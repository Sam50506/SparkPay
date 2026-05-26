import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

/* ─── Constants (unchanged) ─── */
const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ID_HEX = '0x4CEF52';
const ARC_RPC = 'https://rpc.testnet.arc.network';
const REMITTANCE_ADDRESS = '0x71ec1d33f56a9f72a05c507647e1455b238cb7da';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const USDC_DECIMALS = 6;
const GAS_LIMIT = 300000;
const WC_PROJECT_ID = '8bb24a433758c9a403057e2e3f2c371b';

const COUNTRIES = [
  'Mexico','Brazil','India','Philippines','Nigeria',
  'Indonesia','Pakistan','Bangladesh','Vietnam','Ghana',
  'Kenya','Egypt','Turkey','Argentina','Colombia',
  'Ukraine','Ethiopia','Tanzania','Uganda','Nepal'
];

/* ─── ABIs (unchanged) ─── */
const REMITTANCE_ABI = [
  { inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}], name:'sendMoney', outputs:[], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}], name:'createInvoice', outputs:[{name:'',type:'bytes32'}], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}], name:'payInvoice', outputs:[], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'user',type:'address'}], name:'getPayments', outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'}],name:'',type:'tuple[]'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'',type:'bytes32'}], name:'invoices', outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'timestamp',type:'uint256'}], stateMutability:'view', type:'function' },
];
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

/* ─── Helpers (unchanged) ─── */
const shortenAddress = (addr) => (addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : '');
const formatUSDC = (amount) => { if (!amount) return '0'; return parseFloat(ethers.formatUnits(amount, USDC_DECIMALS)).toFixed(2); };
const formatDate = (ts) => (ts ? new Date(Number(ts) * 1000).toLocaleDateString() : '');
const executeWithRetry = async (txFunc, setStatus) => {
  try { return await txFunc(); }
  catch (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('txpool')||msg.includes('nonce')||msg.includes('replacement')||msg.includes('underpriced')||msg.includes('timeout')) {
      setStatus({ type:'warning', message:'Transaction pool full. Retrying in 10 seconds...' });
      await new Promise((r) => setTimeout(r, 10000));
      return await txFunc();
    }
    throw error;
  }
};

/* ─── Global CSS ─── */
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

