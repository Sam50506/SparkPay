import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { ADMIN_ADDRESS, SB_URL, SB_KEY } from '../config';
import { SparkPayLogo } from './OnboardingModal';
import { ScheduledRequests } from './admin/ScheduledRequests';
import { ManualExecute } from './admin/ManualExecute';
import { FailedTxns } from './admin/FailedTxns';
import { Diagnostics } from './admin/Diagnostics';
export { ScheduledRequests, ManualExecute, FailedTxns, Diagnostics };

export function AdminPanel({address,signer,maintenanceMode,setMaintenanceMode}){
  const isAdmin = address && address.toLowerCase()===ADMIN_ADDRESS;
  useEffect(()=>{
    fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode&select=value',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{
      if(d&&d[0])setMaintenanceMode(d[0].value==='true');
    }).catch(()=>{});
  },[]);
  const[stats,setStats]=useState({txCount:0,volume:0,pendingClaims:0});
  const[loading,setLoading]=useState(true);
  const[pkLoading,setPkLoading]=useState(false);
  const[pkRegistered,setPkRegistered]=useState(null);
  const[pkAuthed,setPkAuthed]=useState(()=>{
    const t=sessionStorage.getItem('sp_admin_jwt');
    return !!t;
  });
  const[webauthnSupported,setWebauthnSupported]=useState(true);
  const[pinSetup,setPinSetup]=useState(null);
  const[pinValue,setPinValue]=useState('');
  const[pinConfirm,setPinConfirm]=useState('');
  const[pinMode,setPinMode]=useState('check');

  useEffect(()=>{
    (async()=>{
      const supported=typeof window!=='undefined'&&!!window.PublicKeyCredential;
      let platformAvailable=false;
      if(supported){
        try{platformAvailable=await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch{}
      }
      setWebauthnSupported(supported&&platformAvailable);
    })();
  },[]);

  useEffect(()=>{
    if(!isAdmin||webauthnSupported)return;
    fetch(SB_URL+'/rest/v1/admin_pin?admin_address=eq.'+ADMIN_ADDRESS+'&select=id',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{setPinSetup(d&&d.length>0);setPinMode(d&&d.length>0?'verify':'setup');}).catch(()=>{});
  },[isAdmin,webauthnSupported]);

  const setupPin=async()=>{
    if(pinValue.length<6){setPkError('PIN must be at least 6 digits');return;}
    if(pinValue!==pinConfirm){setPkError('PINs do not match');return;}
    setPkLoading(true);setPkError('');
    try{
      const r=await fetch('/api/pin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'setup',address,pin:pinValue})});
      const d=await r.json();
      if(d.error)throw new Error(d.error);
      setPinSetup(true);setPinMode('verify');setPinValue('');setPinConfirm('');
    }catch(e){setPkError(e.message);}
    setPkLoading(false);
  };

  const verifyPin=async()=>{
    setPkLoading(true);setPkError('');
    try{
      const r=await fetch('/api/pin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify',address,pin:pinValue})});
      const d=await r.json();
      if(d.error)throw new Error(d.error);
      sessionStorage.setItem('sp_admin_jwt',d.token);
      setPkAuthed(true);
    }catch(e){setPkError(e.message);setPinValue('');}
    setPkLoading(false);
  };
  const[pkError,setPkError]=useState('');

  useEffect(()=>{
    if(!isAdmin)return;
    fetch(SB_URL+'/rest/v1/webauthn_credentials?admin_address=eq.'+ADMIN_ADDRESS+'&select=id',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>setPkRegistered(d&&d.length>0)).catch(()=>setPkRegistered(false));
  },[isAdmin]);

  const registerPasskey=async()=>{
    setPkLoading(true);setPkError('');
    try{
      const optRes=await fetch('/api/webauthn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register-options',address})});
      const options=await optRes.json();
      if(options.error)throw new Error(options.error);
      const attResp=await startRegistration(options);
      const verRes=await fetch('/api/webauthn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register-verify',address,response:attResp})});
      const verData=await verRes.json();
      if(!verData.verified)throw new Error(verData.error||'Registration failed');
      setPkRegistered(true);
      alert('Passkey registered successfully!');
    }catch(e){
      setPkError(e.message||'Registration failed');
    }
    setPkLoading(false);
  };

  const loginWithPasskey=async()=>{
    setPkLoading(true);setPkError('');
    try{
      const optRes=await fetch('/api/webauthn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login-options',address})});
      const options=await optRes.json();
      if(options.error)throw new Error(options.error);
      const authResp=await startAuthentication(options);
      const verRes=await fetch('/api/webauthn',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login-verify',address,response:authResp})});
      const verData=await verRes.json();
      if(!verData.verified)throw new Error(verData.error||'Authentication failed');
      sessionStorage.setItem('sp_admin_jwt',verData.token);
      setPkAuthed(true);
    }catch(e){
      setPkError(e.message||'Authentication failed');
    }
    setPkLoading(false);
  };
  useEffect(()=>{
    if(!isAdmin)return;
    (async()=>{
      try{
        const r=await fetch('https://testnet.arcscan.app/api?module=account&action=txlist&address='+ADMIN_ADDRESS+'&sort=desc');
        const d=await r.json();
        const txs=d.result||[];
        const volume=txs.reduce((s,t)=>s+parseFloat(ethers.formatUnits(t.value||'0',18)),0);
        setStats(s=>({...s,txCount:txs.length,volume}));
      }catch{}
      try{
        const r2=await fetch('/api/payout',{method:'GET'});
        const d2=await r2.json();
        setStats(s=>({...s,pendingClaims:d2.pending||0}));
      }catch{}
      setLoading(false);
    })();
  },[isAdmin]);

  if(!address){
    return(<div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontFamily:'var(--fd)',fontSize:28,fontWeight:900,color:'#fff',marginBottom:12}}>Admin Access</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.6)'}}>Please connect your wallet to continue.</div>
    </div>);
  }

  if(!isAdmin){
    return(<div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontFamily:'var(--fd)',fontSize:28,fontWeight:900,color:'#fff',marginBottom:12}}>Access Denied</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.6)'}}>This page is restricted to administrators only.</div>
    </div>);
  }

  if(pkRegistered===null&&webauthnSupported){
    return(<div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'rgba(255,255,255,0.5)',fontSize:14}}>Loading...</div></div>);
  }

  if(!pkAuthed&&!webauthnSupported){
    if(pinSetup===null){
      return(<div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{color:'rgba(255,255,255,0.5)',fontSize:14}}>Loading...</div></div>);
    }
    return(<div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:20,background:'rgba(59,130,196,.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
      </div>
      <div style={{fontFamily:'var(--fd)',fontSize:24,fontWeight:900,color:'#fff',marginBottom:8}}>Admin Verification</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:24,maxWidth:300,lineHeight:1.6}}>{pinMode==='setup'?'Set a secure PIN to access the admin dashboard.':'Enter your PIN to access the admin dashboard.'}</div>
      {pkError&&<div style={{fontSize:12,color:'#ef4444',marginBottom:16,maxWidth:300}}>{pkError}</div>}
      <div style={{position:'relative',width:220,marginBottom:pinMode==='setup'?12:20}}>
        <input type="password" autoComplete="new-password" inputMode="numeric" maxLength={12} value={pinValue} onChange={e=>setPinValue(e.target.value.replace(/\D/g,''))} style={{width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'transparent',caretColor:'#fff',fontSize:18,textAlign:'center',letterSpacing:6,outline:'none',WebkitTextSecurity:'disc'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:8,pointerEvents:'none'}}>
          {pinValue.length===0&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:14}}>Enter PIN</span>}
          {Array.from({length:pinValue.length}).map((_,i)=><div key={i} style={{width:9,height:9,borderRadius:999,background:'#fff'}}/>)}
        </div>
      </div>
      {pinMode==='setup'&&<div style={{position:'relative',width:220,marginBottom:20}}>
        <input type="password" autoComplete="new-password" inputMode="numeric" maxLength={12} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,''))} style={{width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'transparent',caretColor:'#fff',fontSize:18,textAlign:'center',letterSpacing:6,outline:'none'}}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',gap:8,pointerEvents:'none'}}>
          {pinConfirm.length===0&&<span style={{color:'rgba(255,255,255,0.3)',fontSize:14}}>Confirm PIN</span>}
          {Array.from({length:pinConfirm.length}).map((_,i)=><div key={i} style={{width:9,height:9,borderRadius:999,background:'#fff'}}/>)}
        </div>
      </div>}
      <button onClick={pinMode==='setup'?setupPin:verifyPin} disabled={pkLoading||pinValue.length<6} style={{background:'var(--ac)',border:'none',borderRadius:14,padding:'14px 32px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:pkLoading||pinValue.length<6?0.5:1}}>
        {pkLoading?'Verifying...':pinMode==='setup'?'Set PIN':'Unlock'}
      </button>
    </div>);
  }

  if(!pkAuthed&&webauthnSupported){
    return(<div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:20,background:'rgba(59,130,196,.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.8"><path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M6 11v2a6 6 0 0 0 12 0v-2"/><path d="M12 17v4"/><path d="M9 9.5v2"/><path d="M15 9.5v2"/></svg>
      </div>
      <div style={{fontFamily:'var(--fd)',fontSize:24,fontWeight:900,color:'#fff',marginBottom:8}}>Admin Verification</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginBottom:28,maxWidth:300,lineHeight:1.6}}>{pkRegistered?'Use your device biometrics or passkey to access the admin dashboard.':'Set up a passkey to secure this admin dashboard with device biometrics.'}</div>
      {pkError&&<div style={{fontSize:12,color:'#ef4444',marginBottom:16,maxWidth:300}}>{pkError}</div>}
      {pkRegistered?(
        <button onClick={loginWithPasskey} disabled={pkLoading} style={{background:'var(--ac)',border:'none',borderRadius:14,padding:'14px 32px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M6 11v2a6 6 0 0 0 12 0v-2"/></svg>
          {pkLoading?'Verifying...':'Verify with Passkey'}
        </button>
      ):(
        <button onClick={registerPasskey} disabled={pkLoading} style={{background:'var(--ac)',border:'none',borderRadius:14,padding:'14px 32px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M6 11v2a6 6 0 0 0 12 0v-2"/></svg>
          {pkLoading?'Setting up...':'Set Up Passkey'}
        </button>
      )}
    </div>);
  }

  return(<div style={{minHeight:'100vh',background:'var(--bg)'}}>
    <div style={{borderBottom:'1px solid var(--b0)',background:'var(--card)',position:'sticky',top:0,zIndex:10}}>
      <div style={{maxWidth:820,margin:'0 auto',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <SparkPayLogo size={32}/>
          <div>
            <div style={{fontFamily:'var(--fd)',fontSize:15,fontWeight:800,color:'var(--tx1)',lineHeight:1.2}}>SparkPay</div>
            <div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,letterSpacing:'.04em',textTransform:'uppercase'}}>Admin Console</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:999,background:'rgba(34,197,94,0.1)'}}>
            <div style={{width:6,height:6,borderRadius:999,background:'#22c55e'}}/>
            <span style={{fontSize:11,fontWeight:700,color:'#22c55e'}}>Verified</span>
          </div>
          <button onClick={()=>{sessionStorage.removeItem('sp_admin_jwt');window.location.hash='';window.location.reload();}} style={{background:'none',border:'1px solid var(--b1)',borderRadius:9,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx2)'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div style={{maxWidth:820,margin:'0 auto',padding:'28px 24px 60px'}}>
      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Overview</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:32}}>
        <div style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:16,padding:'18px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontSize:12,color:'var(--tx3)',fontWeight:600}}>Total Transactions</div>
            <div style={{width:28,height:28,borderRadius:8,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2.2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
          </div>
          <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)',letterSpacing:'-0.5px'}}>{loading?<span style={{opacity:0.3}}>—</span>:stats.txCount}</div>
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:16,padding:'18px 20px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
            <div style={{fontSize:12,color:'var(--tx3)',fontWeight:600}}>Total Volume</div>
            <div style={{width:28,height:28,borderRadius:8,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'baseline',gap:4,whiteSpace:'nowrap',overflow:'hidden'}}><span style={{fontSize:loading?26:(stats.volume>=10000?20:26),fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)',letterSpacing:'-0.5px'}}>{loading?'—':stats.volume.toFixed(2)}</span><span style={{fontSize:13,fontWeight:600,color:'var(--tx3)'}}>USDC</span></div>
        </div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Site Control</div>
      <div className="ap-card" style={{marginBottom:32}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div className="ap-card-title">Maintenance Mode</div>
            <div style={{fontSize:13,color:'var(--tx2)',marginTop:4}}>{maintenanceMode?'Site is locked — only admin wallet can access SparkPay.':'Site is live and accessible to all users.'}</div>
          </div>
          <button onClick={async()=>{
            const newVal=!maintenanceMode;
            try{
              await fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode',{
                method:'PATCH',
                headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},
                body:JSON.stringify({value:String(newVal)})
              });
              setMaintenanceMode(newVal);
            }catch(e){alert('Failed to update maintenance mode: '+e.message);}
          }} style={{width:48,height:28,borderRadius:999,border:'none',background:maintenanceMode?'#ef4444':'var(--b1)',position:'relative',cursor:'pointer',flexShrink:0,transition:'background .2s'}}>
            <div style={{position:'absolute',top:3,left:maintenanceMode?23:3,width:22,height:22,borderRadius:999,background:'#fff',transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
          </button>
        </div>
        <div style={{marginTop:14,display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:999,background:maintenanceMode?'rgba(239,68,68,0.1)':'rgba(34,197,94,0.1)'}}>
          <div style={{width:6,height:6,borderRadius:999,background:maintenanceMode?'#ef4444':'#22c55e'}}/>
          <span style={{fontSize:11,fontWeight:700,color:maintenanceMode?'#ef4444':'#22c55e'}}>{maintenanceMode?'MAINTENANCE ACTIVE':'LIVE'}</span>
        </div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Payment Operations</div>
      <div className="ap-card" style={{marginBottom:16}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
          <div>
            <div className="ap-card-title">Cashback Payouts</div>
            <div style={{fontSize:12,color:'var(--tx3)',marginTop:4}}>{loading?'Loading...':stats.pendingClaims+' pending claim'+(stats.pendingClaims===1?'':'s')}</div>
          </div>
          {stats.pendingClaims>0&&<div style={{width:8,height:8,borderRadius:999,background:'#f59e0b',marginTop:6}}/>}
        </div>
        <button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={async()=>{
          const token=sessionStorage.getItem('sp_admin_jwt');
          if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}
          try{
            const r=await fetch('/api/payout',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}});
            const d=await r.json();
            alert(d.message+' Paid: '+d.paid);
          }catch(e){alert('Error: '+e.message);}
        }}>Process Pending Payouts</button>
      </div>

      <div className="ap-card" style={{marginBottom:32}}>
        <div className="ap-card-title" style={{marginBottom:4}}>Manual Execute</div>
        <div style={{fontSize:12,color:'var(--tx3)',marginBottom:14}}>Force-execute a scheduled payment if the cron/keeper bot fails.</div>
        <ManualExecute/>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Requests</div>
      <div className="ap-card" style={{marginBottom:32}}>
        <div className="ap-card-title" style={{marginBottom:14}}>Scheduled Payment Requests</div>
        <ScheduledRequests/>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Diagnostics</div><div className="ap-card" style={{marginBottom:32}}><div className="ap-card-title" style={{marginBottom:4}}>System Health</div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:14}}>Run a full check on all SparkPay systems.</div><Diagnostics/></div><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Monitoring</div>
      <div className="ap-card" style={{marginBottom:32}}>
        <div className="ap-card-title" style={{marginBottom:14}}>Failed Transactions</div>
        <FailedTxns/>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Resources</div>
      <div style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:16,overflow:'hidden'}}>
        <a href={'https://testnet.arcscan.app/address/'+ADMIN_ADDRESS} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',textDecoration:'none',borderBottom:'1px solid var(--b0)'}}>
          <div style={{width:30,height:30,borderRadius:8,background:'var(--elev)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx2)" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </div>
          <div style={{flex:1,fontSize:13,fontWeight:600,color:'var(--tx1)'}}>View Admin Wallet on Explorer</div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <div onClick={()=>{sessionStorage.removeItem('sp_admin_jwt');window.location.hash='';window.location.reload();}} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer'}}>
          <div style={{width:30,height:30,borderRadius:8,background:'rgba(239,68,68,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </div>
          <div style={{flex:1,fontSize:13,fontWeight:600,color:'#ef4444'}}>Sign Out</div>
        </div>
      </div>
    </div>
  </div>);
}
