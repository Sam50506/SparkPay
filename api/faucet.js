import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address required' });

  try {
    const response = await fetch('https://api.circle.com/v1/faucet/drips', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.CIRCLE_API_KEY,
        'X-Request-Id': randomUUID()
      },
      body: JSON.stringify({ 
        address, 
        blockchain: 'ARC-TESTNET', 
        usdc: true,
        idempotencyKey: randomUUID()
      })
    });
    const data = await response.json();
    console.log('Circle response:', response.status, JSON.stringify(data));
    res.status(response.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
