import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#05070D;--surf:#0A0D16;--card:#10141F;--elev:#161C2C;--hov:#1C2338;
  --b0:#131929;--b1:#192030;--b2:#1F2840;--b3:#2A3550;
  --tx1:#EBF0FF;--tx2:#6E7E9A;--tx3:#323D55;
  --bl:#4B8CF5;--bl2:#7AACFF;--cy:#17E5B0;--re:#FF4F61;--ye:#F0C43F;
  --dbl:rgba(75,140,245,.11);--dcy:rgba(23,229,176,.09);
  --fd:'Syne',sans-serif;--fb:'DM Sans',sans-serif;
}
html,body{height:100%;background:var(--bg);color:var(--tx1);font-family:var(--fb);overflow-x:hidden}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes spinCW{to{transform:rotate(360deg)}}
@keyframes spinCCW{to{transform:rotate(-360deg)}}
@keyframes fillBar{from{width:0}to{width:100%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

.ap-splash{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;transition:opacity .55s ease,transform .55s ease}
.ap-splash.exit{opacity:0;transform:scale(1.04);pointer-events:none}
.ap-ring-outer{animation:spinCW 5s linear infinite;transform-origin:50% 50%}
.ap-ring-inner{animation:spinCCW 3.5s linear infinite;transform-origin:50% 50%}
.ap-splash-title{font-family:var(--fd);font-size:32px;font-weight:800;letter-spacing:-.5px;color:var(--tx1);margin-top:24px;animation:slideUp .5s .35s both}
.ap-splash-sub{font-size:13px;font-weight:500;color:var(--tx3);letter-spacing:.12em;text-transform:uppercase;margin-top:6px;animation:slideUp .5s .5s both}
.ap-splash-bar-wrap{width:160px;height:2px;background:var(--b1);border-radius:1px;overflow:hidden;margin-top:44px;animation:fadeIn .4s .65s both}
.ap-splash-bar{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--bl),var(--cy));animation:fillBar 2s .7s cubic-bezier(.4,0,.15,1) both}
.ap-splash-ver{position:absolute;bottom:28px;font-size:11px;color:var(--tx3);font-weight:500;animation:fadeIn .5s 1s both}

.ap-connect{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:var(--bg);background-image:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(75,140,245,.07) 0%,transparent 70%)}
.ap-connect-card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--b0);border-radius:20px;padding:40px 36px;text-align:center;animation:scaleIn .3s ease both}
.ap-connect-title{font-family:var(--fd);font-size:26px;font-weight:800;letter-spacing:-.3px;margin-top:20px}
.ap-connect-sub{font-size:14px;color:var(--tx2);margin-top:8px;line-height:1.6}
.ap-connect-btns{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.ap-connect-divider{display:flex;align-items:center;gap:12px;margin:4px 0;font-size:12px;color:var(--tx3)}
.ap-connect-divider::before,.ap-connect-divider::after{content:'';flex:1;height:1px;background:var(--b1)}
.ap-connect-footer{margin-top:24px;padding-top:20px;border-top:1px solid var(--b0);display:flex;flex-direction:column;gap:8px}
.ap-connect-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--tx3)}

.ap-app{display:flex;height:100vh;overflow:hidden;background:var(--bg)}
.ap-sidebar{width:252px;flex-shrink:0;background:var(--surf);border-right:1px solid var(--b0);display:flex;flex-direction:column;height:100vh;position:fixed;left:0;top:0;z-index:100;transition:transform .28s cubic-bezier(.4,0,.2,1)}
.ap-sidebar.mob-open{transform:translateX(0)!important;box-shadow:0 0 60px rgba(0,0,0,.6)}
.ap-content{flex:1;margin-left:252px;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.ap-topbar{height:60px;border-bottom:1px solid var(--b0);display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:var(--bg);flex-shrink:0}
.ap-page{flex:1;overflow-y:auto;padding:28px 28px 40px}
.ap-page-enter{animation:scaleIn .22s ease both;max-width:560px}

.ap-logo-area{padding:22px 16px 18px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:10px}
.ap-logo-name{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.3px;line-height:1}
.ap-logo-tag{font-size:10px;color:var(--tx3);font-weight:600;letter-spacing:.06em;margin-top:2px}
.ap-nav{flex:1;padding:12px 0;overflow-y:auto}
.ap-nav-section{font-size:10px;font-weight:700;color:var(--tx3);letter-spacing:.1em;padding:8px 20px 6px;text-transform:uppercase}
.ap-nav-item{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;cursor:pointer;font-size:13.5px;font-weight:500;color:var(--tx2);margin:1px 8px;border:1px solid transparent;transition:all .14s;user-select:none}
.ap-nav-item:hover{background:var(--elev);color:var(--tx1)}
.ap-nav-item.active{background:var(--dbl);color:var(--bl2);border-color:rgba(75,140,245,.18)}
.ap-sidebar-foot{padding:16px;border-top:1px solid var(--b0)}
.ap-net-badge{display:flex;align-items:center;gap:6px;background:rgba(23,229,176,.06);border:1px solid rgba(23,229,176,.16);border-radius:999px;padding:5px 11px;font-size:11px;font-weight:600;color:var(--cy);margin-bottom:12px}
.ap-net-dot{width:6px;height:6px;border-radius:50%;background:var(--cy);animation:pulse 2s ease infinite}
.ap-wallet-pill{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--card);border:1px solid var(--b1);border-radius:10px}
.ap-wallet-icon{width:28px;height:28px;border-radius:50%;background:var(--dbl);display:flex;align-items:center;justify-content:center;flex-shrink:0}

.ap-page-title{font-family:var(--fd);font-size:22px;font-weight:700;letter-spacing:-.2px}
.ap-page-sub{font-size:13px;color:var(--tx2);margin-top:4px;margin-bottom:22px;line-height:1.5}

.ap-field{margin-bottom:14px}
.ap-label{font-size:11px;font-weight:600;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;display:block}
.ap-input{background:var(--elev);border:1px solid var(--b1);border-radius:10px;padding:11px 14px;font-family:var(--fb);font-size:14px;color:var(--tx1);outline:none;transition:border .15s;width:100%}
.ap-input:focus{border-color:var(--bl)}
.ap-input::placeholder{color:var(--tx3)}
.ap-select{background:var(--elev);border:1px solid var(--b1);border-radius:10px;padding:11px 14px;font-family:var(--fb);font-size:14px;color:var(--tx1);outline:none;width:100%;cursor:pointer;appearance:none}

.ap-btn{border:none;cursor:pointer;font-family:var(--fb);transition:all .18s;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:600}
.ap-btn-primary{width:100%;padding:14px;border-radius:12px;background:linear-gradient(135deg,#4B8CF5,#3264D0);color:#fff;font-size:15px;box-shadow:0 4px 20px rgba(75,140,245,.28);letter-spacing:.01em;margin-top:6px}
.ap-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(75,140,245,.42)}
.ap-btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none}
.ap-btn-sec{padding:9px 18px;border-radius:9px;background:var(--elev);border:1px solid var(--b1);color:var(--tx1);font-size:13px}
.ap-btn-sec:hover{background:var(--hov);border-color:var(--b2)}
.ap-btn-ghost{padding:9px 18px;border-radius:9px;background:transparent;border:1px solid var(--b1);color:var(--tx2);font-size:13px}
.ap-btn-ghost:hover{border-color:var(--b2);color:var(--tx1)}
.ap-btn-danger{padding:7px 14px;border-radius:8px;background:rgba(255,79,97,.07);border:1px solid rgba(255,79,97,.18);color:var(--re);font-size:12px}
.ap-btn-danger:hover{background:rgba(255,79,97,.13)}
.ap-btn-icon{width:34px;height:34px;border-radius:9px;background:var(--elev);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .14s;color:var(--tx2);flex-shrink:0}
.ap-btn-icon:hover{background:var(--hov);color:var(--tx1)}
.ap-btn-full-outline{width:100%;padding:13px;border-radius:12px;background:var(--elev);border:1px solid var(--b2);color:var(--tx1);font-size:14px}
.ap-btn-full-outline:hover{background:var(--hov);border-color:var(--b3)}

.ap-status{padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:14px;font-weight:500;display:flex;align-items:flex-start;gap:9px;line-height:1.5}
.ap-status-success{background:rgba(23,229,176,.07);border:1px solid rgba(23,229,176,.18);color:var(--cy)}
.ap-status-error{background:rgba(255,79,97,.07);border:1px solid rgba(255,79,97,.18);color:var(--re)}
.ap-status-warning{background:rgba(240,196,63,.07);border:1px solid rgba(240,196,63,.18);color:var(--ye)}
.ap-status-info{background:var(--dbl);border:1px solid rgba(75,140,245,.2);color:var(--bl2)}

