import { ethers } from 'ethers';
const RPCS = ['https://rpc.testnet.arc.network','https://arc-testnet.drpc.org','https://5042002.rpc.thirdweb.com'];
const SCHED_ADDR = '0x79a1C363Afd912212B7581F735a9096fB453F8be';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PAYOUT_PRIVATE_KEY;
const ABI = ['function execute(uint256 id) external'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { payment_id } = req.body;
  const id = parseInt(payment_id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid payment_id' });
  for (const url of RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(url, { name: 'Arc Testnet', chainId: 5042002 });
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const contract = new ethers.Contract(SCHED_ADDR, ABI, wallet);
      try {
        await contract.execute.staticCall(id);
        return res.json({ ready: true });
      } catch (e) {
        return res.json({ ready: false, reason: e.reason || e.shortMessage || e.message });
      }
    } catch (_) {}
  }
  return res.status(500).json({ error: 'All RPC endpoints unreachable' });
}
