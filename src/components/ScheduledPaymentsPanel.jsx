import React, { useState, useEffect, useCallback } from 'react';
import { KeeperCountdown } from './KeeperCountdown';
import { ethers } from 'ethers';
import { SB_URL, SB_KEY, SCHED_ADDR, ls, lsSave, ALL_CURRENCY } from '../config';

export function NeedHelpMenu({paymentId,address,contractAddress,signer,schedAbi,payment,onRefresh}){
  const[open,setOpen]=useState(false);
  const[step,setStep]=useState(null);
  const[reason,setReason]=useState('');
  const[newRecipient,setNewRecipient]=useState('');
  const[newAmount,setNewAmount]=useState('');
  const[newDate,setNewDate]=useState('');
  const[newTime,setNewTime]=useState('');
  const[loading,setLoading]=useState(false);
  const[done,setDone]=useState(false);

  const submit=async(type)=>{
    setLoading(true);
    try{
      if(type==='edit'){
        const contract=new ethers.Contract(contractAddress,schedAbi,signer);
        const cancelTx=await contract.cancel(paymentId,{gasPrice:ethers.parseUnits('100','gwei'),gasLimit:100000});
        await cancelTx.wait();
        const recipient=newRecipient||payment.recipient;
        const amount=newAmount?ethers.parseUnits(newAmount,18):ethers.parseUnits(payment.amount.toString(),18);
        const dateStr=newDate?(newTime?`${newDate}T${newTime}:00`:`${newDate}T00:00:00`):null;
        const releaseTime=dateStr?Math.floor(new Date(dateStr).getTime()/1000):payment.releaseTime;
        if(releaseTime<=Math.floor(Date.now()/1000))throw new Error('Release time must be in the future');
        const scheduleTx=await contract.schedule(recipient,releaseTime,payment.country||'',{value:amount,gasPrice:ethers.parseUnits('100','gwei'),gasLimit:200000});
        await scheduleTx.wait();
        await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:paymentId,wallet_address:address,request_type:'edit',reason:'On-chain edit completed',new_recipient:recipient,new_amount:newAmount||null,new_date:newDate||null,new_time:newTime||null,contract_address:contractAddress,original_recipient:null,original_amount:null})});
        setDone(true);setOpen(false);setStep(null);
        if(onRefresh)onRefresh();
      } else {
        const r=await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:paymentId,wallet_address:address,request_type:type,reason:reason||null,new_recipient:newRecipient||null,new_amount:newAmount||null,new_date:newDate||null,new_time:newTime||null,contract_address:contractAddress,original_recipient:null,original_amount:null})});
        if(!r.ok)throw new Error('Failed');
        setDone(true);setOpen(false);setStep(null);
      }
    }catch(e){alert(e.message||'Failed to submit request. Please try again.');}
    setLoading(false);
  };

  if(done)return(<div style={{marginTop:8,fontSize:12,color:'var(--cy)',fontWeight:600,padding:'8px 12px',background:'rgba(23,229,176,.08)',borderRadius:10,textAlign:'center'}}>Request submitted. We will review and get back to you shortly.</div>);
  return(<div style={{marginTop:8}}>
    {!open&&<button onClick={()=>setOpen(true)} style={{width:'100%',background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--tx2)',fontWeight:600,cursor:'pointer'}}>Need Help?</button>}
    {open&&!step&&<div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px',marginTop:4}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:12}}>How can we help?</div>
      <div onClick={()=>setStep('cancel')} style={{padding:'12px 14px',borderRadius:10,border:'1px solid var(--b0)',marginBottom:8,cursor:'pointer',background:'var(--elev)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)'}}>Request Cancellation</div>
        <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>Ask admin to cancel and refund this payment</div>
      </div>
      <div onClick={()=>setStep('edit')} style={{padding:'12px 14px',borderRadius:10,border:'1px solid var(--b0)',cursor:'pointer',background:'var(--elev)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)'}}>Edit Payment Details</div>
        <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>Request to update recipient, amount or date</div>
      </div>
      <button onClick={()=>setOpen(false)} style={{marginTop:10,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Cancel</button>
    </div>}
    {open&&step==='cancel'&&<div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px',marginTop:4}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:10}}>Reason for cancellation</div>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Please explain why you want to cancel..." style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',minHeight:80,resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}}/>
      <button className="ap-btn ap-btn-primary" style={{width:'100%',marginTop:10}} onClick={()=>submit('cancel')} disabled={loading||!reason.trim()}>{loading?'Submitting...':'Submit Request'}</button>
      <button onClick={()=>setStep(null)} style={{marginTop:8,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Back</button>
    </div>}
    {open&&step==='edit'&&<div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px',marginTop:4}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:10}}>Edit Payment Details</div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10}}>Fill in only the fields you want to change.</div>
      <div className="ap-label">New Recipient Address</div>
      <input className="ap-input" style={{marginBottom:10}} placeholder="0x..." value={newRecipient} onChange={e=>setNewRecipient(e.target.value)}/>
      <div className="ap-label">New Amount (USDC)</div>
      <input className="ap-input" type="number" style={{marginBottom:10}} placeholder="0.00" value={newAmount} onChange={e=>setNewAmount(e.target.value)}/>
      <div className="ap-label">New Release Date</div>
      <input className="ap-input" type="date" style={{marginBottom:10}} value={newDate} onChange={e=>setNewDate(e.target.value)}/>
      <div className="ap-label">New Release Time</div>
      <input className="ap-input" type="time" style={{marginBottom:10}} value={newTime} onChange={e=>setNewTime(e.target.value)}/>
      <button className="ap-btn ap-btn-primary" style={{width:'100%',marginTop:4}} onClick={()=>submit('edit')} disabled={loading||(!newRecipient&&!newAmount&&!newDate&&!newTime)}>{loading?'Submitting...':'Submit Request'}</button>
      <button onClick={()=>setStep(null)} style={{marginTop:8,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Back</button>
    </div>}
  </div>);
}

function Countdown({releaseTime}){
  const[now,setNow]=useState(Math.floor(Date.now()/1000));
  useEffect(()=>{const t=setInterval(()=>setNow(Math.floor(Date.now()/1000)),1000);return()=>clearInterval(t);},[]);
  const diff=releaseTime-now;
  if(diff<=0)return null;
  const h=Math.floor(diff/3600);
  const m=Math.floor((diff%3600)/60);
  const s=diff%60;
  return(<span style={{fontFamily:'monospace',fontWeight:700,color:'var(--ac)',fontSize:13}}>{String(h).padStart(2,'0')}H : {String(m).padStart(2,'0')}M : {String(s).padStart(2,'0')}S</span>);
}

function PaymentCard({p,st,manageSched,selectedSched,setSelectedSched,expandedId,setExpandedId,requests,changesModal,setChangesModal,address,signer,schedAddr,schedAbi,fetchPayments,onCancel,loading,rates}){
  const isExpanded=expandedId===p.id;
  const isPending=st==='scheduled';
  const isProcessing=st==='processing';
  const isCancelApproved=st==='cancel_approved';
  const releaseDate=new Date(p.releaseTime*1000).toLocaleString('en',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});
  const statusCfg={
    executed:{bg:'rgba(23,229,176,.1)',cl:'var(--cy)',label:'Released'},
    cancel_approved:{bg:'rgba(23,229,176,.1)',cl:'var(--cy)',label:'Refund Pending'},
    cancelled_admin:{bg:'rgba(255,79,97,.1)',cl:'var(--re)',label:'Cancelled by Admin'},
    cancelled_user:{bg:'rgba(255,79,97,.1)',cl:'var(--re)',label:'Cancelled by User'},
    processing:{bg:'rgba(59,130,196,.15)',cl:'var(--ac)',label:'Payment in Progress',pulse:true},
    scheduled:{bg:'rgba(100,100,100,.08)',cl:'var(--tx3)',label:'Scheduled'},
  }[st];

  const editRequests=(requests[p.id]||[]).filter(r=>r.request_type==='edit');

  return(<div style={{background:'var(--elev)',borderRadius:14,padding:'14px 16px',marginBottom:10,border:'1px solid var(--b0)',position:'relative'}}>
    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:10}}>
      {manageSched&&<input type="checkbox" checked={selectedSched.includes(p.id)} onChange={e=>setSelectedSched(prev=>e.target.checked?[...prev,p.id]:prev.filter(x=>x!==p.id))} style={{width:18,height:18,marginTop:2,flexShrink:0,cursor:'pointer'}}/>}
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <span style={{fontSize:16,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{parseFloat(p.amount).toFixed(2)}</span>
          <span style={{fontSize:12,fontWeight:600,color:'var(--tx3)'}}>USDC</span>
          {p.country&&<span className="ap-cc">{p.country}</span>}
        </div>
        {p.country&&rates&&rates[ALL_CURRENCY[p.country]]&&<div style={{fontSize:11,color:'var(--tx3)',marginBottom:4}}>≈ {(parseFloat(p.amount)*rates[ALL_CURRENCY[p.country]]).toLocaleString('en',{maximumFractionDigits:0})} {ALL_CURRENCY[p.country]}</div>}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
        </div>
        <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginBottom:8}}>To: {p.recipient.slice(0,10)}...{p.recipient.slice(-6)}</div>
        <span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:999,background:statusCfg.bg,color:statusCfg.cl,display:'inline-flex',alignItems:'center',gap:6,marginBottom:8}}>{statusCfg.pulse&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--ac)',display:'inline-block',animation:'pulse 1.2s ease-in-out infinite'}}/>}{statusCfg.label}</span>
        {isPending&&<div style={{marginTop:8,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <span style={{fontSize:11,color:'var(--tx3)'}}>Releases in</span>
          <Countdown releaseTime={p.releaseTime}/>
        </div>}
        {isProcessing&&<div style={{marginTop:8,background:'var(--card)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'var(--tx2)',lineHeight:1.7}}>Your payment will be processed within 60 minutes. <KeeperCountdown suffix=' remaining to request cancellation or edits. Use the Need Help option below if needed.'/></div>}
        {(st==='cancelled_admin'||st==='cancelled_user')&&<div style={{marginTop:8,background:'var(--card)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'var(--tx2)',lineHeight:1.7}}>
          {st==='cancelled_admin'?'Cancelled by admin request. USDC has been refunded to your wallet.':'You cancelled this payment. USDC has been refunded to your wallet.'}
        </div>}
        {isCancelApproved&&<div style={{marginTop:8,background:'rgba(23,229,176,.08)',borderRadius:10,padding:'10px 12px',fontSize:12,color:'var(--cy)',fontWeight:600}}>Refund is being processed to your wallet.</div>}
        {editRequests.length>0&&<div style={{marginTop:8}}>
          {editRequests.map((req,i)=>(
            <div key={i} onClick={()=>setChangesModal(req)} style={{display:'inline-flex',alignItems:'center',gap:5,marginTop:4,cursor:'pointer',padding:'4px 10px',borderRadius:8,background:req.status==='approved'?'rgba(23,229,176,.08)':req.status==='rejected'?'rgba(255,79,97,.08)':'rgba(240,196,63,.08)',border:'1px solid '+(req.status==='approved'?'rgba(23,229,176,.2)':req.status==='rejected'?'rgba(255,79,97,.2)':'rgba(240,196,63,.2)')}}>
              <span style={{fontSize:11,fontWeight:600,color:req.status==='approved'?'var(--cy)':req.status==='rejected'?'var(--re)':'#f59e0b'}}>{req.status==='approved'?'Edit Approved':req.status==='rejected'?'Edit Rejected':'Edit Pending'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>}
      </div>
    </div>
    <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 10px',background:'var(--card)',borderRadius:10,marginBottom:isPending||isProcessing?10:0}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      <span style={{fontSize:12,color:'var(--tx3)'}}>{releaseDate}</span>
    </div>
    {isPending&&<button onClick={()=>onCancel(p.id)} style={{width:"100%",background:"none",border:"1px solid var(--re)",borderRadius:10,padding:"10px",fontSize:12,color:"var(--re)",fontWeight:600,cursor:"pointer"}}>Cancel Payment</button>}{isProcessing&&<NeedHelpMenu paymentId={p.id} address={address} contractAddress={schedAddr} signer={signer} schedAbi={schedAbi} payment={p} onRefresh={fetchPayments}/>}
  </div>);
}

export function OnChainSchedules({address,provider,signer,schedAddr,schedAbi,onExecute,onCancel,loading,rates}){
  const[payments,setPayments]=useState([]);
  const[fetching,setFetching]=useState(false);
  const[now,setNow]=useState(Math.floor(Date.now()/1000));
  const[manageSched,setManageSched]=useState(false);
  const[selectedSched,setSelectedSched]=useState([]);
  const[hiddenSched,setHiddenSched]=useState(()=>new Set(ls('arc_hidden_sched_'+address,[])));
  const[requests,setRequests]=useState({});
  const[expandedId,setExpandedId]=useState(null);
  const[changesModal,setChangesModal]=useState(null);
  const[activeTab,setActiveTab]=useState('active');
  const[showAllActive,setShowAllActive]=useState(false);
  const[showAllHistory,setShowAllHistory]=useState(false);

  useEffect(()=>{const t=setInterval(()=>setNow(Math.floor(Date.now()/1000)),1000);return()=>clearInterval(t);},[]);

  const fetchRequests=useCallback(()=>{
    if(!address)return;
    fetch(SB_URL+'/rest/v1/scheduled_payment_requests?wallet_address=eq.'+address+'&contract_address=eq.'+SCHED_ADDR+'&order=created_at.desc',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}})
      .then(r=>r.json()).then(d=>{const map={};(d||[]).forEach(r=>{if(!map[r.payment_id])map[r.payment_id]=[];map[r.payment_id].push(r);});setRequests(map);}).catch(()=>{});
  },[address]);

  useEffect(()=>{fetchRequests();const t=setInterval(fetchRequests,15000);return()=>clearInterval(t);},[fetchRequests]);

  const fetchPayments=useCallback(async()=>{
    if(!address||!provider)return;
    setFetching(true);
    try{
      const sched=new ethers.Contract(schedAddr,schedAbi,provider);
      const count=Number(await sched.paymentCount());
      const results=[];
      for(let i=count-1;i>=0&&results.length<50;i--){
        const p=await sched.getPayment(i);
        if(p.sender.toLowerCase()===address.toLowerCase()){
          results.push({id:i,recipient:p.recipient,amount:ethers.formatUnits(p.amount,18),releaseTime:Number(p.releaseTime),executed:p.executed,cancelled:p.cancelled,country:p.country});
        }
      }
      setPayments(results);
    }catch(e){console.error(e);}
    setFetching(false);
  },[address,provider,schedAddr,schedAbi]);

  useEffect(()=>{fetchPayments();},[fetchPayments]);
  useEffect(()=>{const t=setInterval(fetchPayments,30000);return()=>clearInterval(t);},[fetchPayments]);

  const hasCancelApproved=p=>!!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'&&r.status==='approved'));
  const hasCancelRequest=p=>!!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'));
  const getStatus=p=>{
    if(p.executed)return'executed';
    if(hasCancelApproved(p))return'cancel_approved';
    if(p.cancelled)return hasCancelApproved(p)?'cancelled_admin':'cancelled_user';
    if(now>=p.releaseTime)return'processing';
    return'scheduled';
  };

  const visiblePayments=payments.filter(p=>!hiddenSched.has(p.id));

  // Split into active (scheduled/processing) and history (executed/cancelled)
  const activePayments=visiblePayments.filter(p=>{const st=getStatus(p);return st==='scheduled'||st==='processing';});
  const historyPayments=visiblePayments.filter(p=>{const st=getStatus(p);return st==='executed'||st==='cancelled_admin'||st==='cancelled_user'||st==='cancel_approved';});

  const LIMIT=5;
  const shownActive=showAllActive?activePayments:activePayments.slice(0,LIMIT);
  const shownHistory=showAllHistory?historyPayments:historyPayments.slice(0,LIMIT);

  if(visiblePayments.length===0&&!fetching)return null;

  const ChangesModal=()=>!changesModal?null:(
    <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setChangesModal(null)}>
      <div style={{background:'var(--card)',borderRadius:16,padding:20,width:'100%',maxWidth:380,boxShadow:'var(--shl)'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:800,color:'var(--tx1)',marginBottom:4}}>Edit Request Details</div>
        <div style={{fontSize:12,color:changesModal.status==='approved'?'var(--cy)':changesModal.status==='rejected'?'var(--re)':'#f59e0b',fontWeight:600,marginBottom:16}}>{changesModal.status==='approved'?'Approved by admin':changesModal.status==='rejected'?'Rejected by admin':'Waiting for admin review'}</div>
        {[changesModal.new_recipient&&{field:'Recipient',before:changesModal.original_recipient||'Original',after:changesModal.new_recipient,mono:true},changesModal.new_amount&&{field:'Amount',before:changesModal.original_amount?changesModal.original_amount+' USDC':'Original',after:changesModal.new_amount+' USDC'},changesModal.new_date&&{field:'Date',before:'Original',after:changesModal.new_date},changesModal.new_time&&{field:'Time',before:'Original',after:changesModal.new_time}].filter(Boolean).map((row,i)=>(
          <div key={i} style={{marginBottom:12,padding:'10px 12px',background:'var(--elev)',borderRadius:10}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>{row.field}</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <div style={{flex:1,padding:'6px 10px',borderRadius:8,background:'rgba(255,79,97,.08)',border:'1px solid rgba(255,79,97,.2)'}}>
                <div style={{fontSize:10,color:'var(--re)',fontWeight:700,marginBottom:2}}>Before</div>
                <div style={{fontSize:12,color:'var(--tx1)',fontFamily:row.mono?'monospace':undefined,wordBreak:'break-all'}}>{row.mono&&row.before!=='Original'?row.before.slice(0,10)+'...'+row.before.slice(-6):row.before}</div>
              </div>
              <div style={{fontSize:16,color:'var(--tx3)'}}>→</div>
              <div style={{flex:1,padding:'6px 10px',borderRadius:8,background:'rgba(23,229,176,.08)',border:'1px solid rgba(23,229,176,.2)'}}>
                <div style={{fontSize:10,color:'var(--cy)',fontWeight:700,marginBottom:2}}>After</div>
                <div style={{fontSize:12,color:'var(--tx1)',fontFamily:row.mono?'monospace':undefined,wordBreak:'break-all'}}>{row.mono?row.after.slice(0,10)+'...'+row.after.slice(-6):row.after}</div>
              </div>
            </div>
          </div>
        ))}
        <button className="ap-btn ap-btn-sec" style={{width:'100%',marginTop:4}} onClick={()=>setChangesModal(null)}>Close</button>
      </div>
    </div>
  );

  const tabStyle=(active)=>({
    flex:1,padding:'9px 0',fontSize:13,fontWeight:700,cursor:'pointer',border:'none',borderRadius:10,
    background:active?'var(--ac)':'transparent',
    color:active?'#fff':'var(--tx3)',
    transition:'all .15s',
  });

  return(<div className="ap-card">
    <ChangesModal/>

    {/* Header */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
      <div>
        <div className="ap-card-title" style={{marginBottom:2}}>Scheduled Payments</div>
        <div style={{fontSize:12,color:'var(--tx3)'}}>{activePayments.length} active</div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0,color:manageSched?'var(--re)':undefined}} onClick={()=>{setManageSched(m=>!m);setSelectedSched([]);}}>{manageSched?'Done':'Manage'}</button>
        <button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0}} onClick={fetchPayments}>{fetching?'Loading...':'Refresh'}</button>
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:'flex',gap:4,background:'var(--elev)',borderRadius:12,padding:4,marginBottom:16}}>
      <button style={tabStyle(activeTab==='active')} onClick={()=>setActiveTab('active')}>
        Currently Scheduled {activePayments.length>0&&<span style={{fontSize:11,opacity:.8}}>({activePayments.length})</span>}
      </button>
      <button style={tabStyle(activeTab==='history')} onClick={()=>setActiveTab('history')}>
        History {historyPayments.length>0&&<span style={{fontSize:11,opacity:.8}}>({historyPayments.length})</span>}
      </button>
    </div>

    {/* Manage mode */}
    {manageSched&&<div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:'var(--tx2)',background:'var(--card)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select payments to hide from this view.</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button onClick={()=>setSelectedSched(visiblePayments.map(p=>p.id))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button>
        <button onClick={()=>setSelectedSched([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>
        {selectedSched.length>0&&<button onClick={()=>{if(window.confirm('Hide '+selectedSched.length+' payment(s)?')){const next=new Set([...hiddenSched,...selectedSched]);setHiddenSched(next);lsSave('arc_hidden_sched_'+address,[...next]);setSelectedSched([]);setManageSched(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Hide {selectedSched.length} Selected</button>}
      </div>
    </div>}

    {fetching&&visiblePayments.length===0&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'20px 0',fontSize:13}}>Loading...</div>}

    {/* Active Tab */}
    {activeTab==='active'&&<>
      {activePayments.length===0&&!fetching&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'24px 0',fontSize:13}}>No active scheduled payments.</div>}
      {shownActive.map(p=><PaymentCard key={p.id} p={p} st={getStatus(p)} manageSched={manageSched} selectedSched={selectedSched} setSelectedSched={setSelectedSched} expandedId={expandedId} setExpandedId={setExpandedId} requests={requests} changesModal={changesModal} setChangesModal={setChangesModal} address={address} signer={signer} schedAddr={schedAddr} schedAbi={schedAbi} fetchPayments={fetchPayments} onCancel={onCancel} loading={loading} rates={rates}/>)}
      {activePayments.length>LIMIT&&<button onClick={()=>setShowAllActive(s=>!s)} style={{width:'100%',background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--tx2)',fontWeight:600,cursor:'pointer',marginTop:4}}>
        {showAllActive?'Show Less ↑':'Show All '+activePayments.length+' Payments ↓'}
      </button>}
    </>}

    {/* History Tab */}
    {activeTab==='history'&&<>
      {historyPayments.length===0&&!fetching&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'24px 0',fontSize:13}}>No payment history yet.</div>}
      {shownHistory.map(p=><PaymentCard key={p.id} p={p} st={getStatus(p)} manageSched={manageSched} selectedSched={selectedSched} setSelectedSched={setSelectedSched} expandedId={expandedId} setExpandedId={setExpandedId} requests={requests} changesModal={changesModal} setChangesModal={setChangesModal} address={address} signer={signer} schedAddr={schedAddr} schedAbi={schedAbi} fetchPayments={fetchPayments} onCancel={onCancel} loading={loading} rates={rates}/>)}
      {historyPayments.length>LIMIT&&<button onClick={()=>setShowAllHistory(s=>!s)} style={{width:'100%',background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--tx2)',fontWeight:600,cursor:'pointer',marginTop:4}}>
        {showAllHistory?'Show Less ↑':'Show All '+historyPayments.length+' Payments ↓'}
      </button>}
    </>}
  </div>);
}
