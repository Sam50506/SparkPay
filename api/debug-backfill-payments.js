import { ethers } from 'ethers';

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0xfb319b6BFf115bDFc6B4b76e0155E9d224f37771';
const SB_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

const ABI = [
  'function paymentCount() external view returns (uint256)',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

export default async function handler(req, res) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
    const contract = new ethers.Contract(SCHED_ADDR, ABI, provider);
    const count = Number(await contract.paymentCount());

    const results = [];

    for (let i = 0; i < count; i++) {
      const checkRes = await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${i}&select=payment_id`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      const existing = await checkRes.json();

      if (existing.length > 0) {
        results.push({ payment_id: i, action: 'skipped_already_exists' });
        continue;
      }

      const p = await contract.getPayment(i);
      const row = {
        payment_id: i,
        sender: p.sender,
        recipient: p.recipient,
        amount: ethers.formatUnits(p.amount, 18),
        release_time: Number(p.releaseTime),
        executed: p.executed,
        cancelled: p.cancelled,
        tx_hash: null
      };

      const insertRes = await fetch(`${SB_URL}/rest/v1/scheduled_payments`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(row)
      });

      if (!insertRes.ok) {
        const errText = await insertRes.text();
        results.push({ payment_id: i, action: 'insert_failed', error: errText });
      } else {
        results.push({ payment_id: i, action: 'inserted', data: row });
      }
    }

    return res.status(200).json({ on_chain_count: count, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
