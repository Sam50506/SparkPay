import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_URL } from '../config';

export default function QRModal({address,onClose}){
  const[amt,setAmt]=useState('');
  const[copied,setCopied]=useState('');
  const link=APP_URL+'/?pay='+address+(amt?'&amount='+amt:'');
  return(
    <div className="ap-modal-bg" onClick={onClose}>
      <div className="ap-modal" onClick={e=>e.stopPropagation()}>
        <div className="ap-modal-title">Receive USDC</div>
        <div className="ap-modal-sub">Share your payment link or QR code</div>
        <div className="ap-qr-wrap">
          <div className="ap-qr-box"><QRCodeSVG value={link} size={180} level="M"/></div>
          <div style={{width:'100%'}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--tx2)',marginBottom:6}}>Optional Amount</div>
            <input className="ap-input" type="number" placeholder="0.00 USDC" value={amt} onChange={e=>setAmt(e.target.value)} style={{marginBottom:14}}/>
            <div style={{fontSize:13,fontWeight:600,color:'var(--tx2)',marginBottom:6}}>Payment Link</div>
            <div className="ap-qr-link">{link}</div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>{navigator.clipboard?.writeText(link);setCopied('link');setTimeout(()=>setCopied(''),2000);}}>{copied==='link'?'Copied!':'Copy Link'}</button>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>{navigator.clipboard?.writeText(address);setCopied('address');setTimeout(()=>setCopied(''),2000);}}>{copied==='address'?'Copied!':'Copy Address'}</button>
            </div>

          </div>
        </div>
        <button className="ap-btn ap-btn-ghost" style={{width:'100%',marginTop:16}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
