import { rateLimit } from './rateLimit.js';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { wallet_address, amount, tx_hash } = req.body;
  if (!wallet_address || !amount) return res.status(400).json({ error: 'Missing fields' });
  if (parseFloat(amount) <= 0 || parseFloat(amount) > 100) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const getRes = await fetch(`${SB_URL}/rest/v1/cashback_balances?wallet_address=eq.${wallet_address}&select=*`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await getRes.json();
    const current = rows[0]?.pending_amount || 0;
    const newBalance = parseFloat((parseFloat(current) + parseFloat(amount)).toFixed(3));
    await fetch(`${SB_URL}/rest/v1/cashback_balances`, {
      method: 'POST',
      headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'},
      body: JSON.stringify({ wallet_address, pending_amount: newBalance, updated_at: new Date().toISOString() })
    });
    return res.json({ success: true, newBalance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
