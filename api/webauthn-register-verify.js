import { verifyRegistrationResponse } from '@simplewebauthn/server';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { address, response } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rpID = req.headers.host.split(':')[0];
  const origin = `https://${req.headers.host}`;

  // Get latest challenge
  const cRes = await fetch(`${SB_URL}/rest/v1/webauthn_challenges?admin_address=eq.${ADMIN_ADDRESS}&order=created_at.desc&limit=1`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
  });
  const challenges = await cRes.json();
  if (!challenges.length) return res.status(400).json({ error: 'No challenge found' });
  const expectedChallenge = challenges[0].challenge;

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID
    });

    if (!verification.verified) return res.status(400).json({ error: 'Verification failed' });

    const { credential } = verification.registrationInfo;
    const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

    await fetch(`${SB_URL}/rest/v1/webauthn_credentials`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        admin_address: ADMIN_ADDRESS,
        credential_id: credentialID,
        public_key: Buffer.from(credentialPublicKey).toString('base64url'),
        counter
      })
    });

    res.json({ verified: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
