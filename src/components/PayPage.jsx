import React from 'react';
import { ALL_CC } from '../config';
import { fmtUsdc, short } from '../config';

export default function PayPage({
  payId, setPayId, payDet, setPayDet,
  handlePayInvReview, loading,
  setConfirmData, setConfirmAction, setShowConfirm
}) {
  return (
    <div className="ap-card">
      <div className="ap-card-title">Pay Invoice</div>
      <div className="ap-card-sub">Enter an invoice ID to look it up and pay instantly.</div>
      <div className="ap-label">Invoice ID</div>
      <input className="ap-input" placeholder="0x..." value={payId} onChange={e=>{setPayId(e.target.value);setPayDet(null);}} style={{marginBottom:payDet?12:14}}/>
      {payDet&&(
        <div style={{background:'var(--acd)',border:'1px solid var(--acs)',borderRadius:12,padding:'14px 16px',marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:'var(--ac2)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>Invoice Details</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14,color:'var(--tx1)'}}>
            <div><span style={{color:'var(--tx2)'}}>Amount:</span> <strong style={{color:'var(--tx1)'}}>{fmtUsdc(payDet.amount)} USDC</strong></div>
            <div><span style={{color:'var(--tx2)'}}>Country:</span> <span style={{color:'var(--tx1)'}}>{payDet.country?<><span className="ap-cc">{ALL_CC[payDet.country]}</span> {payDet.country}</>:'N/A'}</span></div>
            <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>Description:</span> <span style={{color:'var(--tx1)'}}>{payDet.description}</span></div>
            <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>From:</span> <span style={{fontFamily:'monospace',fontSize:13,color:'var(--tx1)'}}>{short(payDet.creator)}</span></div>
          </div>
        </div>
      )}
      <button className="ap-btn ap-btn-primary" onClick={()=>handlePayInvReview(setConfirmData,setConfirmAction,setShowConfirm)} disabled={loading}>{loading?'Looking up...':'Find and Pay Invoice'}</button>
    </div>
  );
}
