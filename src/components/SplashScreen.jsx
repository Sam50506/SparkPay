import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onDone }) => {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t1=setTimeout(()=>setExit(true),3000);
    const t2=setTimeout(()=>onDone(),3400);
    return()=>{clearTimeout(t1);clearTimeout(t2);}
  }, [onDone]);
  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:exit?0:1,transition:'opacity .5s ease',overflow:'hidden'}}>
      <style>{`
        @keyframes sp-flash{0%{opacity:0}10%{opacity:0.25}20%{opacity:0}35%{opacity:0.12}50%{opacity:0}100%{opacity:0}}
        @keyframes sp-logoin{0%{opacity:0;transform:scale(1.08);filter:blur(6px)}60%{filter:blur(0)}100%{opacity:1;transform:scale(1);filter:blur(0)}}
        @keyframes sp-bolt{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes sp-bar{from{width:0}to{width:100%}}
        @keyframes sp-sub{from{opacity:0}to{opacity:1}}
        @keyframes sp-glow{from{opacity:0}to{opacity:1}}
        @keyframes sp-shine{0%{left:-40%;opacity:0}50%{opacity:1}100%{left:120%;opacity:0}}
      `}</style>

      {/* Flash */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#4B8CF5,#17E5B0)',animation:'sp-flash .7s ease forwards',pointerEvents:'none',zIndex:2}}/>



      {/* Logo */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',opacity:0,animation:'sp-logoin .6s cubic-bezier(.22,1,.36,1) 0.3s forwards'}}>
        <div style={{position:'relative',display:'flex',alignItems:'center',lineHeight:1,overflow:'hidden'}}>
          <span style={{fontFamily:'var(--fd)',fontSize:'clamp(36px,8vw,58px)',fontWeight:900,letterSpacing:'-0.02em',color:'#fff'}}>Sp</span>
          <span style={{display:'inline-flex',alignItems:'center',margin:'0 2px',position:'relative',top:1,opacity:0,animation:'sp-bolt .4s cubic-bezier(.34,1.56,.64,1) 0.6s forwards'}}>
            <svg viewBox="0 0 30 44" fill="none" style={{width:'clamp(22px,4.5vw,34px)',height:'clamp(33px,7vw,51px)',filter:'drop-shadow(0 0 10px rgba(75,140,245,1)) drop-shadow(0 0 20px rgba(23,229,176,0.6))'}}>
              <defs>
                <linearGradient id="boltG" x1="15" y1="0" x2="15" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fff"/>
                  <stop offset="45%" stopColor="#7AACFF"/>
                  <stop offset="100%" stopColor="#17E5B0"/>
                </linearGradient>
              </defs>
              <path d="M20 2L3 24H14L10 42L27 20H16L20 2Z" fill="url(#boltG)"/>
            </svg>
          </span>
          <span style={{fontFamily:'var(--fd)',fontSize:'clamp(36px,8vw,58px)',fontWeight:900,letterSpacing:'-0.02em',color:'#fff'}}>rkPay</span>
          <div style={{position:'absolute',top:0,bottom:0,width:'40%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',animation:'sp-shine .8s 0.8s ease forwards',pointerEvents:'none'}}/>
        </div>
        <div style={{marginTop:16,fontSize:10,fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(235,240,255,0.3)',opacity:0,animation:'sp-sub .4s ease 0.9s forwards'}}>
          Instant Global Payments
        </div>
      </div>

      {/* Progress bar */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:'rgba(255,255,255,0.04)'}}>
        <div style={{height:'100%',background:'linear-gradient(90deg,#4B8CF5,#17E5B0)',animation:'sp-bar 1.6s cubic-bezier(.4,0,.2,1) .2s both'}}/>
      </div>
      <div style={{position:'absolute',bottom:14,fontSize:10,color:'rgba(235,240,255,0.15)',letterSpacing:'0.06em',fontWeight:500}}>
        Testnet · Chain 5042002
      </div>
    </div>
  );
};


export default SplashScreen;
