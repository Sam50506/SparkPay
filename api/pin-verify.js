import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { address, pin } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const r = await fetch(`${SB_URL}/rest/v1/admin_pin?admin_address=eq.${ADMIN_ADDRESS}`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    if (!rows.length) return res.status(404).json({ error: 'No PIN set up' });

    const valid = await bcrypt.compare(pin, rows[0].pin_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect PIN' });

    const token = jwt.sign({ address: ADMIN_ADDRESS, ts: Date.now() }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ verified: true, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
EOFCREATE TABLE admin_pin (
  id SERIAL PRIMARY KEY,
  admin_address TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE admin_pin ENABLE ROW LEVEL SECURITY;
cat > ~/sparkpay/api/pin-verify.js << 'EOF'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { address, pin } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const r = await fetch(`${SB_URL}/rest/v1/admin_pin?admin_address=eq.${ADMIN_ADDRESS}`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    if (!rows.length) return res.status(404).json({ error: 'No PIN set up' });

    const valid = await bcrypt.compare(pin, rows[0].pin_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect PIN' });

    const token = jwt.sign({ address: ADMIN_ADDRESS, ts: Date.now() }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ verified: true, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
