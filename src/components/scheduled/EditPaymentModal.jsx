import React, { useState } from 'react';
import { ethers } from 'ethers';

export function EditPaymentModal({payment,paymentId,signer,contractAddress,schedAbi,onClose,onSuccess}){
  const existingDate=new Date(payment.releaseTime*1000);
  const pad=n=>String(n).padStart(2,'0');
  const[newRecipient,setNewRecipient]=useState(payment.recipient||'');
  const[addAmount,setAddAmount]=useState(parseFloat(payment.amount).toFixed(2));
  const[newDate,setNewDate]=useState(existingDate.getFullYear()+'-'+pad(existingDate.getMonth()+1)+'-'+pad(existingDate.getDate()));
  const[newTime,setNewTime]=useState(pad(existingDate.getHours())+':'+pad(existingDate.getMinutes()));
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');

  const submit=async()=>{
    setLoading(true);setError('');
    try{
      const contract=new ethers.Contract(contractAddress,schedAbi,signer);
      const recipientArg=newRecipient.trim()?ethers.getAddress(newRecipient.trim()):ethers.getAddress(payment.recipient);
      let releaseTimeArg=Number(payment.releaseTime);
      if(newDate){
        const timeStr=newTime||'12:00';
        releaseTimeArg=Math.floor((()=>{const [dy,dm,dd]=newDate.split('-').map(Number);const [dh,dmin]=(newTime||'12:00').split(':').map(Number);return new Date(dy,dm-1,dd,dh,dmin,0);})(  ).getTime()/1000);
        if(releaseTimeArg<=Math.floor(Date.now()/1000)){
          setError('Release time must be in the future.');
          setLoading(false);
          return;
        }
      }
      const existingAmt=parseFloat(payment.amount)||0;const newAmt=addAmount&&parseFloat(addAmount)>0?parseFloat(addAmount):0;const diff=newAmt-existingAmt;const value=diff>0?ethers.parseUnits(diff.toFixed(6),18):0n;
      const tx=await contract.edit(paymentId,recipientArg,releaseTimeArg,'',{value,gasPrice:ethers.parseUnits('100','gwei'),gasLimit:300000});
      await tx.wait();
      onSuccess();
      onClose();
    }catch(e){
      setError(e?.reason||e?.shortMessage||e?.message||'Edit failed.');
    }
    setLoading(false);
  };

  return(<div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
    <div style={{background:'var(--card)',borderRadius:16,padding:20,width:'100%',maxWidth:380,boxShadow:'var(--shl)'}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:15,fontWeight:800,color:'var(--tx1)',marginBottom:4}}>Edit Payment</div>
      <div style={{fontSize:12,color:'var(--tx3)',marginBottom:14}}>Edit the fields below. Only changed values will be updated on-chain.</div>
      <div className="ap-label">Recipient Address</div>
      <input className="ap-input" style={{marginBottom:10}} placeholder="0x..." value={newRecipient} onChange={e=>setNewRecipient(e.target.value)}/>
      <div className="ap-label">Amount (USDC)</div>
      <input className="ap-input" type="number" style={{marginBottom:10}} placeholder="0.00" value={addAmount} onChange={e=>setAddAmount(e.target.value)}/>
      
      <div className="ap-label">Release Date</div>
      <input className="ap-input" type="date" style={{marginBottom:10}} value={newDate} onChange={e=>setNewDate(e.target.value)}/>
      <div className="ap-label">Release Time</div>
      <input className="ap-input" type="time" style={{marginBottom:10}} value={newTime} onChange={e=>setNewTime(e.target.value)}/>
      {error&&<div style={{fontSize:12,color:'var(--re)',marginBottom:10}}>{error}</div>}
      <button className="ap-btn ap-btn-primary" style={{width:'100%'}} onClick={submit} disabled={loading||(!newRecipient&&!addAmount&&!newDate&&!newTime)}>{loading?'Submitting...':'Save Changes'}</button>
      <button onClick={onClose} style={{marginTop:8,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Cancel</button>
    </div>
  </div>);
}
