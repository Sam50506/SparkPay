import React from 'react';

export function ScheduledRequests(){
  const SB_URL=process.env.REACT_APP_SUPABASE_URL;
  const SB_KEY=process.env.REACT_APP_SUPABASE_ANON_KEY;
  const[requests,setRequests]=React.useState([]);
  const[loading,setLoading]=React.useState(true);
  const[showAll,setShowAll]=React.useState(false);
  const[reqFilter,setReqFilter]=React.useState('all');
  const[manageReq,setManageReq]=React.useState(false);
  const[selectedReq,setSelectedReq]=React.useState([]);
  const[hiddenReq,setHiddenReq]=React.useState(()=>new Set(JSON.parse(localStorage.getItem('sp_hidden_admin_requests')||'[]')));

  const fetchRequests=async()=>{setLoading(true);try{const r=await fetch(SB_URL+'/rest/v1/scheduled_payment_requests?order=created_at.desc&limit=20',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}});const d=await r.json();setRequests(d||[]);}catch(e){console.error(e);}setLoading(false);};

  const updateStatus=async(id,status,request_type,payment_id)=>{
    try{
      const token=sessionStorage.getItem('sp_admin_jwt');
      if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}
      const r=await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:status==='approved'?'approve':'reject',request_id:id,payment_id,request_type})});
      const d=await r.json();
      if(d.error){alert('Failed: '+d.error);return;}
      fetchRequests();
      if(status==='approved'&&request_type==='edit'){
        const req=requests.find(r=>r.id===id);
        const changes=[];
        if(req?.new_recipient)changes.push('Recipient: '+req.new_recipient.slice(0,10)+'...'+req.new_recipient.slice(-6));
        if(req?.new_amount)changes.push('Amount: '+req.new_amount+' USDC');
        if(req?.new_date)changes.push('Date: '+req.new_date);
        if(req?.new_time)changes.push('Time: '+req.new_time);
        alert('Edit approved!\n\nChanges recorded:\n'+changes.join('\n'));
      } else {
        alert(status==='approved'?'Approved successfully!':'Rejected successfully.');
      }
    }catch(e){alert('Failed: '+e.message);}
  };

  React.useEffect(()=>{fetchRequests();},[]);

  if(loading)return <div style={{fontSize:13,color:'var(--tx3)',padding:'12px 0'}}>Loading...</div>;
  const visibleAll=requests.filter(r=>!hiddenReq.has(r.id)).filter(r=>reqFilter==='all'||r.status===reqFilter);
  if(visibleAll.length===0)return <div style={{fontSize:13,color:'var(--tx3)',padding:'12px 0'}}>No requests yet.</div>;
  const visible=showAll?visibleAll:visibleAll.slice(0,5);

  return(<div>
    {manageReq&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select resolved requests to hide from this view. This only removes them from this device.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setSelectedReq(visibleAll.filter(r=>r.status!=='pending').map(r=>r.id))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All Resolved</button><button onClick={()=>setSelectedReq([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>{selectedReq.length>0&&<button onClick={()=>{const next=new Set([...hiddenReq,...selectedReq]);setHiddenReq(next);localStorage.setItem('sp_hidden_admin_requests',JSON.stringify([...next]));setSelectedReq([]);setManageReq(false);}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Hide {selectedReq.length} Selected</button>}</div></div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
      <div style={{fontSize:12,color:'var(--tx3)',fontWeight:600}}>{visibleAll.filter(r=>r.status==='pending').length} pending of {visibleAll.length}</div>
      <div style={{display:'flex',gap:6}}>
        <select value={reqFilter} onChange={e=>setReqFilter(e.target.value)} style={{background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:8,padding:'0 8px',height:28,fontSize:11,fontWeight:600,color:'var(--tx2)',outline:'none'}}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button onClick={()=>{setManageReq(m=>!m);setSelectedReq([]);}} style={{background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:8,padding:'0 10px',height:28,fontSize:11,fontWeight:600,cursor:'pointer',color:manageReq?'var(--re)':'var(--tx2)'}}>{manageReq?'Done':'Manage'}</button>
        <button onClick={fetchRequests} style={{background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:8,width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx2)'}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>
    </div>
    {visible.map(r=>(<div key={r.id} style={{background:'var(--elev)',borderRadius:14,padding:'14px 16px',marginBottom:10}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
        {manageReq&&r.status!=='pending'&&<input type="checkbox" checked={selectedReq.includes(r.id)} onChange={e=>setSelectedReq(prev=>e.target.checked?[...prev,r.id]:prev.filter(x=>x!==r.id))} style={{width:18,height:18,marginRight:10,marginTop:2,flexShrink:0,cursor:'pointer'}}/>}
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6,flexWrap:'wrap'}}>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:7,background:r.request_type==='cancel'?'rgba(255,79,97,.1)':'rgba(59,130,196,.1)',color:r.request_type==='cancel'?'var(--re)':'var(--ac)'}}>{r.request_type==='cancel'?'Cancel':'Edit'}</span>
            <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:7,background:r.status==='pending'?'rgba(240,196,63,.1)':r.status==='approved'?'rgba(23,229,176,.1)':'rgba(255,79,97,.1)',color:r.status==='pending'?'#f59e0b':r.status==='approved'?'var(--cy)':'var(--re)'}}>{r.status}</span>
          </div>
          <div style={{fontSize:12,color:'var(--tx1)',fontFamily:'monospace',fontWeight:600,marginBottom:3}}>Payment #{r.payment_id}</div>
          <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginBottom:3}}>{r.wallet_address.slice(0,10)}...{r.wallet_address.slice(-6)}</div>
          <div style={{fontSize:11,color:'var(--tx3)'}}>{new Date(r.created_at).toLocaleString()}</div>
          {r.reason&&<div style={{fontSize:12,color:'var(--tx2)',background:'var(--card)',borderRadius:8,padding:'8px 10px',marginTop:8}}>{r.reason}</div>}
          {r.request_type==='edit'&&(r.new_recipient||r.new_amount||r.new_date||r.new_time)&&<div style={{marginTop:8,background:'var(--card)',borderRadius:10,padding:'10px 12px'}}>
            {r.new_recipient&&<div style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'var(--tx2)',marginBottom:5}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>New recipient: <span style={{fontFamily:'monospace',color:'var(--tx1)'}}>{r.new_recipient.slice(0,8)}...{r.new_recipient.slice(-6)}</span></div>}
            {r.new_amount&&<div style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'var(--tx2)',marginBottom:5}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/></svg>New amount: <span style={{color:'var(--tx1)',fontWeight:600}}>{r.new_amount} USDC</span></div>}
            {r.new_date&&<div style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'var(--tx2)',marginBottom:5}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>New date: <span style={{color:'var(--tx1)'}}>{r.new_date}</span></div>}
            {r.new_time&&<div style={{display:'flex',alignItems:'center',gap:7,fontSize:11,color:'var(--tx2)'}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>New time: <span style={{color:'var(--tx1)'}}>{r.new_time}</span></div>}
          </div>}
        </div>
      </div>
      {r.status==='pending'&&<div style={{display:'flex',gap:8}}>
        <button className="ap-btn ap-btn-primary" style={{fontSize:11,padding:'6px 12px',marginTop:0}} onClick={()=>updateStatus(r.id,'approved',r.request_type,r.payment_id)}>Approve</button>
        <button className="ap-btn ap-btn-danger" style={{fontSize:11,padding:'6px 12px'}} onClick={()=>updateStatus(r.id,'rejected',r.request_type,r.payment_id)}>Reject</button>
      </div>}
    </div>))}
    {requests.length>5&&<button onClick={()=>setShowAll(s=>!s)} style={{width:'100%',marginTop:8,padding:'10px',background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:10,color:'var(--ac)',fontSize:13,fontWeight:600,cursor:'pointer'}}>{showAll?'Show less':'Show all ('+requests.length+')'}</button>}
  </div>);
}
