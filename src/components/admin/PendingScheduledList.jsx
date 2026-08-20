import React from 'react';
import { ethers } from 'ethers';
import { SCHED_ADDR, ARC_RPC_FALLBACK, ARC_RPC_FALLBACK2, ARC_RPC_FALLBACK3, ARC_CHAIN_ID, ADMIN_ADDRESS, short, fmtUsdc, fmtDate, fmtTime } from '../../config';

const ABI = [
  'function paymentCount() external view returns (uint256)',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))',
  'function execute(uint256 id) external'
];

const KEEPER_WINDOW_MIN = 60;

export function PendingScheduledList(){
  const [rows,setRows]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [err,setErr]=React.useState(null);
  const [execId,setExecId]=React.useState(null);
  const [result,setResult]=React.useState(null);

  const load=React.useCallback(async()=>{
    setLoading(true);setErr(null);
    const urls=[ARC_RPC_FALLBACK,ARC_RPC_FALLBACK2,ARC_RPC_FALLBACK3];
    let provider=null,lastErr=null;
    for(const url of urls){
      try{
        provider=new ethers.JsonRpcProvider(url,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
        await provider.getBlockNumber();
        break;
      }catch(e){lastErr=e;provider=null;}
    }
    if(!provider){setErr(lastErr?.message||'Could not reach any RPC endpoint.');setLoading(false);return;}

    try{
      const sched=new ethers.Contract(SCHED_ADDR,ABI,provider);
      const count=Number(await sched.paymentCount());
      const now=Math.floor(Date.now()/1000);
      const list=[];
      const BATCH=4;
      for(let start=0;start<count;start+=BATCH){
        const ids=[];
        for(let i=start;i<Math.min(start+BATCH,count);i++)ids.push(i);
        const results=await Promise.all(ids.map(async id=>{
          const p=await sched.getPayment(id);
          return{id,p};
        }));
        for(const{id,p}of results){
          if(p.executed||p.cancelled)continue;
          const releaseTime=Number(p.releaseTime);
          const due=releaseTime<=now;
          let status='not_due',failReason=null;
          if(due){
            const minsSince=(now-releaseTime)/60;
            try{
              await sched.execute.staticCall(id,{from:ADMIN_ADDRESS});
              status=minsSince<KEEPER_WINDOW_MIN?'waiting_keeper':'keeper_delayed';
            }catch(e){
              status='stuck';
              failReason=e.reason||e.shortMessage||e.message;
            }
          }
          list.push({id,recipient:p.recipient,amount:p.amount,releaseTime,status,failReason,minsSince:due?(now-releaseTime)/60:null});
        }
        if(start+BATCH<count)await new Promise(r=>setTimeout(r,250));
      }
      setRows(list.sort((a,b)=>a.releaseTime-b.releaseTime));
    }catch(e){
      setErr(e.message);
    }
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

  const adminAction=async(id,action)=>{
    const reason=window.prompt(action==='cancel_refund'?'Reason for cancelling & refunding payment #'+id+':':'Reason for marking payment #'+id+' under review:');
    if(!reason||!reason.trim())return;
    setExecId(id);setResult(null);
    try{
      const token=sessionStorage.getItem('sp_admin_jwt');
      if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}
      const r=await fetch('/api/admin-payment-action',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({payment_id:id,action,reason})});
      const d=await r.json();
      if(d.error){setResult({id,type:'error',msg:d.error});}
      else{setResult({id,type:'success',msg:(action==='cancel_refund'?'Cancelled & refunded. ':'Marked under review. ')+(d.failureReason?'Failure reason: '+d.failureReason:'')});if(action==='cancel_refund')load();}
    }catch(e){setResult({id,type:'error',msg:e.message});}
    setExecId(null);
  };

  if(loading)return <div style={{fontSize:13,opacity:.7}}>Loading scheduled payments and checking status...</div>;
  if(err)return <div style={{fontSize:12,color:'var(--re)'}}>Error: {err} <button className="ap-btn" style={{marginTop:8}} onClick={load}>Retry</button></div>;
  if(rows.length===0)return <div style={{fontSize:13,opacity:.7}}>No active scheduled payments.</div>;

  const statusTag=(row)=>{
    if(row.status==='not_due')return null;
    if(row.status==='waiting_keeper')return <span style={{color:'var(--ac)',fontWeight:700}}>(Waiting for keeper — up to {Math.max(0,Math.ceil(60-row.minsSince))}m left)</span>;
    if(row.status==='keeper_delayed')return <span style={{color:'#e2a03f',fontWeight:700}}>(Keeper delayed — {Math.floor(row.minsSince)}m overdue, would succeed)</span>;
    if(row.status==='stuck')return <span style={{color:'var(--re)',fontWeight:700}}>(STUCK: {row.failReason})</span>;
    return null;
  };

  return(<div>
    {rows.map(p=>(
      <div key={p.id} style={{padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{fontSize:13,color:'var(--tx1)'}}>
            <div style={{fontWeight:700,color:'var(--tx1)'}}>#{p.id}: {fmtUsdc(p.amount)} USDC {statusTag(p)}</div>
            <div style={{opacity:.7,fontSize:12,color:'var(--tx2)'}}>To: {short(p.recipient)}</div>
            <div style={{opacity:.7,fontSize:12,color:'var(--tx2)'}}>Release: {fmtDate(p.releaseTime)} {fmtTime(p.releaseTime)}</div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button className="ap-btn ap-btn-primary" style={{marginTop:0,padding:'8px 16px'}} disabled={execId===p.id||p.status==='not_due'} onClick={()=>executeOne(p.id)}>
              {execId===p.id?'Executing...':(p.status==='not_due'?'Not due yet':'Execute Manually')}
            </button>
            <button className="ap-btn" style={{marginTop:0,padding:'8px 16px'}} onClick={()=>adminAction(p.id,'cancel_refund')}>Cancel & Refund</button>
            <button className="ap-btn" style={{marginTop:0,padding:'8px 16px'}} onClick={()=>adminAction(p.id,'under_review')}>Send Under Review</button>
          </div>
        </div>
        {result&&result.id===p.id&&<div style={{marginTop:8,fontSize:12,padding:'8px 12px',borderRadius:8,background:result.type==='success'?'rgba(23,229,176,.1)':'rgba(255,79,97,.1)',color:result.type==='success'?'var(--cy)':'var(--re)',wordBreak:'break-all'}}>{result.msg}</div>}
      </div>
    ))}
  </div>);
}
