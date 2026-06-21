import React, { useState } from 'react';

export const SparkPayLogo = ({ size = 36 }) => (
  <img src='/sparkpay-logo.jpg' width={size} height={size} style={{borderRadius:10,objectFit:'cover'}}/>
);const ONBOARDING_ICONS={
  send:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  receive:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  history:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>,
  contacts:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  star:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  invoice:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  pay:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  multi:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/><path d="M16 8L2 22"/><path d="M17.5 15H9"/></svg>,
  schedule:()=><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.6"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};
const ONBOARDING_SLIDES=[
  {icon:'send',title:'Send USDC',desc:'Transfer USDC instantly to any wallet on Arc Testnet. Zero fees, confirmed in seconds.'},
  {icon:'receive',title:'Receive',desc:'Generate your QR code or payment link. Share it with anyone to get paid instantly.'},
  {icon:'history',title:'History',desc:'Track all your transactions with real-time status. Export as CSV anytime.'},
  {icon:'contacts',title:'Contacts',desc:'Save frequent wallet addresses for quick access when sending.'},
  {icon:'star',title:'Rewards',desc:'Earn cashback on every confirmed transaction. Claim when you reach 5 USDC.'},
  {icon:'invoice',title:'Invoice',desc:'Create USDC payment requests stored on Supabase. Share the ID with your client.'},
  {icon:'pay',title:'Pay Invoice',desc:'Enter an invoice ID to look it up and pay instantly from anywhere.'},
  {icon:'multi',title:'Multi Send',desc:'Send USDC to multiple recipients in one session. Perfect for payroll or batch payments.'},
  {icon:'schedule',title:'Scheduled',desc:'Set up recurring payment reminders and pre-fill the Send form automatically.'},
];

const OnboardingModal=({onDone})=>{
  const[slide,setSlide]=useState(0);
  const last=slide===ONBOARDING_SLIDES.length-1;
  const s=ONBOARDING_SLIDES[slide];
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:998,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{background:'var(--card)',borderRadius:24,padding:'32px 24px',maxWidth:360,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.4)'}}>
        <div style={{marginBottom:16,display:'flex',justifyContent:'center'}}>{ONBOARDING_ICONS[s.icon]&&ONBOARDING_ICONS[s.icon]()}</div>
        <div style={{fontFamily:'var(--fd)',fontSize:22,fontWeight:800,color:'var(--tx1)',marginBottom:10}}>{s.title}</div>
        <div style={{fontSize:14,color:'var(--tx2)',lineHeight:1.6,marginBottom:28,minHeight:60}}>{s.desc}</div>
        <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:24}}>
          {ONBOARDING_SLIDES.map((_,i)=><div key={i} style={{width:i===slide?20:6,height:6,borderRadius:3,background:i===slide?'var(--ac)':'var(--b1)',transition:'all .3s'}}/>)}
        </div>
        <div style={{display:'flex',gap:10}}>
          {slide>0&&<button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>setSlide(s=>s-1)}>Back</button>}
          <button className="ap-btn ap-btn-primary" style={{flex:2}} onClick={()=>last?onDone():setSlide(s=>s+1)}>{last?'Get Started':'Next'}</button>
        </div>
        {!last&&<div style={{marginTop:14,fontSize:12,color:'var(--tx3)',cursor:'pointer'}} onClick={onDone}>Skip</div>}
      </div>
    </div>
  );
};

export default OnboardingModal;
