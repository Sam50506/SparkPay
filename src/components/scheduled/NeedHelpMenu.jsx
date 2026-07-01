import React, { useState } from 'react';
import { ethers } from 'ethers';

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
      let amountForRequest=newAmount||null;
      if(type==='edit'&&newAmount){
        const targetWei=ethers.parseUnits(newAmount,18);
        const currentWei=ethers.parseUnits(payment.amount.toString(),18);
        if(targetWei>currentWei){
          const diff=targetWei-currentWei;
          const contract=new ethers.Contract(contractAddress,schedAbi,signer);
          const tx=await contract.topUp(paymentId,{value:diff,gasPrice:ethers.parseUnits('100','gwei'),gasLimit:150000});
          await tx.wait();
          amountForRequest=null;
        }
      }
      const r=await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:paymentId,wallet_address:address,request_type:type,reason:reason||null,new_recipient:newRecipient||null,new_amount:amountForRequest,new_date:newDate||null,new_time:newTime||null,tz_offset:-new Date().getTimezoneOffset(),contract_address:contractAddress,original_recipient:null,original_amount:null})});
      if(!r.ok)throw new Error('Failed');
      setDone(true);setOpen(false);setStep(null);
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
      <div style={{fontSize:11,color:"var(--tx3)",marginBottom:10,marginTop:-6}}>Enter the new total amount, not the difference.</div>
      <div className="ap-label">New Release Date</div>
      <input className="ap-input" type="date" style={{marginBottom:10}} value={newDate} onChange={e=>setNewDate(e.target.value)}/>
      <div className="ap-label">New Release Time</div>
      <input className="ap-input" type="time" style={{marginBottom:10}} value={newTime} onChange={e=>setNewTime(e.target.value)}/>
      <button className="ap-btn ap-btn-primary" style={{width:'100%',marginTop:4}} onClick={()=>submit('edit')} disabled={loading||(!newRecipient&&!newAmount&&!newDate&&!newTime)}>{loading?'Submitting...':'Submit Request'}</button>
      <button onClick={()=>setStep(null)} style={{marginTop:8,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Back</button>
    </div>}
  </div>);
}
