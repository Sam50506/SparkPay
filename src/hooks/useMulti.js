import { useState } from 'react';
import { ethers } from 'ethers';
import { ARC_RPC, ARC_RPC_FALLBACK, ARC_CHAIN_ID, REMIT_ADDR, lsSave, awaitReceipt } from '../config';

export function useMulti({ signer, address, walletName, setStatus, setLoading, setTxns, awardCashback, refreshBal, cleanErr, setConfirmData, setConfirmAction, setShowConfirm, setShowWalletPrompt, getC }) {
  const [multi, setMulti] = useState([{ addr: '', amount: '', country: '' }]);

  const handleMulti = async () => {
    setShowConfirm(false);
    const valid = multi.filter(r => (ethers.isAddress(r.addr) || /^0x[0-9a-fA-F]{40}$/.test(r.addr)) && parseFloat(r.amount) > 0);
    if (!signer || !valid.length) return;
    setLoading(true);
    try {
      const { remit } = getC();
      const recipients = valid.map(r => ethers.getAddress(r.addr.toLowerCase()));
      const amounts = valid.map(r => ethers.parseUnits(parseFloat(r.amount).toString(), 18));
      const countries = valid.map(r => r.country || '');
      const total = amounts.reduce((a, b) => a + b, 0n);

      // USDC is Arc Testnet's native currency — batchSend() is payable and pays
      // recipients directly via native value, matching the rest of the app
      // (single-send, ScheduledPayment) rather than treating it as a separate ERC20.
      setStatus({ type: 'info', msg: 'Estimating gas...' });
      const rp = new ethers.JsonRpcProvider(ARC_RPC || ARC_RPC_FALLBACK, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      const iface = new ethers.Interface(['function batchSend(address[] recipients, uint256[] amounts, string[] countries) payable']);
      const data = iface.encodeFunctionData('batchSend', [recipients, amounts, countries]);
      let gasLimit = 300000;
      try {
        const est = await rp.send('eth_estimateGas', [{ from: address, to: REMIT_ADDR, value: '0x' + total.toString(16), data }]);
        gasLimit = Math.ceil(parseInt(est, 16) * 1.3);
      } catch (e) { }

      setShowWalletPrompt(true);
      let tx;
      try {
        tx = await remit.batchSend(recipients, amounts, countries, { value: total, gasLimit, gasPrice: ethers.parseUnits('21', 'gwei') });
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

      const finalizeMulti = () => {
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
      };

      try {
        await tx.wait();
      } catch (waitErr) {
        // SECURITY/UX: `tx` already exists here, meaning batchSend was genuinely
        // broadcast and may already be paying multiple recipients. A wait-step
        // glitch (RPC rate limit, "could not coalesce error", etc.) is NOT proof
        // the transaction failed - only that we failed to observe confirmation.
        // Never declare failure at this point: doing so risks the user resending
        // a multi-recipient batch and double-paying everyone in it. Fall back to
        // background polling and only report an outcome once we have a real answer.
        console.warn('useMulti: tx.wait() did not resolve cleanly, falling back to background poll:', waitErr.message);
        setStatus({ type: 'info', msg: 'Still confirming on-chain (this can take a bit longer than usual)... Transaction hash: ' + tx.hash });
        setLoading(false);
        awaitReceipt(signer.provider || signer, tx.hash, 300000).then(receipt => {
          if (receipt) {
            finalizeMulti();
          } else {
            setShowWalletPrompt(false);
            setStatus({ type: 'error', msg: 'Could not confirm transaction after 5 minutes. Before retrying, check this tx hash on the block explorer to make sure recipients weren\'t already paid: ' + tx.hash });
          }
        });
        return;
      }
      finalizeMulti();
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
