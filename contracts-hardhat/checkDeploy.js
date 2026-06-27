const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network");
  const code = await provider.getCode("0x09dE47d579Db8c93BB611b2384C4BfAF3aD52153");
  const compiled = JSON.parse(fs.readFileSync("remittance-output.json"));
  const bc = compiled.contracts["contracts/Remittance.sol"]["Remittance"].evm.deployedBytecode.object;
  console.log("Onchain length:", code.length);
  console.log("Compiled length:", bc.length);
  console.log("Onchain start:", code.slice(2, 42));
  console.log("Compiled start:", bc.slice(0, 40));
  console.log("Match:", code.slice(2, 42) === bc.slice(0, 40));
}

main().catch(console.error);
