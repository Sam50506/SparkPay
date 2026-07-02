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

/* ---------- Theme ---------- */
const darkT = {
  bg: '#070B12', card: '#0E1520', elev: '#182233',
  b0: 'rgba(148,163,184,0.08)', b1: 'rgba(148,163,184,0.16)',
  tx1: '#F1F5F9', tx2: '#A7B4C6', tx3: '#64748B',
  ac: '#3B82C4', acSoft: 'rgba(59,130,196,0.12)', acBorder: 'rgba(59,130,196,0.28)',
  ok: '#22C55E', err: '#EF4444',
  fd: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif", radius: 16,
};
const lightT = {
  bg: '#F8FAFC', card: '#FFFFFF', elev: '#F1F5F9',
  b0: 'rgba(0,0,0,0.07)', b1: 'rgba(0,0,0,0.13)',
  tx1: '#0F172A', tx2: '#334155', tx3: '#64748B',
  ac: '#2563EB', acSoft: 'rgba(37,99,235,0.08)', acBorder: 'rgba(37,99,235,0.22)',
  ok: '#16A34A', err: '#DC2626',
  fd: "'Inter','SF Pro Display',system-ui,-apple-system,sans-serif", radius: 16,
};
const ThemeCtx = React.createContext(darkT);
const useT = () => React.useContext(ThemeCtx);
const T = darkT; // fallback for module-level usage

const GlobalFX = () => (
  <style>{`
    @keyframes spPulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes spShimmer{0%{background-position:-180px 0}100%{background-position:180px 0}}
    @keyframes spFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .sp-nav{scrollbar-width:none;-ms-overflow-style:none}
    .sp-nav::-webkit-scrollbar{display:none}
    .sp-fade{animation:spFadeUp .28s ease both}
    .sp-hover-lift{transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
    .sp-hover-lift:hover{transform:translateY(-2px);border-color:${T.acBorder}!important;box-shadow:0 8px 24px rgba(0,0,0,.35)}
    .sp-row:hover{background:${T.elev}}
    @media(max-width:520px){
      .sp-stats{grid-template-columns:repeat(2,1fr)!important}
      .sp-stats>*:last-child{grid-column:1/-1}
      .sp-topbar{padding:0 14px!important}
      .sp-content{padding:18px 14px 90px!important}
    }
  `}</style>
);

/* ---------- Icons (unchanged) ---------- */
const IC = {
  Tx: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  Volume: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>,
  Claims: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  Shield: ()=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Logout: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Explorer: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Maintenance: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  Payout: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Execute: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Requests: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Monitor: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Diag: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Chevron: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Passkey: ()=><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M6 11v2a6 6 0 0 0 12 0v-2"/><path d="M12 17v4"/></svg>,
};

/* ---------- UI primitives ---------- */
const Section = ({icon, title, children, style={}}) => (
  <div style={{marginBottom:36,...style}}>
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
      <div style={{width:30,height:30,borderRadius:9,background:'var(--acd)',border:'1px solid var(--acs)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ac)',flexShrink:0}}>{icon}</div>
      <div style={{fontSize:13,fontWeight:800,color:'var(--tx1)',letterSpacing:'.02em',textTransform:'none'}}>{title}</div>
      
    </div>
    {children}
  </div>
);

const Card = ({title, subtitle, children, style={}}) => (
  <div style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:16,padding:'18px 18px',marginBottom:16,...style}}>
    {title && <div style={{fontSize:14,fontWeight:700,color:'var(--tx1)',letterSpacing:'-.2px',marginBottom:subtitle?4:children?14:0}}>{title}</div>}
    {subtitle && <div style={{fontSize:12,color:'var(--tx3)',marginBottom:14,lineHeight:1.5}}>{subtitle}</div>}
    {children}
  </div>
);

const PrimaryBtn = ({children, disabled, onClick, style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:`linear-gradient(180deg,#4A94D6,${T.ac})`,
    border:'1px solid rgba(255,255,255,0.12)',borderRadius:13,padding:'13px 20px',
    color:'#fff',fontSize:13.5,fontWeight:700,cursor:disabled?'default':'pointer',
    opacity:disabled?0.5:1,letterSpacing:'.01em',
    boxShadow:`0 4px 14px rgba(59,130,196,0.3), 0 1px 0 rgba(255,255,255,0.15) inset`,
    display:'inline-flex',alignItems:'center',justifyContent:'center',gap:10,
    transition:'filter .15s,transform .12s', ...style
  }}>{children}</button>
);

