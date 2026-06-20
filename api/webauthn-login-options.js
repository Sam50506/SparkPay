import { generateAuthenticationOptions } from '@simplewebauthn/server';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { address } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rpID = req.headers.host.split(':')[0];

  const credRes = await fetch(`${SB_URL}/rest/v1/webauthn_credentials?admin_address=eq.${ADMIN_ADDRESS}`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
  });
  const creds = await credRes.json();
  if (!creds.length) return res.status(404).json({ error: 'No passkey registered' });

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    allowCredentials: creds.map(c => ({
      id: c.credential_id,
      type: 'public-key'
    }))
  });

  await fetch(`${SB_URL}/rest/v1/webauthn_challenges`, {
    method: 'POST',
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_address: ADMIN_ADDRESS, challenge: options.challenge })
  });

  res.json(options);
}
