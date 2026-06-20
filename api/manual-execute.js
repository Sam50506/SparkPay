import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x1Eb2088f3FE2bD64Dde3c770f87a5047f99b8946';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PAYOUT_PRIVATE_KEY;
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;
const SCHED_ABI = ['function execute(uint256 id) external'];

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
    const tx = await contract.execute(payment_id, { gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000 });
    await tx.wait();
    return res.json({ success: true, hash: tx.hash });
  } catch (e) {
    return res.status(500).json({ error: e.reason || e.message });
  }
}
