import { useCallback } from 'react';
import { ethers } from 'ethers';
import { SCHED_ADDR, ls } from '../config';

export function useContractHistory({ address, provider, setContractTxns }) {
  const loadContractHistory = useCallback(async () => {
    if (!address) return;
    try {
      const r = await fetch('https://testnet.arcscan.app/api?module=account&action=txlist&address=' + address + '&sort=desc');
      const d = await r.json();
      const allExplorer = [];
      if (d.message === 'OK' && d.result) {
        d.result.filter(t => t.isError === '0' && parseInt(t.value) > 0).forEach(t => {
          const isReceived = t.to.toLowerCase() === address.toLowerCase() && t.from.toLowerCase() !== address.toLowerCase();
          allExplorer.push({ hash: t.hash, recipient: isReceived ? t.from : t.to, sender: t.from, amount: parseFloat(ethers.formatUnits(t.value, 18)).toFixed(2), country: '', timestamp: parseInt(t.timeStamp), status: 'confirmed', received: isReceived, type: isReceived ? 'received' : 'send' });
        });
      }
      try {
        const schedTxsResp = await fetch('https://testnet.arcscan.app/api?module=account&action=txlist&address=' + SCHED_ADDR + '&sort=desc');
        const schedTxsData = await schedTxsResp.json();
        const schedTxs = schedTxsData.message === 'OK' ? schedTxsData.result || [] : [];
        const schedContract = new ethers.Contract(SCHED_ADDR, ['function paymentCount() view returns (uint256)', 'function getPayment(uint256) view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'], provider);
        const count = Number(await schedContract.paymentCount());
        const seenHashes = new Set(allExplorer.map(t => t.hash));
        for (let i = count - 1; i >= 0; i--) {
          const p = await schedContract.getPayment(i);
          const amt = parseFloat(ethers.formatUnits(p.amount, 18)).toFixed(2);
          if (p.sender.toLowerCase() === address.toLowerCase()) {
            if (p.executed) {
              const execTx = schedTxs.find(t => t.input && t.input.startsWith('0xfe0d94c1') && parseInt('0x' + t.input.slice(10), 16) === i && t.isError === '0');
              const execTs = execTx ? parseInt(execTx.timeStamp) : Number(p.releaseTime);
              if (!seenHashes.has('sched_exec_' + i)) {
                allExplorer.push({ hash: 'sched_exec_' + i, recipient: p.recipient, sender: address, amount: amt, country: p.country, timestamp: execTs, status: 'confirmed', type: 'scheduled', label: 'Scheduled Payment' });
                seenHashes.add('sched_exec_' + i);
              }
            }
            if (p.cancelled) {
              if (!seenHashes.has('sched_refund_' + i)) {
                const cancelSig = '0x40e58ee5';
                const cancelTx = schedTxs.filter(t => t.isError === '0' && t.input && t.input.startsWith(cancelSig) && parseInt('0x' + t.input.slice(10), 16) === i).sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp))[0];
                const cancelTs = cancelTx ? parseInt(cancelTx.timeStamp) : Math.floor(Date.now() / 1000);
                allExplorer.push({ hash: 'sched_refund_' + i, recipient: address, sender: address, amount: amt, country: p.country, timestamp: cancelTs, status: 'confirmed', received: true, type: 'refund', label: 'Refund' });
                seenHashes.add('sched_refund_' + i);
              }
            }
          }
          if (p.recipient.toLowerCase() === address.toLowerCase() && p.executed) {
            if (!seenHashes.has('sched_recv_' + i)) {
              allExplorer.push({ hash: 'sched_recv_' + i, recipient: address, sender: p.sender, amount: parseFloat(ethers.formatUnits(p.amount, 18)).toFixed(2), country: p.country, timestamp: Number(p.releaseTime), status: 'confirmed', received: true, type: 'scheduled_received', label: 'Scheduled Payment Received' });
              seenHashes.add('sched_recv_' + i);
            }
          }
        }
      } catch (e) { console.log('sched events error:', e); }
      const deletedHashes = new Set(ls('arc_deleted_hashes_' + address, []));
      setContractTxns(allExplorer.filter(t => !deletedHashes.has(t.hash)));
    } catch (e) { console.log('explorer fetch failed:', e); }
  }, [address, provider, setContractTxns]); // eslint-disable-line

  return { loadContractHistory };
}
