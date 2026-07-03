import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const token = req.headers['authorization']?.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.address !== ADMIN_ADDRESS) throw new Error('Unauthorized');
  } catch { return res.status(401).json({ error: 'Unauthorized' }); }

  const { claim_id } = req.body;
  if (!claim_id) return res.status(400).json({ error: 'claim_id required' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { error } = await supabase.from('cashback_claims').update({ status: 'rejected' }).eq('id', claim_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
}
