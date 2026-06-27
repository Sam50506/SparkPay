import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import jwt from 'jsonwebtoken';
import { rateLimit } from '../src/lib/rateLimit.js';

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const { address, response } = req.body;
  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rpID = req.headers.host.split(':')[0];
  const origin = `https://${req.headers.host}`;

  const credRes = await fetch(`${SB_URL}/rest/v1/webauthn_credentials?admin_address=eq.${ADMIN_ADDRESS}`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
  });
  const creds = await credRes.json();
  if (!creds.length) return res.status(404).json({ error: 'No passkey registered' });
  const cred = creds[0];

  const cRes = await fetch(`${SB_URL}/rest/v1/webauthn_challenges?admin_address=eq.${ADMIN_ADDRESS}&order=created_at.desc&limit=1`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
  });
  const challenges = await cRes.json();
  if (!challenges.length) return res.status(400).json({ error: 'No challenge found' });
  const expectedChallenge = challenges[0].challenge;

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: Buffer.from(cred.public_key, 'base64url'),
        counter: cred.counter
      }
    });

    if (!verification.verified) return res.status(400).json({ error: 'Verification failed' });

    await fetch(`${SB_URL}/rest/v1/webauthn_credentials?admin_address=eq.${ADMIN_ADDRESS}`, {
      method: 'PATCH',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ counter: verification.authenticationInfo.newCounter })
    });

    const token = jwt.sign({ address: ADMIN_ADDRESS, ts: Date.now() }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ verified: true, token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
