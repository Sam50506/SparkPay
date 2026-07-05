import React, { useState } from 'react';
import { IC } from '../icons';
import { ALL_CC, CURRENCY } from '../config';
import CountrySelect from './CountrySelect';
import QRScanner from './QRScanner';

export default function SendPage({
  contacts, sendAmt, setSendAmt, sendTo, setSendTo,
  sendCtry, setSendCtry, convertedVal,
  showScanner, setShowScanner, handleSendReview, loading
}) {
  const [showContactsPicker, setShowContactsPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const filteredC = (contacts||[]).filter(c =>
    c.address?.toLowerCase().includes(sendTo.toLowerCase()) ||
    c.name?.toLowerCase().includes(sendTo.toLowerCase())
  );

  return (
    <>
      <div className="ap-send-card">
        <div className="ap-send-panel">
          <div className="ap-send-lbl">You Send</div>
          <div className="ap-send-row">
            <input className="ap-amount-input" type="number" min="0" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
            <div className="ap-token-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--ac)" strokeWidth="2"/><line x1="12" y1="6" x2="12" y2="8.5" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"/><path d="M15.5 9.5H9.5a2 2 0 0 0 0 4H13a2 2 0 0 1 0 4H8" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17.5" x2="12" y2="20" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"/></svg>
              USDC
            </div>
          </div>
          {sendAmt&&<div style={{fontSize:12,color:'var(--tx3)',marginTop:8}}>${parseFloat(sendAmt)||0} USD</div>}
        </div>
        <div className="ap-recv-divider"><div className="ap-recv-icon"><IC.ArrowDown/></div></div>
        <div className="ap-send-panel recv">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,gap:12}}>
            <div className="ap-send-lbl" style={{marginBottom:0}}>They Receive <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--tx3)',fontSize:10}}>(Optional)</span></div>
            <CountrySelect value={sendCtry} onChange={v=>setSendCtry(v)}/>
          </div>
          {convertedVal
            ? <>
                <div className="ap-conv-amount">{convertedVal} {CURRENCY[sendCtry]}</div>
                <div className="ap-conv-rate">1 USDC = {/* rate shown via convertedVal */} {CURRENCY[sendCtry]}</div>
              </>
            : <div style={{fontSize:13,color:'var(--tx3)'}}>{sendCtry?'Enter an amount above to see the conversion':'Select a destination country to see conversion estimate'}</div>
          }
        </div>
      </div>
      <div className="ap-card" style={{marginBottom:0}}>
        <div className="ap-label">Recipient Address</div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <input className="ap-input" placeholder="0x..." value={sendTo} onChange={e=>setSendTo(e.target.value)} style={{marginBottom:0,flex:1}}/>
          <div style={{position:"relative"}}>
            <button type="button" onMouseDown={()=>setShowContactsPicker(v=>!v)} className="ap-btn-icon" style={{flexShrink:0,color:"var(--ac)"}} title="Pick from contacts"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>
            {showContactsPicker && (
              <div style={{position:"absolute",top:"110%",right:0,zIndex:20,background:"var(--card)",border:"1px solid var(--b1)",borderRadius:12,width:260,boxShadow:"0 8px 24px rgba(0,0,0,.2)"}}>
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
                <div style={{maxHeight:200,overflowY:"auto"}}>
                  {(contacts||[]).filter(c=>!contactSearch||c.name?.toLowerCase().includes(contactSearch.toLowerCase())||c.address?.toLowerCase().includes(contactSearch.toLowerCase())).length===0
                    ? <div style={{padding:"12px",fontSize:12,color:"var(--tx3)",textAlign:"center"}}>No contacts found</div>
                    : (contacts||[]).filter(c=>!contactSearch||c.name?.toLowerCase().includes(contactSearch.toLowerCase())||c.address?.toLowerCase().includes(contactSearch.toLowerCase())).map(c=>(
                      <div key={c.id} onMouseDown={()=>{setSendTo(c.address);if(c.country)setSendCtry(c.country);setShowContactsPicker(false);setContactSearch('');}} style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid var(--b0)",display:"flex",alignItems:"center",gap:8}}>
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
          <button type="button" onClick={()=>setShowScanner(true)} className="ap-btn-icon" style={{flexShrink:0}} title="Scan QR Code">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="14.01"/><line x1="18" y1="14" x2="18" y2="14.01"/><line x1="14" y1="18" x2="14" y2="18.01"/><line x1="18" y1="18" x2="18" y2="18.01"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg>
          </button>
        </div>
        {showScanner&&<QRScanner onScan={(text)=>{
          let addr=text;
          try{
            const url=new URL(text);
            const payParam=url.searchParams.get('pay');
            if(payParam)addr=payParam;
          }catch(e){
            const match=text.match(/0x[a-fA-F0-9]{40}/);
            if(match)addr=match[0];
          }
          setSendTo(addr);
          setShowScanner(false);
        }} onClose={()=>setShowScanner(false)}/>}
        <button className="ap-btn ap-btn-primary" onClick={handleSendReview} disabled={loading||!sendTo||!sendAmt}>{loading?'Processing...':'Review Transfer'}</button>
        <div className="ap-fee-note" style={{marginTop:8}}><IC.Check/> Estimated fee: ~0.0005 USDC on Arc Testnet</div>
      </div>
    </>
  );
}
