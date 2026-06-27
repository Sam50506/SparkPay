const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const output = JSON.parse(fs.readFileSync("remittance-output.json"));
  const contract = output.contracts["contracts/Remittance.sol"]["Remittance"];
  const abi = contract.abi;
  const bytecode = "0x" + contract.evm.bytecode.object;

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying from:", wallet.address);
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployed = await factory.deploy();
  await deployed.waitForDeployment();
  console.log("Remittance deployed to:", await deployed.getAddress());
}

main().catch(console.error);
