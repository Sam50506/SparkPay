import { generateRegistrationOptions } from '@simplewebauthn/server';
import { rateLimit } from '../src/lib/rateLimit.js';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const RP_NAME = 'SparkPay Admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const { address } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rpID = req.headers.host.split(':')[0];
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(ADMIN_ADDRESS),
    userName: 'SparkPay Admin',
    attestationType: 'none',
    timeout: 60000,
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform'
    }
  });

  await fetch(`${SB_URL}/rest/v1/webauthn_challenges`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_address: ADMIN_ADDRESS, challenge: options.challenge })
  });

  res.json(options);
}
