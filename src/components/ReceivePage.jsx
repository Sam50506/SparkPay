import React from 'react';
import { IC } from '../icons';

export default function ReceivePage({ address, setShowQR, setStatus }) {
  return (<div className="ap-card"><div className="ap-card-title">Receive USDC</div><div className="ap-card-sub">Share your QR code or payment link to receive USDC.</div><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowQR(true)}>Open QR Code</button><div className="ap-div"/><div style={{fontSize:13,fontWeight:600,color:'var(--tx2)',marginBottom:6}}>Your Address</div><div style={{display:'flex',gap:8,alignItems:'center'}}><div style={{flex:1,padding:'12px 14px',background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:10,fontFamily:'monospace',fontSize:13,color:'var(--tx1)',wordBreak:'break-all',lineHeight:1.5}}>{address}</div><button className="ap-btn ap-btn-icon" onClick={()=>{navigator.clipboard?.writeText(address);setStatus&&setStatus({type:'success',msg:'Address copied to clipboard'});}}><IC.Copy/></button></div></div>);
}
