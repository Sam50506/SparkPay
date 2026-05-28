import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address required' });

  const userIP = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || '';

  try {
    const response = await fetch('https://api.circle.com/v1/faucet/drips', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.CIRCLE_API_KEY,
        'X-Request-Id': randomUUID(),
        'X-Forwarded-For': userIP,
        'X-Real-IP': userIP
      },
      body: JSON.stringify({ 
        address, 
        blockchain: 'ARC-TESTNET', 
        usdc: true,
        idempotencyKey: address + '-' + Math.floor(Date.now()/7200000)
      })
    });
    const data = await response.json();
    console.log('Circle response:', response.status, JSON.stringify(data));
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
