import React from 'react';
import { ADMIN_ADDRESS } from '../../config';

export function FailedTxns(){
  const[txns,setTxns]=React.useState([]);
  const[loading,setLoading]=React.useState(true);

  const fetchFailed=async()=>{
    setLoading(true);
    try{
      const r=await fetch('https://testnet.arcscan.app/api?module=account&action=txlist&address='+ADMIN_ADDRESS+'&sort=desc');
      const d=await r.json();
      const failed=(d.result||[]).filter(t=>t.isError==='1').slice(0,15);
      setTxns(failed);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  React.useEffect(()=>{fetchFailed();},[]);

  if(loading)return <div style={{fontSize:13,color:'var(--tx3)',padding:'12px 0'}}>Loading...</div>;
  if(txns.length===0)return <div style={{fontSize:13,color:'var(--tx3)',padding:'12px 0'}}>No failed transactions found.</div>;

  return(<div>
    <button onClick={fetchFailed} style={{background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:8,padding:'5px 12px',fontSize:11,fontWeight:600,color:'var(--tx2)',cursor:'pointer',marginBottom:12}}>Refresh</button>
    {txns.map((t,i)=>(<div key={i} style={{background:'var(--elev)',borderRadius:10,padding:'10px 12px',marginBottom:8}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontSize:11,fontWeight:700,color:'var(--re)'}}>Failed</span>
        <span style={{fontSize:11,color:'var(--tx3)'}}>{new Date(Number(t.timeStamp)*1000).toLocaleString()}</span>
      </div>
      <div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx2)',wordBreak:'break-all'}}>{t.hash}</div>
      <a href={'https://testnet.arcscan.app/tx/'+t.hash} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ac)',marginTop:4,display:'inline-block'}}>View on Explorer</a>
    </div>))}
  </div>);
}
