import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const body = req.body || {};
    const { address, pin } = body;
    if (!address || String(address).toLowerCase() !== ADMIN_ADDRESS) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!pin) return res.status(400).json({ error: 'PIN required' });

    const r = await fetch(SB_URL + '/rest/v1/admin_pin?admin_address=eq.' + ADMIN_ADDRESS, {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
    });
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'No PIN set up' });
    }

    const valid = await bcrypt.compare(String(pin), rows[0].pin_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect PIN' });

    const token = jwt.sign({ address: ADMIN_ADDRESS, ts: Date.now() }, JWT_SECRET, { expiresIn: '12h' });
    return res.status(200).json({ verified: true, token });
  } catch (e) {
    return res.status(500).json({ error: 'verify-failed: ' + (e && e.message ? e.message : String(e)) });
  }
}
