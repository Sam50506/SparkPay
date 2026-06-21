import React from 'react';
import { IC } from '../icons';

export default function ReceivePage({ address, setShowQR }) {
  return (<div className="ap-card"><div className="ap-card-title">Receive USDC</div><div className="ap-card-sub">Share your QR code or payment link to receive USDC.</div><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowQR(true)}>Open QR Code</button><div className="ap-div"/><div className="ap-label">Your Address</div><div style={{display:'flex',gap:8,alignItems:'center'}}><div className="ap-code" style={{flex:1}}>{address}</div><button className="ap-btn ap-btn-icon" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button></div></div>);
}
