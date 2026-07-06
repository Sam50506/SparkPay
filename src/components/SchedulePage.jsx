import React, { useState, useMemo } from 'react';
import CountrySelect from './CountrySelect';
import TimePicker from './TimePicker';
import { OnChainSchedules } from './ScheduledPaymentsPanel';
import { SCHED_ADDR, isValidAddr } from '../config';
import { SCHED_ABI } from '../hooks/useSchedule';

const TZ_LABEL = Intl.DateTimeFormat().resolvedOptions().timeZone;
const EST_GAS_ARC = '0.0002';

export default function SchedulePage({
  newSched, setNewSched, handleSchedule, handleExecute,
  handleCancelSched, loading, address, provider, signer, rates,
  balance, contacts
}) {
  const [confirming, setConfirming] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const addrTrimmed = (newSched.addr || '').trim();
  const addrValid = addrTrimmed.length === 0 || isValidAddr(addrTrimmed);
  const amountNum = parseFloat(newSched.amount) || 0;
  const balanceNum = parseFloat(balance) || 0;
  const insufficientBalance = amountNum > 0 && amountNum > balanceNum;

  const canReview = useMemo(() => {
    return !!newSched.addr && isValidAddr(addrTrimmed) && amountNum > 0 &&
      !!newSched.next && !insufficientBalance;
  }, [newSched.addr, addrTrimmed, amountNum, newSched.next, insufficientBalance]);

  const releaseDateTime = newSched.next
    ? new Date(newSched.next + 'T' + (newSched.time || '12:00') + ':00')
    : null;

  const filteredContacts = (contacts || []).filter(c =>
    !contactSearch ||
    c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.address?.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const pickContact = (c) => {
    setNewSched(s => ({ ...s, addr: c.address, country: c.country || s.country }));
    setShowContacts(false);
    setContactSearch('');
  };

  const onConfirmClick = () => {
    if (!canReview) return;
    setConfirming(true);
  };

  const onFinalLock = async () => {
    setConfirming(false);
    await handleSchedule();
  };

  return (
    <div>
      <div className="ap-card">
        <div className="ap-card-title">Schedule Payment</div>
        <div className="ap-card-sub">Lock USDC now. It releases to the recipient automatically at your chosen time.</div>
        <div style={{fontSize:12,color:'var(--tx3)',marginBottom:16,lineHeight:1.7,paddingLeft:12,borderLeft:'2px solid var(--b2)'}}>USDC is locked in a smart contract escrow and released automatically when the time arrives. You can cancel anytime before release to get your USDC back.</div>

        {!confirming && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <div className="ap-label">Recipient Address</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input
                    className="ap-input"
                    style={{marginBottom:0,borderColor:addrValid?undefined:"var(--err,#ef4444)",flex:1}}
                    placeholder="0x..."
                    value={newSched.addr}
                    onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}
                  />
                  <div style={{position:"relative"}}>
                  <button type="button" onMouseDown={()=>setShowContacts(v=>!v)} style={{flexShrink:0,width:42,height:42,borderRadius:10,border:"1px solid var(--b1)",background:"var(--elev)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--ac)"}} title="Pick from contacts"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>
                  {showContacts && (
                    <div style={{position:"absolute",top:"110%",right:0,zIndex:20,background:"var(--card)",border:"1px solid var(--b1)",borderRadius:12,width:"min(320px,90vw)",boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
                      <div style={{padding:"8px 10px",borderBottom:"1px solid var(--b0)"}}>
                        <input
                          autoFocus
                          placeholder="Search contacts..."
                          onMouseDown={e=>e.stopPropagation()}
                          onChange={e=>setContactSearch(e.target.value)}
                          value={contactSearch}
                          style={{width:"100%",padding:"6px 10px",borderRadius:8,border:"1px solid var(--b1)",background:"var(--elev)",color:"var(--tx1)",fontSize:12,outline:"none",boxSizing:"border-box"}}
                        />
                      </div>
                      <div style={{maxHeight:265,overflowY:"auto"}}>
                        {filteredContacts.length===0
                          ? <div style={{padding:"12px",fontSize:12,color:"var(--tx3)",textAlign:"center"}}>No contacts found</div>
                          : filteredContacts.map(c=>(
                            <div key={c.id} onMouseDown={()=>pickContact(c)} style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--b0)",display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:32,height:32,borderRadius:"50%",background:"var(--acd)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,fontSize:13,color:"var(--ac)"}}>{c.name?.[0]?.toUpperCase()||'?'}</div>
                              <div style={{minWidth:0}}>
                                <div style={{fontWeight:600,fontSize:13,color:"var(--tx1)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</div>
                                <div style={{fontSize:11,color:"var(--tx3)",fontFamily:"monospace"}}>{c.address.slice(0,6)}...{c.address.slice(-4)}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  </div>
                </div>
                {!addrValid && <div style={{fontSize:11,color:'var(--err,#ef4444)',marginTop:4}}>Not a valid address (must start with 0x, 42 characters)</div>}
              </div>
              <div>
                <div className="ap-label">Amount (USDC)</div>
                <input className="ap-input" style={{marginBottom:0,borderColor:insufficientBalance?'var(--err,#ef4444)':undefined}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/>
                {insufficientBalance && <div style={{fontSize:11,color:'var(--err,#ef4444)',marginTop:4}}>Exceeds available balance</div>}
              </div>
              <div><div className="ap-label">Country</div><CountrySelect value={newSched.country} onChange={v=>setNewSched(s=>({...s,country:v}))}/></div>
              <div><div className="ap-label">Release Date</div><input className="ap-input" style={{marginBottom:0}} type="date" value={newSched.next||''} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))} min={new Date(Date.now()+5*60000).toISOString().slice(0,10)}/></div>
            </div>
            <div style={{marginBottom:6}}>
              <div className="ap-label">Release Time</div>
              <TimePicker value={newSched.time||'12:00'} onChange={v=>setNewSched(s=>({...s,time:v}))}/>
            </div>
            <div style={{fontSize:11,color:'var(--tx3)',marginBottom:14}}>Times shown in your local timezone ({TZ_LABEL})</div>

            <button className="ap-btn ap-btn-primary" onClick={onConfirmClick} disabled={loading || !canReview}>
              Review Payment
            </button>
          </>
        )}

        {confirming && (
          <div>
            <div style={{background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:12,padding:16,marginBottom:16}}>
              <div style={{fontSize:12,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:12,fontWeight:700}}>Review Before Locking</div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13,gap:12}}>
                <span style={{color:'var(--tx3)',flexShrink:0}}>Recipient</span>
                <span style={{fontFamily:'monospace',color:'var(--tx1)',wordBreak:'break-all',textAlign:'right',minWidth:0}}>{addrTrimmed}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13}}>
                <span style={{color:'var(--tx3)'}}>Amount</span>
                <span style={{fontWeight:700,color:'var(--tx1)'}}>{newSched.amount} USDC</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13}}>
                <span style={{color:'var(--tx3)'}}>Country</span>
                <span style={{color:'var(--tx1)'}}>{newSched.country || '—'}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,fontSize:13}}>
                <span style={{color:'var(--tx3)'}}>Releases at</span>
                <span style={{color:'var(--tx1)'}}>{releaseDateTime ? releaseDateTime.toLocaleString() : '—'} ({TZ_LABEL})</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:'var(--tx3)'}}>Est. network fee</span>
                <span style={{color:'var(--tx1)'}}>~{EST_GAS_ARC} ARC</span>
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>setConfirming(false)} disabled={loading}>Edit</button>
              <button className="ap-btn ap-btn-primary" style={{flex:1}} onClick={onFinalLock} disabled={loading}>{loading?'Processing...':'Confirm & Lock'}</button>
            </div>
          </div>
        )}
      </div>
      <OnChainSchedules address={address} provider={provider} signer={signer} schedAddr={SCHED_ADDR} schedAbi={SCHED_ABI} onExecute={handleExecute} onCancel={handleCancelSched} loading={loading} rates={rates}/>
    </div>
  );
}
