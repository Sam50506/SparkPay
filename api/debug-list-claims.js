const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/cashback_claims?select=id,wallet_address,amount,status,timestamp&order=id.desc&limit=10`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const body = await r.json();
    return res.status(200).json(body);
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
