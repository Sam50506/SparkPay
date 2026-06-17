const { ethers } = require("ethers");

const RPC = "https://rpc.testnet.arc.network";
const SCHED_ADDR = "0x4dd5BD2e2FB59E1591ED769783fC277C8F7B2990";
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;

const SCHED_ABI = [
  "function paymentCount() external view returns (uint256)",
  "function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))",
  "function execute(uint256 id) external"
];

async function main() {
  if (!PRIVATE_KEY) { console.error("No private key"); process.exit(1); }
  const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(RPC, 5042002);
  const wallet = new ethers.Wallet(key, provider);
  const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
  const count = Number(await contract.paymentCount());
  const now = Math.floor(Date.now() / 1000);
  console.log("Checking " + count + " payments");
  for (let i = 0; i < count; i++) {
    const p = await contract.getPayment(i);
    if (!p.executed && !p.cancelled && Number(p.releaseTime) <= now) {
      console.log("Executing payment " + i);
      const tx = await contract.execute(i, { gasPrice: ethers.parseUnits("100", "gwei"), gasLimit: 100000 });
      await tx.wait();
      console.log("Done: " + tx.hash);
    }
  }
  console.log("Keeper finished");
}

main().catch(e => { console.error(e.message); process.exit(1); });
// v2
