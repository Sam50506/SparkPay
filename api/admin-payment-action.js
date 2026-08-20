import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const RPCS = ['https://rpc.testnet.arc.network','https://arc-testnet.drpc.org','https://5042002.rpc.thirdweb.com'];
const SCHED_ADDR = '0x79a1C363Afd912212B7581F735a9096fB453F8be';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PAYOUT_PRIVATE_KEY;
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ABI = [
  'function execute(uint256 id) external',
  'function cancel(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

async function getContract() {
  for (const url of RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(url, { name: 'Arc Testnet', chainId: 5042002 });
      await provider.getBlockNumber();
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      return new ethers.Contract(SCHED_ADDR, ABI, wallet);
    } catch (_) {}
  }
  throw new Error('All RPC endpoints unreachable');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  try { jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Invalid or expired session' }); }

  const { payment_id, action, reason } = req.body;
  const id = parseInt(payment_id, 10);
  if (isNaN(id) || id < 0) return res.status(400).json({ error: 'Invalid payment_id' });
  if (!['cancel_refund', 'under_review'].includes(action)) return res.status(400).json({ error: 'Invalid action' });
  if (!reason || !reason.trim()) return res.status(400).json({ error: 'Reason required' });

  try {
    const contract = await getContract();
    let failureReason = null;
    try { await contract.execute.staticCall(id); }
    catch (e) { failureReason = e.reason || e.shortMessage || e.message; }

    let txHash = null;
    if (action === 'cancel_refund') {
      const tx = await contract.cancel(id, { gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000 });
      await tx.wait();
      txHash = tx.hash;
    }

    await fetch(`${SB_URL}/rest/v1/admin_payment_actions`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_id: id, action, admin_reason: reason, failure_reason: failureReason, tx_hash: txHash })
    });

    return res.json({ success: true, failureReason, txHash });
  } catch (e) {
    return res.status(500).json({ error: e.reason || e.shortMessage || e.message });
  }
}
