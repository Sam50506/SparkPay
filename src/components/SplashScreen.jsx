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
        @keyframes sp-boltin{from{opacity:0;transform:translate(-50%,-50%) scale(0.5)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes sp-idlepulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.08)}}
        @keyframes sp-boltout{to{opacity:0;transform:translate(-50%,-50%) scale(0.5)}}
        @keyframes sp-linein-l{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes sp-linein-r{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        @keyframes sp-burst{0%{transform:translate(-50%,-50%) scale(0);opacity:1}70%{opacity:0.4}100%{transform:translate(-50%,-50%) scale(6);opacity:0}}
        @keyframes sp-wordin{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes sp-letterout{to{opacity:0}}
        @keyframes sp-boltreplacein{to{opacity:1}}
        @keyframes sp-bar{from{width:0}to{width:100%}}
        @keyframes sp-sub{from{opacity:0}to{opacity:1}}
        @keyframes sp-shine{0%{left:-40%;opacity:0}50%{opacity:1}100%{left:120%;opacity:0}}
      `}</style>

      {/* Phase 1: lone bolt at center */}
      <div style={{position:'absolute',top:'50%',left:'50%',opacity:0,animation:'sp-boltin .35s ease forwards, sp-idlepulse .7s ease-in-out .35s 1, sp-boltout .25s ease 1.05s forwards'}}>
        <svg viewBox="0 0 30 44" fill="none" style={{width:'clamp(40px,9vw,64px)',height:'clamp(60px,13.5vw,96px)',filter:'drop-shadow(0 0 10px rgba(75,140,245,1)) drop-shadow(0 0 20px rgba(23,229,176,0.6))'}}>
          <defs>
            <linearGradient id="boltG0" x1="15" y1="0" x2="15" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff"/><stop offset="45%" stopColor="#7AACFF"/><stop offset="100%" stopColor="#17E5B0"/>
            </linearGradient>
          </defs>
          <path d="M20 2L3 24H14L10 42L27 20H16L20 2Z" fill="url(#boltG0)"/>
        </svg>
      </div>

      {/* Converging beams */}
      <div style={{position:'absolute',top:'50%',left:0,width:'50%',height:2,background:'linear-gradient(90deg,transparent,#4B8CF5)',transform:'scaleX(0)',transformOrigin:'left',animation:'sp-linein-l .45s cubic-bezier(.4,0,.2,1) .55s forwards',pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:'50%',right:0,width:'50%',height:2,background:'linear-gradient(90deg,#17E5B0,transparent)',transform:'scaleX(0)',transformOrigin:'right',animation:'sp-linein-r .45s cubic-bezier(.4,0,.2,1) .55s forwards',pointerEvents:'none'}}/>

      {/* Burst on collision */}
      <div style={{position:'absolute',top:'50%',left:'50%',width:26,height:26,marginLeft:-13,marginTop:-13,borderRadius:'50%',background:'radial-gradient(circle,#fff,#7AACFF 55%,transparent 75%)',opacity:0,animation:'sp-burst .45s ease 1.0s forwards',pointerEvents:'none'}}/>

      {/* Phase 2: full plain wordmark appears */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',opacity:0,animation:'sp-wordin .4s ease 1.3s forwards'}}>
        <div style={{position:'relative',display:'flex',alignItems:'center',lineHeight:1,overflow:'hidden'}}>
          <span style={{fontFamily:'var(--fd)',fontSize:'clamp(36px,8vw,58px)',fontWeight:900,letterSpacing:'-0.02em',color:'#fff'}}>Sp</span>
          <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:'var(--fd)',fontSize:'clamp(36px,8vw,58px)',fontWeight:900,letterSpacing:'-0.02em',color:'#fff',animation:'sp-letterout .3s ease 1.9s forwards'}}>a</span>
            <span style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',display:'flex',alignItems:'center',opacity:0,animation:'sp-boltreplacein .3s ease 1.9s forwards'}}>
              <svg viewBox="0 0 30 44" fill="none" style={{width:'clamp(22px,4.5vw,34px)',height:'clamp(33px,7vw,51px)',filter:'drop-shadow(0 0 10px rgba(75,140,245,1)) drop-shadow(0 0 20px rgba(23,229,176,0.6))'}}>
                <defs>
                  <linearGradient id="boltG1" x1="15" y1="0" x2="15" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff"/><stop offset="45%" stopColor="#7AACFF"/><stop offset="100%" stopColor="#17E5B0"/>
                  </linearGradient>
                </defs>
                <path d="M20 2L3 24H14L10 42L27 20H16L20 2Z" fill="url(#boltG1)"/>
              </svg>
            </span>
          </span>
          <span style={{fontFamily:'var(--fd)',fontSize:'clamp(36px,8vw,58px)',fontWeight:900,letterSpacing:'-0.02em',color:'#fff'}}>rkPay</span>
          <div style={{position:'absolute',top:0,bottom:0,width:'40%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',animation:'sp-shine .8s 2.2s ease forwards',pointerEvents:'none'}}/>
        </div>
        <div style={{marginTop:16,fontSize:10,fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(235,240,255,0.3)',opacity:0,animation:'sp-sub .4s ease 2.3s forwards'}}>
          Instant Global Payments
        </div>
      </div>

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
