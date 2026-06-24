/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useInvoices } from './hooks/useInvoices';
import { useSend } from './hooks/useSend';
import { useMulti } from './hooks/useMulti';
import { useSchedule, SCHED_ABI } from './hooks/useSchedule';
import Faucet from './components/Faucet';
import MultiSend from './components/MultiSend';
import TimePicker from './components/TimePicker';
import SplashScreen from './components/SplashScreen';
import CountrySelect from './components/CountrySelect';
import ConfirmModal from './components/ConfirmModal';
import QRModal from './components/QRModal';
import OnboardingModal, { SparkPayLogo } from './components/OnboardingModal';
import { IC } from './icons';
import { NavTooltip, CashbackToast, ResumeModal, WalletPicker } from './components/Modals';
import { NeedHelpMenu, OnChainSchedules } from './components/ScheduledPaymentsPanel';
import { AdminPanel } from './components/AdminPanel';
import QRScanner from './components/QRScanner';
import RatesPage from './components/RatesPage';
import RewardsPage from './components/RewardsPage';
import FeesPage from './components/FeesPage';
import ReceivePage from './components/ReceivePage';
import AboutPage from './components/AboutPage';
import SettingsPage from './components/SettingsPage';

import Lottie from 'lottie-react';
import arcpayAnimation from './arcpay-animation.json';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { ARC_CHAIN_ID, ARC_CHAIN_HEX, DEFAULT_MAINTENANCE, ADMIN_ADDRESS, ARC_RPC, ARC_RPC_FALLBACK, ARC_RPC_FALLBACK2, ARC_RPC_FALLBACK3, SCHED_ADDR, REMIT_ADDR, USDC_ADDR, WC_ID, SB_URL, SB_KEY, APP_URL } from './config';
import { COUNTRIES, ALL_COUNTRIES, ALL_CURRENCY, ALL_CC, CC, flagEmoji, CURRENCY } from './config';
import { REMIT_ABI, ERC20_ABI } from './config';
import { short, sendNotif, requestNotifPermission, fmtUsdc, fmtDate, fmtTime, ls, lsSave, awaitReceipt } from './config';
import { buildChart } from './config';
import { addrColor, isValidAddr } from './config';
import { getProvider, sbFetch, sbInsert, sbSelect, sbUpdate } from './config';


