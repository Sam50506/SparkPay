const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
export default async function handler(req, res) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/scheduled_payments?select=payment_id`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Prefer': 'count=exact' }
    });
    const body = await r.json();
    return res.status(200).json({ count: body.length, rows: body });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
