import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306').toLowerCase();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['authorization']?.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.address?.toLowerCase() !== ADMIN_ADDRESS) throw new Error('Unauthorized');
  } catch { return res.status(401).json({ error: 'Unauthorized' }); }

  const { claim_id, action, reason } = req.body;
  if (!claim_id) return res.status(400).json({ error: 'claim_id required' });

  const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data: claimRow, error: fetchErr } = await supabase.from('cashback_claims').select('wallet_address,amount,status').eq('id', claim_id).single();
  if (fetchErr || !claimRow) return res.status(404).json({ error: 'Claim not found' });

  if (action === 'edit_reason') {
    if (claimRow.status !== 'rejected') return res.status(400).json({ error: 'Can only edit the reason on a rejected claim' });
    const { error } = await supabase.from('cashback_claims').update({ rejection_reason: reason || '' }).eq('id', claim_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  if (action === 'revert_to_pending') {
    if (claimRow.status !== 'rejected') return res.status(400).json({ error: 'Can only revert a rejected claim' });
    // Rejection already restored the balance via increment_cashback - reverting to pending
    // means re-reserving those funds so they can't be claimed elsewhere while this is reconsidered.
    const { error: deductErr } = await supabase.rpc('claim_cashback', { p_wallet: claimRow.wallet_address, p_amt: String(claimRow.amount) });
    if (deductErr) return res.status(400).json({ error: 'Cannot revert: wallet no longer has sufficient pending balance (' + deductErr.message + ')' });
    const { error } = await supabase.from('cashback_claims').update({ status: 'pending', rejection_reason: null }).eq('id', claim_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  }

  return res.status(400).json({ error: 'Invalid action' });
}
