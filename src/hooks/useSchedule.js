import { useCallback } from 'react';
import { ethers } from 'ethers';
import { SCHED_ADDR } from '../config';
import { lsSave, ls } from '../config';

export const SCHED_ABI = [
  'function schedule(address payable recipient,uint256 releaseTime,string calldata country) external payable returns (uint256)',
  'function execute(uint256 id) external',
  'function cancel(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))',
  'function paymentCount() external view returns (uint256)'
];

export function useSchedule({ signer, address, newSched, setNewSched, setLoading, setStatus, setTxns, refreshBal }) {

  const handleSchedule = useCallback(async () => {
    if (!newSched.addr || !newSched.amount || !newSched.next) {
      setStatus({ type: 'error', msg: 'Fill all required fields' });
      return;
    }
    if (!signer) { setStatus({ type: 'error', msg: 'Connect your wallet first' }); return; }
    const releaseTime = Math.floor(new Date(newSched.next + 'T' + (newSched.time || '12:00')).getTime() / 1000);console.log('releaseTime:',releaseTime,'now:',Math.floor(Date.now()/1000),'diff:',releaseTime-Math.floor(Date.now()/1000));
    if (releaseTime <= Math.floor(Date.now() / 1000) + 120) {
      setStatus({ type: "error", msg: "Release time must be at least 2 minutes in the future." });
      return;
    }
    setLoading(true);
    try {
      const amt = ethers.parseUnits(newSched.amount, 18);
      const sched = new ethers.Contract(SCHED_ADDR, SCHED_ABI, signer);
      setStatus({ type: 'info', msg: 'Locking USDC in escrow...' });
      let tx = await sched.schedule(
        ethers.getAddress(newSched.addr.trim()),
        releaseTime,
        newSched.country || '',
        { value: amt, gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 200000 }
      );
      setStatus({ type: 'info', msg: 'Transaction submitted! Waiting for confirmation...' });
      try {
        await Promise.race([
          tx.wait(),
          new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 30000))
        ]);
      } catch (waitErr) {
        if (waitErr.message === 'timeout') {
          setStatus({ type: 'success', msg: 'Payment scheduled! USDC locked in escrow until ' + new Date(releaseTime * 1000).toLocaleString() + ' (Confirmation pending)' });
          setNewSched({ addr: '', amount: '', country: '', freq: 'once', next: '', time: '' });
          setTimeout(refreshBal, 4000);
          setLoading(false);
          return;
        }
        throw waitErr;
      }
      setStatus({ type: 'success', msg: 'Payment scheduled! USDC locked in escrow until ' + new Date(releaseTime * 1000).toLocaleString() });
      const schedRec = {
        id: tx.hash + '_sched', hash: tx.hash, recipient: newSched.addr,
        amount: parseFloat(newSched.amount), country: newSched.country,
        timestamp: releaseTime, status: 'scheduled', type: 'scheduled', releaseTime
      };
      setTxns(prev => {
        const u = [schedRec, ...prev.slice(0, 499)];
        lsSave('arc_txhistory_' + address, u);
        return u;
      });
      setNewSched({ addr: '', amount: '', country: '', freq: 'once', next: '', time: '' });
      setTimeout(refreshBal, 4000);
    } catch (e) {
      console.error('Schedule error full:', e, JSON.stringify(e));
      let msg = 'Scheduling failed: ' + (e?.reason || e?.shortMessage || e?.message || 'Unknown error');
      if (e?.code === 4001 || e?.code === 'ACTION_REJECTED') msg = 'Transaction cancelled.';
      else if (e?.message?.includes('Too early')) msg = 'Release time must be in the future.';
      else if (e?.message?.includes('insufficient')) msg = 'Insufficient balance to lock this amount.';
      else if (e?.message?.includes('reverted')) msg = 'Transaction reverted: '+(e?.reason||e?.data?.message||e?.error?.message||'Check your balance and ensure release time is at least 10 mins in the future.');
      setStatus({ type: 'error', msg });
    }
    setLoading(false);
  }, [signer, address, newSched, setNewSched, setLoading, setStatus, setTxns, refreshBal]);

  const handleExecute = useCallback(async (id) => {
    if (!signer) return;
    setLoading(true);
    try {
      const sched = new ethers.Contract(SCHED_ADDR, SCHED_ABI, signer);
      const tx = await sched.execute(id);
      await tx.wait();
      const execData = ls('arc_sched_exec_' + address, {});
      execData[id] = { hash: tx.hash, ts: Math.floor(Date.now() / 1000) };
      lsSave('arc_sched_exec_' + address, execData);
      setStatus({ type: 'success', msg: 'Payment released successfully!' });
    } catch (e) {
      const cleanErr = err => {
        if (!err) return 'Something went wrong.';
        if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') return 'Transaction cancelled.';
        if (err?.message?.includes('insufficient')) return 'Insufficient balance.';
        if (err?.message?.includes('reverted')) return 'Transaction reverted.';
        if (err?.message?.includes('user rejected')) return 'Transaction cancelled.';
        return err?.message?.slice(0, 100) || 'Transaction failed.';
      };
      setStatus({ type: 'error', msg: cleanErr(e) });
    }
    setLoading(false);
  }, [signer, address, setLoading, setStatus]);

  const handleCancelSched = useCallback(async (id) => {
    if (!signer) return;
    setLoading(true);
    try {
      const sched = new ethers.Contract(SCHED_ADDR, SCHED_ABI, signer);
      const payment = await sched.getPayment(id);
      const tx = await sched.cancel(id);
      await tx.wait();
      setTxns(prev => {
        const updated = prev.map(t =>
          t.type === 'scheduled' &&
          t.status === 'scheduled' &&
          t.recipient === payment.recipient &&
          Math.abs(parseFloat(t.amount) - parseFloat(ethers.formatUnits(payment.amount, 18))) < 0.001
            ? { ...t, status: 'cancelled' }
            : t
        );
        lsSave('arc_txhistory_' + address, updated);
        return updated;
      });
      setStatus({ type: 'success', msg: 'Cancelled. USDC refunded to your wallet.' });
      setTimeout(refreshBal, 4000);
    } catch (e) {
      const cleanErr = err => {
        if (!err) return 'Something went wrong.';
        if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') return 'Transaction cancelled.';
        if (err?.message?.includes('insufficient')) return 'Insufficient balance.';
        if (err?.message?.includes('reverted')) return 'Transaction reverted.';
        return err?.message?.slice(0, 100) || 'Transaction failed.';
      };
      setStatus({ type: 'error', msg: cleanErr(e) });
    }
    setLoading(false);
  }, [signer, address, setLoading, setStatus, setTxns, refreshBal]);

  return { handleSchedule, handleExecute, handleCancelSched };
}
