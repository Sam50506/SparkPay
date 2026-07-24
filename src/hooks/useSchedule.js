import { useCallback } from 'react';
import { ethers } from 'ethers';
import { SCHED_ADDR, sbFetch, awaitReceipt } from '../config';
import { lsSave, ls } from '../config';

export const SCHED_ABI = [
  'function schedule(address payable recipient,uint256 releaseTime,string calldata country) external payable returns (uint256)',
  'function execute(uint256 id) external',
  'function cancel(uint256 id) external',
  'function edit(uint256 id,address payable newRecipient,uint256 newReleaseTime,string calldata newCountry) external payable',
  'function adminEdit(uint256 id,address payable newRecipient,uint256 newAmount,uint256 newReleaseTime,string calldata newCountry) external payable',
  'function topUp(uint256 id) external payable',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))',
  'function paymentCount() external view returns (uint256)',
  'function getUserPayments(address user) external view returns (uint256[])'
];

export function useSchedule({ signer, address, newSched, setNewSched, setLoading, setStatus, setTxns, refreshBal }) {

  const handleSchedule = useCallback(async () => {
    const [sy,sm,sd]=newSched.next.split('-').map(Number);const [sh,smin]=(newSched.time||'12:00').split(':').map(Number);const releaseTimeCheck=Math.floor(new Date(sy,sm-1,sd,sh,smin,0).getTime()/1000);
    if (releaseTimeCheck < Math.floor(Date.now()/1000) + 120) {
      setStatus({ type: 'error', msg: 'Release time must be at least 2 minutes in the future.' });
      return;
    }
    if (!newSched.addr || !newSched.amount || !newSched.next) {
      setStatus({ type: 'error', msg: 'Fill all required fields' });
      return;
    }
    if (!signer) { setStatus({ type: 'error', msg: 'Connect your wallet first' }); return; }
    const releaseTime=Math.floor(new Date(sy,sm-1,sd,sh,smin,0).getTime()/1000);
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

      const finalizeSchedule = async () => {
        setStatus({ type: 'success', msg: 'Payment scheduled! USDC locked in escrow until ' + new Date(releaseTime * 1000).toLocaleString() });
        try {
          const sched2 = new ethers.Contract(SCHED_ADDR, SCHED_ABI, signer.provider || signer);
          const count = Number(await sched2.paymentCount());
          const newId = count - 1;
          await fetch('/api/schedule-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              payment_id: newId, sender: address, recipient: ethers.getAddress(newSched.addr.trim()),
              amount: newSched.amount, release_time: releaseTime, country: newSched.country || '',
              tx_hash: tx.hash
            })
          }).then(async r => { if (!r.ok) throw new Error(await r.text()); });
        } catch (dbErr) { console.error('Failed to save scheduled_payments row:', dbErr.message); }
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
      };

      try {
        await Promise.race([
          tx.wait(),
          new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 30000))
        ]);
      } catch (waitErr) {
        // SECURITY/UX: at this point `tx` already exists, meaning the transaction
        // was genuinely broadcast to the network. ANY failure from here on (a 30s
        // timeout, an RPC rate-limit glitch like "could not coalesce error", or any
        // other polling hiccup) means we failed to OBSERVE confirmation - it does
        // NOT mean the transaction itself failed. Treating those as "scheduling
        // failed" is a false negative that can cause the user to resubmit and lock
        // funds twice for what may already be a successful schedule. So: never
        // declare failure here. Always fall back to background polling via
        // awaitReceipt and only report an outcome once we have a real answer.
        console.warn('tx.wait() did not resolve cleanly, falling back to background poll:', waitErr.message);
        setStatus({ type: 'info', msg: 'Still confirming on-chain (this can take a bit longer than usual)... Transaction hash: ' + tx.hash });
        setLoading(false);
        awaitReceipt(signer.provider || signer, tx.hash, 300000).then(receipt => {
          if (receipt) {
            finalizeSchedule();
          } else {
            setStatus({ type: 'error', msg: 'Could not confirm transaction after 5 minutes. Before retrying, check this tx hash on the block explorer to make sure you don\'t schedule it twice: ' + tx.hash });
          }
        });
        return;
      }
      await finalizeSchedule();
    } catch (e) {
      console.error('Schedule error full:', e, JSON.stringify(e));
      let msg = 'Scheduling failed: ' + (e?.reason || e?.shortMessage || e?.message || 'Unknown error');
      if (e?.code === 4001 || e?.code === 'ACTION_REJECTED') msg = 'Transaction cancelled.';
      else if (e?.message?.includes('Too early')) msg = 'Release time must be in the future.';
      else if (e?.message?.includes('insufficient')) msg = 'Insufficient balance to lock this amount.';
      else if (e?.message?.includes('reverted')) msg = 'Transaction reverted: '+(e?.reason||e?.data?.message||e?.error?.message||'Make sure the release time is in the future and your balance covers the amount.');
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
