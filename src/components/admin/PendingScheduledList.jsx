import React from 'react';
import { ethers } from 'ethers';
import { SCHED_ADDR, ARC_RPC_FALLBACK, ARC_RPC_FALLBACK2, ARC_RPC_FALLBACK3, ARC_CHAIN_ID, ADMIN_ADDRESS, short, fmtUsdc, fmtDate, fmtTime } from '../../config';
import { SCHED_ABI } from '../../hooks/useSchedule';

export function PendingScheduledList(){
  const [rows,setRows]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [err,setErr]=React.useState(null);
  const [execId,setExecId]=React.useState(null);
  const [result,setResult]=React.useState(null);

  const load=React.useCallback(async()=>{
    setLoading(true);setErr(null);
    const urls=[ARC_RPC_FALLBACK,ARC_RPC_FALLBACK2,ARC_RPC_FALLBACK3];
    let out=null,lastErr=null;
    for(const url of urls){
      try{
        const provider=new ethers.JsonRpcProvider(url,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
        const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,provider);
        const count=Number(await sched.paymentCount());
        const list=[];
        const BATCH=4;
        for(let start=0;start<count;start+=BATCH){
          const batchIds=[];
          for(let i=start;i<Math.min(start+BATCH,count);i++)batchIds.push(i);
          const results=await Promise.all(batchIds.map(async id=>{
            const p=await sched.getPayment(id);
            return{id,p};
          }));
          for(const{id,p}of results){
            if(!p.executed&&!p.cancelled){
              list.push({id,recipient:p.recipient,amount:p.amount,releaseTime:Number(p.releaseTime)});
            }
          }
          if(start+BATCH<count)await new Promise(r=>setTimeout(r,250));
        }
        out=list.sort((a,b)=>a.releaseTime-b.releaseTime);
        break;
      }catch(e){lastErr=e;}
    }
    if(out){setRows(out);}
    else{setErr(lastErr?.message||'Could not load scheduled payments from any RPC endpoint.');}
    setLoading(false);
  },[]);

  React.useEffect(()=>{load();},[load]);

  const executeOne=async(id)=>{
    setExecId(id);setResult(null);
    try{
      const token=sessionStorage.getItem('sp_admin_jwt');
      if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}
      const r=await fetch('/api/manual-execute',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({payment_id:id})});
      const d=await r.json();
      if(d.error){setResult({id,type:'error',msg:d.error});}
      else{setResult({id,type:'success',msg:'Executed! Hash: '+d.hash});load();}
    }catch(e){setResult({id,type:'error',msg:e.message});}
    setExecId(null);
  };

  const now=Math.floor(Date.now()/1000);

  if(loading)return <div style={{fontSize:13,opacity:.7}}>Loading scheduled payments...</div>;
  if(err)return <div style={{fontSize:12,color:'var(--re)'}}>Error: {err} <button className="ap-btn" style={{marginTop:8}} onClick={load}>Retry</button></div>;
  if(rows.length===0)return <div style={{fontSize:13,opacity:.7}}>No active scheduled payments.</div>;

  return(<div>
    {rows.map(p=>{
      const due=p.releaseTime<=now;
      return(
        <div key={p.id} style={{padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={{fontSize:13,color:'var(--tx1)'}}>
              <div style={{fontWeight:700,color:'var(--tx1)'}}>#{p.id}: {fmtUsdc(p.amount)} USDC {due&&<span style={{color:'var(--re)',fontWeight:700}}>(OVERDUE)</span>}</div>
              <div style={{opacity:.7,fontSize:12,color:'var(--tx2)'}}>To: {short(p.recipient)}</div>
              <div style={{opacity:.7,fontSize:12,color:'var(--tx2)'}}>Release: {fmtDate(p.releaseTime)} {fmtTime(p.releaseTime)}</div>
            </div>
            <button className="ap-btn ap-btn-primary" style={{marginTop:0,padding:'8px 16px'}} disabled={execId===p.id||!due} onClick={()=>executeOne(p.id)}>
              {execId===p.id?'Executing...':(due?'Execute Manually':'Not due yet')}
            </button>
          </div>
          {result&&result.id===p.id&&<div style={{marginTop:8,fontSize:12,padding:'8px 12px',borderRadius:8,background:result.type==='success'?'rgba(23,229,176,.1)':'rgba(255,79,97,.1)',color:result.type==='success'?'var(--cy)':'var(--re)',wordBreak:'break-all'}}>{result.msg}</div>}
        </div>
      );
    })}
  </div>);
}
