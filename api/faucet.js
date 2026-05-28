import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address required' });

  const userIP = req.headers['x-forwarded-for']?.split(',')[0] || '';

  try {
    // First introspect to find available fields
    const introResponse = await fetch('https://faucet.circle.com/api/graphql', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://faucet.circle.com',
        'Referer': 'https://faucet.circle.com/',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0',
      },
      body: JSON.stringify({
        query: `{ __type(name: "RequestTokenResponse") { fields { name } } }`
      })
    });
    const introData = await introResponse.json();
    console.log('Schema:', JSON.stringify(introData));
    res.status(200).json(introData);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
