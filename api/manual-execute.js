import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x1Eb2088f3FE2bD64Dde3c770f87a5047f99b8946';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PAYOUT_PRIVATE_KEY;
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;
const SCHED_ABI = [
  'function execute(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  try {
    jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const { payment_id } = req.body;
  if (payment_id === undefined) return res.status(400).json({ error: 'payment_id required' });

  try {
    const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
    const payment = await contract.getPayment(payment_id);
    const tx = await contract.execute(payment_id, { gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000 });
    await tx.wait();

    try {
      const sendAmount = parseFloat(ethers.formatUnits(payment.amount, 18));
      if (sendAmount >= 5) {
        const cashbackAmt = parseFloat((sendAmount * 0.01).toFixed(3));
        const SB_URL = process.env.REACT_APP_SUPABASE_URL;
        const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
        const getRes = await fetch(`${SB_URL}/rest/v1/cashback_balances?wallet_address=eq.${payment.sender}&select=*`, {
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        const rows = await getRes.json();
        const current = rows[0]?.pending_amount || 0;
        const newBalance = parseFloat((parseFloat(current) + cashbackAmt).toFixed(3));
        await fetch(`${SB_URL}/rest/v1/cashback_balances`, {
          method: 'POST',
          headers: {
            'apikey': SB_KEY,
            'Authorization': `Bearer ${SB_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ wallet_address: payment.sender, pending_amount: newBalance, updated_at: new Date().toISOString() })
        });
      }
    } catch (ce) { console.error('Cashback failed:', ce.message); }

    return res.json({ success: true, hash: tx.hash });
  } catch (e) {
    return res.status(500).json({ error: e.reason || e.message });
  }
}
