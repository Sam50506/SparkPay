import { useState } from 'react';
import { ethers } from 'ethers';
import { ARC_RPC, ARC_RPC_FALLBACK, ARC_CHAIN_ID, REMIT_ADDR, USDC_ADDR, lsSave } from '../config';

export function useMulti({ signer, address, walletName, setStatus, setLoading, setTxns, awardCashback, refreshBal, cleanErr, setConfirmData, setConfirmAction, setShowConfirm, setShowWalletPrompt, getC }) {
  const [multi, setMulti] = useState([{ addr: '', amount: '', country: '' }]);

  const handleMulti = async () => {
    setShowConfirm(false);
    const valid = multi.filter(r => (ethers.isAddress(r.addr) || /^0x[0-9a-fA-F]{40}$/.test(r.addr)) && parseFloat(r.amount) > 0);
    if (!signer || !valid.length) return;
    setLoading(true);
    try {
      const { remit, usdc } = getC();
      const recipients = valid.map(r => ethers.getAddress(r.addr.toLowerCase()));
      const amounts = valid.map(r => ethers.parseUnits(parseFloat(r.amount).toString(), 18));
      const countries = valid.map(r => r.country || '');
      const total = amounts.reduce((a, b) => a + b, 0n);

      // batchSend() pulls USDC via safeTransferFrom, which requires prior approval —
      // this is a separate step from the batchSend call itself, not sent as native value.
      setStatus({ type: 'info', msg: 'Checking USDC approval...' });
      const currentAllowance = await usdc.allowance(address, REMIT_ADDR);
      if (currentAllowance < total) {
        setShowWalletPrompt(true);
        setStatus({ type: 'info', msg: 'Approve USDC spend in your wallet...' });
        let approveTx;
        try {
          approveTx = await usdc.approve(REMIT_ADDR, total);
        } catch (ae) {
          setShowWalletPrompt(false);
          if (ae?.code === 4001 || ae?.code === 'ACTION_REJECTED') {
            setStatus({ type: 'error', msg: 'Approval cancelled' });
          } else {
            setStatus({ type: 'error', msg: cleanErr(ae) });
          }
          setLoading(false);
          return;
        }
        setStatus({ type: 'info', msg: 'Waiting for approval confirmation...' });
        await approveTx.wait();
      }

      setStatus({ type: 'info', msg: 'Estimating gas...' });
      const rp = new ethers.JsonRpcProvider(ARC_RPC || ARC_RPC_FALLBACK, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      const iface = new ethers.Interface(['function batchSend(address token, address[] recipients, uint256[] amounts, string[] countries)']);
      const data = iface.encodeFunctionData('batchSend', [USDC_ADDR, recipients, amounts, countries]);
      let gasLimit = 300000;
      try {
        const est = await rp.send('eth_estimateGas', [{ from: address, to: REMIT_ADDR, data }]);
        gasLimit = Math.ceil(parseInt(est, 16) * 1.3);
      } catch (e) { }

      setShowWalletPrompt(true);
      let tx;
      try {
        tx = await remit.batchSend(USDC_ADDR, recipients, amounts, countries, { gasLimit, gasPrice: ethers.parseUnits('21', 'gwei') });
      } catch (ue) {
        if (ue?.code === 4001 || ue?.code === 'ACTION_REJECTED') {
          setShowWalletPrompt(false);
          setStatus({ type: 'error', msg: 'Transaction cancelled' });
          setLoading(false);
          return;
        }
        throw ue;
      }
      setStatus({ type: 'info', msg: 'Waiting for confirmation...' });
      await tx.wait();
      valid.forEach((r) => {
        const rec = { id: tx.hash + '_' + r.addr, hash: tx.hash, recipient: r.addr, amount: parseFloat(r.amount), country: r.country, timestamp: Math.floor(Date.now() / 1000), status: 'confirmed' };
        setTxns(prev => { const u = [rec, ...prev.slice(0, 499)]; lsSave('arc_txhistory_' + address, u); return u; });
        awardCashback(tx.hash, r.amount);
      });
      setShowWalletPrompt(false);
      setStatus({ type: 'success', msg: 'Sent to ' + valid.length + ' recipients in one transaction!' });
      setMulti([{ addr: '', amount: '', country: '' }]);
      setTimeout(refreshBal, 3000);
      setTimeout(refreshBal, 6000);
    } catch (e) {
      setShowWalletPrompt(false);
      setStatus({ type: 'error', msg: cleanErr(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiReview = () => { const valid = multi.filter(r => (ethers.isAddress(r.addr) || /^0x[0-9a-fA-F]{40}$/.test(r.addr)) && parseFloat(r.amount) > 0); if (!signer || !valid.length) { setStatus({ type: 'error', msg: 'Add at least one valid recipient' }); return; } const total = valid.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0); if (walletName?.toLowerCase().includes('okx')) { handleMulti(); } else { setConfirmData({ rows: [{ k: 'Recipients', v: valid.length + ' addresses' }, { k: 'Total', v: total.toFixed(2) + ' USDC' }, { k: 'Est. Fee', v: '~' + (valid.length * .001).toFixed(3) + ' USDC', highlight: true }, { k: 'Network', v: 'Arc Testnet' }], confirmLabel: 'Send to All Wallets' }); setConfirmAction(() => handleMulti); setShowConfirm(true); } };

  return { multi, setMulti, handleMulti, handleMultiReview };
}
