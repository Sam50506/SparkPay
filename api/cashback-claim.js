import { rateLimit } from './rateLimit.js';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'normal');
  if (!allowed) return;

  const { wallet_address, amount, turnstileToken } = req.body;
  if (!wallet_address || !amount) return res.status(400).json({ error: 'Missing fields' });

  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: turnstileToken })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return res.status(403).json({ error: 'Security check failed. Please try again.' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'Verification failed: ' + e.message });
  }

  try {
    await fetch(`${SB_URL}/rest/v1/cashback_claims`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({ wallet_address, amount, timestamp: new Date().toISOString(), status: 'pending' })
    });

    const getRes = await fetch(`${SB_URL}/rest/v1/cashback_balances?wallet_address=eq.${wallet_address}&select=*`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await getRes.json();
    const current = rows[0]?.pending_amount || 0;
    const newBalance = parseFloat((parseFloat(current) - parseFloat(amount)).toFixed(3));

    await fetch(`${SB_URL}/rest/v1/cashback_balances?wallet_address=eq.${wallet_address}`, {
      method: 'PATCH',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pending_amount: newBalance, updated_at: new Date().toISOString() })
    });

    return res.json({ success: true, newBalance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