.ap-card{background:var(--card);border:1px solid var(--b0);border-radius:14px;padding:22px;margin-bottom:14px;transition:border-color .2s}
.ap-card:hover{border-color:var(--b1)}
.ap-div{height:1px;background:var(--b0);margin:16px 0}

.ap-code-box{background:var(--elev);border:1px solid var(--b2);border-radius:10px;padding:14px;font-family:'Courier New',monospace;font-size:12px;color:var(--bl2);word-break:break-all;margin-top:14px;line-height:1.6}
.ap-code-label{font-size:11px;font-weight:600;color:var(--tx3);letter-spacing:.07em;text-transform:uppercase;margin-bottom:8px}

.ap-invoice-detail{background:var(--elev);border:1px solid var(--b1);border-radius:12px;padding:16px;margin-bottom:14px}
.ap-invoice-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:14px;border-bottom:1px solid var(--b0)}
.ap-invoice-row:last-child{border-bottom:none}

.ap-hist-empty{text-align:center;padding:48px 24px;color:var(--tx3);font-size:14px}
.ap-hist-item{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--b0)}
.ap-hist-item:last-child{border-bottom:none}
.ap-hist-amount{font-family:var(--fd);font-weight:700;font-size:15px;color:var(--tx1)}
.ap-hist-meta{font-size:12px;color:var(--tx3);margin-top:3px}
.ap-hist-date{font-size:12px;color:var(--tx3);text-align:right}

.ap-table{width:100%;border-collapse:collapse;font-size:14px}
.ap-table th{background:var(--elev);text-align:left;padding:12px 16px;font-weight:600;color:var(--tx3);font-size:11px;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid var(--b0)}
.ap-table td{padding:14px 16px;border-bottom:1px solid var(--b0);color:var(--tx1)}
.ap-table tr:last-child td{border-bottom:none}
.ap-table tr:hover td{background:var(--elev)}
.ap-table tr.best-row td{color:var(--cy);font-weight:600}
.ap-table tr.best-row td:first-child::after{content:' (Best)';font-size:11px;opacity:.7}

.ap-compare-footer{margin-top:18px;text-align:center;font-size:14px;color:var(--cy);font-weight:600;padding:14px;background:var(--dcy);border:1px solid rgba(23,229,176,.15);border-radius:12px}

.ap-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600}
.ap-badge-green{background:rgba(23,229,176,.09);color:var(--cy)}
.ap-badge-blue{background:var(--dbl);color:var(--bl2)}

.ap-botnav{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-top:1px solid var(--b0);padding:8px 0 calc(8px + env(safe-area-inset-bottom));z-index:100}
.ap-bot-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px 4px;cursor:pointer;font-size:10px;font-weight:600;color:var(--tx3);transition:color .14s;font-family:var(--fb)}
.ap-bot-item.active{color:var(--bl)}
.ap-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;backdrop-filter:blur(4px)}
.ap-overlay.on{display:block}

