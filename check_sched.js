const { ethers } = require("ethers");
const RPC = "https://arc-testnet.drpc.org";
const SCHED_ADDR = "0x79a1C363Afd912212B7581F735a9096fB453F8be";
const ABI = [
  "function paymentCount() external view returns (uint256)",
  "function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC, 5042002);
  const contract = new ethers.Contract(SCHED_ADDR, ABI, provider);
  const count = await contract.paymentCount();
  console.log("paymentCount():", count.toString());
  const n = Number(count);
  for (let i = Math.max(0, n - 5); i < n; i++) {
    const p = await contract.getPayment(i);
    console.log(`ID ${i}: sender=${p.sender} amount=${ethers.formatUnits(p.amount,18)} executed=${p.executed} cancelled=${p.cancelled}`);
  }
}
main();
