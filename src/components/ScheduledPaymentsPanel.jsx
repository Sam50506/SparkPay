import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { SB_URL, SB_KEY, SCHED_ADDR, ls, lsSave } from '../config';
import { IC } from '../icons';

export function NeedHelpMenu({paymentId,address,contractAddress,signer,schedAbi,payment,onRefresh}){
  const[open,setOpen]=React.useState(false);
  const[step,setStep]=React.useState(null);
  const[reason,setReason]=React.useState('');
  const[newRecipient,setNewRecipient]=React.useState('');
  const[newAmount,setNewAmount]=React.useState('');
  const[newDate,setNewDate]=React.useState('');
  const[newTime,setNewTime]=React.useState('');
  const[loading,setLoading]=React.useState(false);
  const[done,setDone]=React.useState(false);

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

export function OnChainSchedules({address,provider,signer,schedAddr,schedAbi,onExecute,onCancel,loading}){
  const[payments,setPayments]=React.useState([]);
  const[fetching,setFetching]=React.useState(false);
  const[blockTime,setBlockTime]=React.useState(Math.floor(Date.now()/1000));
  const[manageSched,setManageSched]=React.useState(false);
  const[selectedSched,setSelectedSched]=React.useState([]);
  const[hiddenSched,setHiddenSched]=React.useState(()=>new Set(ls('arc_hidden_sched_'+address,[])));
  const[requests,setRequests]=React.useState({});
  const[changesModal,setChangesModal]=React.useState(null);const fetchRequests=React.useCallback(()=>{if(!address)return;fetch(SB_URL+'/rest/v1/scheduled_payment_requests?wallet_address=eq.'+address+'&contract_address=eq.'+SCHED_ADDR+'&order=created_at.desc',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}}).then(r=>r.json()).then(d=>{const map={};(d||[]).forEach(r=>{if(!map[r.payment_id])map[r.payment_id]=[];map[r.payment_id].push(r);});setRequests(map);}).catch(()=>{});},[address]);React.useEffect(()=>{fetchRequests();const t=setInterval(fetchRequests,15000);return()=>clearInterval(t);},[fetchRequests]);
  const fetchPayments=React.useCallback(async()=>{
    if(!address||!provider)return;
    setFetching(true);
    try{
      const sched=new ethers.Contract(schedAddr,schedAbi,provider);
      const count=Number(await sched.paymentCount());
      const results=[];
      for(let i=count-1;i>=0&&results.length<20;i--){
        const p=await sched.getPayment(i);
        if(p.sender.toLowerCase()===address.toLowerCase()){
          results.push({id:i,recipient:p.recipient,amount:ethers.formatUnits(p.amount,18),releaseTime:Number(p.releaseTime),executed:p.executed,cancelled:p.cancelled,country:p.country});
        }
      }
      setPayments(results);
      const block=await provider.getBlock('latest');
      if(block)setBlockTime(block.timestamp);
    }catch(e){console.error(e);}
    setFetching(false);
  },[address,provider,schedAddr,schedAbi]);
  React.useEffect(()=>{fetchPayments();},[fetchPayments]);
  React.useEffect(()=>{const t=setInterval(()=>fetchPayments(),10000);return()=>clearInterval(t);},[fetchPayments]);
  if(payments.length===0&&!fetching)return null;
  const ChangesModal=()=>!changesModal?null:(<div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setChangesModal(null)}><div style={{background:'var(--card)',borderRadius:16,padding:20,width:'100%',maxWidth:380,boxShadow:'var(--shl)'}} onClick={e=>e.stopPropagation()}><div style={{fontSize:15,fontWeight:800,color:'var(--tx1)',marginBottom:4}}>Edit Request Details</div><div style={{fontSize:12,color:changesModal.status==='approved'?'var(--cy)':changesModal.status==='rejected'?'var(--re)':'#f59e0b',fontWeight:600,marginBottom:16}}>{changesModal.status==='approved'?'Approved by admin':changesModal.status==='rejected'?'Rejected by admin':'Waiting for admin review'}</div>{[changesModal.new_recipient&&{field:'Recipient',before:changesModal.original_recipient||'Original',after:changesModal.new_recipient,mono:true},changesModal.new_amount&&{field:'Amount',before:changesModal.original_amount?changesModal.original_amount+' USDC':'Original',after:changesModal.new_amount+' USDC'},changesModal.new_date&&{field:'Date',before:'Original',after:changesModal.new_date},changesModal.new_time&&{field:'Time',before:'Original',after:changesModal.new_time}].filter(Boolean).map((row,i)=>(<div key={i} style={{marginBottom:12,padding:'10px 12px',background:'var(--elev)',borderRadius:10}}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>{row.field}</div><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{flex:1,padding:'6px 10px',borderRadius:8,background:'rgba(255,79,97,.08)',border:'1px solid rgba(255,79,97,.2)'}}><div style={{fontSize:10,color:'var(--re)',fontWeight:700,marginBottom:2}}>Before</div><div style={{fontSize:12,color:'var(--tx1)',fontFamily:row.mono?'monospace':undefined,wordBreak:'break-all'}}>{row.mono&&row.before!=='Original'?row.before.slice(0,10)+'...'+row.before.slice(-6):row.before}</div></div><div style={{fontSize:16,color:'var(--tx3)'}}>→</div><div style={{flex:1,padding:'6px 10px',borderRadius:8,background:'rgba(23,229,176,.08)',border:'1px solid rgba(23,229,176,.2)'}}><div style={{fontSize:10,color:'var(--cy)',fontWeight:700,marginBottom:2}}>After</div><div style={{fontSize:12,color:'var(--tx1)',fontFamily:row.mono?'monospace':undefined,wordBreak:'break-all'}}>{row.mono?row.after.slice(0,10)+'...'+row.after.slice(-6):row.after}</div></div></div></div>))}<button className="ap-btn ap-btn-sec" style={{width:'100%',marginTop:4}} onClick={()=>setChangesModal(null)}>Close</button></div></div>);
  const now=blockTime;
  const hasCancelApproved=p=>!!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'&&r.status==='approved'));
  const sc=p=>p.executed?{bg:'rgba(23,229,176,.1)',cl:'var(--cy)'}:(p.cancelled||hasCancelApproved(p))?{bg:'rgba(255,79,97,.1)',cl:'var(--re)'}:now>=p.releaseTime?{bg:'rgba(59,130,196,.15)',cl:'var(--ac)'}:{bg:'rgba(100,100,100,.08)',cl:'var(--tx3)'};
  const sl=p=>p.executed?'Released':p.cancelled?'Cancelled':hasCancelApproved(p)?'Cancellation Approved — Refund Pending':now>=p.releaseTime?'Processing Payment':'Scheduled';
  const visiblePayments=payments.filter(p=>!hiddenSched.has(p.id));
  return(<div className="ap-card"><ChangesModal/><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div><div className="ap-card-title" style={{marginBottom:2}}>Scheduled Payments</div><div style={{fontSize:12,color:'var(--tx3)'}}>{visiblePayments.filter(p=>!p.executed&&!p.cancelled&&!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'&&r.status==='approved'))).length} active</div></div><div style={{display:'flex',gap:8}}><button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0,color:manageSched?'var(--re)':undefined}} onClick={()=>{setManageSched(m=>!m);setSelectedSched([]);}}>{manageSched?'Done':'Manage'}</button><button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0}} onClick={fetchPayments}>{fetching?'Loading...':'Refresh'}</button></div></div>{manageSched&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:'var(--tx2)',background:'var(--card)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select payments to hide from this view. This only removes them from this device — completed or cancelled records stay on-chain.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setSelectedSched(visiblePayments.map(p=>p.id))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button><button onClick={()=>setSelectedSched([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>{selectedSched.length>0&&<button onClick={()=>{if(window.confirm('Hide '+selectedSched.length+' payment(s) from this view?')){const next=new Set([...hiddenSched,...selectedSched]);setHiddenSched(next);lsSave('arc_hidden_sched_'+address,[...next]);setSelectedSched([]);setManageSched(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Hide {selectedSched.length} Selected</button>}</div></div>}{fetching&&visiblePayments.length===0&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'20px 0',fontSize:13}}>Loading...</div>}{visiblePayments.length===0&&!fetching&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'20px 0',fontSize:13}}>No scheduled payments to show.</div>}{visiblePayments.map(p=>{const s=sc(p);return(<div key={p.id} style={{background:'var(--elev)',borderRadius:14,padding:'14px 16px',marginBottom:10,border:'1px solid var(--b0)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>{manageSched&&<input type="checkbox" checked={selectedSched.includes(p.id)} onChange={e=>setSelectedSched(prev=>e.target.checked?[...prev,p.id]:prev.filter(x=>x!==p.id))} style={{width:18,height:18,marginRight:10,marginTop:2,flexShrink:0,cursor:'pointer'}}/>}<div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:16,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{parseFloat(p.amount).toFixed(2)}</span><span style={{fontSize:12,fontWeight:600,color:'var(--tx3)'}}>USDC</span>{p.country&&<span className="ap-cc">{p.country}</span>}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginBottom:4}}>{p.recipient.slice(0,10)}...{p.recipient.slice(-6)}</div><div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,marginBottom:6}}>Payment ID: #{p.id}</div><div style={{marginTop:6}}><span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:999,background:s.bg,color:s.cl}}>{sl(p)}</span>{!p.executed&&!p.cancelled&&!hasCancelApproved(p)&&now>=p.releaseTime&&<div style={{fontSize:12,color:'var(--tx2)',marginTop:8,lineHeight:1.6}}>Your payment is being processed and will be delivered to the recipient within 60 minutes.</div>}{requests[p.id]&&requests[p.id].length>0&&<div style={{marginTop:8}}>{requests[p.id].slice(0,1).map((r,i)=>r.status==='approved'&&r.request_type==='cancel'?(<div key={i} style={{padding:'8px 12px',borderRadius:8,background:'rgba(23,229,176,.1)',marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:'var(--cy)'}}>Admin approved your cancellation — USDC refunded to your wallet.</span></div>):(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'6px 10px',borderRadius:8,background:r.status==='approved'?'rgba(23,229,176,.1)':r.status==='rejected'?'rgba(255,79,97,.1)':'rgba(240,196,63,.1)'}}><span style={{fontSize:11,fontWeight:700,color:r.status==='approved'?'var(--cy)':r.status==='rejected'?'var(--re)':'#f59e0b'}}>{r.request_type==='cancel'?'Cancel':'Edit'} Request: {r.status==='pending'?'Waiting for admin':r.status==='approved'?'Approved by admin':'Rejected by admin'}</span>{r.request_type==='edit'&&(r.new_recipient||r.new_amount||r.new_date||r.new_time)&&<button onClick={()=>setChangesModal(r)} style={{background:'none',border:'1px solid currentColor',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:700,cursor:'pointer',color:r.status==='approved'?'var(--cy)':r.status==='rejected'?'var(--re)':'#f59e0b',whiteSpace:'nowrap',flexShrink:0}}>Check here</button>}</div>))}</div>}</div></div></div><div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 10px',background:'var(--card)',borderRadius:10,marginBottom:10}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span style={{fontSize:11,color:'var(--tx2)',fontWeight:500}}>{new Date(p.releaseTime*1000).toLocaleString('en',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})}</span></div>{!p.executed&&!p.cancelled&&now<p.releaseTime&&<div style={{display:'flex',gap:8}}><button className="ap-btn ap-btn-danger" style={{flex:1,fontSize:12,padding:'10px 16px'}} onClick={()=>onCancel(p.id)} disabled={loading}>Cancel Payment</button></div>}{!p.executed&&!p.cancelled&&hasCancelApproved(p)&&<div style={{marginTop:8,fontSize:12,color:'var(--cy)',fontWeight:600,padding:'8px 12px',background:'rgba(23,229,176,.08)',borderRadius:10}}>Cancellation approved! Your USDC has been refunded to your wallet. Please refresh your balance.</div>}{!p.executed&&!p.cancelled&&!hasCancelApproved(p)&&now>=p.releaseTime&&<NeedHelpMenu paymentId={p.id} address={address} contractAddress={schedAddr} signer={signer} schedAbi={schedAbi} payment={p} onRefresh={fetchPayments}/>}</div>);})}
  </div>);
}
