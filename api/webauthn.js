import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import jwt from 'jsonwebtoken';
import { rateLimit } from '../src/lib/rateLimit.js';

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const JWT_SECRET = process.env.PAYOUT_JWT_SECRET;
const RP_NAME = 'SparkPay Admin';

const sb = (path, opts={}) => fetch(`${SB_URL}/rest/v1/${path}`, {
  headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...opts.headers },
  ...opts
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const { action, address, response } = req.body || {};

  if (!address || address.toLowerCase() !== ADMIN_ADDRESS) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rpID = req.headers.host.split(':')[0];
  const origin = `https://${req.headers.host}`;

  try {
    // Register Options
    if (action === 'register-options') {
      const options = await generateRegistrationOptions({
        rpName: RP_NAME, rpID,
        userID: new TextEncoder().encode(ADMIN_ADDRESS),
        userName: 'SparkPay Admin',
        attestationType: 'none',
        timeout: 60000,
        authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred', authenticatorAttachment: 'platform' }
      });
      await sb('webauthn_challenges', { method: 'POST', body: JSON.stringify({ admin_address: ADMIN_ADDRESS, challenge: options.challenge }) });
      return res.json(options);
    }

    // Register Verify
    if (action === 'register-verify') {
      const cRes = await sb(`webauthn_challenges?admin_address=eq.${ADMIN_ADDRESS}&order=created_at.desc&limit=1`);
      const challenges = await cRes.json();
      if (!challenges.length) return res.status(400).json({ error: 'No challenge found' });

      const verification = await verifyRegistrationResponse({ response, expectedChallenge: challenges[0].challenge, expectedOrigin: origin, expectedRPID: rpID });
      if (!verification.verified) return res.status(400).json({ error: 'Verification failed' });

      const { credential } = verification.registrationInfo;
      const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;
      await sb('webauthn_credentials', { method: 'POST', headers: { 'Prefer': 'resolution=merge-duplicates' }, body: JSON.stringify({ admin_address: ADMIN_ADDRESS, credential_id: credentialID, public_key: Buffer.from(credentialPublicKey).toString('base64url'), counter }) });
      return res.json({ verified: true });
    }

    // Login Options
    if (action === 'login-options') {
      const credRes = await sb(`webauthn_credentials?admin_address=eq.${ADMIN_ADDRESS}`);
      const creds = await credRes.json();
      if (!creds.length) return res.status(404).json({ error: 'No passkey registered' });

      const options = await generateAuthenticationOptions({
        rpID, userVerification: 'required',
        allowCredentials: creds.map(c => ({ id: c.credential_id, type: 'public-key' }))
      });
      await sb('webauthn_challenges', { method: 'POST', body: JSON.stringify({ admin_address: ADMIN_ADDRESS, challenge: options.challenge }) });
      return res.json(options);
    }

    // Login Verify
    if (action === 'login-verify') {
      const credRes = await sb(`webauthn_credentials?admin_address=eq.${ADMIN_ADDRESS}`);
      const creds = await credRes.json();
      if (!creds.length) return res.status(404).json({ error: 'No passkey registered' });
      const matchingCred = creds.find(c => c.credential_id === response.id) || null;
      const candidates = matchingCred ? [matchingCred] : creds;

      const cRes = await sb(`webauthn_challenges?admin_address=eq.${ADMIN_ADDRESS}&order=created_at.desc&limit=1`);
      const challenges = await cRes.json();
      if (!challenges.length) return res.status(400).json({ error: 'No challenge found' });

      let verification = null;
      let matchedCred = null;
      for (const c of candidates) {
        try {
          const v = await verifyAuthenticationResponse({
            response, expectedChallenge: challenges[0].challenge, expectedOrigin: origin, expectedRPID: rpID,
            credential: { id: c.credential_id, publicKey: Buffer.from(c.public_key, 'base64url'), counter: c.counter }
          });
          if (v.verified) { verification = v; matchedCred = c; break; }
        } catch (e) { /* try next candidate */ }
      }
      if (!verification || !matchedCred) return res.status(400).json({ error: 'Verification failed' });

      const updateRes = await sb(
        `webauthn_credentials?admin_address=eq.${ADMIN_ADDRESS}&credential_id=eq.${matchedCred.credential_id}&counter=eq.${matchedCred.counter}`,
        { method: 'PATCH', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify({ counter: verification.authenticationInfo.newCounter }) }
      );
      const updated = await updateRes.json();
      if (!Array.isArray(updated) || updated.length === 0) {
        return res.status(409).json({ error: 'Concurrent login detected, please try again' });
      }
      const token = jwt.sign({ address: ADMIN_ADDRESS, ts: Date.now() }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ verified: true, token });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
