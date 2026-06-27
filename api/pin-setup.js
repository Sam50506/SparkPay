import bcrypt from 'bcryptjs';
import { rateLimit } from './rateLimit.js';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const { address, pin } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!pin || pin.length < 6) {
    return res.status(400).json({ error: 'PIN must be at least 6 digits' });
  }

  try {
    const pinHash = await bcrypt.hash(pin, 10);
    await fetch(`${SB_URL}/rest/v1/admin_pin`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ admin_address: ADMIN_ADDRESS, pin_hash: pinHash })
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
