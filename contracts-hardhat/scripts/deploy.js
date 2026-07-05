const hre = require("hardhat");

async function main() {
  const USDC_ADDR = "0x3600000000000000000000000000000000000000";

  // Deploy ScheduledPayment
  console.log("Deploying ScheduledPayment contract...");
  const ScheduledPayment = await hre.ethers.getContractFactory("ScheduledPayment");
  const scheduled = await ScheduledPayment.deploy(USDC_ADDR);
  await scheduled.waitForDeployment();
  const scheduledAddr = await scheduled.getAddress();
  console.log("ScheduledPayment deployed to:", scheduledAddr);

  // Deploy Remittance
  console.log("Deploying Remittance contract...");
  const Remittance = await hre.ethers.getContractFactory("Remittance");
  const remittance = await Remittance.deploy(USDC_ADDR);
  await remittance.waitForDeployment();
  const remittanceAddr = await remittance.getAddress();
  console.log("Remittance deployed to:", remittanceAddr);

  console.log("\n--- Deployment Summary ---");
  console.log("USDC_ADDR:        ", USDC_ADDR);
  console.log("SCHED_ADDR:       ", scheduledAddr);
  console.log("REMIT_ADDR:       ", remittanceAddr);
  console.log("\nUpdate these in src/config.js and Vercel env vars.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
