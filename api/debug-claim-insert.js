const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/cashback_claims`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        wallet_address: '0xTEST0000000000000000000000000000000000',
        amount: 5,
        timestamp: new Date().toISOString(),
        status: 'pending'
      })
    });
    const status = r.status;
    const body = await r.text();
    return res.status(200).json({ supabase_status: status, supabase_response: body });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
