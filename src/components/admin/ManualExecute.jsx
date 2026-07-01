import React from 'react';

export function ManualExecute(){
  const[paymentId,setPaymentId]=React.useState('');
  const[loading,setLoading]=React.useState(false);
  const[result,setResult]=React.useState(null);

  const execute=async()=>{
    if(!paymentId)return;
    setLoading(true);setResult(null);
    try{
      const token=sessionStorage.getItem('sp_admin_jwt');
      if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}
      const r=await fetch('/api/manual-execute',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({payment_id:paymentId})});
      const d=await r.json();
      if(d.error){setResult({type:'error',msg:d.error});}
      else{setResult({type:'success',msg:'Executed! Hash: '+d.hash});setPaymentId('');}
    }catch(e){setResult({type:'error',msg:e.message});}
    setLoading(false);
  };

  return(<div>
    <div style={{display:'flex',gap:8}}>
      <input className="ap-input" style={{marginBottom:0,flex:1}} type="number" placeholder="Payment ID (0-based, e.g. 34)" value={paymentId} onChange={e=>setPaymentId(e.target.value)}/>
      <button className="ap-btn ap-btn-primary" style={{marginTop:0,width:'auto',padding:'0 20px'}} onClick={execute} disabled={loading||!paymentId}>{loading?'Executing...':'Execute'}</button>
    </div>
    {result&&<div style={{marginTop:10,fontSize:12,padding:'8px 12px',borderRadius:8,background:result.type==='success'?'rgba(23,229,176,.1)':'rgba(255,79,97,.1)',color:result.type==='success'?'var(--cy)':'var(--re)',wordBreak:'break-all'}}>{result.msg}</div>}
  </div>);
}
