import React, { useState } from 'react';
import { IC } from '../icons';
import { ls } from '../config';
import CountrySelect from './CountrySelect';

export default function InvoicePage({
  invPayer, setInvPayer, invAmt, setInvAmt,
  invDesc, setInvDesc, invCtry, setInvCtry,
  invId, handleCreateInv, loading, setPayId, setTab, contacts
}) {
  const [showContactsPicker, setShowContactsPicker] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  return (
    <div>
      <div className="ap-card">
        <div className="ap-card-title">Create Invoice</div>
        <div className="ap-card-sub">Request USDC payment. Stored on Supabase and payable from any device.</div>
        <div className="ap-label">Client Wallet Address</div>
        <div style={{display:'flex',gap:8,marginBottom:14,position:'relative'}}>
          <input className="ap-input" placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)} style={{marginBottom:0,flex:1}}/>
          {contacts?.length>0&&<button type="button" onMouseDown={()=>setShowContactsPicker(v=>!v)} className="ap-btn-icon" style={{flexShrink:0,color:"var(--ac)"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></button>}
          {showContactsPicker&&<div style={{position:'absolute',top:'110%',right:0,zIndex:20,background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,width:'min(320px,90vw)',boxShadow:'0 8px 24px rgba(0,0,0,.2)'}}>
            <div style={{padding:'8px 10px',borderBottom:'1px solid var(--b0)'}}>
              <input autoFocus placeholder="Search contacts..." onMouseDown={e=>e.stopPropagation()} onChange={e=>setContactSearch(e.target.value)} value={contactSearch} style={{width:'100%',padding:'6px 10px',borderRadius:8,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{maxHeight:240,overflowY:'auto'}}>
              {(contacts||[]).filter(c=>!contactSearch||c.name?.toLowerCase().includes(contactSearch.toLowerCase())||c.address?.toLowerCase().includes(contactSearch.toLowerCase())).length===0
                ?<div style={{padding:'12px',fontSize:12,color:'var(--tx3)',textAlign:'center'}}>No contacts found</div>
                :(contacts||[]).filter(c=>!contactSearch||c.name?.toLowerCase().includes(contactSearch.toLowerCase())||c.address?.toLowerCase().includes(contactSearch.toLowerCase())).map(c=>(
                  <div key={c.id} onMouseDown={()=>{setInvPayer(c.address);setShowContactsPicker(false);setContactSearch('');}} style={{padding:'9px 12px',cursor:'pointer',borderBottom:'1px solid var(--b0)',display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700,fontSize:13,color:'var(--ac)'}}>{c.name?.[0]?.toUpperCase()||'?'}</div>
                    <div style={{minWidth:0}}><div style={{fontWeight:600,fontSize:13,color:'var(--tx1)'}}>{c.name}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace'}}>{c.address.slice(0,6)}...{c.address.slice(-4)}</div></div>
                  </div>
                ))}
            </div>
          </div>}
        </div>
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
