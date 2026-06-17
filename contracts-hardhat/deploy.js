const { ethers } = require("ethers");
const fs = require("fs");

const USDC_ADDR = "0x3600000000000000000000000000000000000000";
const RPC = "https://rpc.testnet.arc.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const abi = JSON.parse(fs.readFileSync("./artifacts/contracts_ScheduledPayment_sol_ScheduledPayment.abi", "utf8"));
const bin = "0x" + fs.readFileSync("./artifacts/contracts_ScheduledPayment_sol_ScheduledPayment.bin", "utf8").trim();

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, 5042002);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log("Deploying from:", wallet.address);

  const factory = new ethers.ContractFactory(abi, bin, wallet);
  const deployTx = await factory.getDeployTransaction(USDC_ADDR);
  
  const tx = await wallet.sendTransaction({
    data: deployTx.data,
    gasPrice: ethers.parseUnits("100", "gwei"),
    gasLimit: 2000000
  });
  
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("Contract deployed to:", receipt.contractAddress);
}

main().catch(console.error);
