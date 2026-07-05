import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from '../src/lib/rateLimit.js';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306').toLowerCase();
const JWT_SECRET = process.env.PAYOUT_JWT_SECRET;
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;

function isAuthorizedAdminSession(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.address?.toLowerCase() === ADMIN_ADDRESS;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const { action, address, pin } = req.body || {};

  if (!address || String(address).toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Setup
  if (action === 'setup') {
    const setupSecret = req.headers['x-setup-secret'];
    const hasValidSecret = ADMIN_SETUP_SECRET && setupSecret === ADMIN_SETUP_SECRET;
    const hasValidSession = isAuthorizedAdminSession(req);
    if (!hasValidSecret && !hasValidSession) {
      return res.status(401).json({ error: 'Setup requires ADMIN_SETUP_SECRET header or an authenticated admin session' });
    }
    if (!pin || pin.length < 8) return res.status(400).json({ error: 'PIN must be at least 8 digits' });
    try {
      const pinHash = await bcrypt.hash(pin, 10);
      await fetch(`${SB_URL}/rest/v1/admin_pin`, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ admin_address: ADMIN_ADDRESS, pin_hash: pinHash })
      });
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Verify
  if (action === 'verify') {
    if (!pin) return res.status(400).json({ error: 'PIN required' });
    try {
      const r = await fetch(SB_URL + '/rest/v1/admin_pin?admin_address=eq.' + ADMIN_ADDRESS, {
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
      });
      const rows = await r.json();
      if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: 'No PIN set up' });
      const row = rows[0];

      if (row.locked_until && new Date(row.locked_until) > new Date()) {
        const mins = Math.ceil((new Date(row.locked_until) - new Date()) / 60000);
        return res.status(423).json({ error: `Too many failed attempts. Try again in ${mins} minute(s).` });
      }

      const valid = await bcrypt.compare(String(pin), row.pin_hash);
      if (!valid) {
        const attempts = (row.failed_attempts || 0) + 1;
        const update = { failed_attempts: attempts };
        if (attempts >= 5) {
          update.locked_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          update.failed_attempts = 0;
        }
        await fetch(SB_URL + '/rest/v1/admin_pin?admin_address=eq.' + ADMIN_ADDRESS, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        if (update.locked_until) {
          return res.status(423).json({ error: 'Too many failed attempts. Locked for 24 hours.' });
        }
        return res.status(401).json({ error: 'Incorrect PIN' });
      }

      if (row.failed_attempts > 0 || row.locked_until) {
        await fetch(SB_URL + '/rest/v1/admin_pin?admin_address=eq.' + ADMIN_ADDRESS, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ failed_attempts: 0, locked_until: null })
        });
      }

      const token = jwt.sign({ address: ADMIN_ADDRESS, ts: Date.now() }, JWT_SECRET, { expiresIn: '12h' });
      return res.status(200).json({ verified: true, token });
    } catch (e) {
      return res.status(500).json({ error: 'verify-failed: ' + (e && e.message ? e.message : String(e)) });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