const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#000000;--surf:#0A0A0A;--card:#111111;--elev:#1A1A1A;--hov:#222222;
  --b0:#2A2A2A;--b1:#333333;--b2:#444444;--b3:#555555;
  --tx1:#FFFFFF;--tx2:#AAAAAA;--tx3:#666666;
  --ac:#4D9FE0;--ac2:#70B8F0;--acd:rgba(77,159,224,.15);--acs:rgba(77,159,224,.3);
  --cy:#17E5B0;--re:#FF4F61;--ye:#F0C43F;
  --fd:'Inter',sans-serif;--fb:'Inter',sans-serif;
  --sh:0 2px 20px rgba(0,0,0,.4);--shl:0 8px 40px rgba(0,0,0,.6);
}
.ap-root.light{
  --bg:#FFFFFF;--surf:#F3F4F6;--card:#FFFFFF;--elev:#F9FAFB;--hov:#F3F4F6;
  --b0:#E5E7EB;--b1:#D1D5DB;--b2:#9CA3AF;--b3:#6B7280;
  --tx1:#111827;--tx2:#374151;--tx3:#6B7280;
  --ac:#2563EB;--ac2:#1D4ED8;--acd:rgba(37,99,235,.08);--acs:rgba(37,99,235,.2);
  --cy:#059669;--re:#DC2626;--ye:#D97706;
  --fd:'Inter',sans-serif;--fb:'Inter',sans-serif;
  --sh:0 1px 3px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.06);--shl:0 4px 16px rgba(0,0,0,.1);
}
html,body{height:100%;background:var(--bg);color:var(--tx1);font-family:var(--fb);overflow-x:hidden}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0}to{opacity:1}}
@keyframes spinCW{to{transform:rotate(360deg)}}
@keyframes spinCCW{to{transform:rotate(-360deg)}}
@keyframes fillBar{from{width:0}to{width:100%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes cashPop{0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(.9)}60%{transform:translateX(-50%) translateY(-3px) scale(1.03)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.ap-splash{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;transition:opacity .35s ease,transform .35s ease}
.ap-splash.exit{opacity:0;transform:scale(1.04);pointer-events:none}
.ap-ring-outer{animation:spinCW 5s linear infinite;transform-origin:50% 50%}
.ap-ring-inner{animation:spinCCW 3.5s linear infinite;transform-origin:50% 50%}
.ap-splash-title{font-family:var(--fd);font-size:30px;font-weight:800;letter-spacing:-.5px;color:var(--tx1);margin-top:24px;animation:slideUp .5s .35s both}
.ap-splash-sub{font-size:11px;font-weight:600;color:var(--tx3);letter-spacing:.14em;text-transform:uppercase;margin-top:6px;animation:slideUp .5s .5s both}
.ap-splash-bar-wrap{width:160px;height:2px;background:var(--b1);border-radius:1px;overflow:hidden;margin-top:44px;animation:fadeIn .4s .65s both}
.ap-splash-bar{height:100%;border-radius:1px;background:linear-gradient(90deg,var(--ac),var(--cy));animation:fillBar 2s .7s cubic-bezier(.4,0,.15,1) both}
.ap-splash-ver{position:absolute;bottom:28px;font-size:11px;color:var(--tx3);font-weight:500;animation:fadeIn .5s 1s both}
.ap-connect{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:var(--bg);background-image:radial-gradient(ellipse 70% 50% at 50% 0%,rgba(59,130,196,.09) 0%,transparent 70%)}
.ap-connect-card{width:100%;max-width:400px;background:var(--card);border:1px solid var(--b0);border-radius:24px;padding:40px 32px;text-align:center;animation:scaleIn .3s ease both;box-shadow:var(--shl)}
.ap-connect-title{font-family:var(--fd);font-size:24px;font-weight:800;letter-spacing:-.3px;margin-top:18px;color:var(--tx1)}
.ap-connect-sub{font-size:13px;color:var(--tx2);margin-top:8px;line-height:1.6}
.ap-connect-btns{display:flex;flex-direction:column;gap:10px;margin-top:28px}
.ap-cdivider{display:flex;align-items:center;gap:12px;margin:4px 0;font-size:11px;color:var(--tx3)}
.ap-cdivider::before,.ap-cdivider::after{content:'';flex:1;height:1px;background:var(--b1)}
.ap-connect-footer{margin-top:24px;padding-top:20px;border-top:1px solid var(--b0);display:flex;flex-direction:column;gap:8px}
.ap-connect-row{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--tx3)}
.ap-app{display:flex;height:100vh;overflow:hidden;background:var(--bg)}
.ap-sidebar{width:256px;flex-shrink:0;background:var(--surf);border-right:1px solid var(--b0);display:flex;flex-direction:column;height:100vh;position:fixed;left:0;top:0;z-index:100;transition:transform .28s cubic-bezier(.4,0,.2,1)}
.ap-sidebar.mob-open{transform:translateX(0)!important;box-shadow:0 0 60px rgba(0,0,0,.65)}.ap-overlay{position:fixed;inset:0;z-index:101;background:rgba(0,0,0,0.25)}
.ap-content{flex:1;margin-left:256px;display:flex;flex-direction:column;height:100vh;overflow:hidden}.ap-layout{flex:1;margin-left:256px;display:flex;flex-direction:column;min-height:100vh;background:var(--bg)}
.ap-topbar{height:62px;border-bottom:1px solid var(--b0);display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:var(--bg);flex-shrink:0}
.ap-page{flex:1;overflow-y:auto;padding:28px 28px 40px;background:var(--bg);min-height:100%}
.ap-page-enter{animation:scaleIn .22s ease both;max-width:580px}@media(min-width:900px){.ap-page-enter{max-width:800px}.ap-main{margin-left:256px;padding:32px 48px}.ap-connect-card{max-width:480px}}
.ap-logo-area{padding:10px 14px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:8px}
.ap-logo-name{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.3px;line-height:1;color:var(--tx1)}
.ap-logo-tag{font-size:10px;color:var(--tx3);font-weight:600;letter-spacing:.07em;margin-top:2px;text-transform:uppercase}
.ap-nav{flex:1;padding:8px 0;overflow-y:auto}
.ap-nav-sec{font-size:10px;font-weight:700;color:var(--tx1);letter-spacing:.1em;padding:10px 20px 4px;text-transform:uppercase}
.ap-nav-item{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13.5px;font-weight:500;color:var(--tx2);margin:1px 8px;border:1px solid transparent;transition:all .14s;user-select:none;position:relative}
.ap-nav-item:hover{background:var(--elev);color:var(--tx1)}
.ap-nav-item.active{background:var(--acd);color:var(--ac2);border-color:var(--acs)}
.ap-nav-item .ni{margin-left:auto;width:16px;height:16px;border-radius:50%;background:transparent;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:var(--tx3);flex-shrink:0;cursor:pointer;transition:all .14s;font-style:italic;border:1px solid var(--b2);line-height:1}
.ap-nav-item .ni:hover{background:var(--hov);color:var(--tx1);border-color:var(--b3)}
.ap-tip-pop{position:fixed;left:264px;top:auto;transform:none;background:var(--elev);border:1px solid var(--b2);border-radius:12px;padding:11px 14px;font-size:12px;color:var(--tx2);line-height:1.55;width:220px;z-index:400;box-shadow:var(--shl);animation:scaleIn .15s ease;pointer-events:none}
.ap-sidebar-foot{padding:14px;border-top:1px solid var(--b0)}
.ap-net-badge{display:flex;align-items:center;gap:6px;background:rgba(23,229,176,.06);border:1px solid rgba(23,229,176,.16);border-radius:999px;padding:5px 11px;font-size:11px;font-weight:600;color:var(--cy);margin-bottom:10px}
.ap-net-dot{width:6px;height:6px;border-radius:50%;background:var(--cy);animation:pulse 2s ease infinite}
.ap-wallet-pill{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--card);border:1px solid var(--b1);border-radius:12px}
.ap-wallet-icon{width:30px;height:30px;border-radius:50%;background:var(--acd);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ap-btn{border:none;cursor:pointer;font-family:var(--fb);transition:all .18s;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:600}
.ap-btn-primary{width:100%;padding:14px;border-radius:14px;background:#2563EB;color:#fff;font-size:15px;font-weight:700;box-shadow:0 2px 8px rgba(37,99,235,.3);letter-spacing:.01em;margin-top:4px}
.ap-btn-primary:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(59,130,196,.45)}
.ap-btn-primary:disabled{opacity:.45;cursor:not-allowed;transform:none!important}
.ap-btn-sec{padding:9px 18px;border-radius:10px;background:var(--elev);border:1px solid var(--b1);color:var(--tx1);font-size:13px}
.ap-btn-sec:hover{background:var(--hov);border-color:var(--b2)}
.ap-btn-ghost{padding:9px 18px;border-radius:10px;background:transparent;border:1px solid var(--b1);color:var(--tx2);font-size:13px}
.ap-btn-ghost:hover{border-color:var(--b2);color:var(--tx1)}
.ap-btn-danger{padding:7px 14px;border-radius:8px;background:rgba(255,79,97,.07);border:1px solid rgba(255,79,97,.18);color:var(--re);font-size:12px}
.ap-btn-danger:hover{background:rgba(255,79,97,.13)}
.ap-btn-icon{width:34px;height:34px;border-radius:9px;background:var(--elev);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .14s;color:var(--tx2);flex-shrink:0}
.ap-btn-icon:hover{background:var(--hov);color:var(--tx1)}
.ap-btn-outline-full{width:100%;padding:13px;border-radius:14px;background:var(--elev);border:1px solid var(--b2);color:var(--tx1);font-size:14px;font-weight:600}
.ap-btn-outline-full:hover{background:var(--hov);border-color:var(--b3)}
.ap-status{padding:12px 16px;border-radius:12px;margin-bottom:16px;font-size:13.5px;font-weight:500;display:flex;align-items:flex-start;gap:9px;line-height:1.5;animation:slideUp .2s ease;word-break:break-word;overflow-wrap:anywhere;max-height:120px;overflow-y:auto}
.ap-status-success{background:rgba(23,229,176,.07);border:1px solid rgba(23,229,176,.18);color:var(--cy)}
.ap-status-error{background:rgba(255,79,97,.07);border:1px solid rgba(255,79,97,.18);color:var(--re)}
.ap-status-warning{background:rgba(240,196,63,.07);border:1px solid rgba(240,196,63,.18);color:var(--ye)}
.ap-status-info{background:var(--acd);border:1px solid var(--acs);color:var(--ac2)}
.ap-card{background:var(--card);border:1px solid var(--b0);border-radius:18px;padding:24px;margin-bottom:16px;transition:border-color .2s;box-shadow:var(--sh)}
.ap-card:hover{border-color:var(--b1)}
.ap-card-title{font-family:var(--fd);font-size:16px;font-weight:700;letter-spacing:-.2px;color:var(--tx1);margin-bottom:4px}
.ap-card-sub{font-size:13px;color:var(--tx2);margin-bottom:20px;line-height:1.5}
.ap-div{height:1px;background:var(--b0);margin:16px 0}
.ap-label{font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;display:flex;align-items:center;gap:6px}
.ap-input{background:var(--elev);border:1.5px solid var(--b1);border-radius:12px;padding:12px 14px;font-family:var(--fb);font-size:14px;color:var(--tx1);outline:none;transition:border .15s,box-shadow .15s;width:100%;display:block}
.ap-input:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(59,130,196,.1)}
.ap-input::placeholder{color:var(--tx3)}
.ap-select{background:var(--elev);border:1px solid var(--b1);border-radius:12px;padding:12px 14px;font-family:var(--fb);font-size:14px;color:var(--tx1);outline:none;width:100%;cursor:pointer;appearance:none;transition:border .15s;display:block}
.ap-select:focus{border-color:var(--ac)}
.ap-send-card{background:var(--card);border:1px solid var(--b0);border-radius:20px;overflow:hidden;margin-bottom:16px;box-shadow:var(--sh)}
.ap-send-panel{padding:20px 22px}
.ap-send-panel.recv{background:var(--elev);border-top:1px solid var(--b0)}
.ap-send-lbl{font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px}
.ap-send-row{display:flex;align-items:center;gap:12px}
.ap-amount-input{flex:1;background:transparent;border:none;outline:none;font-family:var(--fb);font-size:32px;font-weight:800;color:var(--tx1);width:100%;min-width:0;letter-spacing:-.5px}
.ap-amount-input::placeholder{color:var(--tx3)}
.ap-token-pill{display:flex;align-items:center;gap:7px;background:var(--elev);border:1px solid var(--b1);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700;color:var(--tx1);white-space:nowrap;flex-shrink:0}
.ap-recv-divider{display:flex;align-items:center;justify-content:center;position:relative;height:0;z-index:2}
.ap-recv-icon{width:30px;height:30px;border-radius:50%;background:var(--card);border:1px solid var(--b1);display:flex;align-items:center;justify-content:center;color:var(--tx3)}
.ap-conv-amount{font-family:var(--fd);font-size:22px;font-weight:700;color:var(--tx1);margin-bottom:4px}
.ap-conv-rate{font-size:12px;color:var(--tx3)}
.ap-country-pill{display:flex;align-items:center;gap:7px;background:var(--elev);border:1.5px solid var(--b1);border-radius:12px;padding:12px 14px;cursor:pointer;font-size:14px;font-weight:600;color:var(--tx1);transition:all .14s;width:100%;box-sizing:border-box}
.ap-country-pill:hover{border-color:var(--ac)}
.ap-country-pill.empty{color:var(--tx3)}
.ap-cc{font-size:10px;font-weight:800;background:var(--acd);color:var(--ac2);border-radius:4px;padding:2px 5px;letter-spacing:.04em}
.ap-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.68);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px);animation:fadeIn .2s ease}
.ap-modal{background:var(--card);border:1px solid var(--b1);border-radius:24px;padding:28px;width:100%;max-width:400px;box-shadow:var(--shl);animation:scaleIn .2s ease}
.ap-modal-title{font-family:var(--fd);font-size:18px;font-weight:700;color:var(--tx1);margin-bottom:6px}
.ap-modal-sub{font-size:13px;color:var(--tx2);margin-bottom:22px}
.ap-conf-row{display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--b0);font-size:14px}
.ap-conf-row:last-of-type{border-bottom:none}
.ap-conf-key{color:var(--tx2);font-weight:500}
.ap-conf-val{color:var(--tx1);font-weight:600;text-align:right;max-width:220px;word-break:break-all}
.ap-modal-btns{display:flex;gap:10px;margin-top:20px}
.ap-botnav{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-top:1px solid var(--b0);padding:6px 0 calc(6px + env(safe-area-inset-bottom));z-index:100;align-items:center}
.ap-bot-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:5px 2px;cursor:pointer;font-size:10px;font-weight:600;color:var(--tx2);transition:color .14s;position:relative}
.ap-bot-item.active{color:var(--ac)}
.ap-bot-fab-wrap{flex:0 0 64px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font-size:10px;font-weight:600;color:var(--tx3);transition:color .14s}
.ap-bot-fab-wrap.active{color:var(--ac)}
.ap-fab{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#3B82C4,#2563A8);box-shadow:0 4px 20px rgba(59,130,196,.4);display:flex;align-items:center;justify-content:center;position:relative;top:-14px;color:white;transition:all .2s}
.ap-bot-fab-wrap.active .ap-fab,.ap-bot-fab-wrap:hover .ap-fab{box-shadow:0 6px 28px rgba(59,130,196,.6);transform:translateY(-1px)}
.ap-ndot{width:7px;height:7px;border-radius:50%;background:var(--re);position:absolute;top:2px;right:10px;animation:pulse 1.5s ease infinite}
.ap-mob-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;backdrop-filter:blur(4px)}
.ap-mob-overlay.on{display:block}
.ap-cb-toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--b1);border-radius:16px;padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:var(--shl);z-index:500;animation:cashPop .4s ease;min-width:260px;max-width:320px}
.ap-cb-rarity{font-size:10px;font-weight:800;border-radius:6px;padding:3px 8px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;flex-shrink:0}
.ap-rarity-common{background:rgba(23,229,176,.1);color:var(--cy)}
.ap-rarity-rare{background:var(--acd);color:var(--ac2)}
.ap-rarity-epic{background:rgba(240,196,63,.1);color:var(--ye)}
.ap-rew-bar{height:8px;background:var(--elev);border-radius:999px;overflow:hidden;margin:10px 0 6px}
.ap-rew-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--ac),var(--cy));transition:width .6s cubic-bezier(.4,0,.2,1)}
.ap-tx-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.ap-tx-confirmed{background:rgba(23,229,176,.09);color:var(--cy)}
.ap-tx-pending{background:rgba(240,196,63,.09);color:var(--ye)}
.ap-tx-failed{background:rgba(255,79,97,.09);color:var(--re)}
.ap-tx-submitted{background:var(--acd);color:var(--ac2)}
.ap-hist-row{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--b0)}
.ap-hist-row:last-child{border-bottom:none}
.ap-hist-icon{width:38px;height:38px;border-radius:12px;background:var(--acd);display:flex;align-items:center;justify-content:center;color:var(--ac);flex-shrink:0}
.ap-quick-wrap{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.ap-quick-pill{display:flex;align-items:center;gap:5px;background:var(--elev);border:1px solid var(--b1);border-radius:999px;padding:5px 11px;font-size:11px;font-weight:600;color:var(--tx2);cursor:pointer;transition:all .14s;font-family:monospace}
.ap-quick-pill:hover{border-color:var(--ac);color:var(--ac2);background:var(--acd)}
.ap-qr-wrap{display:flex;flex-direction:column;align-items:center;gap:16px;width:100%}
.ap-qr-box{background:#fff;border-radius:16px;padding:16px;display:inline-flex;box-shadow:var(--sh)}
.ap-qr-link{background:var(--elev);border:1px solid var(--b1);border-radius:10px;padding:10px 14px;font-family:'Courier New',monospace;font-size:11px;color:var(--ac2);word-break:break-all;line-height:1.5;width:100%}
.ap-about-link{display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid var(--b0);cursor:pointer;text-decoration:none;color:var(--tx1);transition:color .14s}
.ap-about-link:hover{color:var(--ac2)}
.ap-about-link:last-child{border-bottom:none}
.ap-toggle{cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;border:none;outline:none;padding:0}
.ap-toggle-knob{position:absolute;top:4px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .2s;pointer-events:none}
.ap-rates-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.ap-rate-card{background:var(--elev);border:1px solid var(--b1);border-radius:14px;padding:14px;transition:border-color .2s}
.ap-rate-card:hover{border-color:var(--ac)}
.ap-code{background:var(--elev);border:1px solid var(--b2);border-radius:10px;padding:13px 16px;font-family:'Courier New',monospace;font-size:12px;color:var(--ac2);word-break:break-all;line-height:1.6}
.ap-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600}
.ap-badge-blue{background:var(--acd);color:var(--ac2)}
.ap-table{width:100%;border-collapse:collapse;font-size:14px}
.ap-table th{background:var(--elev);text-align:left;padding:11px 16px;font-weight:700;color:var(--tx3);font-size:10px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid var(--b0)}
.ap-table td{padding:13px 16px;border-bottom:1px solid var(--b0);color:var(--tx1)}
.ap-table tr:last-child td{border-bottom:none}
.ap-table tr:hover td{background:var(--elev)}
.ap-best-row td{color:var(--cy);font-weight:600}
.ap-setting-row{display:flex;align-items:center;justify-content:space-between;padding:18px 0;border-bottom:1px solid var(--b0)}
.ap-setting-row:last-child{border-bottom:none}
.ap-setting-label{font-weight:600;color:var(--tx1);font-size:14px}
.ap-resume-addr{font-family:'Courier New',monospace;font-size:13px;color:var(--ac2);background:var(--acd);border-radius:8px;padding:8px 14px;display:inline-block;margin:12px 0 20px;border:1px solid var(--acs)}
.ap-reward-item{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--elev);border-radius:12px;font-size:13px;margin-bottom:8px}
.ap-fee-note{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--tx3);margin-bottom:14px}
.ap-resumed-banner{background:rgba(240,196,63,.07);border:1px solid rgba(240,196,63,.18);border-radius:12px;padding:10px 16px;font-size:13px;color:var(--ye);margin-bottom:16px;display:flex;align-items:center;gap:8px}
@media(max-width:768px){
  .ap-sidebar{transform:translateX(-270px)}
  .ap-content{margin-left:0}.ap-layout{margin-left:0}
  .ap-page{padding:18px 16px 96px}
  .ap-botnav{display:flex}
  .mob-hide{display:none!important}
  .ap-topbar{padding:0 16px}
  .ap-page-enter{max-width:100%}
  .ap-tip-pop{left:auto;right:calc(100% + 10px)}
}
@media(min-width:769px){.mob-show{display:none!important}}
`;


function AppInner() {
  const isAdminRoute = window.location.hash === '#admin';
  const[maintenanceMode,setMaintenanceMode]=useState(DEFAULT_MAINTENANCE);
  const[maintenanceLoaded,setMaintenanceLoaded]=useState(false);
  useEffect(()=>{
    fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode&select=value',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{
      if(d&&d[0])setMaintenanceMode(d[0].value==='true');
      setMaintenanceLoaded(true);
    }).catch(()=>setMaintenanceLoaded(true));
  },[]);
  const [provider,setProvider]=useState(null);const[signer,setSigner]=useState(null);const[address,setAddress]=useState('');const[balance,setBalance]=useState('0.00');const[walletName,setWalletName]=useState('');
  const wcProvRef=useRef(null);const wcInitRef=useRef(null);const[showPicker,setShowPicker]=useState(false);const isPWA=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;const[splash,setSplash]=useState(!isPWA);const[isResumed,setIsResumed]=useState(false);const[showOnboarding,setShowOnboarding]=useState(()=>!ls('arc_onboarded',false));const[faucetLoading,setFaucetLoading]=useState(false);const[showWalletPrompt,setShowWalletPrompt]=useState(false);const[faucetMsg,setFaucetMsg]=useState(null);const[lastClaim,setLastClaim]=useState(0);const[showFaucetFrame,setShowFaucetFrame]=useState(false);useEffect(()=>{if(address)setLastClaim(ls('arc_faucet_last_'+address,0));},[address]);
  const[tab,setTab]=useState('send');const[status,setStatus]=useState(null);const[loading,setLoading]=useState(false);const[mobOpen,setMobOpen]=useState(false);const[dm,setDm]=useState(false);
  const[showResumeModal,setShowResumeModal]=useState(false);const[savedSession,setSavedSession]=useState(null);
  const[showConfirm,setShowConfirm]=useState(false);const[confirmData,setConfirmData]=useState(null);const[confirmAction,setConfirmAction]=useState(null);
  const[showQR,setShowQR]=useState(false);const[rates,setRates]=useState({});
  
  const[payId,setPayId]=useState('');
  const[txns,setTxns]=useState([]);
  const[contractTxns,setContractTxns]=useState([]);
  const[contacts,setContacts]=useState([]);const[contactsLoaded,setContactsLoaded]=useState(false);const[cName,setCName]=useState('');const[cAddr,setCAddr]=useState('');const[cCtry,setCCtry]=useState('');const[editId,setEditId]=useState(null);
  const[scheds,setScheds]=useState(()=>ls('arc_scheds',[]));const[newSched,setNewSched]=useState({addr:'',amount:'',country:'',freq:'weekly',next:'',time:'09:00'});const[editSchedId,setEditSchedId]=useState(null);const[editSchedData,setEditSchedData]=useState(null);
  const[defCtry,setDefCtry]=useState(()=>ls('arc_ctry',''));
  const[cashbackPending,setCashbackPending]=useState(0);const[cashbackHistory,setCashbackHistory]=useState(()=>ls('arc_cashback_history',[]));
  useEffect(()=>{
    if(!address)return;
    const fetchCashback=()=>{
      sbSelect('cashback_balances','wallet_address=eq.'+address+'&select=pending_amount').then(rows=>{
        setCashbackPending(rows?.[0]?.pending_amount?parseFloat(rows[0].pending_amount):0);
      }).catch(()=>{});
    };
    fetchCashback();
    const t=setInterval(fetchCashback,15000);
    return()=>clearInterval(t);
  },[address]);
  const[showCashbackToast,setShowCashbackToast]=useState(false);const[cashbackToastData,setCashbackToastData]=useState(null);const[claimLoading,setClaimLoading]=useState(false);const[claimSubmitted,setClaimSubmitted]=useState(false);const[claimAmt,setClaimAmt]=useState('');const[myClaimsHistory,setMyClaimsHistory]=useState([]);const[claimsLoading,setClaimsLoading]=useState(false);const[manageTxns,setManageTxns]=useState(false);const[rateSearch,setRateSearch]=useState('');const[manageContacts,setManageContacts]=useState(false);const[selectedContacts,setSelectedContacts]=useState([]);const[cSearch,setCSearch]=useState('');const[showAdd,setShowAdd]=useState(false);const[selectedTxns,setSelectedTxns]=useState([]);const[deletedHashes,setDeletedHashes]=useState(()=>new Set([]));const[txSearch,setTxSearch]=useState('');const[txFilter,setTxFilter]=useState('all');const[txPage,setTxPage]=useState(1);const[expandedTx,setExpandedTx]=useState(null);const[showTxns,setShowTxns]=useState(true);const[pendingClaimsCount,setPendingClaimsCount]=useState(0);

  useEffect(()=>{if(address&&contactsLoaded)lsSave('arc_contacts_'+address,contacts);},[contacts,address,contactsLoaded]);
  useEffect(()=>lsSave('arc_scheds',scheds),[scheds]);
  useEffect(()=>{if(address){const cutoff=Math.floor(Date.now()/1000)-(30*24*60*60);const all=ls('arc_txhistory_'+address,[]);const recent=all.filter(t=>!t.timestamp||t.timestamp>cutoff);if(recent.length<all.length){lsSave('arc_txhistory_'+address,recent);setStatus({type:'info',msg:'Transactions older than 30 days have been removed to keep your app running smoothly.'});}setTxns(recent);}},[address]);
  useEffect(()=>{if(address)lsSave('arc_txhistory_'+address,txns);},[txns,address]);
  useEffect(()=>lsSave('arc_dm',dm),[dm]);
  useEffect(()=>lsSave('arc_ctry',defCtry),[defCtry]);
  
  useEffect(()=>lsSave('arc_cashback_history',cashbackHistory),[cashbackHistory]);
  useEffect(()=>{if(address)lsSave('arc_session',{address,walletType:walletName,ts:Date.now()});},[address,walletName]);
  useEffect(()=>{if(!splash){const s=ls('arc_session',null);if(s&&s.address&&!address&&Date.now()-s.ts<86400000){setSavedSession(s);setShowResumeModal(true);}}},[splash]);// eslint-disable-line
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const pa=p.get('pay');const pamt=p.get('amount');if(pa){setSendTo(pa);if(pamt)setSendAmt(pamt);setTab('send');}const inv=p.get('inv');if(inv){try{const i=JSON.parse(atob(inv));const s=ls('arc_invoices',[]);if(!s.find(x=>x.id===i.id))lsSave('arc_invoices',[i,...s]);setPayId(i.id);setTab('pay');}catch{}}},[]);
  useEffect(()=>{fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json()).then(d=>setRates(d.rates||{})).catch(()=>setRates({PKR:279,NGN:1371,INR:96.7,PHP:61.8,BDT:122.8,MXN:17.4,BRL:5.03,IDR:17713,VND:26222,GHS:11.5,KES:129,EGP:53.1,TRY:45.6,ARS:1399,COP:3795,UAH:44.2,ETB:155.9,TZS:2572,UGX:3734,NPR:154.6}));},[]);

  const doDisconnect=useCallback(()=>{if(wcProvRef.current){wcProvRef.current.disconnect();wcProvRef.current=null;}try{if(window.ethereum)window.ethereum.request({method:'wallet_revokePermissions',params:[{eth_accounts:{}}]});}catch{}setProvider(null);setSigner(null);setAddress('');setWalletName('');setStatus(null);setBalance('0.00');setIsResumed(false);lsSave('arc_session',null);},[]);

  useEffect(()=>{if(!window.ethereum)return;const onAcc=a=>{if(!a.length){setTimeout(()=>{if(window.ethereum)window.ethereum.request({method:'eth_accounts'}).then(accounts=>{if(!accounts.length)doDisconnect();})},1000);}else setAddress(a[0]);};const onChain=(chainId)=>{};window.ethereum.on('accountsChanged',onAcc);window.ethereum.on('chainChanged',onChain);return()=>{window.ethereum.removeListener('accountsChanged',onAcc);window.ethereum.removeListener('chainChanged',onChain);};},[doDisconnect]);

  const refreshBal=useCallback(async()=>{if(!address)return;try{const rp=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});const b=await rp.getBalance(address);setBalance(parseFloat(ethers.formatUnits(b,18)).toFixed(2));}catch{}},[address]);
  useEffect(()=>{if(signer&&address){refreshBal();setContacts(ls('arc_contacts_'+address,[]));setContactsLoaded(true);setDeletedHashes(new Set(ls('arc_deleted_hashes_'+address,[])));}},[signer,address,refreshBal]);
  useEffect(()=>{if(!signer||!address)return;const t=setInterval(refreshBal,15000);return()=>clearInterval(t);},[signer,address,refreshBal]);

  const getC=()=>({remit:new ethers.Contract(REMIT_ADDR,REMIT_ABI,signer),usdc:new ethers.Contract(USDC_ADDR,ERC20_ABI,signer)});
  const loadDeletedHashes=useCallback(async()=>{
  try{
    const rows=await sbSelect('deleted_txns','wallet_address=eq.'+address+'&select=tx_hash');
    const remote=new Set((rows||[]).map(r=>r.tx_hash));
    const local=new Set(ls('arc_deleted_hashes_'+address,[]));
    const merged=new Set([...remote,...local]);
    lsSave('arc_deleted_hashes_'+address,[...merged]);
    setDeletedHashes(merged);
    return merged;
  }catch(e){return new Set(ls('arc_deleted_hashes_'+address,[]));}
},[address]);

const loadContractHistory=useCallback(async()=>{if(!address)return;try{
    const r=await fetch('https://testnet.arcscan.app/api?module=account&action=txlist&address='+address+'&sort=desc');
    const d=await r.json();
    const allExplorer=[];
    if(d.message==='OK'&&d.result){
      d.result.filter(t=>t.isError==='0'&&parseInt(t.value)>0).forEach(t=>{
        const isReceived=t.to.toLowerCase()===address.toLowerCase()&&t.from.toLowerCase()!==address.toLowerCase();
        allExplorer.push({hash:t.hash,recipient:isReceived?t.from:t.to,sender:t.from,amount:parseFloat(ethers.formatUnits(t.value,18)).toFixed(2),country:'',timestamp:parseInt(t.timeStamp),status:'confirmed',received:isReceived,type:isReceived?'received':'send'});
      });
    }
    // Fetch scheduled payment events using block explorer for real timestamps
    try{
      const schedTxsResp=await fetch('https://testnet.arcscan.app/api?module=account&action=txlist&address='+SCHED_ADDR+'&sort=desc');
      const schedTxsData=await schedTxsResp.json();
      const schedTxs=schedTxsData.message==='OK'?schedTxsData.result||[]:[];
      const schedContract=new ethers.Contract(SCHED_ADDR,['function paymentCount() view returns (uint256)','function getPayment(uint256) view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'],provider);
      const count=Number(await schedContract.paymentCount());
      const seenHashes=new Set(allExplorer.map(t=>t.hash));
      for(let i=count-1;i>=0;i--){
        const p=await schedContract.getPayment(i);
        const amt=parseFloat(ethers.formatUnits(p.amount,18)).toFixed(2);
        if(p.sender.toLowerCase()===address.toLowerCase()){
          if(p.executed){
            const execTx=schedTxs.find(t=>t.from.toLowerCase()!==address.toLowerCase()&&t.isError==='0');
            const execTs=execTx?parseInt(execTx.timeStamp):Number(p.releaseTime);
            if(!seenHashes.has('sched_exec_'+i)){
              allExplorer.push({hash:'sched_exec_'+i,recipient:p.recipient,sender:address,amount:amt,country:p.country,timestamp:execTs,status:'confirmed',type:'scheduled',label:'Scheduled Payment'});
              seenHashes.add('sched_exec_'+i);
            }
          }
          if(p.cancelled){
            if(!seenHashes.has('sched_refund_'+i)){
              const cancelTx=schedTxs.filter(t=>t.from.toLowerCase()===address.toLowerCase()&&t.isError==='0'&&parseInt(t.value)===0&&parseInt(t.timeStamp)>Number(p.releaseTime)-86400).sort((a,b)=>parseInt(b.timeStamp)-parseInt(a.timeStamp))[0];
              const cancelTs=cancelTx?parseInt(cancelTx.timeStamp):Math.floor(Date.now()/1000);
              allExplorer.push({hash:'sched_refund_'+i,recipient:address,sender:address,amount:amt,country:p.country,timestamp:cancelTs,status:'confirmed',received:true,type:'refund',label:'Refund'});
              seenHashes.add('sched_refund_'+i);
            }
          }
        }
        if(p.recipient.toLowerCase()===address.toLowerCase()&&p.executed){
          if(!seenHashes.has('sched_recv_'+i)){
            allExplorer.push({hash:'sched_recv_'+i,recipient:address,sender:p.sender,amount:parseFloat(ethers.formatUnits(p.amount,18)).toFixed(2),country:p.country,timestamp:Number(p.releaseTime),status:'confirmed',received:true,type:'scheduled_received',label:'Scheduled Payment Received'});
            seenHashes.add('sched_recv_'+i);
          }
        }
      }
    }catch(e){console.log('sched events error:',e);}
    const deletedHashes=new Set(ls('arc_deleted_hashes_'+address,[]));setContractTxns(allExplorer.filter(t=>!deletedHashes.has(t.hash)));
  }catch(e){console.log('explorer fetch failed:',e);}},[address]);// eslint-disable-line
  const awardCashback=useCallback(async(txHash,txAmount)=>{if(!txAmount||parseFloat(txAmount)<5)return;const amt=parseFloat((parseFloat(txAmount)*0.01).toFixed(3));if(amt<=0)return;
    try{
      const r=await fetch('/api/cashback-award',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wallet_address:address,amount:amt,tx_hash:txHash})});
      const d=await r.json();
      if(d.success){setCashbackPending(d.newBalance);}
    }catch(e){console.error('Cashback award failed:',e);}
    setCashbackHistory(prev=>[{amount:amt,txHash,ts:Date.now()},...prev.slice(0,49)]);setCashbackToastData({amount:amt.toFixed(3)});setShowCashbackToast(true);
  },[address]);
  const refreshPendingTxns=useCallback(async()=>{
    try{
      const rp=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      const stored=ls('arc_txhistory_'+address,[]);
      const pending=stored.filter(t=>t.status==='pending'||t.status==='submitted');
      if(!pending.length)return;
      const updated=[...stored];
      for(const tx of pending){
        try{
          const r=await rp.getTransactionReceipt(tx.hash);
          if(r&&r.blockNumber){
            const confirmed=r.status===1?'confirmed':'failed';
            const idx=updated.findIndex(t=>t.hash===tx.hash);
            if(idx>=0){updated[idx]={...updated[idx],status:confirmed};if(confirmed==='confirmed')awardCashback(tx.hash,updated[idx].amount);}
          }
        }catch(_){}
      }
      lsSave('arc_txhistory_'+address,updated);
      setTxns(updated);
    }catch(_){}
  },[address]);
  useEffect(()=>{if(tab==='history'&&signer){loadDeletedHashes().then(()=>loadContractHistory());setTxPage(1);setTxSearch('');setTxFilter('all');setExpandedTx(null);}if(signer&&address){(async()=>{try{const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer.provider||provider);const scheduledTxns=txns.filter(t=>t.type==='scheduled'&&t.status==='scheduled');for(const st of scheduledTxns){const idMatch=st.id&&st.id.includes('_sched')?null:null;}const count=Number(await sched.paymentCount());const onChainMap={};for(let i=0;i<count;i++){const p=await sched.getPayment(i);if(p.sender.toLowerCase()===address.toLowerCase()){onChainMap[i]=p;}}setTxns(prev=>{let changed=false;const updated=prev.map(t=>{if(t.type==='scheduled'&&t.status==='scheduled'){const match=Object.entries(onChainMap).find(([id,p])=>p.recipient.toLowerCase()===t.recipient.toLowerCase()&&Math.abs(parseFloat(ethers.formatUnits(p.amount,18))-parseFloat(t.amount))<0.001&&Number(p.releaseTime)===Number(t.releaseTime||t.timestamp));if(match){const[,p]=match;if(p.executed){changed=true;return{...t,status:'confirmed'};}if(p.cancelled){changed=true;return{...t,status:'cancelled'};}}}return t;});if(changed)lsSave('arc_txhistory_'+address,updated);return changed?updated:prev;});}catch(e){console.log('sync error',e);}})();}},[tab,signer,address]);useEffect(()=>{if(tab==='rewards'&&address){fetchMyClaims();}},[tab,address]);useEffect(()=>{if(tab==='settings'&&address&&address.toLowerCase()==='0x9e086e6c07d5108ce40d84e9df1ce43caedd2306'){sbSelect('cashback_claims','status=eq.pending&select=id').then(rows=>setPendingClaimsCount(rows?.length||0)).catch(()=>{});}},[tab,address]);


  const fetchMyClaims=async()=>{if(!address)return;setClaimsLoading(true);try{const rows=await sbSelect('cashback_claims','wallet_address=eq.'+address+'&order=timestamp.desc&limit=10');setMyClaimsHistory(rows||[]);if(rows&&rows.length>0&&rows[0].status==='paid'&&claimSubmitted===true){setClaimSubmitted('paid');setTimeout(()=>setClaimSubmitted(false),5000);}}catch(e){console.error(e);}setClaimsLoading(false);};
  const claimCashback=async()=>{const amt=parseFloat(claimAmt)||cashbackPending;if(cashbackPending<5||claimLoading||amt<5||amt>cashbackPending)return;setClaimLoading(true);try{
    await sbInsert('cashback_claims',{wallet_address:address,amount:amt,timestamp:new Date().toISOString(),status:'pending'});
    const newBalance=parseFloat((cashbackPending-amt).toFixed(3));
    await sbUpdate('cashback_balances','wallet_address=eq.'+address,{pending_amount:newBalance,updated_at:new Date().toISOString()});
    setClaimSubmitted(true);setCashbackPending(newBalance);setStatus({type:'success',msg:'Cashback claim submitted. Your USDC will be sent to your wallet shortly.'});
  }catch(e){setStatus({type:'error',msg:'Claim failed: '+e.message});}setClaimLoading(false);};

  const addArc=p=>({chainId:ARC_CHAIN_HEX,chainName:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:[ARC_RPC||ARC_RPC_FALLBACK],blockExplorerUrls:['https://testnet.arcscan.app'],...p});
  const ensureArc=async eth=>{try{await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]});}catch(e){if(e.code===4902||e.code===-32603){setStatus({type:'info',msg:'Adding Arc Testnet to your wallet...'});try{await eth.request({method:'wallet_addEthereumChain',params:[addArc({})]});}catch(ae){setStatus({type:'error',msg:'Please add Arc Testnet manually in your wallet settings. Chain ID: 5042002, RPC: https://rpc.testnet.arc.network'});throw ae;}}else throw e;}};
  const finaliseConnect=async bp=>{bp.pollingInterval=800;const s=await bp.getSigner();const addr=await s.getAddress();setProvider(bp);setSigner(s);setAddress(addr);setIsResumed(false);setStatus({type:'success',msg:'Connected: '+short(addr)});requestNotifPermission();};

  const connectBrowser=async(type,provObj)=>{try{const eth=provObj||(window.okxwallet&&(type==='OKX Wallet'||provObj?.isOkxWallet||provObj?.isOKExWallet)?window.okxwallet:null)||await getProvider();if(!eth){setStatus({type:'error',msg:'No wallet found. Install MetaMask.'});return;}await eth.request({method:'eth_requestAccounts'});const bp=new ethers.BrowserProvider(eth,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});await ensureArc(eth);let name='Browser Wallet';if(eth.isMises||(window.mises?.ethereum===eth))name='Mises';else if(eth.isMetaMask&&!eth.isBraveWallet)name='MetaMask';else if(eth.isBraveWallet)name='Brave';else if(eth.isCoinbaseWallet)name='Coinbase';else if(eth.isOkxWallet||eth.isOKExWallet)name='OKX';setWalletName(name);await finaliseConnect(bp);}catch(e){setStatus({type:'error',msg:e.message||'Connection failed'});}};

  const connectWC=async()=>{try{const wcp=await EthereumProvider.init({projectId:WC_ID,chains:[1],optionalChains:[ARC_CHAIN_ID],showQrModal:true,qrModalOptions:{themeMode:'light',themeVariables:{'--wcm-font-family':'inherit'}},methods:['eth_sendTransaction','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'],events:['chainChanged','accountsChanged']});await wcp.enable();wcp.on('accountsChanged',a=>{if(!a.length)doDisconnect();else setAddress(a[0]);});wcp.on('disconnect',doDisconnect);try{await wcp.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]});}catch(e){if(e.code===4902)await wcp.request({method:'wallet_addEthereumChain',params:[addArc({})]});}const bp=new ethers.BrowserProvider(wcp,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});wcProvRef.current=wcp;setWalletName('WalletConnect');await finaliseConnect(bp);}catch(e){setStatus({type:'error',msg:e.message||'WalletConnect failed'});}};








  const exportCSV=()=>{const rows=[['Type','Hash','Recipient','Amount (USDC)','Country','Date','Status'],...txns.map(t=>['Send',t.hash||'',t.recipient||'',t.amount||'',t.country||'',fmtDate(t.timestamp),t.status||'']),...ls('arc_invoices',[]).map(i=>['Invoice',i.id||'',i.payer||'',i.amount||'',i.country||'',fmtDate(i.ts),i.paid?'Paid':'Unpaid']),...scheds.map(s=>['Scheduled','',s.addr||'',s.amount||'',s.country||'',s.next||'',s.freq||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sparkpay-history.csv';a.click();URL.revokeObjectURL(url);};

  const schedHashes=new Set(contractTxns.filter(r=>r.type==='scheduled'||r.type==='refund'||r.type==='scheduled_received').map(r=>r.hash));const allTxns=[...txns.filter(t=>!(t.type==='scheduled'&&contractTxns.some(c=>c.type==='scheduled'&&c.recipient.toLowerCase()===(t.recipient||'').toLowerCase()&&Math.abs(parseFloat(c.amount)-parseFloat(t.amount))<0.01))),...contractTxns.filter(r=>!txns.find(l=>l.hash===r.hash))].filter(t=>!deletedHashes.has(t.hash)).sort((a,b)=>Number(b.sortTime||b.timestamp||0)-Number(a.sortTime||a.timestamp||0));
  const chartData=buildChart(allTxns);const totalSent=allTxns.filter(t=>!t.received&&t.type!=='refund'&&t.status!=='scheduled').reduce((s,t)=>{const n=typeof t.amount==='bigint'||typeof t.amount==='object'?parseFloat(ethers.formatUnits(BigInt(t.amount.toString()),18)):parseFloat(t.amount);const v=isNaN(n)?0:n;return s+(v<0?0:v);},0);
  const hasPendingTx=txns.some(t=>t.status==='pending'||t.status==='submitted');
  const recentRecipients=[...new Set(txns.filter(t=>t.recipient&&!t.hash?.startsWith('0xdemo')).map(t=>t.recipient))].slice(0,5);
  const statusCls=s=>!s?null:({success:'ap-status ap-status-success',error:'ap-status ap-status-error',warning:'ap-status ap-status-warning',info:'ap-status ap-status-info'}[s.type]||'ap-status ap-status-info');
  const cleanErr=e=>{if(!e)return'Something went wrong. Please try again.';if(e?.code===4001||e?.code==='ACTION_REJECTED')return'Transaction cancelled.';if(e?.reason)return e.reason;if(e?.message){const m=e.message;if(m.includes('insufficient'))return'Insufficient balance.';if(m.includes('reverted'))return'Transaction reverted: '+(e?.data?.message||e?.error?.message||'Check balance and release time must be at least 10 mins in future.');if(m.includes('Too early'))return'Release time must be in the future.';if(m.includes('user rejected'))return'Transaction cancelled.';if(m.includes('network'))return'Network error. Please check your connection.';if(m.length<100)return m;}return'Transaction failed. Please try again.';};
  const { invPayer, setInvPayer, invAmt, setInvAmt, invDesc, setInvDesc, invCtry, setInvCtry, invId, setInvId, payDet, setPayDet, handleCreateInv, handlePayInv, handlePayInvReview } = useInvoices({ address, signer, provider, setStatus, setLoading, setTxns, awardCashback, refreshBal, payId, setPayId, cleanErr, setShowConfirm });
  const { sendTo, setSendTo, sendAmt, setSendAmt, showScanner, setShowScanner, sendCtry, setSendCtry, handleSend, handleSendReview } = useSend({ signer, provider, address, walletName, rates, setStatus, setLoading, setTxns, awardCashback, refreshBal, cleanErr, setConfirmData, setConfirmAction, setShowConfirm });
  const convertedVal=(()=>{if(!sendAmt||!sendCtry)return null;const r=rates[CURRENCY[sendCtry]];if(!r)return null;return(parseFloat(sendAmt)*r).toLocaleString('en',{maximumFractionDigits:0});})();
  const { multi, setMulti, handleMulti, handleMultiReview } = useMulti({ signer, address, walletName, setStatus, setLoading, setTxns, awardCashback, refreshBal, cleanErr, setConfirmData, setConfirmAction, setShowConfirm, setShowWalletPrompt, getC });
  const txBadge=st=>({confirmed:'ap-tx-badge ap-tx-confirmed',pending:'ap-tx-badge ap-tx-pending',failed:'ap-tx-badge ap-tx-failed',submitted:'ap-tx-badge ap-tx-submitted'}[st]||'ap-tx-badge ap-tx-pending');

  const isDesktop=window.innerWidth>=769;
  const SIDEBAR_SECTIONS=[
    {title:'Transfers',items:[{id:'send',label:'Send',ICN:IC.SendFab,info:'Transfer USDC to any wallet instantly on Arc Testnet'},{id:'multi',label:'Multi Send',ICN:IC.Multi,info:'Send USDC to multiple recipients in one session'},{id:'invoice',label:'Invoice',ICN:IC.Invoice,info:'Create USDC payment requests stored on Supabase'},{id:'pay',label:'Pay Invoice',ICN:IC.Pay,info:'Look up and pay an invoice using its unique ID'}]},
    ...(isDesktop?[{title:'My Account',items:[{id:'history',label:'History',ICN:IC.History,info:'View all your transactions',dot:hasPendingTx},{id:'receive',label:'Receive',ICN:IC.Receive,info:'Generate QR code or payment link'},{id:'contacts',label:'Contacts',ICN:IC.Contacts,info:'Save wallet addresses for quick access'},{id:'rewards',label:'Rewards',ICN:IC.Rewards,info:'Earn cashback on every confirmed transaction'}]}]:[]),
    {title:'Analytics',items:[{id:'rates',label:'Exchange Rates',ICN:IC.Rates,info:'Live USDC to local currency conversion rates for 150+ countries'},{id:'fees',label:'Fee Compare',ICN:IC.Compare,info:'See how SparkPay compares to banks and other transfer services'}]},
    {title:'Tools',items:[{id:'schedule',label:'Scheduled',ICN:IC.Schedule,info:'Set up recurring payment reminders and pre-fill the Send form'},{id:'faucet',label:'Faucet',ICN:IC.Receive,info:'Claim 20 free testnet USDC every 2 hours via Circle Faucet'}]},
    {title:'More',items:[{id:'settings',label:'Settings',ICN:IC.Settings,info:'Customize your SparkPay experience'},{id:'about',label:'About SparkPay',ICN:IC.About,info:'Learn more about SparkPay and how it works'},{id:'faq',label:'FAQ',ICN:IC.About,info:'Frequently asked questions about SparkPay'}]},
  ];
  const BOTTOM_TABS=[{id:'history',label:'History',ICN:IC.History},{id:'receive',label:'Receive',ICN:IC.Receive},{id:'send',label:'Send',ICN:IC.SendFab,fab:true},{id:'contacts',label:'Contacts',ICN:IC.Contacts},{id:'rewards',label:'Rewards',ICN:IC.Rewards}];
  const PAGE_TITLES={send:'Send USDC',multi:'Multi Send',invoice:'Invoice',pay:'Pay Invoice',contacts:'Contacts',schedule:'Scheduled',history:'History',rates:'Exchange Rates',fees:'Fee Comparison',rewards:'Rewards',settings:'Settings',about:'About SparkPay',faq:'FAQ',receive:'Receive',faucet:'Faucet'};

  const renderSend=()=>(<>
    
    {contacts.length>0&&<div style={{marginBottom:16}}><div className="ap-label">Quick Select</div><div className="ap-quick-wrap">{contacts.map(c=><button key={c.id} className="ap-quick-pill" onClick={()=>{setSendTo(c.address);setSendCtry(c.country);}}><span className="ap-cc">{ALL_CC[c.country]||'?'}</span>{c.name}</button>)}</div></div>}
    <div className="ap-send-card">
      <div className="ap-send-panel">
        <div className="ap-send-lbl">You Send</div>
        <div className="ap-send-row">
          <input className="ap-amount-input" type="number" min="0" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
          <div className="ap-token-pill"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="var(--ac)" strokeWidth="2"/><line x1="12" y1="6" x2="12" y2="8.5" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"/><path d="M15.5 9.5H9.5a2 2 0 0 0 0 4H13a2 2 0 0 1 0 4H8" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17.5" x2="12" y2="20" stroke="var(--ac)" strokeWidth="2" strokeLinecap="round"/></svg>USDC</div>
        </div>
        {sendAmt&&<div style={{fontSize:12,color:'var(--tx3)',marginTop:8}}>${parseFloat(sendAmt)||0} USD</div>}
      </div>
      <div className="ap-recv-divider"><div className="ap-recv-icon"><IC.ArrowDown/></div></div>
      <div className="ap-send-panel recv">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,gap:12}}>
          <div className="ap-send-lbl" style={{marginBottom:0}}>They Receive <span style={{fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--tx3)',fontSize:10}}>(Optional)</span></div>
          <CountrySelect value={sendCtry} onChange={v=>setSendCtry(v)}/>
        </div>
        {convertedVal?(<><div className="ap-conv-amount">{convertedVal} {CURRENCY[sendCtry]}</div><div className="ap-conv-rate">1 USDC = {rates[CURRENCY[sendCtry]]?.toFixed(2)} {CURRENCY[sendCtry]} </div></>):(<div style={{fontSize:13,color:'var(--tx3)'}}>{sendCtry?'Enter an amount above to see the conversion':'Select a destination country to see conversion estimate'}</div>)}
      </div>
    </div>
    <div className="ap-card" style={{marginBottom:0}}>
      <div className="ap-label">Recipient Address</div>
      <div style={{display:'flex',gap:8,marginBottom:14}}><input className="ap-input" placeholder="0x..." value={sendTo} onChange={e=>setSendTo(e.target.value)} style={{marginBottom:0,flex:1}}/><button type="button" onClick={()=>setShowScanner(true)} className="ap-btn-icon" style={{flexShrink:0}} title="Scan QR Code"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="14.01"/><line x1="18" y1="14" x2="18" y2="14.01"/><line x1="14" y1="18" x2="14" y2="18.01"/><line x1="18" y1="18" x2="18" y2="18.01"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg></button></div>{showScanner&&<QRScanner onScan={(text)=>{
  let addr=text;
  try{
    const url=new URL(text);
    const payParam=url.searchParams.get('pay');
    if(payParam)addr=payParam;
  }catch(e){
    const match=text.match(/0x[a-fA-F0-9]{40}/);
    if(match)addr=match[0];
  }
  setSendTo(addr);
  setShowScanner(false);
}} onClose={()=>setShowScanner(false)}/>}
      
      <button className="ap-btn ap-btn-primary" onClick={handleSendReview} disabled={loading||!sendTo||!sendAmt}>{loading?'Processing...':'Review Transfer'}</button>
      <div className="ap-fee-note" style={{marginTop:8}}><IC.Check/> Estimated fee: ~0.0005 USDC on Arc Testnet</div>
    </div>
  </>);


  const renderInvoice=()=>(<div><div className="ap-card"><div className="ap-card-title">Create Invoice</div><div className="ap-card-sub">Request USDC payment. Stored on Supabase and payable from any device.</div><div className="ap-label">Client Wallet Address</div><input className="ap-input" placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Amount (USDC)</div><input className="ap-input" type="number" placeholder="500" value={invAmt} onChange={e=>setInvAmt(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Description</div><input className="ap-input" placeholder="Logo design - May 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Your Country (Optional)</div><CountrySelect value={invCtry} onChange={v=>setInvCtry(v)}/><button className="ap-btn ap-btn-primary" onClick={handleCreateInv} disabled={loading}>{loading?'Creating...':'Create Invoice'}</button>{invId&&(<div style={{marginTop:20}}><div style={{fontSize:13,fontWeight:700,color:'var(--cy)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><IC.Check/> Invoice created successfully</div><div className="ap-code">{invId}</div><div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}><button className="ap-btn ap-btn-sec" onClick={()=>navigator.clipboard?.writeText(invId)}><IC.Copy/> Copy ID</button><button className="ap-btn ap-btn-sec" onClick={()=>{setPayId(invId);setTab('pay');}}>Pay this Invoice</button></div></div>)}</div>{ls('arc_invoices',[]).length>0&&(<div className="ap-card"><div className="ap-card-title">Recent Invoices</div><div className="ap-div"/>{ls('arc_invoices',[]).slice(0,5).map((inv,i)=>(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--b0)'}}><div><div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>{inv.amount} USDC - {inv.desc?.slice(0,30)}</div><div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx2)',marginTop:2}}>{inv.id?.slice(0,18)}...</div></div><button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setPayId(inv.id);setTab('pay');}}>Pay</button></div>))}</div>)}</div>);

  const renderPay=()=>(<div className="ap-card"><div className="ap-card-title">Pay Invoice</div><div className="ap-card-sub">Enter an invoice ID to look it up and pay instantly.</div><div className="ap-label">Invoice ID</div><input className="ap-input" placeholder="0x..." value={payId} onChange={e=>{setPayId(e.target.value);setPayDet(null);}} style={{marginBottom:payDet?12:14}}/>{payDet&&(<div style={{background:'var(--acd)',border:'1px solid var(--acs)',borderRadius:12,padding:'14px 16px',marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:'var(--ac2)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>Invoice Details</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14,color:'var(--tx1)'}}><div><span style={{color:'var(--tx2)'}}>Amount:</span> <strong style={{color:'var(--tx1)'}}>{fmtUsdc(payDet.amount)} USDC</strong></div><div><span style={{color:'var(--tx2)'}}>Country:</span> <span style={{color:'var(--tx1)'}}>{payDet.country?<><span className="ap-cc">{ALL_CC[payDet.country]}</span> {payDet.country}</>:'N/A'}</span></div><div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>Description:</span> <span style={{color:'var(--tx1)'}}>{payDet.description}</span></div><div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>From:</span> <span style={{fontFamily:'monospace',fontSize:13,color:'var(--tx1)'}}>{short(payDet.creator)}</span></div></div></div>)}<button className="ap-btn ap-btn-primary" onClick={()=>handlePayInvReview(setConfirmData,setConfirmAction,setShowConfirm)} disabled={loading}>{loading?'Looking up...':'Find and Pay Invoice'}</button></div>);

  const renderContacts=()=>(<div><div className="ap-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><div className="ap-card-title">Contacts ({contacts.length})</div><div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Your saved wallet addresses</div></div><div style={{display:'flex',gap:8}}>{contacts.length>0&&<button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'7px 12px',color:manageContacts?'var(--re)':undefined}} onClick={()=>{setManageContacts(m=>!m);setSelectedContacts([]);}}>{manageContacts?'Done':'Manage'}</button>}<button className="ap-btn ap-btn-primary" style={{fontSize:13,padding:'8px 16px',whiteSpace:'nowrap',width:'auto'}} onClick={()=>{setShowAdd(s=>!s);setEditId(null);setCName('');setCAddr('');setCCtry('');}}>{showAdd?'Cancel':'+ Add'}</button></div></div>{showAdd&&<div style={{background:'var(--elev)',borderRadius:12,padding:14,marginBottom:12}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}><div><div className="ap-label">Name</div><input className="ap-input" style={{marginBottom:0}} placeholder="Sam" value={cName} onChange={e=>setCName(e.target.value)}/></div><div><div className="ap-label">Country</div><CountrySelect value={cCtry} onChange={v=>setCCtry(v)}/></div></div><div className="ap-label">Wallet Address</div><input className="ap-input" placeholder="0x..." value={cAddr} onChange={e=>setCAddr(e.target.value)} style={{marginBottom:10}}/><button className="ap-btn ap-btn-primary" style={{width:'100%'}} onClick={()=>{if(!cName.trim()||cAddr.trim().length!==42){setStatus({type:'error',msg:'Enter a valid name and address'});return;}if(editId){setContacts(p=>p.map(c=>c.id===editId?{...c,name:cName.trim(),address:cAddr.trim(),country:cCtry}:c));setEditId(null);}else{setContacts(p=>[{id:Date.now(),name:cName.trim(),address:cAddr.trim(),country:cCtry},...p]);}setCName('');setCAddr('');setCCtry('');setShowAdd(false);setStatus({type:'success',msg:'Contact saved'});}}>{editId?'Update Contact':'Save Contact'}</button></div>}{contacts.length>0&&<input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search contacts..." style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',marginBottom:12,boxSizing:'border-box'}}/>}{manageContacts&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select contacts to delete.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setSelectedContacts(contacts.map(c=>c.id))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button><button onClick={()=>setSelectedContacts([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>{selectedContacts.length>0&&<button onClick={()=>{if(window.confirm('Delete '+selectedContacts.length+' contacts?')){setContacts(p=>p.filter(c=>!selectedContacts.includes(c.id)));setSelectedContacts([]);setManageContacts(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Delete {selectedContacts.length} Selected</button>}</div></div>}{contacts.filter(ct=>!cSearch||ct.name.toLowerCase().includes(cSearch.toLowerCase())||ct.address.toLowerCase().includes(cSearch.toLowerCase())).map(ct=>(<div key={ct.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>{manageContacts?<input type="checkbox" checked={selectedContacts.includes(ct.id)} onChange={e=>setSelectedContacts(p=>e.target.checked?[...p,ct.id]:p.filter(x=>x!==ct.id))} style={{width:18,height:18,flexShrink:0}}/>:<div style={{width:44,height:44,borderRadius:14,background:addrColor(ct.address),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',flexShrink:0}}>{ct.name[0].toUpperCase()}</div>}<div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:6}}>{ct.country&&<span className="ap-cc">{ALL_CC[ct.country]||'?'}</span>}{ct.name}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:2,overflow:'hidden',textOverflow:'ellipsis'}}>{ct.address}</div></div><div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}><button className="ap-btn ap-btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>{setSendTo(ct.address);setSendCtry(ct.country);setTab('send');}}>Send</button><button onClick={()=>{setCAddr(ct.address);setCName(ct.name);setCCtry(ct.country||'');setEditId(ct.id);setShowAdd(true);}} style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}}>Edit Contact</button></div></div>))}</div>{[...new Set(txns.slice(0,20).map(t=>t.recipient).filter(Boolean))].slice(0,5).length>0&&<div className="ap-card"><div className="ap-card-title">Recent Recipients</div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:12}}>Quickly save from your recent transactions</div>{[...new Set(txns.slice(0,20).map(t=>t.recipient).filter(Boolean))].slice(0,5).map((addr,i)=>{const saved=contacts.find(ct=>ct.address.toLowerCase()===addr.toLowerCase());return(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--b0)'}}><div style={{width:44,height:44,borderRadius:14,background:addrColor(addr),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff',fontWeight:700,fontSize:14}}>{saved?saved.name[0].toUpperCase():addr.slice(2,4).toUpperCase()}</div><div style={{flex:1,minWidth:0,overflow:'hidden'}}>{saved?<div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{saved.name}</div>:<div/>}<div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis'}}>{addr.slice(0,10)}...{addr.slice(-6)}</div></div><div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}><button className="ap-btn ap-btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>{setSendTo(addr);setTab('send');}}>Send</button>{saved?<button style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}} onClick={()=>{setCAddr(saved.address);setCName(saved.name);setCCtry(saved.country||'');setEditId(saved.id);setShowAdd(true);}}>Edit Contact</button>:<button style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}} onClick={()=>{setCAddr(addr);setShowAdd(true);}}>Save Contact</button>}</div></div>);})}</div>}</div>);
const { handleSchedule, handleExecute, handleCancelSched } = useSchedule({ signer, address, newSched, setNewSched, setLoading, setStatus, setTxns, refreshBal });
const renderSchedule = () => (
  <div><div className="ap-card"><div className="ap-card-title">Schedule Payment</div><div className="ap-card-sub">Lock USDC now. It releases to the recipient automatically at your chosen time.</div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:16,lineHeight:1.7,paddingLeft:12,borderLeft:'2px solid var(--b2)'}}>USDC is locked in a smart contract escrow and released automatically when the time arrives. You can cancel anytime before release to get your USDC back.</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}><div><div className="ap-label">Recipient Address</div><input className="ap-input" style={{marginBottom:0}} placeholder="0x..." value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}/></div><div><div className="ap-label">Amount (USDC)</div><input className="ap-input" style={{marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/></div><div><div className="ap-label">Country</div><CountrySelect value={newSched.country} onChange={v=>setNewSched(s=>({...s,country:v}))}/></div><div><div className="ap-label">Release Date</div><input className="ap-input" style={{marginBottom:0}} type="date" value={newSched.next||''} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))} min={new Date(Date.now()+5*60000).toISOString().slice(0,10)}/></div><div><div className="ap-label">Release Time</div><TimePicker value={newSched.time||'12:00'} onChange={v=>setNewSched(s=>({...s,time:v}))}/></div></div><button className="ap-btn ap-btn-primary" onClick={handleSchedule} disabled={loading}>{loading?'Processing...':'Lock and Schedule Payment'}</button></div><OnChainSchedules address={address} provider={provider} signer={signer} schedAddr={SCHED_ADDR} schedAbi={SCHED_ABI} onExecute={handleExecute} onCancel={handleCancelSched} loading={loading}/></div>
);
const batchGroups={};allTxns.forEach(t=>{if(!t.hash)return;if(!batchGroups[t.hash])batchGroups[t.hash]=[];batchGroups[t.hash].push(t);});
  const dedupedTxns=Object.entries(batchGroups).map(([hash,txs])=>txs.length>1?{...txs[0],isBatch:true,batchTxns:txs,amount:txs.reduce((s,t)=>s+parseFloat(t.amount||0),0)}:txs[0]);
  const PAGE_SIZE=10;const filtered=dedupedTxns.filter(t=>{const ms=!txSearch||(t.recipient||'').toLowerCase().includes(txSearch.toLowerCase())||(t.hash||'').toLowerCase().includes(txSearch.toLowerCase());const mf=txFilter==='all'||(txFilter==='confirmed'&&(t.status==='confirmed'||t.status==='scheduled'))||(txFilter==='pending'&&(t.status==='pending'||t.status==='submitted'))||(txFilter==='failed'&&t.status==='failed');return ms&&mf;});const totalPages=Math.ceil(filtered.length/PAGE_SIZE)||1;const paginated=filtered.slice((txPage-1)*PAGE_SIZE,txPage*PAGE_SIZE);const today=new Date();const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const grouped=paginated.reduce((acc,t,i)=>{const d=t.timestamp?new Date(Number(t.timestamp)*1000):new Date();let label;if(d.toDateString()===today.toDateString())label='Today';else if(d.toDateString()===yesterday.toDateString())label='Yesterday';else label=d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});if(!acc[label])acc[label]=[];acc[label].push({...t,_idx:(txPage-1)*PAGE_SIZE+i});return acc;},{});const renderHistory=()=>(<div>{allTxns.length>0&&(<div className="ap-card"><div className="ap-card-title">Transfer Volume</div><div style={{marginTop:16}}><ResponsiveContainer width="100%" height={160}><AreaChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82C4" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82C4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--b0)"/><XAxis dataKey="label" tick={{fontSize:11,fill:'var(--tx3)'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:'var(--tx3)'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v} width={35}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:10,fontSize:13,color:'var(--tx1)'}}/><Area type="monotone" dataKey="sent" stroke="#3B82C4" fill="url(#cg)" strokeWidth={2} name="Sent (USDC)"/></AreaChart></ResponsiveContainer></div></div>)}<div className="ap-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><div className="ap-card-title">Transactions ({filtered.length})</div><div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Total sent: {totalSent.toFixed(2)} USDC</div></div><div style={{display:'flex',gap:8}}><button className="ap-btn ap-btn-sec" onClick={exportCSV} style={{fontSize:12,padding:'7px 12px'}}>Export CSV</button><button className="ap-btn ap-btn-sec" onClick={async()=>{await refreshPendingTxns();loadContractHistory();}} style={{fontSize:12,padding:'7px 12px'}}>Refresh</button><button className="ap-btn ap-btn-sec" onClick={()=>setManageTxns(m=>!m)} style={{fontSize:12,padding:'7px 12px',color:manageTxns?'var(--re)':undefined}}>{manageTxns?'Done':'Manage'}</button></div></div><div style={{display:'flex',gap:8,marginBottom:12}}><input value={txSearch} onChange={e=>{setTxSearch(e.target.value);setTxPage(1);}} placeholder="Search address or hash..." style={{flex:1,minWidth:0,padding:'8px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none'}}/><select value={txFilter} onChange={e=>{setTxFilter(e.target.value);setTxPage(1);}} style={{padding:'8px 10px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none'}}><option value="all">All</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></div>{manageTxns&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select transactions to delete. This only removes them from this device.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setSelectedTxns(dedupedTxns.map(t=>t.hash))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button><button onClick={()=>setSelectedTxns([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>{selectedTxns.length>0&&<button onClick={()=>{if(window.confirm('Delete '+selectedTxns.length+' transactions?')){const updated=txns.filter(t=>!selectedTxns.includes(t.hash));lsSave('arc_txhistory_'+address,updated);setTxns(updated);const newDeleted=new Set([...deletedHashes,...selectedTxns]);lsSave('arc_deleted_hashes_'+address,[...newDeleted]);setDeletedHashes(newDeleted);selectedTxns.forEach(h=>sbInsert('deleted_txns',{wallet_address:address,tx_hash:h}).catch(()=>{}));setSelectedTxns([]);setManageTxns(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Delete {selectedTxns.length} Selected</button>}</div></div>}{(()=>{const refunds=filtered.filter(t=>t.type==='refund');const nonRefunds=filtered.filter(t=>t.type!=='refund');const groupedNR=nonRefunds.reduce((acc,t,i)=>{const d=t.timestamp?new Date(Number(t.timestamp)*1000):new Date();let label;if(d.toDateString()===today.toDateString())label='Today';else if(d.toDateString()===yesterday.toDateString())label='Yesterday';else label=d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});if(!acc[label])acc[label]=[];acc[label].push({...t,_idx:i});return acc;},{});return(<>{refunds.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:1,padding:'8px 0 4px'}}>Refunds</div>{refunds.map((t,i)=>{const amt=Math.abs(parseFloat(typeof t.amount==='bigint'||(typeof t.amount==='object'&&t.amount!==null)?ethers.formatUnits(BigInt(t.amount.toString()),18):t.amount)).toFixed(2);return(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--b0)'}}><div style={{width:32,height:32,borderRadius:10,background:'rgba(23,229,176,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--cy)'}}><IC.Check/></div><div style={{flex:1}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>Refund</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{fmtDate(t.timestamp)}</div></div><div style={{textAlign:'right'}}><div style={{fontWeight:700,color:'var(--cy)',fontSize:14}}>+{amt} USDC</div></div></div>);})}</div>}{nonRefunds.length===0&&refunds.length===0?<div style={{textAlign:'center',color:'var(--tx3)',padding:'32px 0',fontSize:14}}>No transactions found</div>:Object.entries(groupedNR).map(([date,txs])=>(<div key={date}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:1,padding:'8px 0 4px'}}>{date}</div>{txs.map((t,i)=>{const isExp=expandedTx===t._idx;const amt=parseFloat(typeof t.amount==='bigint'||(typeof t.amount==='object'&&t.amount!==null)?ethers.formatUnits(BigInt(t.amount.toString()),18):t.amount).toFixed(2);return(<div key={i}><div className="ap-hist-row" onClick={()=>{if(!manageTxns)setExpandedTx(isExp?null:t._idx);}} style={{cursor:'pointer'}}><div className="ap-hist-icon">{manageTxns?<input type="checkbox" checked={!!(selectedTxns||[]).includes(t.hash)} onChange={e=>{e.stopPropagation();setSelectedTxns(prev=>e.target.checked?[...(Array.isArray(prev)?prev:[]),t.hash]:(Array.isArray(prev)?prev:[]).filter(h=>h!==t.hash));}} style={{width:18,height:18,cursor:'pointer'}} onClick={e=>e.stopPropagation()}/>:<IC.Send received={t.received}/>}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>{!t.isBatch&&t.country&&<span className="ap-cc">{ALL_CC[t.country]||'?'}</span>}{t.type==='scheduled'?'Scheduled Payment':t.type==='received'?'Received':t.type==='invoice'?'Invoice Payment':t.type==='refund'?'Refund':t.isBatch?'Batch Send ('+t.batchTxns.length+' recipients)':(t.country||'Transfer')}<span className={txBadge(t.status)}>{t.status||'pending'}</span>{t.isBatch&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:999,background:'rgba(59,130,196,.15)',color:'var(--ac)',fontWeight:600}}>Batch</span>}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:3,overflow:'hidden',textOverflow:'ellipsis'}}>{short(t.recipient)}</div></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{amt} USDC</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>{fmtDate(t.timestamp)}{t.type!=='refund'&&t.timestamp?' '+fmtTime(t.timestamp):''}</div></div></div>{isExp&&<div style={{background:'var(--elev)',borderRadius:10,padding:'10px 14px',marginBottom:8,fontSize:12,color:'var(--tx2)'}}>{t.isBatch?(<div style={{marginBottom:6}}><span style={{color:'var(--tx3)',fontWeight:600,display:'block',marginBottom:4}}>Recipients:</span>{t.batchTxns.map((bt,bi)=>(<div key={bi} style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:8,alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--b0)'}}><span style={{fontFamily:'monospace',fontSize:11,color:'var(--tx1)',overflow:'hidden',textOverflow:'ellipsis'}}>{short(bt.recipient)}</span><span style={{fontSize:11,color:'var(--tx2)'}}>{bt.country||'—'}</span><span style={{fontWeight:600,fontSize:11,textAlign:'right'}}>{parseFloat(bt.amount).toFixed(2)} USDC</span></div>))}</div>):(<div style={{marginBottom:6}}><span style={{color:'var(--tx3)'}}>To: </span><span style={{fontFamily:'monospace',wordBreak:'break-all'}}>{t.recipient}</span></div>)}{t.hash&&!t.hash.startsWith('0xdemo')&&<div style={{marginBottom:6}}><span style={{color:'var(--tx3)'}}>Hash: </span><span style={{fontFamily:'monospace',wordBreak:'break-all'}}>{t.hash}</span></div>}<div style={{display:'flex',gap:8,marginTop:8}}>{t.hash&&!t.hash.startsWith('0xdemo')&&<a href={'https://testnet.arcscan.app/tx/'+t.hash} target="_blank" rel="noreferrer" className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px'}}>View on Explorer</a>}{manageTxns&&<button onClick={e=>{e.stopPropagation();if(window.confirm('Delete this transaction?')){const updated=txns.filter(x=>x.hash!==t.hash);lsSave('arc_txhistory_'+address,updated);setTxns(updated);const newDeleted=new Set([...deletedHashes,t.hash]);lsSave('arc_deleted_hashes_'+address,[...newDeleted]);setDeletedHashes(newDeleted);sbInsert('deleted_txns',{wallet_address:address,tx_hash:t.hash}).catch(()=>{});}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 10px',fontSize:11,borderRadius:8,fontWeight:600}}>Delete</button>}</div></div>}</div>);})}</div>))}{totalPages>1&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:12}}><button onClick={()=>setTxPage(1)} disabled={txPage===1} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>«</button><button onClick={()=>setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>Prev</button><span style={{fontSize:12,color:'var(--tx3)'}}>{txPage} / {totalPages}</span><button onClick={()=>setTxPage(p=>Math.min(totalPages,p+1))} disabled={txPage===totalPages} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>Next</button></div>}</>);})()}</div></div>);



const renderRewards = () => <RewardsPage cashbackPending={cashbackPending} claimAmt={claimAmt} setClaimAmt={setClaimAmt} claimCashback={claimCashback} claimLoading={claimLoading} claimSubmitted={claimSubmitted} myClaimsHistory={myClaimsHistory} claimsLoading={claimsLoading} fetchMyClaims={fetchMyClaims} cashbackHistory={cashbackHistory}/>;



  const FaqPage=()=>{const[open,setOpen]=React.useState(null);const faqs=[['General',[['What is SparkPay?','SparkPay is a free app that lets you send USDC to anyone in the world. You connect your crypto wallet, enter the recipient address and amount, and the money reaches the recipient in seconds.'],['Do I need to create an account?','No. You just connect your existing crypto wallet like MetaMask or any WalletConnect compatible wallet. There is no sign up, no email, and no password required.'],['Is it really free to send?','Yes. SparkPay charges zero fees. The only cost would be network gas fees, but on Arc Testnet those are also effectively zero.'],['How long does a transfer take?','Usually a few seconds. Once your transaction is submitted to the blockchain, it confirms almost instantly on Arc Testnet.'],['Is my money safe?','SparkPay never touches your funds. You send directly from your own wallet. Nobody at SparkPay can access, hold, or move your money.']]],['Features',[['What is USDC Cashback?','Every time you send 5 USDC or more and the transaction confirms on chain, you earn 1% of the amount back as a reward. When your rewards reach 5 USDC, you can claim it directly to your wallet.'],['What is the Faucet?','The Faucet lets you claim free testnet USDC every 2 hours so you can try SparkPay without using real money. This is available because SparkPay runs on Arc Testnet.'],['Can I schedule payments?','Yes. The Scheduled tab lets you set up a reminder for a future payment. On the scheduled date, SparkPay will pre-fill the Send form so you can confirm with one tap.'],['What is Multi Send?','Multi Send lets you send USDC to multiple wallet addresses in one go. This is useful for paying several people at once, like a team or group.'],['What is an Invoice?','You can create a payment request with a specific amount and share it as a link or ID. The recipient can open it in SparkPay and pay it directly without needing to copy your address manually.']]],['Troubleshooting',[['I sent to the wrong address. What do I do?','Blockchain transactions cannot be reversed once confirmed. Always double check the recipient address before confirming. Save trusted addresses in your Contacts to avoid this in the future.'],['My transaction is stuck as pending.','Wait a few minutes and refresh the History tab. If it stays pending, check the transaction hash on testnet.arcscan.app. If it still does not resolve, contact support on Telegram.'],['My cashback is not showing up.','Cashback only applies to transactions of 5 USDC or more that are fully confirmed on chain. Check the Rewards tab after your transaction shows as confirmed in History.'],['I need more help.','If you cannot find an answer here, reach out directly on Telegram. Tap the button below and send a message describing your issue.']]]];return(<div><div className="ap-card"><div className="ap-card-title">Frequently Asked Questions</div><div className="ap-card-sub">Tap a question to see the answer.</div>{faqs.map(([section,items])=>(<div key={section} style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:8}}>{section}</div><div className="ap-div"/>{items.map(([q,a],i)=>{const key=section+i;return(<div key={key} style={{borderBottom:'1px solid var(--b0)'}}><div onClick={()=>setOpen(open===key?null:key)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',cursor:'pointer'}}><div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',paddingRight:12}}>{q}</div><div style={{fontSize:18,color:'var(--tx3)',flexShrink:0}}>{open===key?'−':'+'}</div></div>{open===key&&<div style={{fontSize:13,color:'var(--tx2)',lineHeight:1.8,paddingBottom:14}}>{a}</div>}</div>);})}</div>))}</div><div className="ap-card" style={{textAlign:'center'}}><div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:6}}>Still need help?</div><div style={{fontSize:12,color:'var(--tx2)',marginBottom:16}}>Contact us on Telegram and we will get back to you as soon as possible.</div><a href="https://t.me/Sam50506" target="_blank" rel="noreferrer" className="ap-btn ap-btn-primary" style={{textDecoration:'none',display:'block',textAlign:'center'}}>Chat on Telegram</a></div></div>);};
  const renderFaq=()=><FaqPage/>;
  const renderPage=()=>{switch(tab){case 'send':return renderSend();case 'multi':return <MultiSend multi={multi} setMulti={setMulti} loading={loading} handleMultiReview={handleMultiReview}/>;case 'invoice':return renderInvoice();case 'pay':return renderPay();case 'contacts':return renderContacts();case 'schedule':return renderSchedule();case 'history':return renderHistory();case 'rates':return <RatesPage rates={rates} rateSearch={rateSearch} setRateSearch={setRateSearch}/>;case 'fees':return <FeesPage/>;case 'rewards':return <RewardsPage cashbackPending={cashbackPending} claimAmt={claimAmt} setClaimAmt={setClaimAmt} claimCashback={claimCashback} claimLoading={claimLoading} claimSubmitted={claimSubmitted} myClaimsHistory={myClaimsHistory} claimsLoading={claimsLoading} fetchMyClaims={fetchMyClaims} cashbackHistory={cashbackHistory}/>;case 'receive':return <ReceivePage address={address} setShowQR={setShowQR}/>;case 'settings':return <SettingsPage dm={dm} setDm={setDm} defCtry={defCtry} setDefCtry={setDefCtry} setSendCtry={setSendCtry} address={address} pendingClaimsCount={pendingClaimsCount} setPendingClaimsCount={setPendingClaimsCount} setContacts={setContacts} setScheds={setScheds} setTxns={setTxns} setCashbackPending={setCashbackPending} setCashbackHistory={setCashbackHistory} setStatus={setStatus}/>;case 'about':return <AboutPage/>;case 'faq':return renderFaq();case 'faucet':return <Faucet address={address} balance={balance} setBalance={setBalance} faucetLoading={faucetLoading} setFaucetLoading={setFaucetLoading} faucetMsg={faucetMsg} setFaucetMsg={setFaucetMsg} lastClaim={lastClaim} setLastClaim={setLastClaim}/>;default:return renderSend();}};

  if(!isAdminRoute&&maintenanceLoaded&&maintenanceMode&&address&&address.toLowerCase()!==ADMIN_ADDRESS){
    return(<div style={{position:'fixed',inset:0,background:'#0a0a0a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:16}}>🛠️</div>
      <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:8}}>Under Maintenance</div>
      <div style={{fontSize:14,color:'#999',maxWidth:320,lineHeight:1.6}}>SparkPay is currently undergoing maintenance. Please check back shortly.</div>
    </div>);
  }
  if(isAdminRoute){
    return(<div className={'ap-root'+(dm?'':' light')}><style>{CSS}</style><AdminPanel address={address} signer={signer} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode}/>{!address&&<div style={{position:'fixed',bottom:24,left:0,right:0,display:'flex',justifyContent:'center'}}><div className="ap-connect-card" style={{maxWidth:360,width:'calc(100% - 48px)'}}><div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:16,color:'var(--tx1)',marginBottom:12}}>Connect Wallet</div><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowPicker(true)}>Connect Wallet</button>{showPicker&&<WalletPicker onPick={(type,p,name)=>{setShowPicker(false);if(name)setWalletName(name);connectBrowser(type,p);}} onClose={()=>setShowPicker(false)}/>}</div></div>}</div>);
  }
  return(
    <div className={'ap-root'+(dm?'':' light')}>
      <style>{CSS}</style>
      {splash&&<SplashScreen onDone={()=>setSplash(false)}/>}{!splash&&showOnboarding&&<OnboardingModal onDone={()=>{lsSave('arc_onboarded',true);setShowOnboarding(false);}}/>}
      {showWalletPrompt&&<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 16px 32px'}}><div style={{background:'var(--card)',borderRadius:24,padding:'28px 24px',width:'100%',maxWidth:480,textAlign:'center'}}><div style={{width:56,height:56,borderRadius:16,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='var(--ac)' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='7' width='20' height='14' rx='2'/><path d='M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2'/><line x1='12' y1='12' x2='12' y2='16'/><line x1='10' y1='14' x2='14' y2='14'/></svg></div><div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:18,color:'var(--tx1)',marginBottom:8}}>Confirm in Your Wallet</div><div style={{fontSize:14,color:'var(--tx2)',lineHeight:1.6,marginBottom:20}}>Open your wallet extension and confirm the transaction to complete the batch send to all recipients.</div><div style={{fontSize:12,color:'var(--tx3)'}}>Waiting for your confirmation...</div><button onClick={()=>setShowWalletPrompt(false)} style={{marginTop:20,background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'8px 24px',color:'var(--tx2)',fontSize:13,cursor:'pointer'}}>Cancel</button></div></div>}
        {showFaucetFrame&&<div style={{position:'fixed',inset:0,zIndex:999,background:'#000',display:'flex',flexDirection:'column'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#111'}}><span style={{color:'#fff',fontWeight:700}}>Circle Faucet</span><button onClick={()=>setShowFaucetFrame(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>×</button></div><iframe src={'https://faucet.circle.com/?address='+address+'&blockchain=ARC&token=USDC'} style={{flex:1,border:'none',width:'100%'}} title="Circle Faucet"/></div>}
      {showResumeModal&&savedSession&&<ResumeModal session={savedSession} onResume={()=>{setShowResumeModal(false);const wt=savedSession.walletType||'';if(wt&&wt!=='WalletConnect'){connectBrowser(wt);}else{setShowPicker(true);}}} onNew={()=>setShowResumeModal(false)}/>}
      {showConfirm&&confirmData&&<ConfirmModal data={confirmData} walletName={walletName} onConfirm={()=>{if(confirmAction)confirmAction()();}} onCancel={()=>{setShowConfirm(false);setConfirmData(null);setConfirmAction(null);}}/>}
      {showQR&&address&&<QRModal address={address} onClose={()=>setShowQR(false)}/>}
      {showCashbackToast&&cashbackToastData&&<CashbackToast amount={cashbackToastData.amount} rarity={cashbackToastData.rarity} onClose={()=>setShowCashbackToast(false)}/>}

      {!splash&&!address&&(
        <div style={{minHeight:'100vh',background:'var(--bg)',overflowY:'auto'}}>
          {/* Hero Section */}
          <div style={{maxWidth:480,margin:'0 auto',padding:'16px 24px 0'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:40}}>
              <SparkPayLogo size={48}/>
              <span style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:18,color:'var(--tx1)'}}>SparkPay</span>
            </div>
            <div style={{textAlign:'center',marginBottom:40}}>
              <div style={{fontFamily:'var(--fd)',fontSize:40,fontWeight:900,color:'var(--tx1)',lineHeight:1.1,letterSpacing:'-0.5px',marginBottom:12}}>Send USDC<br/><span style={{color:'var(--ac)'}}>Globally.</span></div>
              <div style={{fontSize:14,color:'var(--tx2)',lineHeight:1.6}}>Send money across borders instantly.<br/>Zero fees. Instant settlement. Powered by Arc.</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:32}}>
              {[['150+','Countries'],['~0','Fees'],['Instant','Settlement']].map(([v,l])=>(
                <div key={l} style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:14,padding:'14px 8px',textAlign:'center'}}>
                  <div style={{fontFamily:'var(--fd)',fontSize:18,fontWeight:900,color:'var(--ac)'}}>{v}</div>
                  <div style={{fontSize:10,color:'var(--tx3)',marginTop:3,fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Connect Card */}
            <div className="ap-connect-card" style={{marginBottom:48}}>
              <div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:18,color:'var(--tx1)',marginBottom:4}}>Get Started</div>
              <div style={{fontSize:13,color:'var(--tx2)',marginBottom:20}}>Connect your wallet to start sending USDC</div>
              <div className="ap-connect-btns">
                {showPicker?<WalletPicker onPick={(type,p,name)=>{setShowPicker(false);if(name)setWalletName(name);connectBrowser(type,p);}} onClose={()=>setShowPicker(false)}/>:<><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowPicker(true)}>Connect Wallet</button><div className="ap-cdivider">or</div><button className="ap-btn ap-btn-outline-full" onClick={connectWC}><IC.WC/> Connect via WalletConnect</button><ConnectTroubleshoot/></>}
              </div>
            </div>
          </div>
        </div>
      )}
      {address&&(
        <div className="ap-layout">
          <aside className={'ap-sidebar'+(mobOpen?' mob-open':'')}>
            <div className="ap-logo-area"><img src="/sparkpay-logo.jpg" width="50" height="50" style={{borderRadius:0,objectFit:"contain",background:"none"}}/><div><div className="ap-logo-name">SparkPay</div><div className="ap-logo-tag">Remittance</div></div></div>
            <nav className="ap-nav">
              {SIDEBAR_SECTIONS.map(sec=>(<div key={sec.title}><div className="ap-nav-sec">{sec.title}</div>{sec.items.map(({id,label,ICN,info,dot})=>(<div key={id} className={'ap-nav-item'+(tab===id?' active':'')} onClick={()=>{setTab(id);setMobOpen(false);setStatus(null);}}><ICN/>{label}{dot&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--re)',display:'inline-block',marginLeft:2,flexShrink:0}}/>}<NavTooltip text={info}/></div>))}</div>))}
            </nav>
            <div className="ap-sidebar-foot">
              <div className="ap-net-badge"><span className="ap-net-dot"/>Arc Testnet<span style={{color:'var(--tx3)',marginLeft:4,fontWeight:500}}>#5042002</span></div>
              <div className="ap-wallet-pill"><div className="ap-wallet-icon"><IC.Wallet/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase'}}>{walletName||'Wallet'}</div><div style={{fontSize:12,fontWeight:600,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{short(address)}</div></div><div style={{fontSize:13,fontWeight:700,color:'var(--ac2)',fontFamily:'var(--fd)'}}>${balance}</div></div>
            </div>
          </aside>
          {mobOpen&&<div onClick={()=>setMobOpen(false)} style={{position:'fixed',inset:0,zIndex:99,background:'transparent'}}/>}
          <div className="ap-topbar">
            <div style={{display:'flex',alignItems:'center',gap:12}}><button className="ap-btn-icon mob-show" onClick={()=>setMobOpen(true)} style={{border:'none',background:'var(--elev)'}}><IC.Menu/></button><span style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:16,letterSpacing:'-.2px',color:'var(--tx1)'}}>{PAGE_TITLES[tab]||'SparkPay'}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:13,color:'var(--ac2)',background:'var(--acd)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--acs)'}}>${balance}</div><div className="ap-badge ap-badge-blue mob-hide" style={{padding:'6px 12px',fontSize:12,fontFamily:'monospace'}}>{short(address)}</div><button className="ap-btn ap-btn-icon" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button><button className="ap-btn ap-btn-danger" onClick={doDisconnect}>Disconnect</button></div>
          </div>
          <div className="ap-page"><div className="ap-page-enter">{status&&<div className={statusCls(status)} style={{marginBottom:20}}>{status.msg}</div>}{renderPage()}<div style={{textAlign:'center',marginTop:28,fontSize:11,color:'var(--tx3)'}}>SparkPay on Arc Testnet, Chain {ARC_CHAIN_ID} &nbsp;<a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{color:'var(--ac)',textDecoration:'none'}}>Block Explorer</a></div></div></div>
          <nav className="ap-botnav">
            {BOTTOM_TABS.map(({id,label,ICN,fab})=>fab?(<div key={id} className={'ap-bot-fab-wrap'+(tab===id?' active':'')} onClick={()=>setTab(id)}><div className="ap-fab"><ICN/></div><span>{label}</span></div>):(<div key={id} className={'ap-bot-item'+(tab===id?' active':'')} onClick={()=>setTab(id)}><div style={{position:'relative',display:'inline-flex'}}><ICN/>{id==='rewards'&&cashbackPending>0&&<span className="ap-ndot"/>}</div>{label}</div>))}
          </nav>
        </div>
      )}
    </div>
  );
}




const ConnectTroubleshoot=()=>{const[open,setOpen]=React.useState(false);const[item,setItem]=React.useState(null);const issues=[['My wallet is not showing up in the list.','Make sure your wallet app is installed on this device and you are using a browser that supports wallet connections. On mobile, try opening SparkPay directly inside your wallet app browser.'],['I approved the connection but nothing happened.','Close the wallet popup and try connecting again. Sometimes the connection request times out. If it keeps happening, refresh the page and try once more.'],['It says wrong network or chain.','SparkPay runs on Arc Testnet. Open your wallet, go to network settings, and switch to Arc Testnet. If Arc Testnet is not listed, SparkPay will add it automatically when you connect.'],['WalletConnect QR code is not appearing.','Make sure you are not blocking popups in your browser. Try switching to a different browser or use the direct Connect Wallet button instead.'],['I clicked WalletConnect but nothing happened.','WalletConnect takes a few seconds to load all supported wallets. Wait 6 to 7 seconds and the popup will appear on its own. Do not tap the button again.'],['Nothing is working.','Reach out on Telegram and describe what is happening. We will help you get connected.']];return(<div style={{marginTop:16}}><button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',color:'var(--tx3)',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 0',display:'flex',alignItems:'center',gap:6,width:'100%',justifyContent:'center'}}><span>{open?'Hide':'Having trouble connecting?'}</span><span style={{fontSize:14}}>{open?'−':'+'}</span></button>{open&&<div style={{marginTop:12,borderRadius:12,border:'1px solid var(--b1)',overflow:'hidden'}}>{issues.map(([q,a],i)=>(<div key={i} style={{borderBottom:i<issues.length-1?'1px solid var(--b0)':'none'}}><div onClick={()=>setItem(item===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',cursor:'pointer'}}><div style={{fontSize:12,fontWeight:600,color:'var(--tx1)',paddingRight:8,textAlign:'left'}}>{q}</div><div style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>{item===i?'−':'+'}</div></div>{item===i&&<div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.8,padding:'0 14px 12px'}}>{a}{i===issues.length-1&&<a href='https://t.me/Sam50506' target='_blank' rel='noreferrer' style={{display:'block',marginTop:10,color:'var(--ac)',fontWeight:700,textDecoration:'none'}}>Open Telegram</a>}</div>}</div>))}</div>}</div>);};

function App(){return <AppInner/>;}
export default App;