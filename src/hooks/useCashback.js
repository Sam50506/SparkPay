import { useState, useCallback } from 'react';
import { sbInsert, sbSelect, sbUpdate, lsSave } from '../config';

export function useCashback({ address, setStatus }) {
  const [cashbackPending, setCashbackPending] = useState(0);
  const [cashbackHistory, setCashbackHistory] = useState([]);
  const [showCashbackToast, setShowCashbackToast] = useState(false);
  const [cashbackToastData, setCashbackToastData] = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimAmt, setClaimAmt] = useState('');
  const [myClaimsHistory, setMyClaimsHistory] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);

  const awardCashback = useCallback(async (txHash, txAmount) => {
    if (!txAmount || parseFloat(txAmount) < 5) return;
    const amt = parseFloat((parseFloat(txAmount) * 0.01).toFixed(3));
    if (amt <= 0) return;
    try {
      const r = await fetch('/api/cashback-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: address, amount: amt, tx_hash: txHash })
      });
      const d = await r.json();
      if (d.success) { setCashbackPending(d.newBalance); }
    } catch (e) { console.error('Cashback award failed:', e); }
    setCashbackHistory(prev => [{ amount: amt, txHash, ts: Date.now() }, ...prev.slice(0, 49)]);
    setCashbackToastData({ amount: amt.toFixed(3) });
    setShowCashbackToast(true);
  }, [address]);

  const fetchMyClaims = useCallback(async () => {
    if (!address) return;
    setClaimsLoading(true);
    try {
      const rows = await sbSelect('cashback_claims', 'wallet_address=eq.' + address + '&order=timestamp.desc&limit=10');
      setMyClaimsHistory(rows || []);
      if (rows && rows.length > 0 && rows[0].status === 'paid' && claimSubmitted === true) {
        setClaimSubmitted('paid');
        setTimeout(() => setClaimSubmitted(false), 5000);
      }
    } catch (e) { console.error(e); }
    setClaimsLoading(false);
  }, [address, claimSubmitted]);

  const claimCashback = useCallback(async () => {
    const amt = parseFloat(claimAmt) || cashbackPending;
    if (cashbackPending < 5 || claimLoading || amt < 5 || amt > cashbackPending) return;
    setClaimLoading(true);
    try {
      await sbInsert('cashback_claims', { wallet_address: address, amount: amt, timestamp: new Date().toISOString(), status: 'pending' });
      const newBalance = parseFloat((cashbackPending - amt).toFixed(3));
      await sbUpdate('cashback_balances', 'wallet_address=eq.' + address, { pending_amount: newBalance, updated_at: new Date().toISOString() });
      setClaimSubmitted(true);
      setCashbackPending(newBalance);
      setStatus({ type: 'success', msg: 'Cashback claim submitted. Your USDC will be sent to your wallet shortly.' });
    } catch (e) { setStatus({ type: 'error', msg: 'Claim failed: ' + e.message }); }
    setClaimLoading(false);
  }, [address, cashbackPending, claimAmt, claimLoading, setStatus]);

  return {
    cashbackPending, setCashbackPending,
    cashbackHistory, setCashbackHistory,
    showCashbackToast, setShowCashbackToast,
    cashbackToastData, setCashbackToastData,
    claimLoading, claimSubmitted, setClaimSubmitted,
    claimAmt, setClaimAmt,
    myClaimsHistory, claimsLoading,
    awardCashback, fetchMyClaims, claimCashback
  };
}
