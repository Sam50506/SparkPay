import { rateLimit } from '../src/lib/rateLimit.js';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error('Telegram alert failed:', e.message);
  }
}

const sb = (path, opts={}) => fetch(`${SB_URL}/rest/v1/${path}`, {
  ...opts,
  headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...(opts.headers||{}) },
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
      const rpcRes = await sb('rpc/increment_cashback', {
        method: 'POST',
        body: JSON.stringify({ wallet: wallet_address, amt: String(amount) })
      });
      if (!rpcRes.ok) {
        const errBody = await rpcRes.text();
        console.error('increment_cashback RPC failed:', rpcRes.status, errBody);
        return res.status(500).json({ error: 'Failed to award cashback: ' + errBody });
      }
      const getRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}&select=pending_amount`);
      const rows = await getRes.json();
      const newBalance = rows[0]?.pending_amount ?? null;
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
      // Atomic check-and-decrement: claim_cashback() only succeeds if pending_amount >= amount,
      // preventing concurrent claims from both reading a stale balance and double-spending.
      const rpcRes = await sb('rpc/claim_cashback', {
        method: 'POST',
        body: JSON.stringify({ p_wallet: wallet_address, p_amt: String(amount) })
      });
      if (!rpcRes.ok) {
        const errBody = await rpcRes.text();
        console.error('claim_cashback RPC failed:', rpcRes.status, errBody);
        return res.status(400).json({ error: 'Insufficient balance or claim failed' });
      }
      const newBalance = await rpcRes.json();

      const insertRes = await sb('cashback_claims', { method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify({ wallet_address, amount, timestamp: new Date().toISOString(), status: 'pending' }) });
      if (!insertRes.ok) {
        const errBody = await insertRes.text();
        console.error('cashback_claims insert failed after balance already decremented:', insertRes.status, errBody);
        // Balance was already atomically decremented — refund it since the claim record failed to save
        await sb('rpc/increment_cashback', { method: 'POST', body: JSON.stringify({ wallet: wallet_address, amt: String(amount) }) }).catch(() => {});
        return res.status(500).json({ error: 'Failed to record claim: ' + errBody });
      }

      sendTelegramAlert(
        `💰 <b>New Cashback Claim</b>\n\nAmount: <b>${amount} USDC</b>\nWallet: <code>${wallet_address}</code>`
      );

      return res.json({ success: true, newBalance });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
