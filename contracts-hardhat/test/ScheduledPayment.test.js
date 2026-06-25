const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ScheduledPayment", function () {
  let contract;
  let owner, executor, sender, recipient, attacker;
  const ONE_ETH = ethers.parseEther("1.0");
  const ONE_MINUTE = 60;

  beforeEach(async function () {
    [owner, executor, sender, recipient, attacker] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ScheduledPayment");
    contract = await Factory.deploy(executor.address);
    await contract.waitForDeployment();
  });

  // ─── Schedule ───────────────────────────────────────────
  describe("schedule()", function () {
    it("locks funds and emits event", async function () {
      const releaseTime = (await time.latest()) + ONE_MINUTE * 2;

      await expect(
        contract.connect(sender).schedule(
          recipient.address, releaseTime, "PK",
          { value: ONE_ETH }
        )
      ).to.emit(contract, "PaymentScheduled")
        .withArgs(0, sender.address, recipient.address, ONE_ETH, releaseTime, "PK");

      const bal = await ethers.provider.getBalance(await contract.getAddress());
      expect(bal).to.equal(ONE_ETH);
    });

    it("reverts if release time is in the past", async function () {
      const pastTime = (await time.latest()) - 10;
      await expect(
        contract.connect(sender).schedule(recipient.address, pastTime, "PK", { value: ONE_ETH })
      ).to.be.revertedWith("Release time too soon");
    });

    it("reverts if amount is zero", async function () {
      const releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      await expect(
        contract.connect(sender).schedule(recipient.address, releaseTime, "PK", { value: 0 })
      ).to.be.revertedWith("Amount must be > 0");
    });

    it("reverts if recipient is zero address", async function () {
      const releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      await expect(
        contract.connect(sender).schedule(ethers.ZeroAddress, releaseTime, "PK", { value: ONE_ETH })
      ).to.be.revertedWith("Invalid recipient");
    });

    it("reverts if sender sends to themselves", async function () {
      const releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      await expect(
        contract.connect(sender).schedule(sender.address, releaseTime, "PK", { value: ONE_ETH })
      ).to.be.revertedWith("Cannot send to yourself");
    });
  });

  // ─── Execute ─────────────────────────────────────────────
  describe("execute()", function () {
    let paymentId;
    let releaseTime;

    beforeEach(async function () {
      releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      const tx = await contract.connect(sender).schedule(
        recipient.address, releaseTime, "PK", { value: ONE_ETH }
      );
      await tx.wait();
      paymentId = 0;
    });

    it("sends funds to recipient after release time", async function () {
      await time.increaseTo(releaseTime + 1);
      const before = await ethers.provider.getBalance(recipient.address);
      await contract.connect(executor).execute(paymentId);
      const after = await ethers.provider.getBalance(recipient.address);
      expect(after - before).to.equal(ONE_ETH);
    });

    it("emits PaymentExecuted event", async function () {
      await time.increaseTo(releaseTime + 1);
      await expect(contract.connect(executor).execute(paymentId))
        .to.emit(contract, "PaymentExecuted")
        .withArgs(paymentId, recipient.address, ONE_ETH);
    });

    it("reverts if too early", async function () {
      await expect(
        contract.connect(executor).execute(paymentId)
      ).to.be.revertedWith("Too early");
    });

    it("reverts if not executor or owner", async function () {
      await time.increaseTo(releaseTime + 1);
      await expect(
        contract.connect(attacker).execute(paymentId)
      ).to.be.revertedWith("Not authorized");
    });

    it("reverts if already executed", async function () {
      await time.increaseTo(releaseTime + 1);
      await contract.connect(executor).execute(paymentId);
      await expect(
        contract.connect(executor).execute(paymentId)
      ).to.be.revertedWith("Already executed");
    });
  });

  // ─── Cancel ──────────────────────────────────────────────
  describe("cancel()", function () {
    let paymentId;
    let releaseTime;

    beforeEach(async function () {
      releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      await contract.connect(sender).schedule(
        recipient.address, releaseTime, "PK", { value: ONE_ETH }
      );
      paymentId = 0;
    });

    it("refunds sender and emits event", async function () {
      const before = await ethers.provider.getBalance(sender.address);
      const tx = await contract.connect(sender).cancel(paymentId);
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(sender.address);
      expect(after + gas - before).to.equal(ONE_ETH);

      await expect(tx)
        .to.emit(contract, "PaymentCancelled")
        .withArgs(paymentId, sender.address, ONE_ETH);
    });

    it("executor can cancel", async function () {
      await expect(
        contract.connect(executor).cancel(paymentId)
      ).to.emit(contract, "PaymentCancelled");
    });

    it("owner can cancel", async function () {
      await expect(
        contract.connect(owner).cancel(paymentId)
      ).to.emit(contract, "PaymentCancelled");
    });

    it("reverts if attacker tries to cancel", async function () {
      await expect(
        contract.connect(attacker).cancel(paymentId)
      ).to.be.revertedWith("Not authorized");
    });

    it("reverts if already cancelled", async function () {
      await contract.connect(sender).cancel(paymentId);
      await expect(
        contract.connect(sender).cancel(paymentId)
      ).to.be.revertedWith("Already cancelled");
    });
  });

  // ─── Pausable ────────────────────────────────────────────
  describe("pause()", function () {
    it("owner can pause and unpause", async function () {
      await contract.connect(owner).pause();
      const releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      await expect(
        contract.connect(sender).schedule(recipient.address, releaseTime, "PK", { value: ONE_ETH })
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");

      await contract.connect(owner).unpause();
      await expect(
        contract.connect(sender).schedule(recipient.address, releaseTime, "PK", { value: ONE_ETH })
      ).to.emit(contract, "PaymentScheduled");
    });

    it("attacker cannot pause", async function () {
      await expect(
        contract.connect(attacker).pause()
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  // ─── Emergency Withdraw ──────────────────────────────────
  describe("emergencyWithdraw()", function () {
    it("owner can withdraw stuck funds", async function () {
      const releaseTime = (await time.latest()) + ONE_MINUTE * 2;
      await contract.connect(sender).schedule(
        recipient.address, releaseTime, "PK", { value: ONE_ETH }
      );

      const before = await ethers.provider.getBalance(owner.address);
      const tx = await contract.connect(owner).emergencyWithdraw(owner.address);
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(owner.address);
      expect(after + gas - before).to.equal(ONE_ETH);
    });

    it("attacker cannot emergency withdraw", async function () {
      await expect(
        contract.connect(attacker).emergencyWithdraw(attacker.address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  // ─── setExecutor ─────────────────────────────────────────
  describe("setExecutor()", function () {
    it("owner can update executor", async function () {
      await contract.connect(owner).setExecutor(attacker.address);
      expect(await contract.executor()).to.equal(attacker.address);
    });

    it("non-owner cannot update executor", async function () {
      await expect(
        contract.connect(attacker).setExecutor(attacker.address)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("reverts if zero address", async function () {
      await expect(
        contract.connect(owner).setExecutor(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });
  });
});