const Skeleton = ({w=60,h=26}) => (
  <div style={{height:h,width:w,borderRadius:6,background:'linear-gradient(90deg,var(--elev) 25%,var(--b1) 50%,var(--elev) 75%)',backgroundSize:'180px 100%',animation:'spShimmer 1.4s infinite linear'}}/>
);

const StatCard = ({label, value, icon, loading, accent=false}) => (
  <div className="sp-hover-lift" style={{background:'var(--card)',border:`1px solid ${accent?'var(--acs)':'var(--b0)'}`,borderRadius:18,padding:'18px',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,background:accent
      ?`radial-gradient(220px 120px at 85% -10%,rgba(59,130,196,0.18),transparent 70%)`
      :'linear-gradient(135deg,rgba(255,255,255,0.025) 0%,transparent 55%)',pointerEvents:'none'}}/>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
      <div style={{width:38,height:38,borderRadius:11,background:accent?'var(--acd)':'var(--elev)',border:`1px solid ${accent?'var(--acs)':'var(--b1)'}`,display:'flex',alignItems:'center',justifyContent:'center',color:accent?'var(--ac)':'var(--tx2)'}}>{icon}</div>
      {accent&&<div style={{width:8,height:8,borderRadius:'50%',background:'var(--ac)',boxShadow:'0 0 10px var(--ac)',animation:'spPulse 2s infinite'}}/>}
    </div>
    <div style={{fontSize:27,fontWeight:900,fontFamily:'var(--fd)',color:accent?'var(--ac)':'var(--tx1)',letterSpacing:'-1px',lineHeight:1,marginBottom:7,fontVariantNumeric:'tabular-nums'}}>
      {loading?<Skeleton/>:value}
    </div>
    <div style={{fontSize:10.5,color:'var(--tx3)',fontWeight:700,letterSpacing:'.08em',textTransform:'none'}}>{label}</div>
  </div>
);

/* ---------- Component ---------- */
export function AdminPanel({address,signer,maintenanceMode,setMaintenanceMode,dm,setDm}){
  const T = dm ? darkT : lightT;
  const isAdmin = address && address.toLowerCase()===ADMIN_ADDRESS;
  const [stats, setStats] = useState({txCount:0, volume:0, pendingClaims:0});
  const [loading, setLoading] = useState(true);
  const [pkLoading, setPkLoading] = useState(false);
  const [pkRegistered, setPkRegistered] = useState(null);
  const [pkAuthed, setPkAuthed] = useState(()=>!!sessionStorage.getItem('sp_admin_jwt'));
  const [webauthnSupported, setWebauthnSupported] = useState(true);
  const [pinSetup, setPinSetup] = useState(null);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMode, setPinMode] = useState('check');
  const [pkError, setPkError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

useEffect(()=>{
    fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode&select=value',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{if(d&&d[0])setMaintenanceMode(d[0].value==='true');}).catch(()=>{});
  },[]);

  useEffect(()=>{
    (async()=>{
      const supported=typeof window!=='undefined'&&!!window.PublicKeyCredential;
      let platformAvailable=false;
      if(supported){try{platformAvailable=await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();}catch{}}
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
    }catch(e){setPkError(e.message||'Registration failed');}
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
    }catch(e){setPkError(e.message||'Authentication failed');}
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
        const r2=await fetch(SB_URL+'/rest/v1/cashback_claims?status=eq.pending&select=id',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}});
        const d2=await r2.json();
        setStats(s=>({...s,pendingClaims:Array.isArray(d2)?d2.length:0}));
      }catch{}
      setLoading(false);
    })();
  },[isAdmin]);

