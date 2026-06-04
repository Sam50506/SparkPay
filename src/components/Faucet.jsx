import React from 'react';
import { ethers } from 'ethers';

const ARC_RPC = process.env.REACT_APP_ARC_RPC || '';
const ARC_RPC_FALLBACK = 'https://rpc.testnet.arc.network';
const ARC_CHAIN_ID = 5042002;

const ls = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function Faucet({ address, balance, setBalance, faucetLoading, setFaucetLoading, faucetMsg, setFaucetMsg, lastClaim, setLastClaim }) {
  const claimFaucet = async () => {
    if (!address) { setFaucetMsg({ type: 'error', msg: 'Connect your wallet first' }); return; }
    const now = Date.now();
    const cooldown = 2 * 60 * 60 * 1000;
    if (now - lastClaim < cooldown) {
      const mins = Math.ceil((cooldown - (now - lastClaim)) / 60000);
      setFaucetMsg({ type: 'error', msg: 'Wait ' + mins + ' more minutes before claiming again' });
      return;
    }
    setFaucetLoading(true); setFaucetMsg(null);
    navigator.clipboard?.writeText(address);
    const w = window.open('https://faucet.circle.com', '_blank');
    if (!w || w.closed) window.location.href = 'https://faucet.circle.com';
    setFaucetMsg({ type: 'info', msg: 'Address copied! Paste it in the faucet. Waiting to confirm your claim...' });
    setFaucetLoading(false);
    const prevBal = parseFloat(balance);
    let attempts = 0;
    const getBal = async () => {
      try {
        const rp = new ethers.JsonRpcProvider(ARC_RPC || ARC_RPC_FALLBACK, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
        const b = await rp.getBalance(address);
        return parseFloat(ethers.formatUnits(b, 18));
      } catch { return prevBal; }
    };
    const poll = setInterval(async () => {
      attempts++;
      const newBal = await getBal();
      if (newBal >= prevBal + 19) {
        clearInterval(poll);
        lsSave('arc_faucet_last_' + address, Date.now());
        setLastClaim(Date.now());
        setBalance(newBal.toFixed(2));
        setFaucetMsg({ type: 'success', msg: '20 USDC received! Next claim in 2 hours.' });
      } else if (attempts >= 20) {
        clearInterval(poll);
        setFaucetMsg({ type: 'error', msg: 'Claim not detected. Try again when ready.' });
      }
    }, 30000);
  };

  const cooldownLeft = Math.max(0, Math.ceil((2 * 60 * 60 * 1000 - (Date.now() - lastClaim)) / 60000));
  const canClaim = cooldownLeft === 0;
  const steps = [
    { color: 'var(--ac)', path: 'M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5v5h5', title: 'Claim', desc: 'Request 20 USDC from Circle faucet' },
    { color: 'var(--ye)', path: 'M12 2a10 10 0 110 20A10 10 0 0112 2zm0 6v4l3 3', title: 'Wait', desc: '2 hour cooldown between claims' },
    { color: 'var(--cy)', path: 'M12 2a10 10 0 110 20A10 10 0 0112 2zm-2 10l2 2 4-4', title: 'Receive', desc: 'USDC arrives in your wallet' },
  ];

  return (
    <div>
      <div className="ap-card">
        <div className="ap-card-title">Circle Testnet Faucet</div>
        <div className="ap-card-sub">Claim 20 free USDC on Arc Testnet every 2 hours. Powered by Circle.</div>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--ac)', fontFamily: 'var(--fd)', lineHeight: 1 }}>20</div>
          <div style={{ fontSize: 14, color: 'var(--tx2)', marginTop: 6 }}>USDC per claim</div>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 2 }}>Every 2 hours per address</div>
        </div>
        {faucetMsg && <div className={faucetMsg.type === 'success' ? 'ap-status ap-status-success' : faucetMsg.type === 'info' ? 'ap-status ap-status-info' : 'ap-status ap-status-error'} style={{ marginBottom: 12 }}>{faucetMsg.msg}</div>}
        {!canClaim && <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 12, textAlign: 'center', padding: '10px', background: 'var(--elev)', borderRadius: 10 }}>Next claim in {cooldownLeft} minutes</div>}
        <button className="ap-btn ap-btn-primary" style={{ marginTop: 0 }} onClick={claimFaucet} disabled={!canClaim}>
          {faucetLoading ? 'Claiming...' : (canClaim ? 'Claim 20 USDC' : 'Cooldown Active')}
        </button>
      </div>
      <div className="ap-card" style={{ marginTop: 16 }}>
        <div className="ap-card-title">How it works</div>
        <div className="ap-div" />
        {steps.map(({ color, path, title, desc }) => (
          <div key={title} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--b0)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--acd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
            </div>
            <div><div style={{ fontWeight: 600, color: 'var(--tx1)', fontSize: 14 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>{desc}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
