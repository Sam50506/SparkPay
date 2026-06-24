import React from 'react';
import { IC } from '../icons';
import { ls } from '../config';
import CountrySelect from './CountrySelect';

export default function InvoicePage({
  invPayer, setInvPayer, invAmt, setInvAmt,
  invDesc, setInvDesc, invCtry, setInvCtry,
  invId, handleCreateInv, loading, setPayId, setTab
}) {
  return (
    <div>
      <div className="ap-card">
        <div className="ap-card-title">Create Invoice</div>
        <div className="ap-card-sub">Request USDC payment. Stored on Supabase and payable from any device.</div>
        <div className="ap-label">Client Wallet Address</div>
        <input className="ap-input" placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)} style={{marginBottom:14}}/>
        <div className="ap-label">Amount (USDC)</div>
        <input className="ap-input" type="number" placeholder="500" value={invAmt} onChange={e=>setInvAmt(e.target.value)} style={{marginBottom:14}}/>
        <div className="ap-label">Description</div>
        <input className="ap-input" placeholder="Logo design - May 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)} style={{marginBottom:14}}/>
        <div className="ap-label">Your Country (Optional)</div>
        <CountrySelect value={invCtry} onChange={v=>setInvCtry(v)}/>
        <button className="ap-btn ap-btn-primary" onClick={handleCreateInv} disabled={loading}>{loading?'Creating...':'Create Invoice'}</button>
        {invId&&(
          <div style={{marginTop:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--cy)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><IC.Check/> Invoice created successfully</div>
            <div className="ap-code">{invId}</div>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
              <button className="ap-btn ap-btn-sec" onClick={()=>navigator.clipboard?.writeText(invId)}><IC.Copy/> Copy ID</button>
              <button className="ap-btn ap-btn-sec" onClick={()=>{setPayId(invId);setTab('pay');}}>Pay this Invoice</button>
            </div>
          </div>
        )}
      </div>
      {ls('arc_invoices',[]).length>0&&(
        <div className="ap-card">
          <div className="ap-card-title">Recent Invoices</div>
          <div className="ap-div"/>
          {ls('arc_invoices',[]).slice(0,5).map((inv,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--b0)'}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>{inv.amount} USDC - {inv.desc?.slice(0,30)}</div>
                <div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx2)',marginTop:2}}>{inv.id?.slice(0,18)}...</div>
              </div>
              <button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setPayId(inv.id);setTab('pay');}}>Pay</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
