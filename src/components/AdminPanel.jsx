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

const Section = ({icon, title, children, style={}}) => (
  <div style={{marginBottom:32,...style}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
      <div style={{color:'var(--tx3)'}}>{icon}</div>
      <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase'}}>{title}</div>
    </div>
    {children}
  </div>
);

const Card = ({title, subtitle, children, style={}}) => (
  <div className="ap-card" style={{marginBottom:16,...style}}>
    {title && <div className="ap-card-title" style={{marginBottom:subtitle?4:children?14:0}}>{title}</div>}
    {subtitle && <div style={{fontSize:12,color:'var(--tx3)',marginBottom:14}}>{subtitle}</div>}
    {children}
  </div>
);

const StatCard = ({label, value, icon, loading, accent=false}) => (
  <div style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:16,padding:'18px 20px'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
      <div style={{fontSize:12,color:'var(--tx3)',fontWeight:600}}>{label}</div>
      <div style={{width:30,height:30,borderRadius:8,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ac)'}}>{icon}</div>
    </div>
    <div style={{display:'flex',alignItems:'baseline',gap:6}}>
      <div style={{fontSize:26,fontWeight:800,fontFamily:'var(--fd)',color:accent?'var(--ac)':'var(--tx1)',letterSpacing:'-0.5px',lineHeight:1}}>
        {loading ? <span style={{opacity:0.2}}>—</span> : value}
      </div>
    </div>
  </div>
);

export function AdminPanel({address,signer,maintenanceMode,setMaintenanceMode}){
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
        const r2=await fetch('/api/payout',{method:'GET'});
        const d2=await r2.json();
        setStats(s=>({...s,pendingClaims:d2.pending||0}));
      }catch{}
      setLoading(false);
    })();
  },[isAdmin]);

  const signOut=()=>{sessionStorage.removeItem('sp_admin_jwt');window.location.hash='';window.location.reload();};

  // Auth screens
