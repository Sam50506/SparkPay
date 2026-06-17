const hre = require("hardhat");

async function main() {
  const USDC_ADDR = "0x36000000000000000000000000000000000000000";
  
  console.log("Deploying ScheduledPayment contract...");
  
  const ScheduledPayment = await hre.ethers.getContractFactory("ScheduledPayment");
  const contract = await ScheduledPayment.deploy(USDC_ADDR);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("ScheduledPayment deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
