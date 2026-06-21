import React, { useState, useEffect } from 'react';
import { IC } from '../icons';
import { SparkPayLogo } from './OnboardingModal';
import { short } from '../config';

export function NavTooltip({text}){
  const[open,setOpen]=useState(false);const ref=useRef(null);
  useEffect(()=>{if(!open)return;const close=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener('mousedown',close);document.addEventListener('touchstart',close);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('touchstart',close);};},[open]);
  return(<span ref={ref} style={{position:'relative',display:'inline-flex',flexShrink:0}}>{open&&<div className="ap-tip-pop">{text}</div>}</span>);
}


export function CashbackToast({amount,rarity,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
  const cls=rarity==='Epic'?'ap-rarity-epic':rarity==='Rare'?'ap-rarity-rare':'ap-rarity-common';
  return(
    <div className="ap-cb-toast">
      <div style={{width:36,height:36,borderRadius:'50%',background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--ac2)'}}><IC.Gift/></div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:'var(--tx1)'}}>Cashback Earned</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>+{amount} USDC added to rewards</div></div>
      <span className={'ap-cb-rarity '+cls}>{rarity}</span>
    </div>
  );
}

export function ResumeModal({session,onResume,onNew}){
  return(
    <div className="ap-modal-bg">
      <div className="ap-modal" style={{textAlign:'center'}}>
        <SparkPayLogo size={44}/>
        <div className="ap-modal-title" style={{marginTop:14}}>Welcome Back</div>
        <div className="ap-modal-sub">Your previous session was saved</div>
        <div className="ap-resume-addr">{short(session.address)}</div>
        <div style={{display:'flex',gap:10}}>
          <button className="ap-btn ap-btn-ghost" style={{flex:1}} onClick={onNew}>New Wallet</button>
          <button className="ap-btn ap-btn-primary" style={{flex:2,marginTop:0}} onClick={onResume}>Resume Session</button>
        </div>
      </div>
    </div>
  );
}

export function WalletPicker({onPick,onClose}){
  const [eip6963,setEip6963]=React.useState([]);
  React.useEffect(()=>{
    const detected=[];
    const handler=(e)=>{
      const {info,provider}=e.detail;
      if(!detected.find(w=>w.info.uuid===info.uuid)){
        detected.push({info,provider});
        setEip6963([...detected]);
      }
    };
    window.addEventListener('eip6963:announceProvider',handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    return()=>window.removeEventListener('eip6963:announceProvider',handler);
  },[]);

  const options=[];
  if(eip6963.length>0){
    eip6963.forEach((w,i)=>{const name=w.info.name.toLowerCase();if(name.includes('phantom')||name.includes('solflare')||name.includes('solana'))return;options.push({type:'eip6963_'+i,label:w.info.name,icon:w.info.icon,p:w.provider});});
  } else {
    const eth=window.ethereum;
    if(eth){const providers=eth.providers?.length?eth.providers:[eth];providers.forEach((p,i)=>{let label='Browser Wallet',type='p_'+i;if(p.isMetaMask&&!p.isBraveWallet)label='MetaMask';else if(p.isBraveWallet)label='Brave Wallet';else if(p.isCoinbaseWallet)label='Coinbase Wallet';else if(p.isRabby)label='Rabby';else if(p.isOkxWallet||p.isOKExWallet)label='OKX Wallet';else if(p.isTrust)label='Trust Wallet';options.push({type,label,p});});}
    else options.push({type:'install',label:'No wallet found'});
  }

  return(
    <div style={{background:'var(--elev)',border:'1px solid var(--b2)',borderRadius:16,padding:20,display:'flex',flexDirection:'column',gap:10,boxShadow:'var(--shl)'}}>
      <div style={{fontSize:14,fontWeight:700,color:'var(--tx1)',fontFamily:'var(--fd)',marginBottom:4}}>Choose wallet</div>
      {options.map((o,i)=><button key={i} onClick={()=>onPick(o.type,o.p,o.label)} style={{display:'flex',alignItems:'center',gap:12,background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'13px 16px',cursor:'pointer',fontSize:14,fontWeight:600,color:'var(--tx1)',width:'100%',textAlign:'left',transition:'all .14s'}}>
        {o.icon?<img src={o.icon} style={{width:24,height:24,borderRadius:6}} alt={o.label}/>:<IC.Wallet/>} {o.label}
      </button>)}
      
      <button onClick={onClose} style={{fontSize:13,color:'var(--tx2)',background:'none',border:'none',cursor:'pointer',marginTop:4}}>Back</button>
    </div>
  );
}

