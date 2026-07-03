import { rateLimit } from '../src/lib/rateLimit.js';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

const sb = (path, opts={}) => fetch(`${SB_URL}/rest/v1/${path}`, {
  headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...opts.headers },
  ...opts
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, wallet_address, amount, tx_hash, turnstileToken } = req.body || {};

  // Award cashback (internal)
  if (action === 'award') {
    const allowed = await rateLimit(req, res, 'strict');
    if (!allowed) return;

    const secret = req.headers['x-internal-secret'];
    if (!secret || secret !== INTERNAL_SECRET) return res.status(401).json({ error: 'Unauthorized' });
    if (!wallet_address || !amount) return res.status(400).json({ error: 'Missing fields' });
    if (parseFloat(amount) <= 0 || parseFloat(amount) > 100) return res.status(400).json({ error: 'Invalid amount' });

    try {
      const getRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}&select=*`);
      const rows = await getRes.json();
      const current = rows[0]?.pending_amount || 0;
      const newBalance = parseFloat((parseFloat(current) + parseFloat(amount)).toFixed(3));
      if (rows[0]) {
        // Update existing
        await sb(`cashback_balances?wallet_address=eq.${wallet_address}`, { method: 'PATCH', body: JSON.stringify({ pending_amount: newBalance, updated_at: new Date().toISOString() }) });
      } else {
        // Insert new
        await sb('cashback_balances', { method: 'POST', body: JSON.stringify({ wallet_address, pending_amount: newBalance, updated_at: new Date().toISOString() }) });
      }
      return res.json({ success: true, newBalance });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Claim cashback (user)
  if (action === 'claim') {
    const allowed = await rateLimit(req, res, 'normal');
    if (!allowed) return;

    if (!wallet_address || !amount) return res.status(400).json({ error: 'Missing fields' });

    try {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: TURNSTILE_SECRET, response: turnstileToken })
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) return res.status(403).json({ error: 'Security check failed. Please try again.' });
    } catch (e) {
      return res.status(500).json({ error: 'Verification failed: ' + e.message });
    }

    try {
      const insertRes = await sb('cashback_claims', { method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify({ wallet_address, amount, timestamp: new Date().toISOString(), status: 'pending' }) });
      if (!insertRes.ok) {
        const errBody = await insertRes.text();
        console.error('cashback_claims insert failed:', insertRes.status, errBody);
        return res.status(500).json({ error: 'Failed to record claim: ' + errBody });
      }

      const getRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}&select=*`);
      if (!getRes.ok) {
        const errBody = await getRes.text();
        console.error('cashback_balances fetch failed:', getRes.status, errBody);
        return res.status(500).json({ error: 'Failed to read balance: ' + errBody });
      }
      const rows = await getRes.json();
      const current = rows[0]?.pending_amount || 0;
      const newBalance = parseFloat((parseFloat(current) - parseFloat(amount)).toFixed(3));

      const patchRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}`, { method: 'PATCH', body: JSON.stringify({ pending_amount: newBalance, updated_at: new Date().toISOString() }) });
      if (!patchRes.ok) {
        const errBody = await patchRes.text();
        console.error('cashback_balances patch failed:', patchRes.status, errBody);
        return res.status(500).json({ error: 'Failed to update balance: ' + errBody });
      }

      return res.json({ success: true, newBalance });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