@media(max-width:768px){
  .ap-sidebar{transform:translateX(-260px)}
  .ap-content{margin-left:0}
  .ap-page{padding:18px 16px 88px}
  .ap-botnav{display:flex}
  .mob-hide{display:none!important}
  .ap-topbar{padding:0 16px}
  .ap-page-enter{max-width:100%}
}
@media(min-width:769px){.mob-show{display:none!important}}
`;

/* ─── SVG Icons ─── */

const IC = {
  Send:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Invoice: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Pay:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  History: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Compare: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Wallet:  ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  Menu:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X:       ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Alert:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Copy:    ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  WC:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5c4-4 11-4 15 0"/><path d="M7.5 15.5c2.5-2.5 7-2.5 9 0"/><path d="M10.5 18.5c1-1 3-1 4 0"/></svg>,
};

/* ─── Arc Logo ───────────────────────────────────────────────────────────────
   REPLACE with your actual Arc logo:

   const ArcLogo = ({ size=36 }) => <img src="/arc-logo.png" width={size} height={size} style={{objectFit:'contain'}} />
─────────────────────────────────────────────────────────────────────────────*/
const ArcLogo = ({ size=36, animated=false }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
    {animated ? (
      <>
        <g className="ap-ring-outer"><circle cx="22" cy="22" r="18" stroke="#4B8CF5" strokeWidth="2.5" strokeDasharray="72 40" strokeLinecap="round"/></g>
        <g className="ap-ring-inner"><circle cx="22" cy="22" r="11" stroke="#17E5B0" strokeWidth="2.5" strokeDasharray="46 24" strokeLinecap="round"/></g>
        <circle cx="22" cy="22" r="3.5" fill="#4B8CF5"/>
        <circle cx="22" cy="22" r="1.5" fill="white"/>
      </>
    ) : (
      <>
        <circle cx="22" cy="22" r="18" stroke="#4B8CF5" strokeWidth="2.5" strokeDasharray="72 40" strokeLinecap="round"/>
        <circle cx="22" cy="22" r="11" stroke="#17E5B0" strokeWidth="2.5" strokeDasharray="46 24" strokeLinecap="round"/>
        <circle cx="22" cy="22" r="3.5" fill="#4B8CF5"/>
        <circle cx="22" cy="22" r="1.5" fill="white"/>
      </>
    )}
  </svg>
);

/* ─── Splash Screen ─── */
const SplashScreen = ({ onDone }) => {
  const [exit, setExit] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setExit(true), 2800);
    const t2 = setTimeout(() => onDone(), 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  return (
    <div className={`ap-splash${exit ? ' exit' : ''}`}>
      <div style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'center',width:96,height:96,animation:'fadeIn .4s ease both'}}>
        <ArcLogo size={96} animated />
      </div>
      <div className="ap-splash-title">ArcPay</div>
      <div className="ap-splash-sub">Decentralized Remittance Protocol</div>
      <div className="ap-splash-bar-wrap"><div className="ap-splash-bar"/></div>
      <div className="ap-splash-ver">Arc Testnet &nbsp;&middot;&nbsp; Chain 5042002</div>
    </div>
  );
};

// ─── Provider detection - works in Mises, MetaMask, Brave, all browsers ───────
function getProvider() {
  return new Promise((resolve) => {
    const tryResolve = () => {
      const { ethereum } = window;
      if (!ethereum) return null;

      // Multiple providers (e.g. MetaMask + another extension)
      if (ethereum.providers?.length > 0) {
        // Prefer MetaMask
        const mm = ethereum.providers.find(p => p.isMetaMask && !p.isBraveWallet);
        if (mm) return mm;
        return ethereum.providers[0];
      }

      // Mises browser: ethereum exists but may be wrapped by evmAsk
      // Access the raw provider via _metamask or directly
      if (ethereum.isMetaMask) return ethereum;
      if (ethereum._metamask) return ethereum;

      // Generic injected wallet (Mises without MetaMask, Opera, etc)
      return ethereum;
    };

    const result = tryResolve();
    if (result) return resolve(result);

    // Wait up to 3 seconds for wallet to inject
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      const r = tryResolve();
      if (r) { clearInterval(timer); return resolve(r); }
      if (attempts > 30) { clearInterval(timer); resolve(null); }
    }, 100);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ARC_CHAIN_ID     = 5042002;
const ARC_CHAIN_HEX    = '0x4CEF52';
const ARC_RPC          = process.env.REACT_APP_ARC_RPC          || '';
const REMIT_ADDR       = process.env.REACT_APP_REMIT_ADDR        || '0x91F07CE441cD7c39C4c43EB86A7ABd6F9cc48F44'; // v2 deployed 2026-05-25
const USDC_ADDR        = process.env.REACT_APP_USDC_ADDR         || '0x3600000000000000000000000000000000000000';
const WC_ID            = process.env.REACT_APP_WC_ID             || '';
const SB_URL           = process.env.REACT_APP_SUPABASE_URL      || '';
const SB_KEY           = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Supabase helpers
const sbFetch = async (path, opts={}) => {
  const r = await fetch(SB_URL + path, {
    ...opts,
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts.headers||{}) }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const sbInsert = (table, data) => sbFetch('/rest/v1/' + table, { method:'POST', body: JSON.stringify(data) });
const sbSelect = (table, query) => sbFetch('/rest/v1/' + table + '?' + query);
const sbUpdate = (table, query, data) => sbFetch('/rest/v1/' + table + '?' + query, { method:'PATCH', body: JSON.stringify(data) });

const COUNTRIES = ['Pakistan','Nigeria','India','Philippines','Bangladesh','Mexico','Brazil','Indonesia','Vietnam','Ghana','Kenya','Egypt','Turkey','Argentina','Colombia','Ukraine','Ethiopia','Tanzania','Uganda','Nepal'];
const FLAG = {Pakistan:'🇵🇰',Nigeria:'🇳🇬',India:'🇮🇳',Philippines:'🇵🇭',Bangladesh:'🇧🇩',Mexico:'🇲🇽',Brazil:'🇧🇷',Indonesia:'🇮🇩',Vietnam:'🇻🇳',Ghana:'🇬🇭',Kenya:'🇰🇪',Egypt:'🇪🇬',Turkey:'🇹🇷',Argentina:'🇦🇷',Colombia:'🇨🇴',Ukraine:'🇺🇦',Ethiopia:'🇪🇹',Tanzania:'🇹🇿',Uganda:'🇺🇬',Nepal:'🇳🇵'};
const CURRENCY = {Pakistan:'PKR',Nigeria:'NGN',India:'INR',Philippines:'PHP',Bangladesh:'BDT',Mexico:'MXN',Brazil:'BRL',Indonesia:'IDR',Vietnam:'VND',Ghana:'GHS',Kenya:'KES',Egypt:'EGP',Turkey:'TRY',Argentina:'ARS',Colombia:'COP',Ukraine:'UAH',Ethiopia:'ETB',Tanzania:'TZS',Uganda:'UGX',Nepal:'NPR'};

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const REMIT_ABI = [
  {inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}],name:'createInvoice',outputs:[{name:'',type:'bytes32'}],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}],name:'payInvoice',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}],name:'sendMoney',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getPayments',outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'},{name:'invoiceId',type:'bytes32'}],name:'',type:'tuple[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getUserInvoices',outputs:[{name:'',type:'bytes32[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'bytes32'}],name:'invoices',outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'createdAt',type:'uint256'},{name:'nonce',type:'uint256'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'address'}],name:'nonces',outputs:[{name:'',type:'uint256'}],stateMutability:'view',type:'function'}
];
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const short   = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '';
const fmtUsdc = v => v !== undefined && v !== null ? parseFloat(ethers.formatUnits(BigInt(v.toString()), 6)).toFixed(2) : '0.00';
const fmtDate = ts => ts ? new Date(Number(ts)*1000).toLocaleDateString('en',{month:'short',day:'numeric'}) : '';
const ls   = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const lsSave = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };

// ─── Arc-specific: poll for receipt instead of tx.wait() ─────────────────────
async function awaitReceipt(provider, hash, ms=45000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await provider.getTransactionReceipt(hash);
      if (r) return r;
    } catch(_) {}
    await new Promise(res => setTimeout(res, 1500));
  }
  return null; // timed out but tx still lives on-chain
}

// ─── Analytics helper ─────────────────────────────────────────────────────────
function buildChart(txns) {
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    return { label: d.toLocaleDateString('en',{weekday:'short'}), sent: 0 };
  });
  txns.forEach(tx => {
    const label = new Date(Number(tx.timestamp)*1000).toLocaleDateString('en',{weekday:'short'});
    const slot  = days.find(d => d.label === label);
    if (slot) {
      const n = typeof tx.amount === 'string' || typeof tx.amount === 'number'
        ? parseFloat(tx.amount) : parseFloat(fmtUsdc(tx.amount));
      slot.sent += isNaN(n) ? 0 : n;
    }
  });
  return days;
}

// ─── Wallet picker ────────────────────────────────────────────────────────────
function WalletPicker({ onPick, onClose, dm }) {
  const eth = window.ethereum;
  const options = [];
  if (eth) {
    const providers = eth.providers?.length ? eth.providers : [eth];
    providers.forEach((p,i) => {
      let label = '🌐 Browser Wallet', type = 'p_'+i;
      if (p.isMetaMask && !p.isBraveWallet) label = '🦊 MetaMask';
      else if (p.isBraveWallet)  label = '🦁 Brave Wallet';
      else if (p.isCoinbaseWallet) label = '🔵 Coinbase Wallet';
      else if (p.isRabby)  label = '👛 Rabby';
      else if (p.isTrust)  label = '💙 Trust Wallet';
      else label = '🌐 Browser Wallet (Mises/Other)';
      options.push({ type, label, p });
    });
  } else {
    // No ethereum found - show install message but still show WC
    options.push({ type:'install', label:'🦊 Install MetaMask' });
  }
  options.push({ type:'wc', label:'📱 WalletConnect' });
  const bg = dm ? '#1e293b' : '#fff';
  const br = dm ? '#334155' : '#e2e8f0';
  const tc = dm ? '#f1f5f9' : '#0f172a';
  return (
    <div style={{background:bg,border:`1px solid ${br}`,borderRadius:16,padding:20,display:'flex',flexDirection:'column',gap:10,boxShadow:'0 8px 40px rgba(0,0,0,0.15)'}}>
      <div style={{fontSize:15,fontWeight:700,color:tc,fontFamily:'"Bricolage Grotesque",sans-serif'}}>Choose your wallet</div>
      {options.map((o,i) => (
        <button key={i} onClick={() => onPick(o.type, o.p)}
          style={{display:'flex',alignItems:'center',gap:12,background:dm?'#0f172a':'#f8faff',border:`1px solid ${br}`,borderRadius:12,padding:'13px 16px',cursor:'pointer',fontSize:14,fontWeight:600,color:tc,width:'100%',textAlign:'left'}}>
          {o.label}
        </button>
      ))}
      <button onClick={onClose} style={{fontSize:13,color:'#94a3b8',background:'none',border:'none',cursor:'pointer',marginTop:4}}>← Back</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // wallet
  const [provider,  setProvider]  = useState(null);
  const [signer,    setSigner]    = useState(null);
  const [address,   setAddress]   = useState('');
  const [balance,   setBalance]   = useState('0.00');
  const [walletName,setWalletName]= useState('');
  const [wcProv,    setWcProv]    = useState(null);
  const wcProvRef = useRef(null);
  const [showPicker,setShowPicker]= useState(false);
  const [splash,    setSplash]    = useState(true);
  // ui
  const [tab,    setTab]    = useState('send');
  const [status, setStatus] = useState(null);  // {type,msg}
  const [loading,setLoading]= useState(false);
  const [dm,     setDm]     = useState(() => ls('arc_dm',false));
  // rates
  const [rates,  setRates]  = useState({});
  // send
  const [sendTo,  setSendTo]  = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [sendCtry,setSendCtry]= useState(() => ls('arc_ctry',''));
  // multi-send
  const [multi, setMulti] = useState([{addr:'',amount:'',country:'Pakistan'}]);
  // invoice
  const [invPayer,setInvPayer] = useState('');
  const [invAmt,  setInvAmt]   = useState('');
  const [invDesc, setInvDesc]  = useState('');
  const [invCtry, setInvCtry]  = useState('Pakistan');
  const [invId,   setInvId]    = useState('');
  // pay
  const [payId,  setPayId]  = useState('');
  const [payDet, setPayDet] = useState(null);
  // history (localStorage + contract)
  const [txns,   setTxns]   = useState(() => {
    const saved = ls('arc_txhistory',[]);
    // Add demo data if empty (for presentation)
    if (saved.length === 0) {
      return [
        {hash:'0xdemo1',recipient:'0xda526902d606493403a0e7048790280cfbb8ee56',amount:50,country:'Pakistan',timestamp:Math.floor(Date.now()/1000)-86400,status:'confirmed'},
        {hash:'0xdemo2',recipient:'0x742d35Cc6634C0532925a3b8D4C9C6A21B2D4C1',amount:25,country:'India',timestamp:Math.floor(Date.now()/1000)-172800,status:'confirmed'},
        {hash:'0xdemo3',recipient:'0x8ba1f109551bD432803012645Ac136ddd64DBA72',amount:100,country:'Nigeria',timestamp:Math.floor(Date.now()/1000)-259200,status:'confirmed'},
      ];
    }
    return saved;
  });
  const [contractTxns, setContractTxns] = useState([]);
  // contacts
  const [contacts, setContacts] = useState(() => ls('arc_contacts',[]));
  const [cName,setCName] = useState(''); const [cAddr,setCAddr] = useState(''); const [cCtry,setCCtry] = useState('Pakistan');
  // scheduled
  const [scheds,  setScheds]  = useState(() => ls('arc_scheds',[]));
  const [newSched,setNewSched]= useState({addr:'',amount:'',country:'Pakistan',freq:'weekly',next:''});
  // settings
  const [defCtry, setDefCtry] = useState(() => ls('arc_ctry',''));

  // persist
  useEffect(() => lsSave('arc_contacts', contacts),  [contacts]);
  useEffect(() => lsSave('arc_scheds',   scheds),    [scheds]);
  useEffect(() => lsSave('arc_txhistory',txns),      [txns]);
  useEffect(() => lsSave('arc_dm',       dm),        [dm]);
  useEffect(() => lsSave('arc_ctry',     defCtry),   [defCtry]);

  // Handle incoming invoice link (?inv=base64data)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invParam = params.get('inv');
    if (invParam) {
      try {
        const inv = JSON.parse(atob(invParam));
        // Save to localStorage so payer can pay it
        const saved = ls('arc_invoices',[]);
        if (!saved.find(i=>i.id===inv.id)) {
          lsSave('arc_invoices',[inv,...saved]);
        }
        setPayId(inv.id);
        setTab('pay');
        setStatus({type:'info',msg:`Invoice from ${short(inv.creator)}: ${inv.amount} USDC for "${inv.desc}"`});
      } catch {}
    }
  }, []);

  // rates
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r=>r.json()).then(d=>setRates(d.rates||{}))
      .catch(()=>setRates({PKR:279,NGN:1371,INR:96.7,PHP:61.8,BDT:122.8,MXN:17.4,BRL:5.03,IDR:17713,VND:26222,GHS:11.5,KES:129,EGP:53.1,TRY:45.6,ARS:1399,COP:3795,UAH:44.2,ETB:155.9,TZS:2572,UGX:3734,NPR:154.6}));
  },[]);

  const doDisconnect = useCallback(() => {
    if (wcProvRef.current) { wcProvRef.current.disconnect(); wcProvRef.current = null; }
    setProvider(null); setSigner(null); setAddress(''); setWalletName(''); setWcProv(null);
    setStatus(null); setBalance('0.00');
  }, []);

  const refreshBal = useCallback(async () => {
    if (!provider || !address) return;
    try {
      // Use native balance (Arc USDC = native token, 18 decimals)
      const b = await provider.getBalance(address);
      setBalance(parseFloat(ethers.formatUnits(b,18)).toFixed(2));
    } catch {
      try {
        const c = new ethers.Contract(USDC_ADDR,ERC20_ABI,provider);
        const b = await c.balanceOf(address);
        setBalance(fmtUsdc(b));
      } catch {}
    }
  }, [provider, address]);

  // ── HISTORY ────────────────────────────────────────────────────────────────
  const loadContractHistory = useCallback(async () => {
    try {
      const {remit} = getC();
      const p = await remit.getPayments(address);
      setContractTxns([...p].reverse());
    } catch {}
  }, [signer, address]); // eslint-disable-line react-hooks/exhaustive-deps

  // account listener
  useEffect(() => {
    if (!window.ethereum) return;
    const onAcc = a => { if (!a.length) doDisconnect(); else setAddress(a[0]); };
    const onChain = () => window.location.reload();
    window.ethereum.on('accountsChanged', onAcc);
    window.ethereum.on('chainChanged', onChain);
    return () => { window.ethereum.removeListener('accountsChanged',onAcc); window.ethereum.removeListener('chainChanged',onChain); };
  }, [doDisconnect]);

  // load contract history when tab opens
  useEffect(() => {
    if (tab === 'history' && signer) loadContractHistory();
  }, [tab, signer, loadContractHistory]);

  useEffect(() => { if (signer && address) refreshBal(); }, [signer, address, refreshBal]);

  // ── wallet helpers ──────────────────────────────────────────────────────────
  const addArc = params => ({
    chainId: ARC_CHAIN_HEX, chainName: 'Arc Testnet',
    nativeCurrency: {name:'USDC',symbol:'USDC',decimals:18},
    rpcUrls: [ARC_RPC], blockExplorerUrls: ['https://testnet.arcscan.app'],
    ...params
  });

  const ensureArc = async (eth) => {
    try { await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]}); }
    catch(e) { if(e.code===4902) await eth.request({method:'wallet_addEthereumChain',params:[addArc({})]}); else throw e; }
  };

  const finaliseConnect = async (bp, eth) => {
    bp.pollingInterval = 800;
    const s    = await bp.getSigner();
    const addr = await s.getAddress();
    setProvider(bp); setSigner(s); setAddress(addr);
    setStatus({type:'success',msg:`Connected: ${short(addr)}`});
  };

  const connectBrowser = async (type, provObj) => {
    try {
      // Use passed provider or detect automatically
      // getProvider() handles Mises browser conflict by waiting for MetaMask
      const eth = provObj || await getProvider();
      if (!eth) { setStatus({type:'error',msg:'No wallet found. Install MetaMask.'}); return; }
      await eth.request({method:'eth_requestAccounts'});
      const bp = new ethers.BrowserProvider(eth, {name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      await ensureArc(eth);
      let name = '🌐 Browser Wallet';
      if (eth.isMetaMask && !eth.isBraveWallet) name = '🦊 MetaMask';
      else if (eth.isBraveWallet) name = '🦁 Brave';
      else if (eth.isCoinbaseWallet) name = '🔵 Coinbase';
      setWalletName(name);
      await finaliseConnect(bp, eth);
    } catch(e) { setStatus({type:'error',msg:e.message||'Connection failed'}); }
  };

  const connectWC = async () => {
    try {
      const wcp = await EthereumProvider.init({
        projectId:WC_ID, chains:[ARC_CHAIN_ID], showQrModal:true,
        methods:['eth_sendTransaction','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'],
        events:['chainChanged','accountsChanged'],
      });
      await wcp.enable();
      wcp.on('accountsChanged', a => { if(!a.length) doDisconnect(); else setAddress(a[0]); });
      wcp.on('disconnect', doDisconnect);
      try { await wcp.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]}); }
      catch(e){ if(e.code===4902) await wcp.request({method:'wallet_addEthereumChain',params:[addArc({})]}); }
      const bp = new ethers.BrowserProvider(wcp, {name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      setWcProv(wcp); wcProvRef.current = wcp; setWalletName('📱 WalletConnect');
      await finaliseConnect(bp, wcp);
    } catch(e) { setStatus({type:'error',msg:e.message||'WalletConnect failed'}); }
  };



  const getC = () => ({
    remit: new ethers.Contract(REMIT_ADDR, REMIT_ABI, signer),
    usdc:  new ethers.Contract(USDC_ADDR,  ERC20_ABI, signer),
  });

  // ── SEND ──────────────────────────────────────────────────────────────────
  // Arc USDC is the NATIVE token. Transfer it like ETH: signer.sendTransaction({value})
  // Using 18 decimals (native precision). This is the ONLY reliable way from browser wallets.
  const handleSend = async () => {
    if (!signer||!sendTo||!sendAmt) { setStatus({type:'error',msg:'Fill all fields'}); return; }
    if (!ethers.isAddress(sendTo))  { setStatus({type:'error',msg:'Invalid address'}); return; }
    const sendToNorm = ethers.getAddress(sendTo.trim());
    const amt = parseFloat(sendAmt);
    if (isNaN(amt)||amt<=0)         { setStatus({type:'error',msg:'Invalid amount'}); return; }
    setLoading(true); setStatus({type:'info',msg:'Sending USDC…'});
    try {
      const value = ethers.parseUnits(sendAmt, 18); // native = 18 dec
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? ethers.parseUnits('50','gwei');
      const tx = await signer.sendTransaction({ to: sendToNorm, value, gasLimit: 21000, gasPrice });
      // Save to history immediately — don't wait for receipt
      const rec = { hash:tx.hash, recipient:sendToNorm, amount:amt, country:sendCtry, timestamp:Math.floor(Date.now()/1000), status:'pending' };
      setTxns(prev => { const u=[rec,...prev.slice(0,499)]; lsSave('arc_txhistory',u); return u; });
      setStatus({type:'success',msg:`✓ Sent ${sendAmt} USDC → ${short(sendTo)}`});
      setSendTo(''); setSendAmt('');
      // Poll for receipt and update status
      awaitReceipt(provider, tx.hash).then(receipt => {
        const confirmed = receipt && receipt.status === 1 ? 'confirmed' : 'failed';
        setTxns(prev => {
          const u = prev.map(t => t.hash === tx.hash ? {...t, status: confirmed} : t);
          lsSave('arc_txhistory', u); return u;
        });
      });
      setTimeout(refreshBal, 6000);
    } catch(e) { setStatus({type:'error',msg:e.reason||e.message||'Failed'}); }
    finally { setLoading(false); }
  };

  // ── MULTI-SEND ─────────────────────────────────────────────────────────────
  const handleMulti = async () => {
    const valid = multi.filter(r => ethers.isAddress(r.addr) && parseFloat(r.amount)>0);
    if (!signer||!valid.length) { setStatus({type:'error',msg:'Add valid recipients'}); return; }
    setLoading(true);
    try {
      for (const r of valid) {
        setStatus({type:'info',msg:`Sending to ${short(r.addr)}…`});
        const value = ethers.parseUnits(r.amount, 18);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice ?? ethers.parseUnits('50','gwei');
        const tx = await signer.sendTransaction({ to: r.addr, value, gasLimit: 21000, gasPrice });
        const rec = { hash:tx.hash, recipient:r.addr, amount:parseFloat(r.amount), country:r.country, timestamp:Math.floor(Date.now()/1000), status:'pending' };
        setTxns(prev => { const u=[rec,...prev.slice(0,499)]; lsSave('arc_txhistory',u); return u; });
        awaitReceipt(provider, tx.hash).then(receipt => {
          const confirmed = receipt && receipt.status === 1 ? 'confirmed' : 'failed';
          setTxns(prev => {
            const u = prev.map(t => t.hash === tx.hash ? {...t, status: confirmed} : t);
            lsSave('arc_txhistory', u); return u;
          });
        });
      }
      setStatus({type:'success',msg:`✓ Sent to ${valid.length} recipients`});
      setMulti([{addr:'',amount:'',country:'Pakistan'}]);
      setTimeout(refreshBal, 6000);
    } catch(e) { setStatus({type:'error',msg:e.reason||e.message||'Failed'}); }
    finally { setLoading(false); }
  };

  // ── INVOICE ────────────────────────────────────────────────────────────────
  const handleCreateInv = async () => {
    if (!address||!invPayer||!invAmt||!invDesc) { setStatus({type:'error',msg:'Fill all fields and connect wallet'}); return; }
    setLoading(true); setStatus({type:'info',msg:'Creating invoice…'});
    try {
      const id = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2,'0')).join('');
      const invoice = {
        id,
        creator: address,
        payer: invPayer.trim(),
        amount: invAmt,
        description: invDesc,
        country: invCtry,
        paid: false
      };
      // Save to Supabase — works across all devices
      await sbInsert('invoices', invoice);
      // Also save locally as cache
      const saved = ls('arc_invoices',[]);
      lsSave('arc_invoices',[{...invoice,desc:invDesc,ts:Math.floor(Date.now()/1000)},...saved.slice(0,99)]);
      setInvId(id);
      setStatus({type:'success',msg:'✓ Invoice created! Share this ID with your client — they can pay from any device.'});
      setInvPayer(''); setInvAmt(''); setInvDesc('');
    } catch(e) {
      setStatus({type:'error',msg:'Failed to create invoice: ' + e.message});
    }
    finally { setLoading(false); }
  };

  // ── PAY INVOICE ────────────────────────────────────────────────────────────
  const handlePayInv = async () => {
    if (!signer||!payId) { setStatus({type:'error',msg:'Enter invoice ID'}); return; }
    const id = payId.trim();
    setLoading(true); setStatus({type:'info',msg:'Looking up invoice…'});
    try {
      // Fetch invoice from Supabase
      const rows = await sbSelect('invoices', `id=eq.${id}&select=*`);
      if (!rows || rows.length === 0) { setStatus({type:'error',msg:'Invoice not found.'}); setLoading(false); return; }
      const inv = rows[0];
      if (inv.paid) { setStatus({type:'error',msg:'This invoice has already been paid.'}); setLoading(false); return; }
      setPayDet({creator:inv.creator, amount:ethers.parseUnits(inv.amount,18), description:inv.description, country:inv.country});
      setStatus({type:'info',msg:`Invoice found: ${inv.amount} USDC for "${inv.description}". Sending payment…`});
      // Pay via direct native USDC transfer
      const value = ethers.parseUnits(inv.amount, 18);
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice ?? ethers.parseUnits('50','gwei');
      const tx = await signer.sendTransaction({
        to: inv.creator,
        value,
        gasLimit: 21000,
        gasPrice
      });
      // Mark as paid in Supabase
      await sbUpdate('invoices', `id=eq.${id}`, { paid: true, paid_by: address, paid_tx: tx.hash });
      // Save to tx history
      const rec = {hash:tx.hash, recipient:inv.creator, amount:inv.amount, country:inv.country, timestamp:Math.floor(Date.now()/1000), status:'submitted'};
      setTxns(prev => { const u=[rec,...prev.slice(0,499)]; lsSave('arc_txhistory',u); return u; });
      awaitReceipt(provider, tx.hash).then(receipt => {
        const confirmed = receipt && receipt.status === 1 ? 'confirmed' : 'failed';
        setTxns(prev => {
          const u = prev.map(t => t.hash === tx.hash ? {...t, status: confirmed} : t);
          lsSave('arc_txhistory', u); return u;
        });
      });
      setStatus({type:'success',msg:`✓ Paid ${inv.amount} USDC! TX: ${tx.hash.slice(0,10)}…`});
      setPayId(''); setPayDet(null);
      setTimeout(refreshBal, 5000);
    } catch(e) { setStatus({type:'error',msg:e.reason||e.message||'Failed'}); }
    finally { setLoading(false); }
  };


  // merge local + contract history, dedup by hash
  const allTxns = [
    ...txns,
    ...contractTxns.filter(c => !txns.find(l => l.hash === c.transactionHash))
  ];
  const chartData = buildChart(allTxns);
  const totalSent = txns.reduce((s,t) => s+(parseFloat(t.amount)||0), 0);


  const [mobOpen, setMobOpen] = useState(false);

  // ── Dark-theme style object ──────────────────────────────────────────────────
  const D='#161C2C', B='#192030', T='#EBF0FF', T2='#6E7E9A', BDR='#131929';
  const S = {
    lbl:   {display:'block',fontSize:11,fontWeight:700,color:'#323D55',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:7},
    inp:   {width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${B}`,fontSize:14,color:T,background:D,boxSizing:'border-box',marginBottom:14,fontFamily:'DM Sans,sans-serif',outline:'none'},
    sel:   {width:'100%',padding:'11px 14px',borderRadius:10,border:`1px solid ${B}`,fontSize:14,color:T,background:D,boxSizing:'border-box',marginBottom:14,fontFamily:'DM Sans,sans-serif'},
    btnP:  {width:'100%',padding:'14px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#4B8CF5,#3264D0)',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4},
    btnS:  {padding:'9px 16px',borderRadius:9,border:`1px solid ${B}`,background:D,color:T,fontSize:13,fontWeight:600,cursor:'pointer'},
    btnD:  {padding:'7px 12px',borderRadius:8,border:'1px solid rgba(255,79,97,.2)',background:'rgba(255,79,97,.07)',color:'#FF4F61',fontSize:12,fontWeight:600,cursor:'pointer'},
    btnG:  {width:'100%',padding:'10px',borderRadius:9,border:`1px dashed ${B}`,background:'transparent',color:T2,fontSize:13,cursor:'pointer',marginTop:4},
    cTitle:{fontSize:17,fontWeight:700,fontFamily:'Syne,sans-serif',color:T,marginBottom:4},
    cSub:  {fontSize:13,color:T2,marginBottom:18},
    card:  {background:'#10141F',border:`1px solid ${BDR}`,borderRadius:14,padding:22,marginBottom:14},
    convB: {background:'rgba(75,140,245,.08)',border:'1px solid rgba(75,140,245,.2)',borderRadius:12,padding:'14px 16px',marginBottom:14},
    invB:  {background:D,border:'1px solid #1F2840',borderRadius:10,padding:14,fontFamily:'Courier New',fontSize:12,color:'#7AACFF',wordBreak:'break-all',marginTop:12,lineHeight:1.6},
    table: {width:'100%',borderCollapse:'collapse',fontSize:14},
    th:    {background:D,padding:'12px 16px',textAlign:'left',fontWeight:600,fontSize:11,color:'#323D55',letterSpacing:'.07em',textTransform:'uppercase',borderBottom:`1px solid ${BDR}`},
    td:    {padding:'14px 16px',borderBottom:`1px solid ${BDR}`,color:T},
    hRow:  {display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:`1px solid ${BDR}`},
    hIcon: {width:36,height:36,borderRadius:10,background:'rgba(75,140,245,.11)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#4B8CF5',flexShrink:0,fontWeight:700},
    tog:   {width:40,height:22,borderRadius:999,background:dm?'#4B8CF5':'#192030',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0,border:'none'},
    togKnob:{position:'absolute',top:3,left:dm?21:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'},
  };

  const TABS = [
    {id:'send',     label:'Send',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>},
    {id:'multi',    label:'Multi-Send',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg>},
    {id:'invoice',  label:'Invoice',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>},
    {id:'pay',      label:'Pay',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>},
    {id:'contacts', label:'Contacts',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
    {id:'schedule', label:'Scheduled',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>},
    {id:'history',  label:'History',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>},
    {id:'rates',    label:'Rates',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>},
    {id:'fees',     label:'Compare',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
    {id:'settings', label:'Settings',
      ICN:()=><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>},
  ];

  const PAGE_TITLES = {send:'Send USDC',multi:'Multi-Send',invoice:'Invoice',pay:'Pay Invoice',contacts:'Contacts',schedule:'Scheduled',history:'History',rates:'Exchange Rates',fees:'Fee Comparison',settings:'Settings'};

  const converted = () => {
    if (!sendAmt||!sendCtry) return null;
    const r = rates[CURRENCY[sendCtry]];
    if (!r) return null;
    return (parseFloat(sendAmt)*r).toLocaleString('en',{maximumFractionDigits:0});
  };

  const toastCls = s => {
    if (!s) return null;
    const m={success:'ap-status ap-status-success',error:'ap-status ap-status-error',warning:'ap-status ap-status-warning',info:'ap-status ap-status-info'};
    return m[s.type]||m.info;
  };

  const connectBrowserWallet = () => connectBrowser();
  const connectMobileWallet = connectWC;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      {splash && <SplashScreen onDone={()=>setSplash(false)}/>}

      {/* Connect screen */}
      {!splash && !address && (
        <div className="ap-connect">
          <div className="ap-connect-card">
            <ArcLogo size={56}/>
            <div className="ap-connect-title">ArcPay</div>
            <div className="ap-connect-sub">Cross-border USDC remittance on Arc Testnet. Near-zero fees, instant settlement.</div>
            <div className="ap-connect-btns">
              {showPicker ? (
                <WalletPicker onPick={(type,p)=>{setShowPicker(false);connectBrowser(type,p);}} onClose={()=>setShowPicker(false)} dm={true}/>
              ) : (
                <>
                  <button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowPicker(true)}>Connect Wallet</button>
                  <div className="ap-connect-divider">or</div>
                  <button className="ap-btn ap-btn-full-outline" onClick={connectMobileWallet}>Connect via WalletConnect</button>
                </>
              )}
            </div>
            {status&&<div style={{marginTop:16,padding:'10px 14px',borderRadius:8,background:'rgba(75,140,245,0.1)',border:'1px solid rgba(75,140,245,0.2)',fontSize:13,color:'#7AACFF'}}>{status.msg}</div>}
            <div className="ap-connect-footer">
              <div className="ap-connect-row"><span>Network</span><span style={{color:'var(--cy)',fontWeight:600}}>Arc Testnet</span></div>
              <div className="ap-connect-row"><span>Chain ID</span><span style={{fontFamily:'monospace',color:'var(--tx2)'}}>5042002</span></div>
              <div className="ap-connect-row"><span>Contract</span><span style={{fontFamily:'monospace',color:'var(--tx2)'}}>{REMIT_ADDR.slice(0,10)}...</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Main app */}
      {!splash && address && (
        <div className="ap-app">
          {mobOpen&&<div className="ap-overlay on" onClick={()=>setMobOpen(false)}/>}

          {/* Sidebar */}
          <aside className={`ap-sidebar${mobOpen?' mob-open':''}`}>
            <div className="ap-logo-area">
              <ArcLogo size={34}/>
              <div><div className="ap-logo-name">ArcPay</div><div className="ap-logo-tag">REMITTANCE</div></div>
            </div>
            <nav className="ap-nav">
              <div className="ap-nav-section">Navigation</div>
              {TABS.map(({id,label,ICN})=>(
                <div key={id} className={`ap-nav-item${tab===id?' active':''}`} onClick={()=>{setTab(id);setMobOpen(false);}}>
                  <ICN/>{label}
                </div>
              ))}
            </nav>
            <div className="ap-sidebar-foot">
              <div className="ap-net-badge"><span className="ap-net-dot"/>Arc Testnet<span style={{color:'var(--tx3)',fontWeight:500,marginLeft:2}}>#5042002</span></div>
              <div className="ap-wallet-pill">
                <div className="ap-wallet-icon"><IC.Wallet/></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,letterSpacing:'.06em'}}>{walletName.replace(/[^\w\s]/g,'').trim().toUpperCase()||'WALLET'}</div>
                  <div style={{fontSize:12,fontWeight:600,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{short(address)}</div>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:'var(--bl2)',fontFamily:'var(--fd)'}}>${balance}</div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="ap-content">
            <header className="ap-topbar">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <button className="ap-btn-icon mob-show" onClick={()=>setMobOpen(true)} style={{border:'none',background:'var(--elev)'}}><IC.Menu/></button>
                <div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:17,letterSpacing:'-.2px'}}>{PAGE_TITLES[tab]}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:14,color:'var(--bl2)',background:'var(--dbl)',padding:'6px 12px',borderRadius:8}}>${balance}</div>
                <div className="ap-badge ap-badge-blue mob-hide" style={{padding:'6px 12px',fontSize:12}}>{short(address)}</div>
                <button className="ap-btn ap-btn-danger" onClick={doDisconnect}>Disconnect</button>
              </div>
            </header>

            <div className="ap-page">
              <div className="ap-page-enter">
                {status&&<div className={toastCls(status)} style={{marginBottom:20}}>{status.msg}</div>}

                {/* SEND */}
                {tab==='send'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Send USDC</div>
                    <div style={S.cSub}>Transfer USDC instantly. Arc USDC is native — sends like ETH.</div>
                    {contacts.length>0&&(
                      <div style={{marginBottom:16}}>
                        <label style={S.lbl}>Quick Select</label>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                          {contacts.map(c=><button key={c.id} style={{...S.btnS,fontSize:12,padding:'6px 12px'}} onClick={()=>{setSendTo(c.address);setSendCtry(c.country);}}>{FLAG[c.country]} {c.name}</button>)}
                        </div>
                      </div>
                    )}
                    <label style={S.lbl}>Recipient Address</label>
                    <input style={S.inp} placeholder="0x..." value={sendTo} onChange={e=>setSendTo(e.target.value)}/>
                    <label style={S.lbl}>Amount (USDC)</label>
                    <input style={S.inp} type="number" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
                    <label style={S.lbl}>Destination Country</label>
                    <select style={S.sel} value={sendCtry} onChange={e=>setSendCtry(e.target.value)}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}
                    </select>
                    {converted()&&(
                      <div style={S.convB}>
                        <div style={{fontSize:12,color:'var(--bl2)',fontWeight:700,marginBottom:4}}>RECIPIENT GETS APPROXIMATELY</div>
                        <div style={{fontSize:22,fontWeight:800,fontFamily:'Syne,sans-serif',color:'var(--tx1)'}}>{FLAG[sendCtry]} {converted()} {CURRENCY[sendCtry]}</div>
                        <div style={{fontSize:12,color:'var(--tx2)',marginTop:4}}>1 USDC = {rates[CURRENCY[sendCtry]]?.toFixed(2)} {CURRENCY[sendCtry]} · Live rate</div>
                      </div>
                    )}
                    <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handleSend} disabled={loading}>{loading?'Sending...':'Send USDC'}</button>
                  </div>
                )}

                {/* MULTI-SEND */}
                {tab==='multi'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Multi-Send</div>
                    <div style={S.cSub}>Send USDC to multiple recipients in one session.</div>
                    {multi.map((r,i)=>(
                      <div key={i} style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}>
                        <div style={{flex:2}}>{i===0&&<label style={S.lbl}>Address</label>}<input style={{...S.inp,marginBottom:0}} placeholder="0x..." value={r.addr} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,addr:v}:x));}}/></div>
                        <div style={{flex:1}}>{i===0&&<label style={S.lbl}>USDC</label>}<input style={{...S.inp,marginBottom:0}} type="number" placeholder="0.00" value={r.amount} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,amount:v}:x));}}/></div>
                        <div style={{flex:1}}>{i===0&&<label style={S.lbl}>Country</label>}<select style={{...S.sel,marginBottom:0}} value={r.country} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,country:v}:x));}}>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                        {multi.length>1&&<button style={{...S.btnD,marginTop:i===0?22:0}} onClick={()=>setMulti(p=>p.filter((_,j)=>j!==i))}>X</button>}
                      </div>
                    ))}
                    <button style={S.btnG} onClick={()=>setMulti(p=>[...p,{addr:'',amount:'',country:'Pakistan'}])}>+ Add Recipient</button>
                    <div style={{margin:'14px 0',padding:'12px 14px',background:'var(--elev)',borderRadius:10,border:'1px solid var(--b1)',fontSize:14,color:'var(--tx1)'}}>
                      Total: <strong>${multi.reduce((s,r)=>s+(parseFloat(r.amount)||0),0).toFixed(2)} USDC</strong> to <strong>{multi.filter(r=>r.addr&&r.amount).length}</strong> recipients
                    </div>
                    <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handleMulti} disabled={loading}>{loading?'Sending...':'Send All'}</button>
                  </div>
                )}

                {/* INVOICE */}
                {tab==='invoice'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Create Invoice</div>
                    <div style={S.cSub}>Request USDC payment. Stored in Supabase, payable from any device.</div>
                    <label style={S.lbl}>Client Wallet Address</label>
                    <input style={S.inp} placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)}/>
                    <label style={S.lbl}>Amount (USDC)</label>
                    <input style={S.inp} type="number" placeholder="500" value={invAmt} onChange={e=>setInvAmt(e.target.value)}/>
                    <label style={S.lbl}>Description</label>
                    <input style={S.inp} placeholder="Logo design - May 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)}/>
                    <label style={S.lbl}>Your Country</label>
                    <select style={S.sel} value={invCtry} onChange={e=>setInvCtry(e.target.value)}>{COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}</select>
                    <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handleCreateInv} disabled={loading}>{loading?'Creating...':'Create Invoice'}</button>
                    {invId&&(
                      <div>
                        <div style={{marginTop:16,fontSize:14,fontWeight:700,color:'var(--cy)'}}>Invoice created successfully</div>
                        <div style={S.invB}>{invId}</div>
                        <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                          <button style={S.btnS} onClick={()=>navigator.clipboard?.writeText(invId)}>Copy ID</button>
                          <button style={{...S.btnP,width:'auto',padding:'9px 16px',marginTop:0}} onClick={()=>{setPayId(invId);setTab('pay');}}>Pay this Invoice</button>
                        </div>
                      </div>
                    )}
                    {ls('arc_invoices',[]).length>0&&(
                      <div style={{marginTop:20}}>
                        <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',marginBottom:10,letterSpacing:'.07em',textTransform:'uppercase'}}>Recent Invoices</div>
                        {ls('arc_invoices',[]).slice(0,5).map((inv,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--b0)'}}>
                            <div>
                              <div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>${inv.amount} USDC - {inv.desc?.slice(0,30)}</div>
                              <div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx3)'}}>{inv.id?.slice(0,16)}...</div>
                            </div>
                            <button style={{...S.btnS,fontSize:12,padding:'6px 10px'}} onClick={()=>{setPayId(inv.id);setTab('pay');}}>Pay</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PAY */}
                {tab==='pay'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Pay Invoice</div>
                    <div style={S.cSub}>Enter an invoice ID to look it up and pay instantly.</div>
                    <label style={S.lbl}>Invoice ID</label>
                    <input style={S.inp} placeholder="0x..." value={payId} onChange={e=>setPayId(e.target.value)}/>
                    {payDet&&(
                      <div style={{...S.convB,marginBottom:16}}>
                        <div style={{fontSize:12,color:'var(--bl2)',fontWeight:700,marginBottom:8}}>INVOICE DETAILS</div>
                        <div style={{fontSize:14,color:'var(--tx1)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                          <div><span style={{color:'var(--tx2)'}}>Amount:</span> <strong>{fmtUsdc(payDet.amount)} USDC</strong></div>
                          <div><span style={{color:'var(--tx2)'}}>Country:</span> {FLAG[payDet.country]||''} {payDet.country}</div>
                          <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>Desc:</span> {payDet.description}</div>
                          <div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>From:</span> <span style={{fontFamily:'monospace'}}>{short(payDet.creator)}</span></div>
                        </div>
                      </div>
                    )}
                    <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handlePayInv} disabled={loading}>{loading?'Processing...':'Pay Invoice'}</button>
                  </div>
                )}

                {/* CONTACTS */}
                {tab==='contacts'&&(
                  <div>
                    <div style={S.card}>
                      <div style={S.cTitle}>Add Contact</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                        <div><label style={S.lbl}>Name</label><input style={{...S.inp,marginBottom:0}} placeholder="Ahmed" value={cName} onChange={e=>setCName(e.target.value)}/></div>
                        <div><label style={S.lbl}>Country</label><select style={{...S.sel,marginBottom:0}} value={cCtry} onChange={e=>setCCtry(e.target.value)}>{COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}</select></div>
                      </div>
                      <label style={{...S.lbl,marginTop:14}}>Wallet Address</label>
                      <input style={S.inp} placeholder="0x..." value={cAddr} onChange={e=>setCAddr(e.target.value)}/>
                      <button style={S.btnP} onClick={()=>{
                        if(!cName||!ethers.isAddress(cAddr)){setStatus({type:'error',msg:'Enter name and valid address'});return;}
                        setContacts(p=>[{id:Date.now(),name:cName,address:cAddr,country:cCtry},...p]);
                        setCName('');setCAddr('');setStatus({type:'success',msg:'Contact saved'});
                      }}>Save Contact</button>
                    </div>
                    {contacts.length>0&&(
                      <div style={S.card}>
                        <div style={S.cTitle}>Saved Contacts ({contacts.length})</div>
                        {contacts.map(c=>(
                          <div key={c.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid var(--b0)'}}>
                            <div style={{width:40,height:40,borderRadius:12,background:'var(--elev)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'var(--bl2)',flexShrink:0}}>{c.name[0].toUpperCase()}</div>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{FLAG[c.country]} {c.name}</div>
                              <div style={{fontSize:12,color:'var(--tx3)',fontFamily:'monospace'}}>{c.address}</div>
                            </div>
                            <button style={{...S.btnS,fontSize:12}} onClick={()=>{setSendTo(c.address);setSendCtry(c.country);setTab('send');}}>Send</button>
                            <button style={S.btnD} onClick={()=>setContacts(p=>p.filter(x=>x.id!==c.id))}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SCHEDULE */}
                {tab==='schedule'&&(
                  <div>
                    <div style={S.card}>
                      <div style={S.cTitle}>Schedule Payment</div>
                      <div style={S.cSub}>Set up recurring transfers. Click Execute to pre-fill Send.</div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                        <div><label style={S.lbl}>Recipient</label><input style={{...S.inp,marginBottom:0}} placeholder="0x..." value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}/></div>
                        <div><label style={S.lbl}>Amount (USDC)</label><input style={{...S.inp,marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/></div>
                        <div><label style={S.lbl}>Country</label><select style={{...S.sel,marginBottom:0}} value={newSched.country} onChange={e=>setNewSched(s=>({...s,country:e.target.value}))}>{COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}</select></div>
                        <div><label style={S.lbl}>Frequency</label><select style={{...S.sel,marginBottom:0}} value={newSched.freq} onChange={e=>setNewSched(s=>({...s,freq:e.target.value}))}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                      </div>
                      <label style={{...S.lbl,marginTop:14}}>Next Date</label>
                      <input style={S.inp} type="date" value={newSched.next} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))}/>
                      <button style={S.btnP} onClick={()=>{
                        if(!newSched.addr||!newSched.amount||!newSched.next){setStatus({type:'error',msg:'Fill all fields'});return;}
                        setScheds(p=>[{id:Date.now(),...newSched},...p]);
                        setNewSched({addr:'',amount:'',country:'Pakistan',freq:'weekly',next:''});
                        setStatus({type:'success',msg:'Scheduled'});
                      }}>Schedule Payment</button>
                    </div>
                    {scheds.length>0&&(
                      <div style={S.card}>
                        <div style={S.cTitle}>Active Schedules</div>
                        {scheds.map(s=>(
                          <div key={s.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid var(--b0)'}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,color:'var(--tx1)'}}>{FLAG[s.country]} {short(s.addr)}</div>
                              <div style={{fontSize:13,color:'var(--tx2)',marginTop:2}}>${s.amount} USDC - {s.freq} - Next: {s.next}</div>
                            </div>
                            <button style={{...S.btnS,fontSize:12}} onClick={()=>{setSendTo(s.addr);setSendAmt(s.amount);setSendCtry(s.country);setTab('send');setStatus({type:'info',msg:'Pre-filled. Review and confirm.'});}}>Execute</button>
                            <button style={S.btnD} onClick={()=>setScheds(p=>p.filter(x=>x.id!==s.id))}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* HISTORY */}
                {tab==='history'&&(
                  <div>
                    {allTxns.length>0&&(
                      <div style={S.card}>
                        <div style={S.cTitle}>Transfer Volume</div>
                        <ResponsiveContainer width="100%" height={180}>
                          <AreaChart data={chartData} margin={{top:8,right:8,left:-20,bottom:0}}>
                            <defs>
                              <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4B8CF5" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#4B8CF5" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#192030"/>
                            <XAxis dataKey="label" tick={{fontSize:11,fill:'#6E7E9A'}} axisLine={false} tickLine={false}/>
                            <YAxis tick={{fontSize:11,fill:'#6E7E9A'}} axisLine={false} tickLine={false}/>
                            <Tooltip contentStyle={{background:'#10141F',border:'1px solid #192030',borderRadius:10,fontSize:13,color:'#EBF0FF'}}/>
                            <Area type="monotone" dataKey="sent" stroke="#4B8CF5" fill="url(#cg)" strokeWidth={2} name="Sent (USDC)"/>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div style={S.card}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                        <div style={S.cTitle}>Transactions ({allTxns.length})</div>
                        <button style={S.btnS} onClick={loadContractHistory}>Refresh</button>
                      </div>
                      {allTxns.length===0
                        ?<div style={{textAlign:'center',color:'var(--tx3)',padding:'32px 0'}}>No transactions yet</div>
                        :allTxns.map((t,i)=>(
                          <div key={i} style={S.hRow}>
                            <div style={S.hIcon}>↑</div>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{FLAG[t.country]||''} {t.country||'Transfer'}</div>
                              <div style={{fontSize:12,color:'var(--tx3)',fontFamily:'monospace',marginTop:2}}>{short(t.recipient)}</div>
                            </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontWeight:800,color:'var(--tx1)',fontSize:15}}>-{typeof t.amount==='string'||typeof t.amount==='number'?parseFloat(t.amount).toFixed(2):fmtUsdc(t.amount)} USDC</div>
                              <div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>{fmtDate(t.timestamp)}</div>
                            </div>
                            {t.hash&&<a href={`https://testnet.arcscan.app/tx/${t.hash}`} target="_blank" rel="noreferrer" style={{fontSize:13,color:'var(--bl)',textDecoration:'none',padding:'4px 8px'}}>View</a>}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* RATES */}
                {tab==='rates'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Live Exchange Rates</div>
                    <div style={S.cSub}>1 USDC = 1 USD - Rates via exchangerate-api.com</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
                      {COUNTRIES.map(c=>{
                        const cur=CURRENCY[c],rate=rates[cur];
                        return(
                          <div key={c} style={{background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:12,padding:'13px 15px'}}>
                            <div style={{fontSize:18,marginBottom:4}}>{FLAG[c]}</div>
                            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em'}}>{cur}</div>
                            <div style={{fontSize:17,fontWeight:800,fontFamily:'Syne,sans-serif',color:'var(--tx1)',marginTop:2}}>{rate?rate.toLocaleString('en',{maximumFractionDigits:1}):'...'}</div>
                            <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{c}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COMPARE */}
                {tab==='fees'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Fee Comparison</div>
                    <div style={S.cSub}>Sending $100 internationally. See what you actually pay.</div>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Service</th><th style={S.th}>Fee on $100</th><th style={S.th}>Speed</th><th style={S.th}>Save</th></tr></thead>
                      <tbody>
                        {[
                          {name:'ArcPay',fee:'~$0.007',speed:'< 1 sec',save:'$44.99',best:true},
                          {name:'SWIFT / Bank',fee:'$25 to $45',speed:'3 to 5 days',save:'...'},
                          {name:'Western Union',fee:'$4.99 + 3%',speed:'1 to 5 days',save:'...'},
                          {name:'PayPal',fee:'5% (max $4.99)',speed:'1 to 3 days',save:'...'},
                          {name:'Wise',fee:'0.5 to 2%',speed:'1 to 2 days',save:'...'},
                          {name:'MoneyGram',fee:'$3.99 + spread',speed:'1 to 3 days',save:'...'},
                        ].map((r,i)=>(
                          <tr key={i}>
                            <td style={{...S.td,fontWeight:r.best?800:400,color:r.best?'var(--cy)':'var(--tx1)'}}>{r.name}{r.best?' (Best)':''}</td>
                            <td style={{...S.td,color:r.best?'var(--cy)':'var(--tx1)',fontWeight:r.best?700:400}}>{r.fee}</td>
                            <td style={S.td}>{r.speed}</td>
                            <td style={{...S.td,fontWeight:700,color:r.save!=='...'?'var(--cy)':'var(--tx3)'}}>{r.save}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{marginTop:18,background:'var(--dcy)',border:'1px solid rgba(23,229,176,.15)',borderRadius:12,padding:18,textAlign:'center'}}>
                      <div style={{fontSize:12,color:'var(--cy)',fontWeight:700,marginBottom:4}}>ANNUAL SAVINGS vs BANK WIRE at $500/month</div>
                      <div style={{fontSize:34,fontWeight:800,fontFamily:'Syne,sans-serif',color:'var(--tx1)',letterSpacing:'-1px'}}>$2,699</div>
                    </div>
                  </div>
                )}

                {/* SETTINGS */}
                {tab==='settings'&&(
                  <div style={S.card}>
                    <div style={S.cTitle}>Settings</div>
                    {[
                      {label:'Dark Mode',sub:'Switch interface theme',
                        el:<button style={S.tog} onClick={()=>setDm(d=>!d)}><div style={S.togKnob}/></button>},
                      {label:'Default Send Country',sub:'Pre-selected when you open Send',
                        el:<select style={{...S.sel,marginBottom:0,width:'auto',minWidth:160}} value={defCtry} onChange={e=>{setDefCtry(e.target.value);setSendCtry(e.target.value);}}>
                          <option value="">None</option>
                          {COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}
                        </select>},
                    ].map((item,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 0',borderBottom:'1px solid var(--b0)'}}>
                        <div>
                          <div style={{fontWeight:600,color:'var(--tx1)',fontSize:15}}>{item.label}</div>
                          <div style={{fontSize:13,color:'var(--tx2)',marginTop:2}}>{item.sub}</div>
                        </div>
                        {item.el}
                      </div>
                    ))}
                    <div style={{padding:'18px 0',borderBottom:'1px solid var(--b0)'}}>
                      <div style={{fontWeight:600,color:'var(--tx1)',fontSize:15,marginBottom:8}}>Network Info</div>
                      <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'6px 16px',fontSize:13}}>
                        {[['Chain ID','5042002'],['RPC','rpc.testnet.arc.network'],['USDC',`${USDC_ADDR.slice(0,10)}...`],['Contract',`${REMIT_ADDR.slice(0,10)}...`]].map(([k,v])=>(
                          <React.Fragment key={k}><span style={{color:'var(--tx2)'}}>{k}</span><span style={{fontFamily:'monospace',color:'var(--tx1)'}}>{v}</span></React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div style={{padding:'18px 0'}}>
                      <div style={{fontWeight:600,color:'var(--tx1)',fontSize:15,marginBottom:4}}>Privacy</div>
                      <div style={{fontSize:13,color:'var(--tx2)',marginBottom:12}}>All data stored locally on your device. Nothing sent to any server.</div>
                      <button style={S.btnD} onClick={()=>{if(window.confirm('Clear all local data?')){setContacts([]);setScheds([]);setTxns([]);setStatus({type:'success',msg:'Data cleared'});}}}>Clear Local Data</button>
                    </div>
                  </div>
                )}

                <div style={{textAlign:'center',marginTop:24,fontSize:12,color:'var(--tx3)'}}>
                  ArcPay - Arc Testnet - Chain ID {ARC_CHAIN_ID} - <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{color:'var(--bl)'}}>Explorer</a>
                </div>
              </div>
            </div>
          </main>

          {/* Bottom nav mobile */}
          <nav className="ap-botnav">
            {TABS.slice(0,5).map(({id,label,ICN})=>(
              <div key={id} className={`ap-bot-item${tab===id?' active':''}`} onClick={()=>{setTab(id);setMobOpen(false);}}>
                <ICN/>{label}
              </div>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