const rootVars = {'--bg':T.bg,'--card':T.card,'--elev':T.elev,'--b0':T.b0,'--b1':T.b1,'--tx1':T.tx1,'--tx2':T.tx2,'--tx3':T.tx3,'--ac':T.ac,'--acd':T.acSoft,'--fd':T.fd};
  const signOut=()=>{sessionStorage.removeItem('sp_admin_jwt');window.location.hash='';window.location.reload();};

  /* ---------- Auth screens ---------- */
  const authScreen=(title,subtitle,content)=>(
    <div style={{...rootVars,minHeight:'100vh',background:`radial-gradient(700px 420px at 50% -8%,rgba(59,130,196,0.14),transparent 65%),${T.bg}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center',fontFamily:T.fd}}>
      <GlobalFX/>
      <div className="sp-fade" style={{width:'100%',maxWidth:380,background:T.card,border:`1px solid ${T.b0}`,borderRadius:24,padding:'40px 28px',boxShadow:'0 24px 60px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',display:'flex',flexDirection:'column',alignItems:'center'}}>
        <div style={{width:72,height:72,borderRadius:20,background:T.acSoft,border:`1px solid ${T.acBorder}`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:26,color:T.ac,}}>
          {title==='Admin Verification'?<IC.Passkey/>:<IC.Shield/>}
        </div>
        <div style={{fontFamily:T.fd,fontSize:23,fontWeight:900,color:T.tx1,marginBottom:8,letterSpacing:'-.4px'}}>{title}</div>
        <div style={{fontSize:13,color:T.tx3,marginBottom:28,maxWidth:300,lineHeight:1.7}}>{subtitle}</div>
        {pkError&&<div style={{fontSize:12,color:T.err,marginBottom:20,maxWidth:300,padding:'10px 14px',borderRadius:10,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)'}}>{pkError}</div>}
        {content}
      </div>
    </div>
  );

if(!address) return authScreen('Admin Access','Connect your wallet to continue.',null);
  if(!isAdmin) return authScreen('Access Denied','This area is restricted to administrators only.',null);

  if(pkRegistered===null&&webauthnSupported){
    return(<div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:T.fd}}>
      <GlobalFX/>
      <div style={{fontSize:13,color:T.tx3,animation:'spPulse 1.6s infinite'}}>Checking credentials...</div>
    </div>);
  }

  const pinInputStyle = {
    width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:13,
    border:`1px solid ${T.b1}`,background:T.elev,color:T.tx1,fontSize:16,
    textAlign:'center',letterSpacing:6,outline:'none',fontFamily:T.fd,
  };

if(!pkAuthed&&!webauthnSupported){
    return authScreen(
      pinMode==='setup'?'Set Up Admin PIN':'Admin Verification',
      pinMode==='setup'?'Create a secure PIN to protect the admin dashboard.':'Enter your PIN to access the admin dashboard.',
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,width:'100%',maxWidth:280}}>
        <input type="password" autoComplete={pinMode==='setup'?'new-password':'current-password'} inputMode="numeric" maxLength={12} value={pinValue} onChange={e=>setPinValue(e.target.value.replace(/\D/g,''))} placeholder="Enter PIN" style={pinInputStyle}/>
        {pinMode==='setup'&&<input type="password" autoComplete="new-password" inputMode="numeric" maxLength={12} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,''))} placeholder="Confirm PIN" style={pinInputStyle}/>}
        <PrimaryBtn onClick={pinMode==='setup'?setupPin:verifyPin} disabled={pkLoading||pinValue.length<6} style={{width:'100%'}}>
          {pkLoading?'Verifying...':(pinMode==='setup'?'Set PIN':'Unlock')}
        </PrimaryBtn>
      </div>
    );
  }

if(!pkAuthed&&webauthnSupported){
    return authScreen(
      'Admin Verification',
      pkRegistered?'Use your device biometrics or passkey to access the admin dashboard.':'Set up a passkey to secure this dashboard.',
      <PrimaryBtn onClick={pkRegistered?loginWithPasskey:registerPasskey} disabled={pkLoading}>
        <IC.Passkey/>
        {pkLoading?'Verifying...':(pkRegistered?'Verify with Passkey':'Set Up Passkey')}
      </PrimaryBtn>
    );
  }

  const navItems = [
    {id:'overview', label:'Overview', icon:IC.Tx},
    {id:'operations', label:'Operations', icon:IC.Payout},
    {id:'requests', label:'Requests', icon:IC.Requests},
    {id:'diagnostics', label:'Diagnostics', icon:IC.Diag},
    {id:'monitoring', label:'Monitoring', icon:IC.Monitor},
  ];

return(
    <div style={{...rootVars,minHeight:'100vh',background:`radial-gradient(900px 300px at 50% -6%,rgba(59,130,196,0.10),transparent 60%),${T.bg}`,fontFamily:T.fd}}>
      <GlobalFX/>

      {/* Top bar */}
      <div style={{borderBottom:'1px solid var(--b0)',background:'var(--card)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',position:'sticky',top:0,zIndex:10}}>
        <div className="sp-topbar" style={{maxWidth:860,margin:'0 auto',padding:'0 20px',display:'flex',alignItems:'center',justifyContent:'space-between',height:62}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <SparkPayLogo size={32}/>
            <div>
              <div style={{fontFamily:'var(--fd)',fontSize:15,fontWeight:900,color:'var(--tx1)',lineHeight:1.1,letterSpacing:'-.3px'}}>SparkPay</div>
              <div style={{fontSize:9,color:'var(--ac)',fontWeight:700,letterSpacing:'.14em',textTransform:'none'}}>admin</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:999,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.18)'}}>
              <div
              style={{width:6,height:6,borderRadius:999,background:T.ok,boxShadow:`0 0 8px ${T.ok}`,animation:'spPulse 2s infinite'}}/>
              <span style={{fontSize:10,fontWeight:700,color:T.ok,letterSpacing:'.06em'}}>VERIFIED</span>
            </div>
            <button onClick={()=>setDm&&setDm(d=>!d)} title={dm?"Switch to Light Mode":"Switch to Dark Mode"} style={{background:T.elev,border:`1px solid ${T.b1}`,borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:T.tx3,transition:'all .15s'}}>
              {dm
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              }
            </button>
            <button onClick={signOut} title="Sign Out" style={{background:T.elev,border:`1px solid ${T.b1}`,borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:T.tx3,transition:'all .15s'}}>
              <IC.Logout/>
            </button>
          </div>
        </div>

        {/* Nav */}
        <div className="sp-nav" style={{maxWidth:860,margin:'0 auto',display:'flex',gap:6,overflowX:'auto',WebkitOverflowScrolling:'touch',padding:'0 14px 12px'}}>
          {navItems.map(n=>{
            const active=activeSection===n.id;
            return(
              <button key={n.id} onClick={()=>setActiveSection(n.id)} style={{
                flexShrink:0,display:'flex',alignItems:'center',gap:8,padding:'8px 15px',
                borderRadius:999,cursor:'pointer',whiteSpace:'nowrap',
                fontSize:12,fontWeight:700,letterSpacing:'.02em',transition:'all .16s',
                background:active?T.acSoft:'transparent',
                border:`1px solid ${active?T.acBorder:'transparent'}`,
                color:active?T.ac:T.tx3,
              }}>
                <n.icon/>{n.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="sp-content" style={{maxWidth:860,margin:'0 auto',padding:'26px 20px 90px'}}>

        {/* Overview */}
        {activeSection==='overview'&&<div className="sp-fade">
          <div className="sp-stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:30}}>
            <StatCard label="Total Transactions" value={stats.txCount} icon={<IC.Tx/>} loading={loading}/>
            <StatCard label="Total Volume" value={`${stats.volume.toFixed(2)} USDC`} icon={<IC.Volume/>} loading={loading}/>
            <StatCard label="Pending Claims" value={stats.pendingClaims} icon={<IC.Claims/>} loading={loading} accent={stats.pendingClaims>0}/>
          </div>

          <Section icon={<IC.Maintenance/>} title="Site Control">
            <Card>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:T.tx1,marginBottom:4}}>Maintenance Mode</div>
                  <div style={{fontSize:12,color:T.tx3,lineHeight:1.5}}>{maintenanceMode?'Site locked - only admin wallet can access.':'Site is live and accessible to all users.'}</div>
                </div>
                <button onClick={async()=>{
                  const newVal=!maintenanceMode;
                  try{
                    await fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode',{method:'PATCH',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({value:String(newVal)})});
                    setMaintenanceMode(newVal);
                  }catch(e){alert('Failed: '+e.message);}
                }} style={{width:48,height:26,borderRadius:999,border:'none',background:maintenanceMode?T.err:T.b1,position:'relative',cursor:'pointer',flexShrink:0,transition:'background .2s'}}>
                  <div style={{position:'absolute',top:3,left:maintenanceMode?25:3,width:20,height:20,borderRadius:999,background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,0.35)'}}/>
                </button>
              </div>
              <div style={{marginTop:14,display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:maintenanceMode?'rgba(239,68,68,0.08)':'rgba(34,197,94,0.08)',border:`1px solid ${maintenanceMode?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)'}`}}>
                <div style={{width:5,height:5,borderRadius:999,background:maintenanceMode?T.err:T.ok}}/>
                <span style={{fontSize:10,fontWeight:700,color:maintenanceMode?T.err:T.ok,letterSpacing:'.06em'}}>{maintenanceMode?'MAINTENANCE ACTIVE':'LIVE'}</span>
              </div>
            </Card>
          </Section>

          <Section icon={<IC.Explorer/>} title="Resources">
            <div style={{background:T.card,border:`1px solid ${T.b0}`,borderRadius:T.radius,overflow:'hidden'}}>
              <a className="sp-row" href={'https://testnet.arcscan.app/address/'+ADMIN_ADDRESS} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',textDecoration:'none',borderBottom:'1px solid var(--b0)',transition:'background .14s'}}>
                <div style={{width:32,height:32,borderRadius:9,background:T.elev,border:`1px solid ${T.b1}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:T.tx2}}><IC.Explorer/></div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:T.tx1}}>View Admin Wallet on Explorer</div>
                <span style={{color:T.tx3,display:'flex'}}><IC.Chevron/></span>
              </a>
              <div className="sp-row" onClick={signOut} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer',transition:'background .14s'}}>
                <div style={{width:32,height:32,borderRadius:9,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:T.err}}><IC.Logout/></div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:T.err}}>Sign Out</div>
              </div>
            </div>
          </Section>
        </div>}

        {/* Operations */}
        {activeSection==='operations'&&<div className="sp-fade">
          <Section icon={<IC.Payout/>} title="Cashback Payouts">
            <Card title="Process Payouts" subtitle={loading?'Loading...':stats.pendingClaims+' pending claim'+(stats.pendingClaims===1?'':'s')}>
              <PrimaryBtn onClick={async()=>{
                const token=sessionStorage.getItem('sp_admin_jwt');
                if(!token){alert('Session expired.');window.location.reload();return;}
                try{const r=await fetch('/api/payout',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}});const d=await r.json();alert(d.message+' Paid: '+d.paid);}catch(e){alert('Error: '+e.message);}
              }}>Process Pending Payouts</PrimaryBtn>
            </Card>
          </Section>

          <Section icon={<IC.Execute/>} title="Manual Execute">
            <Card title="Force Execute Payment" subtitle="Manually trigger a scheduled payment if the keeper bot fails.">
              <ManualExecute/>
            </Card>
          </Section>
        </div>}

        {/* Requests */}
        {activeSection==='requests'&&<div className="sp-fade">
          <Section icon={<IC.Requests/>} title="Scheduled Payment Requests">
            <Card>
              <ScheduledRequests/>
            </Card>
          </Section>
        </div>}

        {/* Diagnostics */}
        {activeSection==='diagnostics'&&<div className="sp-fade">
          <Section icon={<IC.Diag/>} title="System Diagnostics">
            <Card title="Health Check" subtitle="Run a full diagnostic across all SparkPay systems.">
              <Diagnostics/>
            </Card>
          </Section>
        </div>}

        {/* Monitoring */}
        {activeSection==='monitoring'&&<div className="sp-fade">
          <Section icon={<IC.Monitor/>} title="Failed Transactions">
            <Card>
              <FailedTxns/>
            </Card>
          </Section>
        </div>}

      </div>
    </div>
  );
}