import React, { useState, useEffect } from 'react';
import { SB_URL, SB_KEY, short } from '../../config';

export function CashbackClaims() {
  const [claims, setClaims] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editReason, setEditReason] = useState('');

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const [pendingRes, rejectedRes] = await Promise.all([
        fetch(`${SB_URL}/rest/v1/cashback_claims?status=eq.pending&order=timestamp.desc&select=*`, { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }),
        fetch(`${SB_URL}/rest/v1/cashback_claims?status=eq.rejected&order=timestamp.desc&limit=10&select=*`, { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } })
      ]);
      setClaims((await pendingRes.json()) || []);
      setRejected((await rejectedRes.json()) || []);
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

  const reject = async () => {
    if (!rejectReason.trim()) { alert('Please provide a reason for rejection.'); return; }
    const claim = rejectModal;
    const token = sessionStorage.getItem('sp_admin_jwt');
    if (!token) { alert('Session expired.'); window.location.reload(); return; }
    setActionLoading('reject_' + claim.id);
    try {
      const r = await fetch('/api/reject-claim', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, reason: rejectReason.trim() })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setRejectModal(null);
      setRejectReason('');
      fetchClaims();
    } catch (e) { alert('Error: ' + e.message); }
    setActionLoading(null);
  };

  const saveEditedReason = async (claim) => {
    const token = sessionStorage.getItem('sp_admin_jwt');
    if (!token) { alert('Session expired.'); window.location.reload(); return; }
    setActionLoading('edit_' + claim.id);
    try {
      const r = await fetch('/api/edit-claim-decision', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, action: 'edit_reason', reason: editReason.trim() })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setEditingId(null);
      fetchClaims();
    } catch (e) { alert('Error: ' + e.message); }
    setActionLoading(null);
  };

  const revertToPending = async (claim) => {
    if (!window.confirm('Move this claim back to pending? This re-reserves ' + parseFloat(claim.amount).toFixed(3) + ' USDC from the wallet\'s balance.')) return;
    const token = sessionStorage.getItem('sp_admin_jwt');
    if (!token) { alert('Session expired.'); window.location.reload(); return; }
    setActionLoading('revert_' + claim.id);
    try {
      const r = await fetch('/api/edit-claim-decision', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_id: claim.id, action: 'revert_to_pending' })
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      fetchClaims();
    } catch (e) { alert('Error: ' + e.message); }
    setActionLoading(null);
  };

  if (loading) return <div style={{color:'var(--tx3)',fontSize:13,padding:'12px 0'}}>Loading claims...</div>;

  return (
    <div>
      {rejectModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:16,padding:24,width:'100%',maxWidth:360}}>
            <div style={{fontSize:16,fontWeight:700,color:'var(--tx1)',marginBottom:4}}>Reject Claim</div>
            <div style={{fontSize:12,color:'var(--tx3)',marginBottom:16}}>{parseFloat(rejectModal.amount).toFixed(3)} USDC from {short(rejectModal.wallet_address)}</div>
            <div style={{fontSize:12,fontWeight:600,color:'var(--tx2)',marginBottom:6}}>Reason for rejection <span style={{color:'var(--re)'}}>*</span></div>
            <textarea
              value={rejectReason}
              onChange={e=>setRejectReason(e.target.value)}
              placeholder="e.g. Suspicious activity, duplicate claim..."
              rows={3}
              style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',resize:'none',boxSizing:'border-box',marginBottom:16,fontFamily:'inherit'}}
            />
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{setRejectModal(null);setRejectReason('');}} style={{flex:1,background:'none',border:'1px solid var(--b1)',color:'var(--tx2)',borderRadius:10,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={reject} disabled={!!actionLoading} style={{flex:1,background:'rgba(255,79,97,.1)',border:'1px solid var(--re)',color:'var(--re)',borderRadius:10,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',opacity:actionLoading?0.6:1}}>
                {actionLoading?'Rejecting...':'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!claims.length && <div style={{color:'var(--tx3)',fontSize:13,padding:'12px 0'}}>No pending claims.</div>}
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
            <button onClick={()=>{setRejectModal(c);setRejectReason('');}} disabled={!!actionLoading} style={{flex:1,background:'none',border:'1px solid var(--re)',color:'var(--re)',borderRadius:10,padding:'10px',fontSize:13,fontWeight:700,cursor:'pointer',opacity:actionLoading?0.6:1}}>
              Reject
            </button>
          </div>
        </div>
      ))}

      {rejected.length>0 && (
        <div style={{marginTop:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--tx2)',marginBottom:10}}>Recently Rejected</div>
          {rejected.map(c => (
            <div key={c.id} style={{background:'var(--elev)',borderRadius:12,padding:'14px 16px',marginBottom:10,border:'1px solid var(--b1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--tx1)'}}>{parseFloat(c.amount).toFixed(3)} USDC</div>
                  <div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx2)'}}>{short(c.wallet_address)}</div>
                </div>
                <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:'rgba(255,79,97,.1)',color:'var(--re)'}}>rejected</span>
              </div>
              {editingId===c.id ? (
                <div>
                  <textarea value={editReason} onChange={e=>setEditReason(e.target.value)} rows={2} style={{width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--b1)',background:'var(--card)',color:'var(--tx1)',fontSize:12,outline:'none',resize:'none',boxSizing:'border-box',marginBottom:8,fontFamily:'inherit'}}/>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>saveEditedReason(c)} disabled={!!actionLoading} style={{flex:1,background:'var(--ac)',border:'none',color:'#fff',borderRadius:8,padding:'7px',fontSize:12,fontWeight:700,cursor:'pointer'}}>Save</button>
                    <button onClick={()=>setEditingId(null)} style={{flex:1,background:'none',border:'1px solid var(--b1)',color:'var(--tx2)',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:12,color:'var(--tx2)',fontStyle:'italic',marginBottom:8}}>"{c.rejection_reason||'-'}"</div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>{setEditingId(c.id);setEditReason(c.rejection_reason||'');}} style={{flex:1,background:'none',border:'1px solid var(--b1)',color:'var(--tx2)',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer'}}>Edit Reason</button>
                    <button onClick={()=>revertToPending(c)} disabled={!!actionLoading} style={{flex:1,background:'none',border:'1px solid var(--ac)',color:'var(--ac)',borderRadius:8,padding:'7px',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      {actionLoading==='revert_'+c.id?'Reverting...':'Revert to Pending'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={fetchClaims} style={{width:'100%',background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--tx2)',cursor:'pointer',marginTop:4}}>Refresh</button>
    </div>
  );
}
