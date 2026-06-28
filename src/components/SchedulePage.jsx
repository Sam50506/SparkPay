import React from 'react';
import CountrySelect from './CountrySelect';
import TimePicker from './TimePicker';
import { OnChainSchedules } from './ScheduledPaymentsPanel';
import { SCHED_ADDR } from '../config';
import { SCHED_ABI } from '../hooks/useSchedule';

export default function SchedulePage({
  newSched, setNewSched, handleSchedule, handleExecute,
  handleCancelSched, loading, address, provider, signer, rates
}) {
  return (
    <div>
      <div className="ap-card">
        <div className="ap-card-title">Schedule Payment</div>
        <div className="ap-card-sub">Lock USDC now. It releases to the recipient automatically at your chosen time.</div>
        <div style={{fontSize:12,color:'var(--tx3)',marginBottom:16,lineHeight:1.7,paddingLeft:12,borderLeft:'2px solid var(--b2)'}}>USDC is locked in a smart contract escrow and released automatically when the time arrives. You can cancel anytime before release to get your USDC back.</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
          <div><div className="ap-label">Recipient Address</div><input className="ap-input" style={{marginBottom:0}} placeholder="0x..." value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}/></div>
          <div><div className="ap-label">Amount (USDC)</div><input className="ap-input" style={{marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/></div>
          <div><div className="ap-label">Country</div><CountrySelect value={newSched.country} onChange={v=>setNewSched(s=>({...s,country:v}))}/></div>
          <div><div className="ap-label">Release Date</div><input className="ap-input" style={{marginBottom:0}} type="date" value={newSched.next||''} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))} min={new Date(Date.now()+5*60000).toISOString().slice(0,10)}/></div>
        </div>
        <div style={{marginBottom:14}}><div className="ap-label">Release Time</div><TimePicker value={newSched.time||'12:00'} onChange={v=>setNewSched(s=>({...s,time:v}))}/></div>
        <button className="ap-btn ap-btn-primary" onClick={handleSchedule} disabled={loading}>{loading?'Processing...':'Lock and Schedule Payment'}</button>
      </div>
      <OnChainSchedules address={address} provider={provider} signer={signer} schedAddr={SCHED_ADDR} schedAbi={SCHED_ABI} onExecute={handleExecute} onCancel={handleCancelSched} loading={loading} rates={rates}/>
    </div>
  );
}
