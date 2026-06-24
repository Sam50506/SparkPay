import React from 'react';
import { IC } from '../icons';
import { ALL_CC, CURRENCY } from '../config';
import CountrySelect from './CountrySelect';
import QRScanner from './QRScanner';

export default function SendPage({
  contacts, sendAmt, setSendAmt, sendTo, setSendTo,
  sendCtry, setSendCtry, convertedVal,
  showScanner, setShowScanner, handleSendReview, loading
}) {
  return (
    <>
      {contacts.length>0&&(
        <div style={{marginBottom:16}}>
          <div className="ap-label">Quick Select</div>
          <div className="ap-quick-wrap">
            {contacts.map(c=>(
              <button key={c.id} className="ap-quick-pill" onClick={()=>{setSendTo(c.address);setSendCtry(c.country);}}>
                <span className="ap-cc">{ALL_CC[c.country]||'?'}</span>{c.name}
              </button>
            ))}
          </div>
        </div>
      )}
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