const authScreen=(title,subtitle,content)=>(
    <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{width:72,height:72,borderRadius:20,background:'rgba(59,130,196,.1)',border:'1px solid rgba(59,130,196,.2)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:28,color:'var(--ac)'}}>
        {title==='Admin Verification'?<IC.Passkey/>:<IC.Shield/>}
      </div>
      <div style={{fontFamily:'var(--fd)',fontSize:24,fontWeight:900,color:'#fff',marginBottom:8}}>{title}</div>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.45)',marginBottom:32,maxWidth:320,lineHeight:1.7}}>{subtitle}</div>
      {pkError&&<div style={{fontSize:12,color:'#ef4444',marginBottom:20,maxWidth:300,padding:'10px 14px',borderRadius:10,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)'}}>{pkError}</div>}
      {content}
    </div>
  );

  if(!address) return authScreen('Admin Access','Connect your wallet to continue.',null);
  if(!isAdmin) return authScreen('Access Denied','This area is restricted to administrators only.',null);

  if(pkRegistered===null&&webauthnSupported){
    return(<div style={{minHeight:'100vh',background:'#000',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:13,color:'rgba(255,255,255,0.4)'}}>Checking credentials...</div>
    </div>);
  }

  if(!pkAuthed&&!webauthnSupported){
    return authScreen(
      pinMode==='setup'?'Set Up Admin PIN':'Admin Verification',
      pinMode==='setup'?'Create a secure PIN to protect the admin dashboard.':'Enter your PIN to access the admin dashboard.',
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,width:'100%',maxWidth:280}}>
        <div style={{position:'relative',width:'100%'}}>
          <input type="password" autoComplete={pinMode==='setup'?'new-password':'current-password'} inputMode="numeric" maxLength={12} value={pinValue} onChange={e=>setPinValue(e.target.value.replace(/\D/g,''))} placeholder="Enter PIN" style={{width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:16,textAlign:'center',letterSpacing:6,outline:'none'}}/>
        </div>
        {pinMode==='setup'&&<div style={{position:'relative',width:'100%'}}>
          <input type="password" autoComplete="new-password" inputMode="numeric" maxLength={12} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,''))} placeholder="Confirm PIN" style={{width:'100%',boxSizing:'border-box',padding:'14px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:16,textAlign:'center',letterSpacing:6,outline:'none'}}/>
        </div>}
        <button onClick={pinMode==='setup'?setupPin:verifyPin} disabled={pkLoading||pinValue.length<6} style={{width:'100%',background:'var(--ac)',border:'none',borderRadius:14,padding:'14px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',opacity:pkLoading||pinValue.length<6?0.5:1}}>
          {pkLoading?'Verifying...':(pinMode==='setup'?'Set PIN':'Unlock')}
        </button>
      </div>
    );
  }

  if(!pkAuthed&&webauthnSupported){
    return authScreen(
      'Admin Verification',
      pkRegistered?'Use your device biometrics or passkey to access the admin dashboard.':'Set up a passkey to secure this dashboard.',
      <button onClick={pkRegistered?loginWithPasskey:registerPasskey} disabled={pkLoading} style={{background:'var(--ac)',border:'none',borderRadius:14,padding:'14px 32px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:10,opacity:pkLoading?0.6:1}}>
        <IC.Passkey/>
        {pkLoading?'Verifying...':(pkRegistered?'Verify with Passkey':'Set Up Passkey')}
      </button>
    );
  }

  const navItems = [
    {id:'overview', label:'Overview'},
    {id:'operations', label:'Operations'},
    {id:'requests', label:'Requests'},
    {id:'diagnostics', label:'Diagnostics'},
    {id:'monitoring', label:'Monitoring'},
  ];

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      {/* Top bar */}
      <div style={{borderBottom:'1px solid var(--b0)',background:'var(--card)',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:860,margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:58}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <SparkPayLogo size={28}/>
            <div>
              <div style={{fontFamily:'var(--fd)',fontSize:14,fontWeight:800,color:'var(--tx1)',lineHeight:1.1}}>SparkPay</div>
              <div style={{fontSize:9,color:'var(--tx3)',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>Admin Console</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',borderRadius:999,background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.2)'}}>
              <div style={{width:5,height:5,borderRadius:999,background:'#22c55e'}}/>
              <span style={{fontSize:10,fontWeight:700,color:'#22c55e',letterSpacing:'.04em'}}>VERIFIED</span>
            </div>
            <button onClick={signOut} style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx3)'}}>
              <IC.Logout/>
            </button>
          </div>
        </div>
        {/* Nav */}
        <div style={{maxWidth:860,margin:'0 auto',padding:'0 24px',display:'flex',gap:2,borderTop:'1px solid var(--b0)'}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setActiveSection(n.id)} style={{padding:'10px 14px',background:'none',border:'none',fontSize:12,fontWeight:600,color:activeSection===n.id?'var(--ac)':'var(--tx3)',borderBottom:`2px solid ${activeSection===n.id?'var(--ac)':'transparent'}`,cursor:'pointer',transition:'all .14s'}}>
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:860,margin:'0 auto',padding:'32px 24px 60px'}}>

        {/* Overview */}
        {activeSection==='overview'&&<div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:32}}>
            <StatCard label="Total Transactions" value={stats.txCount} icon={<IC.Tx/>} loading={loading}/>
            <StatCard label="Total Volume" value={`${stats.volume.toFixed(2)} USDC`} icon={<IC.Volume/>} loading={loading}/>
            <StatCard label="Pending Claims" value={stats.pendingClaims} icon={<IC.Claims/>} loading={loading} accent={stats.pendingClaims>0}/>
          </div>

          <Section icon={<IC.Maintenance/>} title="Site Control">
            <Card>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:'var(--tx1)',marginBottom:4}}>Maintenance Mode</div>
                  <div style={{fontSize:12,color:'var(--tx3)'}}>{maintenanceMode?'Site locked — only admin wallet can access.':'Site is live and accessible to all users.'}</div>
                </div>
                <button onClick={async()=>{
                  const newVal=!maintenanceMode;
                  try{
                    await fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode',{method:'PATCH',headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},body:JSON.stringify({value:String(newVal)})});
                    setMaintenanceMode(newVal);
                  }catch(e){alert('Failed: '+e.message);}
                }} style={{width:48,height:26,borderRadius:999,border:'none',background:maintenanceMode?'#ef4444':'var(--b1)',position:'relative',cursor:'pointer',flexShrink:0,transition:'background .2s'}}>
                  <div style={{position:'absolute',top:3,left:maintenanceMode?25:3,width:20,height:20,borderRadius:999,background:'#fff',transition:'left .2s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}/>
                </button>
              </div>
              <div style={{marginTop:14,display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:maintenanceMode?'rgba(239,68,68,0.08)':'rgba(34,197,94,0.08)',border:`1px solid ${maintenanceMode?'rgba(239,68,68,0.2)':'rgba(34,197,94,0.2)'}`}}>
                <div style={{width:5,height:5,borderRadius:999,background:maintenanceMode?'#ef4444':'#22c55e'}}/>
                <span style={{fontSize:10,fontWeight:700,color:maintenanceMode?'#ef4444':'#22c55e',letterSpacing:'.06em'}}>{maintenanceMode?'MAINTENANCE ACTIVE':'LIVE'}</span>
              </div>
            </Card>
          </Section>

          <Section icon={<IC.Explorer/>} title="Resources">
            <div style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:16,overflow:'hidden'}}>
              <a href={'https://testnet.arcscan.app/address/'+ADMIN_ADDRESS} target="_blank" rel="noreferrer" style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',textDecoration:'none',borderBottom:'1px solid var(--b0)'}}>
                <div style={{width:32,height:32,borderRadius:8,background:'var(--elev)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--tx3)'}}><IC.Explorer/></div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:'var(--tx1)'}}>View Admin Wallet on Explorer</div>
                <IC.Chevron/>
              </a>
              <div onClick={signOut} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',cursor:'pointer'}}>
                <div style={{width:32,height:32,borderRadius:8,background:'rgba(239,68,68,0.08)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#ef4444'}}><IC.Logout/></div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:'#ef4444'}}>Sign Out</div>
              </div>
            </div>
          </Section>
        </div>}

        {/* Operations */}
    {activeSection==='operations'&&<div>
          <Section icon={<IC.Payout/>} title="Cashback Payouts">
            <Card title="Process Payouts" subtitle={loading?'Loading...':stats.pendingClaims+' pending claim'+(stats.pendingClaims===1?'':'s')}>
              <button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={async()=>{
                const token=sessionStorage.getItem('sp_admin_jwt');
                if(!token){alert('Session expired.');window.location.reload();return;}
                try{const r=await fetch('/api/payout',{method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}});const d=await r.json();alert(d.message+' Paid: '+d.paid);}catch(e){alert('Error: '+e.message);}
              }}>Process Pending Payouts</button>
            </Card>
          </Section>

          <Section icon={<IC.Execute/>} title="Manual Execute">
            <Card title="Force Execute Payment" subtitle="Manually trigger a scheduled payment if the keeper bot fails.">
              <ManualExecute/>
            </Card>
          </Section>
        </div>}

        {/* Requests */}
        {activeSection==='requests'&&<div>
          <Section icon={<IC.Requests/>} title="Scheduled Payment Requests">
            <Card>
              <ScheduledRequests/>
            </Card>
          </Section>
        </div>}

        {/* Diagnostics */}
        {activeSection==='diagnostics'&&<div>
          <Section icon={<IC.Diag/>} title="System Diagnostics">
            <Card title="Health Check" subtitle="Run a full diagnostic across all SparkPay systems.">
              <Diagnostics/>
            </Card>
          </Section>
        </div>}

        {/* Monitoring */}
        {activeSection==='monitoring'&&<div>
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
