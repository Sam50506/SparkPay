import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { address, captchaToken } = req.body;
  if (!address) return res.status(400).json({ error: 'Address required' });

  const userIP = req.headers['x-forwarded-for']?.split(',')[0] || '';

  // Verify reCAPTCHA
  try {
    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${captchaToken}`
    });
    const captchaData = await captchaRes.json();
    console.log('Captcha:', JSON.stringify(captchaData));
    if (!captchaData.success || captchaData.score < 0.5) {
      return res.status(400).json({ error: 'Captcha verification failed' });
    }
  } catch(e) {
    console.log('Captcha error:', e.message);
  }

  try {
    const response = await fetch('https://faucet.circle.com/api/graphql', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://faucet.circle.com',
        'Referer': 'https://faucet.circle.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0',
        'X-Forwarded-For': userIP,
        'X-Captcha-Token': captchaToken||'',
      },
      body: JSON.stringify({
        query: `mutation RequestToken($input: RequestTokenInput!) {
          requestToken(input: $input) {
            hash
          }
        }`,
        variables: {
          input: {
            destinationAddress: address,
            blockchain: 'ARC',
            token: 'USDC',
            captchaToken: captchaToken||''
          }
        }
      })
    });
    const data = await response.json();
    console.log('Faucet response:', response.status, JSON.stringify(data));
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
