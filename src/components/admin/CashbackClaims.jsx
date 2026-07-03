import React, { useState, useEffect } from 'react';
import { SB_URL, SB_KEY, short } from '../../config';

export function CashbackClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/cashback_claims?status=eq.pending&order=timestamp.desc&select=*`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      const d = await r.json();
      setClaims(d || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchClaims(); }, []);

  const approve = async (claim) => {
    const token = sessionStorage.getItem('sp_admin_jwt');
    if (!token) { alert('Session expired.'); window.location.reload(); return; }
    setActionLoading(claim.id);
    try {
      const r = await fetch('/api/payout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      alert(`Paid ${claim.amount} USDC to ${short(claim.wallet_address)}`);
      fetchClaims();
    } catch (e) { alert('Error: ' + e.message); }
    setActionLoading(null);
  };

  const reject = async (claim) => {
    if (!window.confirm(`Reject claim of ${claim.amount} USDC from ${short(claim.wallet_address)}?`)) return;
    const token = sessionStorage.getItem('sp_admin_jwt');
    if (!token) { alert('Session expired.'); window.location.reload(); return; }
    setActionLoading('reject_' + claim.id);
    try {
      const r = await fetch('/api/reject-claim', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      fetchClaims();
    } catch (e) { alert('Error: ' + e.message); }
    setActionLoading(null);
  };

  if (loading) return <div style={{color:'var(--tx3)',fontSize:13,padding:'12px 0'}}>Loading claims...</div>;
  if (!claims.length) return <div style={{color:'var(--tx3)',fontSize:13,padding:'12px 0'}}>No pending claims.</div>;

  return (
    <div>
      {claims.map(c => (
        <div key={c.id} style={{background:'var(--elev)',borderRadius:12,padding:'14px 16px',marginBottom:10,border:'1px solid var(--b1)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:'var(--tx1)',marginBottom:4}}>{parseFloat(c.amount).toFixed(3)} USDC</div>
              <div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx2)',marginBottom:2}}>{c.wallet_address}</div>
              <div style={{fontSize:11,color:'var(--tx3)'}}>{new Date(c.timestamp).toLocaleString('en',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'rgba(240,196,63,.1)',color:'#f59e0b'}}>pending</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>approve(c)} disabled={!!actionLoading} style={{flex:2,background:'var(--ac)',border:'none',color:'#fff',borderRadius:10,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',opacity:actionLoading?0.6:1}}>
              {actionLoading===c.id?'Paying...':'Approve & Pay'}
            </button>
            <button onClick={()=>reject(c)} disabled={!!actionLoading} style={{flex:1,background:'none',border:'1px solid var(--re)',color:'var(--re)',borderRadius:10,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',opacity:actionLoading?0.6:1}}>
              {actionLoading==='reject_'+c.id?'Rejecting...':'Reject'}
            </button>
          </div>
        </div>
      ))}
      <button onClick={fetchClaims} style={{width:'100%',background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--tx2)',cursor:'pointer',marginTop:4}}>Refresh</button>
    </div>
  );
}
