const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

const sb = (path, opts={}) => fetch(`${SB_URL}/rest/v1/${path}`, {
  headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...opts.headers },
  ...opts
});

export default async function handler(req, res) {
  const wallet_address = req.query.wallet;
  if (!wallet_address) return res.status(400).json({ error: 'Add ?wallet=0xYourAddress to the URL' });

  try {
    const getRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}&select=*`);
    const rows = await getRes.json();
    const current = rows[0]?.pending_amount || 0;
    const newBalance = parseFloat((parseFloat(current) + 5).toFixed(3));

    if (rows[0]) {
      await sb(`cashback_balances?wallet_address=eq.${wallet_address}`, { method: 'PATCH', body: JSON.stringify({ pending_amount: newBalance, updated_at: new Date().toISOString() }) });
    } else {
      await sb('cashback_balances', { method: 'POST', body: JSON.stringify({ wallet_address, pending_amount: newBalance, updated_at: new Date().toISOString() }) });
    }
    return res.json({ success: true, newBalance });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
