path = "api/reject-claim.js"
with open(path) as f:
    content = f.read()

old = """  const { claim_id } = req.body;
  if (!claim_id) return res.status(400).json({ error: 'claim_id required' });

  const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { reason } = req.body;
  const { error } = await supabase.from('cashback_claims').update({ status: 'rejected', rejection_reason: reason || '' }).eq('id', claim_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });"""

new = """  const { claim_id } = req.body;
  if (!claim_id) return res.status(400).json({ error: 'claim_id required' });

  const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { reason } = req.body;

  const { data: claimRow, error: fetchErr } = await supabase.from('cashback_claims').select('wallet_address,amount,status').eq('id', claim_id).single();
  if (fetchErr || !claimRow) return res.status(404).json({ error: 'Claim not found' });
  if (claimRow.status !== 'pending') return res.status(400).json({ error: 'Only pending claims can be rejected' });

  // claim_cashback() already decremented the balance when the claim was submitted -
  // rejecting must restore it, otherwise the user's cashback is silently lost.
  const { error: refundErr } = await supabase.rpc('increment_cashback', { wallet: claimRow.wallet_address, amt: String(claimRow.amount) });
  if (refundErr) return res.status(500).json({ error: 'Failed to restore balance: ' + refundErr.message });

  const { error } = await supabase.from('cashback_claims').update({ status: 'rejected', rejection_reason: reason || '' }).eq('id', claim_id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: rejecting a claim now restores the balance via increment_cashback")
