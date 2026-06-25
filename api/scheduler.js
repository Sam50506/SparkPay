import { ethers } from 'ethers';

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0xBf17436D2bF9053b3969C5B085B4602f58ad9e87';
const PRIVATE_KEY = process.env.DEPLOYER_KEY || process.env.PAYOUT_PRIVATE_KEY;
const SCHED_ABI = [
  'function execute(uint256 id) external',
  'function paymentCount() external view returns (uint256)',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

export default async function handler(req, res) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC, {name:'Arc Testnet',chainId:5042002});
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
    const count = Number(await contract.paymentCount());
    const now = Math.floor(Date.now()/1000);
    const executed = [];
    for(let i = 0; i < count; i++) {
      const p = await contract.getPayment(i);
      if(!p.executed && !p.cancelled && now >= Number(p.releaseTime)) {
        const tx = await contract.execute(i, {gasPrice: ethers.parseUnits('21','gwei')});
        await tx.wait();
        executed.push(i);
      }
    }
    res.json({success:true, executed});
  } catch(e) {
    console.error(e);
    res.status(500).json({error: e.message});
  }
}
