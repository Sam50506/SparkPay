import React, { useState, useEffect } from 'react';
import { ALL_CC, sbSelect, short, fmtUsdc } from '../config';

export default function PayPage({
  payId, setPayId, payDet, setPayDet,
  handlePayInvReview, loading,
  setConfirmData, setConfirmAction, setShowConfirm, address
}) {
  const [invoices, setInvoices] = useState([]);
  const [invLoading, setInvLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setInvLoading(true);
    Promise.all([
      sbSelect('invoices', 'creator=eq.'+address+'&order=created_at.desc&limit=20').catch(()=>[]),
      sbSelect('invoices', 'paid_by=eq.'+address+'&order=created_at.desc&limit=20').catch(()=>[])
    ]).then(([created, paid]) => {
      const merged = [...(created||[]), ...(paid||[])];
      const unique = merged.filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);
      unique.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      setInvoices(unique);
    }).finally(()=>setInvLoading(false));
  }, [address]);
  return (
    <>
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
    {(invLoading||invoices.length>0)&&<div className="ap-card" style={{marginTop:16}}>
      <div className="ap-card-title">Invoice History</div>
      <div className="ap-card-sub">Invoices you created or paid</div>
      <div className="ap-div"/>
      {invLoading&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'20px 0',fontSize:13}}>Loading...</div>}
      {!invLoading&&invoices.map((inv,i)=>(
        <div key={inv.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--b0)',cursor:'pointer'}} onClick={()=>setPayId(inv.id)}>
          <div style={{minWidth:0,flex:1}}>
            <div style={{fontWeight:600,color:'var(--tx1)',fontSize:14}}>{inv.description||'Invoice'}</div>
            <div style={{fontSize:11,color:'var(--tx3)',marginTop:2,fontFamily:'monospace'}}>{inv.id.slice(0,18)}...</div>
            <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{inv.creator.toLowerCase()===address.toLowerCase()?'Created by you':'Paid by you'}</div>
          </div>
          <div style={{textAlign:'right',flexShrink:0,marginLeft:12}}>
            <div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{inv.amount} USDC</div>
            <div style={{fontSize:11,padding:'2px 8px',borderRadius:999,marginTop:4,background:inv.paid?'rgba(23,229,176,.1)':'rgba(59,130,196,.1)',color:inv.paid?'var(--cy)':'var(--ac)',display:'inline-block',fontWeight:600}}>{inv.paid?'Paid':'Pending'}</div>
          </div>
        </div>
      ))}
    </div>}
    </>
  );
}