/* ─── Main App ─── */
export default function App() {

  /* ── Original state (unchanged) ── */
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wcProvider, setWcProvider] = useState(null);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCountry, setSendCountry] = useState(COUNTRIES[0]);
  const [invoicePayer, setInvoicePayer] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceCountry, setInvoiceCountry] = useState(COUNTRIES[0]);
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payInvoiceDetails, setPayInvoiceDetails] = useState(null);
  const [history, setHistory] = useState([]);

  /* ── New UI state ── */
  const [splash, setSplash] = useState(true);
  const [mobOpen, setMobOpen] = useState(false);

  /* ── Original effects (unchanged) ── */
  useEffect(() => {
    const autoConnect = async () => { if (window.ethereum?.selectedAddress) await connectBrowserWallet(); };
    autoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts) => { if (accounts.length === 0) disconnect(); else if (accounts[0] !== address) setAddress(accounts[0]); };
    const handleChain = () => window.location.reload();
    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => { window.ethereum.removeListener('accountsChanged', handleAccounts); window.ethereum.removeListener('chainChanged', handleChain); };
  }, [address]);

  useEffect(() => {
    if (activeTab === 'history' && signer) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, signer, address]);

  /* ── Original wallet logic (unchanged) ── */
  const switchToArc = async (ethereumProvider) => {
    try {
      await ethereumProvider.request({ method:'wallet_switchEthereumChain', params:[{ chainId:ARC_CHAIN_ID_HEX }] });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await ethereumProvider.request({ method:'wallet_addEthereumChain', params:[{ chainId:ARC_CHAIN_ID_HEX, chainName:'Arc Testnet', nativeCurrency:{ name:'ARC', symbol:'ARC', decimals:18 }, rpcUrls:[ARC_RPC], blockExplorerUrls:[] }] });
      } else throw switchError;
    }
  };

  const getBrowserWalletName = () => {
    if (!window.ethereum) return 'Browser Wallet';
    if (window.ethereum.isRabby) return 'Rabby';
    if (window.ethereum.isBraveWallet) return 'Brave Wallet';
    if (window.ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
    if (window.ethereum.isMetaMask) return 'MetaMask';
    return 'Browser Wallet';
  };

  const connectBrowserWallet = async () => {
    try {
      if (!window.ethereum) { setStatus({ type:'error', message:'No browser wallet detected. Please install MetaMask or another wallet.' }); return; }
      const browserProvider = new ethers.BrowserProvider(window.ethereum, { name:'Arc Testnet', chainId:ARC_CHAIN_ID });
      await browserProvider.send('eth_requestAccounts', []);
      await switchToArc(window.ethereum);
      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setProvider(browserProvider); setSigner(newSigner); setAddress(newAddress); setWalletName(getBrowserWalletName());
      setStatus({ type:'success', message:`Connected to ${getBrowserWalletName()}: ${shortenAddress(newAddress)}` });
    } catch (error) { setStatus({ type:'error', message:error.message || 'Failed to connect wallet' }); }
  };

  const connectMobileWallet = async () => {
    try {
      const ethereumProvider = await EthereumProvider.init({ projectId:WC_PROJECT_ID, chains:[ARC_CHAIN_ID], showQrModal:true, methods:['eth_sendTransaction','eth_sign','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'], events:['chainChanged','accountsChanged'] });
      await ethereumProvider.enable();
      ethereumProvider.on('accountsChanged', (accounts) => { if (accounts.length === 0) disconnect(); else setAddress(accounts[0]); });
      ethereumProvider.on('disconnect', () => disconnect());
      try { await ethereumProvider.request({ method:'wallet_switchEthereumChain', params:[{ chainId:ARC_CHAIN_ID_HEX }] }); }
      catch (e) { if (e.code === 4902) await ethereumProvider.request({ method:'wallet_addEthereumChain', params:[{ chainId:ARC_CHAIN_ID_HEX, chainName:'Arc Testnet', nativeCurrency:{ name:'ARC', symbol:'ARC', decimals:18 }, rpcUrls:[ARC_RPC], blockExplorerUrls:[] }] }); }
      const browserProvider = new ethers.BrowserProvider(ethereumProvider, { name:'Arc Testnet', chainId:ARC_CHAIN_ID });
      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setWcProvider(ethereumProvider); setProvider(browserProvider); setSigner(newSigner); setAddress(newAddress); setWalletName('WalletConnect');
      setStatus({ type:'success', message:`Connected via WalletConnect: ${shortenAddress(newAddress)}` });
    } catch (error) { setStatus({ type:'error', message:error.message || 'Failed to connect mobile wallet' }); }
  };

  const disconnect = useCallback(() => {
    if (wcProvider) wcProvider.disconnect();
    setProvider(null); setSigner(null); setAddress(''); setWalletName(''); setWcProvider(null); setStatus(null);
  }, [wcProvider]);

  const getContracts = () => {
    if (!signer) return null;
    return { remittance:new ethers.Contract(REMITTANCE_ADDRESS, REMITTANCE_ABI, signer), usdc:new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer) };
  };

  /* ── Original action handlers (unchanged) ── */
  const handleSend = async () => {
    if (!signer || !sendRecipient || !sendAmount) { setStatus({ type:'error', message:'Please fill all fields and connect wallet' }); return; }
    setLoading(true); setStatus({ type:'info', message:'Processing...' });
    try {
      const { remittance, usdc } = getContracts();
      const amount = ethers.parseUnits(sendAmount, USDC_DECIMALS);
      const allowance = await usdc.allowance(address, REMITTANCE_ADDRESS);
      if (allowance < amount) { setStatus({ type:'info', message:'Approving USDC...' }); const approveTx = await usdc.approve(REMITTANCE_ADDRESS, amount, { gasLimit:GAS_LIMIT }); await approveTx.wait(); }
      setStatus({ type:'info', message:'Sending USDC...' });
      const tx = await executeWithRetry(() => remittance.sendMoney(USDC_ADDRESS, sendRecipient, amount, sendCountry, { gasLimit:GAS_LIMIT }), setStatus);
      await tx.wait();
      setStatus({ type:'success', message:`Successfully sent ${sendAmount} USDC to ${shortenAddress(sendRecipient)}` });
      setSendRecipient(''); setSendAmount('');
    } catch (error) { setStatus({ type:'error', message:error.reason || error.message || 'Transaction failed' }); }
    finally { setLoading(false); }
  };

  const handleCreateInvoice = async () => {
    if (!signer || !invoicePayer || !invoiceAmount || !invoiceDescription) { setStatus({ type:'error', message:'Please fill all fields' }); return; }
    setLoading(true); setStatus({ type:'info', message:'Creating...' });
    try {
      const { remittance } = getContracts();
      const amount = ethers.parseUnits(invoiceAmount, USDC_DECIMALS);
      const invoiceId = await remittance.createInvoice.staticCall(invoicePayer, amount, invoiceDescription, invoiceCountry);
      const tx = await executeWithRetry(() => remittance.createInvoice(invoicePayer, amount, invoiceDescription, invoiceCountry, { gasLimit:GAS_LIMIT }), setStatus);
      await tx.wait();
      setCreatedInvoiceId(invoiceId);
      setStatus({ type:'success', message:'Invoice created successfully!' });
      setInvoicePayer(''); setInvoiceAmount(''); setInvoiceDescription('');
    } catch (error) { setStatus({ type:'error', message:error.reason || error.message || 'Failed to create invoice' }); }
    finally { setLoading(false); }
  };

  const handlePayInvoice = async () => {
    if (!signer || !payInvoiceId) { setStatus({ type:'error', message:'Please enter an invoice ID' }); return; }
    setLoading(true); setStatus({ type:'info', message:'Processing...' });
    try {
      const { remittance, usdc } = getContracts();
      let invoiceId = payInvoiceId.trim();
      if (!invoiceId.startsWith('0x')) invoiceId = '0x' + invoiceId;
      const invoice = await remittance.invoices(invoiceId);
      if (invoice.creator === ethers.ZeroAddress) { setStatus({ type:'error', message:'Invoice not found' }); setLoading(false); return; }
      if (invoice.paid) { setStatus({ type:'error', message:'Invoice already paid' }); setLoading(false); return; }
      setPayInvoiceDetails({ creator:invoice.creator, amount:invoice.amount, description:invoice.description, country:invoice.country });
      const amount = invoice.amount;
      const allowance = await usdc.allowance(address, REMITTANCE_ADDRESS);
      if (allowance < amount) { setStatus({ type:'info', message:'Approving USDC...' }); const approveTx = await usdc.approve(REMITTANCE_ADDRESS, amount, { gasLimit:GAS_LIMIT }); await approveTx.wait(); }
      setStatus({ type:'info', message:'Paying invoice...' });
      const tx = await executeWithRetry(() => remittance.payInvoice(USDC_ADDRESS, invoiceId, { gasLimit:GAS_LIMIT }), setStatus);
      await tx.wait();
      setStatus({ type:'success', message:`Successfully paid invoice for ${formatUSDC(amount)} USDC` });
      setPayInvoiceId(''); setPayInvoiceDetails(null);
    } catch (error) { setStatus({ type:'error', message:error.reason || error.message || 'Payment failed' }); }
    finally { setLoading(false); }
  };

  const loadHistory = async () => {
    try { const { remittance } = getContracts(); const payments = await remittance.getPayments(address); setHistory(payments); }
    catch (error) { console.error('History load failed:', error); }
  };

  /* ── New UI helpers ── */
  const statusClass = () => {
    if (!status) return null;
    const msg = status.message?.toLowerCase() || '';
    if (status.type === 'success' || msg.includes('successfully') || msg.includes('created')) return 'ap-status ap-status-success';
    if (status.type === 'error') return 'ap-status ap-status-error';
    if (status.type === 'warning') return 'ap-status ap-status-warning';
    return 'ap-status ap-status-info';
  };

  const statusIcon = () => {
    if (!status) return null;
    const msg = status.message?.toLowerCase() || '';
    if (status.type === 'success' || msg.includes('successfully') || msg.includes('created')) return <IC.Check/>;
    if (status.type === 'error') return <IC.X/>;
    return <IC.Alert/>;
  };

  const nav = (id) => { setActiveTab(id); setMobOpen(false); };

  const TABS = [
    { id:'send',    label:'Send',    Icon:IC.Send    },
    { id:'invoice', label:'Invoice', Icon:IC.Invoice },
    { id:'pay',     label:'Pay',     Icon:IC.Pay     },
    { id:'history', label:'History', Icon:IC.History },
    { id:'fees',    label:'Compare', Icon:IC.Compare },
  ];

  const PAGE_META = {
    send:    { title:'Send USDC',       sub:'Transfer USDC instantly to any wallet address on Arc Testnet.' },
    invoice: { title:'Create Invoice',  sub:'Generate an on-chain invoice and share the ID with your client.' },
    pay:     { title:'Pay Invoice',     sub:'Enter an invoice ID to look up and pay it on-chain.' },
    history: { title:'Transaction History', sub:'All outgoing transfers from your connected wallet.' },
    fees:    { title:'Fee Comparison',  sub:'How ArcPay compares to traditional remittance services on a $100 transfer.' },
  };

  /* ── Render ── */
  return (
    <>
      <style>{CSS}</style>

      {/* Splash */}
      {splash && <SplashScreen onDone={() => setSplash(false)} />}

      {/* Connect screen */}
      {!splash && !address && (
        <div className="ap-connect">
          <div className="ap-connect-card">
            <ArcLogo size={56} />
            <div className="ap-connect-title">ArcPay</div>
            <div className="ap-connect-sub">Cross-border USDC remittance on Arc Testnet. Near-zero fees, instant settlement.</div>
            <div className="ap-connect-btns">
              <button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={connectBrowserWallet}>
                <IC.Wallet /> Connect Browser Wallet
              </button>
              <div className="ap-connect-divider">or</div>
              <button className="ap-btn ap-btn-full-outline" onClick={connectMobileWallet}>
                <IC.WC /> Connect via WalletConnect
              </button>
            </div>
            {status && <div className={statusClass()} style={{marginTop:16,marginBottom:0,textAlign:'left'}}>{statusIcon()}<span>{status.message}</span></div>}
            <div className="ap-connect-footer">
              <div className="ap-connect-row"><span>Network</span><span style={{color:'var(--cy)',fontWeight:600}}>Arc Testnet</span></div>
              <div className="ap-connect-row"><span>Chain ID</span><span style={{color:'var(--tx2)',fontFamily:'monospace'}}>5042002</span></div>
              <div className="ap-connect-row"><span>Contract</span><span style={{color:'var(--tx2)',fontFamily:'monospace'}}>{shortenAddress(REMITTANCE_ADDRESS)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Main app */}
      {!splash && address && (
        <div className="ap-app">

          {/* Mobile overlay */}
          <div className={`ap-overlay${mobOpen?' on':''}`} onClick={() => setMobOpen(false)} />

          {/* Sidebar */}
          <aside className={`ap-sidebar${mobOpen?' mob-open':''}`}>
            <div className="ap-logo-area">
              <ArcLogo size={34} />
              <div>
                <div className="ap-logo-name">ArcPay</div>
                <div className="ap-logo-tag">REMITTANCE</div>
              </div>
            </div>
            <nav className="ap-nav">
              <div className="ap-nav-section">Navigation</div>
              {TABS.map(({ id, label, Icon }) => (
                <div key={id} className={`ap-nav-item${activeTab===id?' active':''}`} onClick={() => nav(id)}>
                  <Icon />{label}
                </div>
              ))}
            </nav>
            <div className="ap-sidebar-foot">
              <div className="ap-net-badge">
                <span className="ap-net-dot" />
                Arc Testnet
                <span style={{color:'var(--tx3)',fontWeight:500,marginLeft:2}}>#5042002</span>
              </div>
              <div className="ap-wallet-pill">
                <div className="ap-wallet-icon"><IC.Wallet /></div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,letterSpacing:'.06em'}}>{walletName.toUpperCase()}</div>
                  <div style={{fontSize:12,fontWeight:600,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{shortenAddress(address)}</div>
                </div>
                <button className="ap-btn ap-btn-danger" onClick={disconnect} style={{padding:'5px 10px',fontSize:11}}>
                  Disconnect
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="ap-content">

            {/* Top bar */}
            <header className="ap-topbar">
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <button className="ap-btn-icon mob-show" onClick={() => setMobOpen(true)}>
                  <IC.Menu />
                </button>
                <div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:17,letterSpacing:'-.2px'}}>
                  {PAGE_META[activeTab]?.title}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div className="ap-net-badge mob-hide" style={{cursor:'default'}}>
                  <span className="ap-net-dot"/>Live
                </div>
                <div className="ap-badge ap-badge-blue mob-hide" style={{padding:'6px 12px',fontSize:12}}>
                  {shortenAddress(address)}
                </div>
                <button className="ap-btn-icon" onClick={disconnect} title="Disconnect">
                  <IC.X />
                </button>
              </div>
            </header>

            {/* Page */}
            <div className="ap-page">
              <div className="ap-page-enter">
                <div className="ap-page-sub">{PAGE_META[activeTab]?.sub}</div>

                {/* Status */}
                {status && (
                  <div className={statusClass()}>
                    {statusIcon()}
                    <span>{status.message}</span>
                  </div>
                )}

                {/* ── SEND ── */}
                {activeTab === 'send' && (
                  <div className="ap-card">
                    <div className="ap-field">
                      <label className="ap-label">Recipient Wallet Address</label>
                      <input className="ap-input" placeholder="0x..." value={sendRecipient} onChange={(e) => setSendRecipient(e.target.value)} />
                    </div>
                    <div className="ap-field">
                      <label className="ap-label">Amount (USDC)</label>
                      <input className="ap-input" placeholder="0.00" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                    </div>
                    <div className="ap-field" style={{marginBottom:6}}>
                      <label className="ap-label">Destination Country</label>
                      <select className="ap-select" value={sendCountry} onChange={(e) => setSendCountry(e.target.value)}>
                        {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    {sendAmount && (
                      <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontSize:13,color:'var(--tx3)',borderTop:'1px solid var(--b0)',marginTop:12}}>
                        <span>Estimated gas</span>
                        <span style={{color:'var(--cy)',fontWeight:600}}>&lt; $0.01</span>
                      </div>
                    )}
                    <button className="ap-btn ap-btn-primary" onClick={handleSend} disabled={loading || !sendRecipient || !sendAmount}>
                      {loading ? 'Processing...' : `Send ${sendAmount || '0'} USDC`}
                    </button>
                  </div>
                )}

                {/* ── INVOICE ── */}
                {activeTab === 'invoice' && (
                  <div>
                    <div className="ap-card">
                      <div className="ap-field">
                        <label className="ap-label">Client Wallet Address</label>
                        <input className="ap-input" placeholder="0x..." value={invoicePayer} onChange={(e) => setInvoicePayer(e.target.value)} />
                      </div>
                      <div className="ap-field">
                        <label className="ap-label">Amount (USDC)</label>
                        <input className="ap-input" placeholder="0.00" type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} />
                      </div>
                      <div className="ap-field">
                        <label className="ap-label">Description</label>
                        <input className="ap-input" placeholder="Logo design — March 2026" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} />
                      </div>
                      <div className="ap-field" style={{marginBottom:6}}>
                        <label className="ap-label">Your Country</label>
                        <select className="ap-select" value={invoiceCountry} onChange={(e) => setInvoiceCountry(e.target.value)}>
                          {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <button className="ap-btn ap-btn-primary" onClick={handleCreateInvoice} disabled={loading || !invoicePayer || !invoiceAmount || !invoiceDescription}>
                        {loading ? 'Creating...' : 'Create Invoice'}
                      </button>
                    </div>
                    {createdInvoiceId && (
                      <div className="ap-card">
                        <div className="ap-code-label">Invoice ID</div>
                        <div style={{fontSize:13,color:'var(--tx2)',marginBottom:8}}>Share this ID with your client so they can pay via the Pay tab.</div>
                        <div className="ap-code-box">{createdInvoiceId}</div>
                        <button className="ap-btn ap-btn-sec" style={{marginTop:12,gap:6}} onClick={() => navigator.clipboard?.writeText(createdInvoiceId)}>
                          <IC.Copy /> Copy Invoice ID
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── PAY ── */}
                {activeTab === 'pay' && (
                  <div>
                    <div className="ap-card">
                      <div className="ap-field" style={{marginBottom:6}}>
                        <label className="ap-label">Invoice ID</label>
                        <input className="ap-input" placeholder="0x..." value={payInvoiceId} onChange={(e) => setPayInvoiceId(e.target.value)} />
                      </div>
                      <button className="ap-btn ap-btn-primary" onClick={handlePayInvoice} disabled={loading || !payInvoiceId}>
                        {loading ? 'Processing...' : 'Look Up and Pay'}
                      </button>
                    </div>
                    {payInvoiceDetails && (
                      <div className="ap-card">
                        <div className="ap-code-label" style={{marginBottom:12}}>Invoice Details</div>
                        <div className="ap-invoice-detail">
                          {[
                            ['Amount',      `${formatUSDC(payInvoiceDetails.amount)} USDC`],
                            ['Description', payInvoiceDetails.description],
                            ['From',        shortenAddress(payInvoiceDetails.creator)],
                            ['Country',     payInvoiceDetails.country],
                          ].map(([k, v]) => (
                            <div key={k} className="ap-invoice-row">
                              <span style={{color:'var(--tx3)',fontSize:13}}>{k}</span>
                              <span style={{fontWeight:600,fontSize:13}}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── HISTORY ── */}
                {activeTab === 'history' && (
                  <div className="ap-card">
                    {history.length === 0 ? (
                      <div className="ap-hist-empty">No transactions found for this wallet.</div>
                    ) : (
                      history.map((p, i) => (
                        <div key={i} className="ap-hist-item">
                          <div>
                            <div className="ap-hist-amount">{formatUSDC(p.amount)} USDC</div>
                            <div className="ap-hist-meta">To {shortenAddress(p.recipient)} &nbsp;&middot;&nbsp; {p.country}</div>
                          </div>
                          <div className="ap-hist-date">{formatDate(p.timestamp)}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── COMPARE (fees) ── */}
                {activeTab === 'fees' && (
                  <div>
                    <div className="ap-card" style={{padding:0,overflow:'hidden'}}>
                      <table className="ap-table">
                        <thead>
                          <tr>
                            <th>Service</th>
                            <th>Fee on $100</th>
                            <th>Speed</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="best-row">
                            <td>ArcPay</td>
                            <td>~$0.007</td>
                            <td>&lt; 1 second</td>
                          </tr>
                          <tr><td>Western Union</td><td>$4.99 + 3%</td><td>1 to 5 days</td></tr>
                          <tr><td>SWIFT / Bank Wire</td><td>$25 to $45</td><td>3 to 5 days</td></tr>
                          <tr><td>PayPal</td><td>5% up to $4.99</td><td>1 to 3 days</td></tr>
                          <tr><td>Wise</td><td>0.5% to 2%</td><td>1 to 2 days</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="ap-compare-footer">ArcPay saves you up to $44.99 per transaction</div>
                  </div>
                )}

              </div>
            </div>
          </main>

          {/* Bottom nav (mobile) */}
          <nav className="ap-botnav">
            {TABS.map(({ id, label, Icon }) => (
              <div key={id} className={`ap-bot-item${activeTab===id?' active':''}`} onClick={() => nav(id)}>
                <Icon />{label}
              </div>
            ))}
          </nav>

        </div>
      )}
    </>
  );
}
