import React, { useState, useEffect, useCallback, useRef } from 'react';

import Lottie from 'lottie-react';
import arcpayAnimation from './arcpay-animation.json';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0A0E1A;--surf:#111827;--card:#1A2235;--elev:#1F2A3F;--hov:#243048;
  --b0:#2A3550;--b1:#334060;--b2:#3D4D72;--b3:#4F6090;
  --tx1:#F0F4FF;--tx2:#A0AECA;--tx3:#5A6A8A;
  --ac:#4D9FE0;--ac2:#70B8F0;--acd:rgba(77,159,224,.15);--acs:rgba(77,159,224,.3);
  --cy:#17E5B0;--re:#FF4F61;--ye:#F0C43F;
  --fd:'Syne',sans-serif;--fb:'DM Sans',sans-serif;
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
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes spinCW{to{transform:rotate(360deg)}}
@keyframes spinCCW{to{transform:rotate(-360deg)}}
@keyframes fillBar{from{width:0}to{width:100%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes cashPop{0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(.9)}60%{transform:translateX(-50%) translateY(-3px) scale(1.03)}100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}
.ap-splash{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:999;transition:opacity .55s ease,transform .55s ease}
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
.ap-sidebar.mob-open{transform:translateX(0)!important;box-shadow:0 0 60px rgba(0,0,0,.65)}
.ap-content{flex:1;margin-left:256px;display:flex;flex-direction:column;height:100vh;overflow:hidden}
.ap-topbar{height:62px;border-bottom:1px solid var(--b0);display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:var(--bg);flex-shrink:0}
.ap-page{flex:1;overflow-y:auto;padding:28px 28px 40px;background:var(--bg);min-height:100%}
.ap-page-enter{animation:scaleIn .22s ease both;max-width:580px}
.ap-logo-area{padding:20px 16px 17px;border-bottom:1px solid var(--b0);display:flex;align-items:center;gap:11px}
.ap-logo-name{font-family:var(--fd);font-weight:800;font-size:17px;letter-spacing:-.3px;line-height:1;color:var(--tx1)}
.ap-logo-tag{font-size:10px;color:var(--tx3);font-weight:600;letter-spacing:.07em;margin-top:2px;text-transform:uppercase}
.ap-nav{flex:1;padding:8px 0;overflow-y:auto}
.ap-nav-sec{font-size:10px;font-weight:700;color:var(--tx3);letter-spacing:.1em;padding:10px 20px 4px;text-transform:uppercase}
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
.ap-status{padding:12px 16px;border-radius:12px;margin-bottom:16px;font-size:13.5px;font-weight:500;display:flex;align-items:flex-start;gap:9px;line-height:1.5;animation:slideUp .2s ease}
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
.ap-country-pill{display:inline-flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--b1);border-radius:999px;padding:7px 12px;cursor:pointer;font-size:12px;font-weight:600;color:var(--tx1);white-space:nowrap;transition:all .14s;flex-shrink:0;position:relative}
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
.ap-botnav{display:none;position:fixed;bottom:0;left:0;right:0;background:var(--surf);border-top:1px solid var(--b0);padding:6px 0 calc(6px + env(safe-area-inset-bottom));z-index:100;align-items:flex-end}
.ap-bot-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:5px 2px;cursor:pointer;font-size:10px;font-weight:600;color:var(--tx2);transition:color .14s;position:relative}
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
  .ap-content{margin-left:0}
  .ap-page{padding:18px 16px 96px}
  .ap-botnav{display:flex}
  .mob-hide{display:none!important}
  .ap-topbar{padding:0 16px}
  .ap-page-enter{max-width:100%}
  .ap-tip-pop{left:auto;right:calc(100% + 10px)}
}
@media(min-width:769px){.mob-show{display:none!important}}
`;

const IC = {
  Send:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Multi:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/></svg>,
  Invoice:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Pay:      ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Contacts: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Schedule: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  History:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Rates:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  Compare:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Settings: ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Rewards:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Receive:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>,
  About:    ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Wallet:   ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  Menu:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Close:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Copy:     ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  ArrowDown:()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  Ext:      ()=><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  XLogo:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Gift:     ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  WC:       ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 12.5c4-4 11-4 15 0"/><path d="M7.5 15.5c2.5-2.5 7-2.5 9 0"/><path d="M10.5 18.5c1-1 3-1 4 0"/></svg>,
  Blog:     ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Alert:    ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

const ArcPayLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="#0F1A2E"/>
    <defs>
      <linearGradient id="ag" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#7AAFD4"/>
      </linearGradient>
    </defs>
    <path d="M50 14C29 14 17 30 17 47L17 54L27 54L27 47C27 34 37 24 50 24C63 24 73 34 73 47L73 54L83 54L83 47C83 30 71 14 50 14Z" fill="url(#ag)"/>
    <rect x="34" y="54" width="10" height="22" rx="2" fill="url(#ag)"/>
    <rect x="56" y="54" width="10" height="22" rx="2" fill="url(#ag)"/>
    <rect x="44" y="60" width="12" height="16" rx="2" fill="url(#ag)" opacity="0.5"/>
  </svg>
);
const ONBOARDING_SLIDES=[
  {icon:'📤',title:'Send USDC',desc:'Transfer USDC instantly to any wallet on Arc Testnet. Near-zero fees, confirmed in seconds.'},
  {icon:'📥',title:'Receive',desc:'Generate your QR code or payment link. Share it with anyone to get paid instantly.'},
  {icon:'📋',title:'History',desc:'Track all your transactions with real-time status. Export as CSV anytime.'},
  {icon:'👥',title:'Contacts',desc:'Save frequent wallet addresses for quick access when sending.'},
  {icon:'⭐',title:'Rewards',desc:'Earn cashback on every confirmed transaction. Claim when you reach 10 USDC.'},
  {icon:'📄',title:'Invoice',desc:'Create USDC payment requests stored on Supabase. Share the ID with your client.'},
  {icon:'💳',title:'Pay Invoice',desc:'Enter an invoice ID to look it up and pay instantly from anywhere.'},
  {icon:'🔀',title:'Multi Send',desc:'Send USDC to multiple recipients in one session. Perfect for payroll or batch payments.'},
  {icon:'📅',title:'Scheduled',desc:'Set up recurring payment reminders and pre-fill the Send form automatically.'},
];

const OnboardingModal=({onDone})=>{
  const[slide,setSlide]=useState(0);
  const last=slide===ONBOARDING_SLIDES.length-1;
  const s=ONBOARDING_SLIDES[slide];
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:998,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <div style={{background:'var(--card)',borderRadius:24,padding:'32px 24px',maxWidth:360,width:'100%',textAlign:'center',boxShadow:'0 8px 40px rgba(0,0,0,0.4)'}}>
        <div style={{fontSize:56,marginBottom:16}}>{s.icon}</div>
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

const SplashScreen = ({ onDone }) => {
  const [exit, setExit] = useState(false);
  useEffect(() => { const t1=setTimeout(()=>setExit(true),1800); const t2=setTimeout(()=>onDone(),2300); return()=>{clearTimeout(t1);clearTimeout(t2);}; }, [onDone]);
  return (
    <div className={`ap-splash${exit?' exit':''}`} style={{background:'#000',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'fixed',inset:0}}>
      <style>{`
        @keyframes orbitSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes orbitSpinRev{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
        @keyframes pulse{0%,100%{opacity:.6;filter:blur(2px)}50%{opacity:1;filter:blur(0px)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 30px 8px rgba(0,120,255,.4)}50%{box-shadow:0 0 60px 20px rgba(0,180,255,.8)}}
        @keyframes textReveal{0%{opacity:0;letter-spacing:0.5em;filter:blur(8px)}100%{opacity:1;letter-spacing:-0.02em;filter:blur(0)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes energyFlow{0%{stroke-dashoffset:1000}100%{stroke-dashoffset:0}}
      `}</style>
      {/* Orbit rings with text inside */}
      <div style={{position:'relative',width:280,height:280,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:40}}>
        <div style={{position:'absolute',width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle, rgba(0,100,255,0.12) 0%, transparent 70%)',animation:'glowPulse 2s ease-in-out infinite'}}/>
        <div style={{position:'absolute',width:260,height:260,borderRadius:'50%',border:'2px solid transparent',borderTop:'2px solid rgba(0,160,255,0.9)',borderRight:'2px solid rgba(0,160,255,0.3)',boxShadow:'0 0 20px rgba(0,160,255,0.5)',animation:'orbitSpin 2s linear infinite'}}/>
        <div style={{position:'absolute',width:220,height:220,borderRadius:'50%',border:'1.5px solid transparent',borderBottom:'1.5px solid rgba(0,210,255,0.8)',borderLeft:'1.5px solid rgba(0,210,255,0.2)',boxShadow:'0 0 12px rgba(0,210,255,0.4)',animation:'orbitSpinRev 1.5s linear infinite'}}/>
        <div style={{position:'absolute',width:180,height:180,borderRadius:'50%',border:'1px solid transparent',borderTop:'1px solid rgba(100,230,255,0.5)',animation:'orbitSpin 3s linear infinite'}}/>
        <div style={{position:'absolute',width:260,height:260,borderRadius:'50%',animation:'orbitSpin 2s linear infinite'}}>
          <div style={{position:'absolute',top:-5,left:'50%',width:10,height:10,borderRadius:'50%',background:'#00d4ff',boxShadow:'0 0 16px 6px rgba(0,212,255,0.9)',transform:'translateX(-50%)'}}/>
        </div>
        <div style={{position:'absolute',width:220,height:220,borderRadius:'50%',animation:'orbitSpinRev 1.5s linear infinite'}}>
          <div style={{position:'absolute',bottom:-5,left:'50%',width:8,height:8,borderRadius:'50%',background:'#0088ff',boxShadow:'0 0 12px 4px rgba(0,136,255,0.9)',transform:'translateX(-50%)'}}/>
        </div>
        {/* ArcPay text inside rings */}
        <div style={{position:'relative',zIndex:2,textAlign:'center'}}>
          <div style={{fontFamily:'var(--fd)',fontSize:42,fontWeight:900,background:'linear-gradient(180deg, #ffffff 0%, #a0c8ff 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'textReveal .8s .3s both',letterSpacing:'-0.03em',lineHeight:1}}>ArcPay</div>
        </div>
      </div>
      <div style={{fontSize:12,color:'rgba(0,180,255,0.7)',letterSpacing:'0.25em',textTransform:'uppercase',fontWeight:600,animation:'fadeInUp .6s .8s both'}}>Decentralized Remittance</div>
      <div style={{position:'absolute',bottom:32,fontSize:11,color:'rgba(255,255,255,0.2)',animation:'fadeInUp .6s 1.2s both'}}>Arc Testnet &nbsp;·&nbsp; Chain 5042002</div>
    </div>
  );
};

function getProvider() {
  return new Promise((resolve) => {
    const tryResolve = () => {
      if(window.mises?.ethereum) return window.mises.ethereum;
      const {ethereum}=window; if(!ethereum) return null;
      if(ethereum.providers?.length>0){
        const mises=ethereum.providers.find(p=>p.isMises);if(mises)return mises;
        const mm=ethereum.providers.find(p=>p.isMetaMask&&!p.isBraveWallet);if(mm)return mm;
        return ethereum.providers[0];
      }
      if(ethereum.isMises) return ethereum;
      if(ethereum.isMetaMask||ethereum._metamask) return ethereum;
      return ethereum;
    };
    const result=tryResolve(); if(result) return resolve(result);
    let attempts=0; const timer=setInterval(()=>{attempts++;const r=tryResolve();if(r){clearInterval(timer);return resolve(r);}if(attempts>30){clearInterval(timer);resolve(null);}},100);
  });
}

const ARC_CHAIN_ID=5042002, ARC_CHAIN_HEX='0x4CEF52';
const ARC_RPC    = process.env.REACT_APP_ARC_RPC||'';
const ARC_RPC_FALLBACK='https://rpc.testnet.arc.network';
const REMIT_ADDR = process.env.REACT_APP_REMIT_ADDR||'0x91F07CE441cD7c39C4c43EB86A7ABd6F9cc48F44';
const USDC_ADDR  = process.env.REACT_APP_USDC_ADDR||'0x3600000000000000000000000000000000000000';
const WC_ID      = process.env.REACT_APP_WC_ID||'';
const SB_URL     = process.env.REACT_APP_SUPABASE_URL||'';
const SB_KEY     = process.env.REACT_APP_SUPABASE_ANON_KEY||'';
const APP_URL    = 'https://arc-remittance.vercel.app';

const sbFetch=(path,opts={})=>fetch(SB_URL+path,{...opts,headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}}).then(async r=>{if(!r.ok)throw new Error(await r.text());return r.json();});
const sbInsert=(table,data)=>sbFetch('/rest/v1/'+table,{method:'POST',body:JSON.stringify(data)});
const sbSelect=(table,query)=>sbFetch('/rest/v1/'+table+'?'+query);
const sbUpdate=(table,query,data)=>sbFetch('/rest/v1/'+table+'?'+query,{method:'PATCH',body:JSON.stringify(data)});

const COUNTRIES=['Pakistan','Nigeria','India','Philippines','Bangladesh','Mexico','Brazil','Indonesia','Vietnam','Ghana','Kenya','Egypt','Turkey','Argentina','Colombia','Ukraine','Ethiopia','Tanzania','Uganda','Nepal'];
const CC={Pakistan:'PK',Nigeria:'NG',India:'IN',Philippines:'PH',Bangladesh:'BD',Mexico:'MX',Brazil:'BR',Indonesia:'ID',Vietnam:'VN',Ghana:'GH',Kenya:'KE',Egypt:'EG',Turkey:'TR',Argentina:'AR',Colombia:'CO',Ukraine:'UA',Ethiopia:'ET',Tanzania:'TZ',Uganda:'UG',Nepal:'NP'};
const CURRENCY={Pakistan:'PKR',Nigeria:'NGN',India:'INR',Philippines:'PHP',Bangladesh:'BDT',Mexico:'MXN',Brazil:'BRL',Indonesia:'IDR',Vietnam:'VND',Ghana:'GHS',Kenya:'KES',Egypt:'EGP',Turkey:'TRY',Argentina:'ARS',Colombia:'COP',Ukraine:'UAH',Ethiopia:'ETB',Tanzania:'TZS',Uganda:'UGX',Nepal:'NPR'};

const REMIT_ABI=[
  {inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}],name:'createInvoice',outputs:[{name:'',type:'bytes32'}],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}],name:'payInvoice',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}],name:'sendMoney',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getPayments',outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'},{name:'invoiceId',type:'bytes32'}],name:'',type:'tuple[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getUserInvoices',outputs:[{name:'',type:'bytes32[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'bytes32'}],name:'invoices',outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'createdAt',type:'uint256'},{name:'nonce',type:'uint256'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'address'}],name:'nonces',outputs:[{name:'',type:'uint256'}],stateMutability:'view',type:'function'}
];
const ERC20_ABI=['function balanceOf(address) view returns (uint256)','function allowance(address,address) view returns (uint256)','function approve(address,uint256) returns (bool)','function transfer(address,uint256) returns (bool)','function decimals() view returns (uint8)'];

const short  =a=>a?a.slice(0,6)+'...'+a.slice(-4):'';
const fmtUsdc=v=>v!=null?parseFloat(ethers.formatUnits(BigInt(v.toString()),6)).toFixed(2):'0.00';
const fmtDate=ts=>ts?new Date(Number(ts)*1000).toLocaleDateString('en',{month:'short',day:'numeric'}):'';
const ls     =(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
const lsSave =(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

async function awaitReceipt(provider,hash,ms=90000){
  const end=Date.now()+ms;
  let rpcProvider=null;
  try{if(ARC_RPC)rpcProvider=new ethers.JsonRpcProvider(ARC_RPC,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});}catch(_){}
  while(Date.now()<end){
    try{const p=rpcProvider||provider;const r=await p.getTransactionReceipt(hash);if(r)return r;}catch(_){}
    await new Promise(res=>setTimeout(res,2000));
  }
  return null;
}

function buildChart(txns){
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return{label:d.toLocaleDateString('en',{weekday:'short'}),sent:0};});
  txns.forEach(tx=>{const label=new Date(Number(tx.timestamp)*1000).toLocaleDateString('en',{weekday:'short'});const slot=days.find(d=>d.label===label);if(slot){const n=parseFloat(typeof tx.amount==='object'?fmtUsdc(tx.amount):tx.amount);slot.sent+=isNaN(n)?0:n;}});
  return days;
}

function CountrySelect({value,onChange}){
  const[open,setOpen]=React.useState(false);
  const sheetRef=React.useRef(null);
  const isOKX=navigator.userAgent.includes('OKApp')||navigator.userAgent.includes('OKX');
  if(isOKX){
    return(<>
      <div className={`ap-country-pill${!value?' empty':''}`} onClick={()=>{setOpen(o=>!o);window.scrollTo(0,0);}} style={{cursor:'pointer'}}>
        {value?<><span className="ap-cc">{CC[value]}</span><span style={{maxWidth:72,overflow:'hidden',textOverflow:'ellipsis',fontSize:13}}>{value}</span></>:<span style={{fontSize:13}}>Select country</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:4,flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open&&<div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end'}} onClick={()=>setOpen(false)}>
        <div style={{background:'var(--card)',width:'100%',maxHeight:'60vh',display:'flex',flexDirection:'column',borderRadius:'20px 20px 0 0'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',fontSize:14,color:'var(--ac)',cursor:'pointer',fontWeight:600}}>Cancel</button>
            <span style={{fontWeight:700,fontSize:15,color:'var(--tx1)'}}>Select Country</span>
            <span style={{width:56}}/>
          </div>
          <div ref={el=>{if(el)el.scrollTop=0;}} style={{overflowY:'auto',flex:1}}>
            <div onClick={()=>{onChange('');setOpen(false);}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx2)',borderBottom:'1px solid var(--b0)'}}>None (Optional)</div>
            {COUNTRIES.map(c=><div key={c} onClick={()=>{onChange(c);setOpen(false);}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx1)',borderBottom:'1px solid var(--b0)',display:'flex',alignItems:'center',gap:8,background:value===c?'var(--acd)':'transparent'}}><span className="ap-cc">{CC[c]}</span>{c} <span style={{color:'var(--tx3)',fontSize:12}}>({CURRENCY[c]})</span></div>)}
          </div>
        </div>
      </div>}
    </>);
  }
  return(
    <div style={{position:'relative',display:'block',width:'100%'}}>
      <div className={`ap-country-pill${!value?' empty':''}`} style={{pointerEvents:'none',userSelect:'none',position:'absolute',inset:0,display:'flex',alignItems:'center',paddingLeft:10,paddingRight:6,gap:4,zIndex:0}}>
        {value?<><span className="ap-cc">{CC[value]}</span><span style={{maxWidth:72,overflow:'hidden',textOverflow:'ellipsis',fontSize:13}}>{value}</span></>:<span style={{fontSize:13}}>Select country</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{position:'relative',zIndex:1,opacity:0.01,cursor:'pointer',width:'100%',minWidth:100,height:40,fontSize:16,border:'none',background:'transparent'}}>
        <option value="">None (Optional)</option>
        {COUNTRIES.map(c=><option key={c} value={c}>{c} ({CURRENCY[c]})</option>)}
      </select>
    </div>
  );
}

function OKXSelect({value, onChange, options, style}){
  const isOKX=navigator.userAgent.includes('OKApp')||navigator.userAgent.includes('OKX');
  if(isOKX){
    const[open,setOpen]=React.useState(false);
    return(<>
      <div style={{...style,padding:'10px 14px',borderRadius:12,border:'1px solid var(--b1)',background:'var(--elev)',fontSize:14,color:value?'var(--tx1)':'var(--tx3)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,minHeight:44}} onClick={()=>setOpen(o=>!o)}>
        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{options.find(o=>o.value===value)?.label||'Select...'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open&&<div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-end'}} onClick={()=>setOpen(false)}>
        <div style={{background:'var(--card)',width:'100%',height:'55vh',overflowY:'auto',borderRadius:'20px 20px 0 0',paddingBottom:16}} onClick={e=>e.stopPropagation()}>
          <div style={{textAlign:'center',fontWeight:700,fontSize:15,padding:'12px 16px',borderBottom:'1px solid var(--b0)',color:'var(--tx1)'}}>Select Country</div>
          {options.map(o=><div key={o.value} onClick={()=>{onChange(o.value);setOpen(false);}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx1)',borderBottom:'1px solid var(--b0)',background:value===o.value?'var(--acd)':'transparent'}}>{o.label}</div>)}
        </div>
      </div>}
    </>);
  }
  return(
    <div style={{position:'relative',display:'inline-block',width:'100%'}}>
      <div style={{pointerEvents:'none',userSelect:'none',position:'absolute',inset:0,display:'flex',alignItems:'center',paddingLeft:14,paddingRight:14,gap:4,zIndex:0,background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:12}}>
        <span style={{fontSize:14,color:value?'var(--tx1)':'var(--tx3)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{options.find(o=>o.value===value)?.label||'Select...'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{...style,position:'relative',zIndex:1,opacity:0.01,cursor:'pointer',width:'100%',height:44,fontSize:16,border:'none',background:'transparent',display:'block'}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NavTooltip({text}){
  const[open,setOpen]=useState(false);const ref=useRef(null);
  useEffect(()=>{if(!open)return;const close=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener('mousedown',close);document.addEventListener('touchstart',close);return()=>{document.removeEventListener('mousedown',close);document.removeEventListener('touchstart',close);};},[open]);
  return(<span ref={ref} style={{position:'relative',display:'inline-flex',flexShrink:0}}><i className="ni mob-hide" onClick={e=>{e.stopPropagation();setOpen(o=>!o);}}>i</i>{open&&<div className="ap-tip-pop">{text}</div>}</span>);
}

function ConfirmModal({data,onConfirm,onCancel,walletName}){
  return(
    <div className="ap-modal-bg" onClick={onCancel}>
      <div className="ap-modal" onClick={e=>e.stopPropagation()}>
        <div className="ap-modal-title">Review Transfer</div>
        {walletName?.toLowerCase().includes('okx')&&<div style={{background:'rgba(255,165,0,.1)',border:'1px solid rgba(255,165,0,.3)',borderRadius:10,padding:'8px 12px',fontSize:12,color:'#FFA500',marginBottom:8}}>OKX Wallet fires transaction on first confirmation. This screen is your only review — proceed carefully.</div>}
        <div className="ap-modal-sub">Please confirm the details before proceeding</div>
        {data.rows.map((r,i)=><div key={i} className="ap-conf-row"><span className="ap-conf-key">{r.k}</span><span className="ap-conf-val" style={r.highlight?{color:'var(--cy)'}:{}}>{r.v}</span></div>)}
        <div className="ap-modal-btns">
          <button className="ap-btn ap-btn-ghost" style={{flex:1}} onClick={onCancel}>Cancel</button>
          <button className="ap-btn ap-btn-primary" style={{flex:2,marginTop:0}} onClick={onConfirm}>{data.confirmLabel||'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

function QRModal({address,onClose}){
  const[amt,setAmt]=useState('');
  const link=APP_URL+'/?pay='+address+(amt?'&amount='+amt:'');
  return(
    <div className="ap-modal-bg" onClick={onClose}>
      <div className="ap-modal" onClick={e=>e.stopPropagation()}>
        <div className="ap-modal-title">Receive USDC</div>
        <div className="ap-modal-sub">Share your payment link or QR code</div>
        <div className="ap-qr-wrap">
          <div className="ap-qr-box"><QRCodeSVG value={link} size={180} level="M"/></div>
          <div style={{width:'100%'}}>
            <div className="ap-label" style={{marginBottom:7}}>Optional Amount</div>
            <input className="ap-input" type="number" placeholder="0.00 USDC" value={amt} onChange={e=>setAmt(e.target.value)} style={{marginBottom:14}}/>
            <div className="ap-label" style={{marginBottom:7}}>Payment Link</div>
            <div className="ap-qr-link">{link}</div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>navigator.clipboard?.writeText(link)}>Copy Link</button>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>navigator.clipboard?.writeText(address)}>Copy Address</button>
            </div>
          </div>
        </div>
        <button className="ap-btn ap-btn-ghost" style={{width:'100%',marginTop:16}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function CashbackToast({amount,rarity,onClose}){
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

function ResumeModal({session,onResume,onNew}){
  return(
    <div className="ap-modal-bg">
      <div className="ap-modal" style={{textAlign:'center'}}>
        <ArcPayLogo size={44}/>
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

function WalletPicker({onPick,onClose}){
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
    eip6963.forEach((w,i)=>options.push({type:'eip6963_'+i,label:w.info.name,icon:w.info.icon,p:w.provider}));
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
      <button onClick={()=>onPick('wc',null)} style={{display:'flex',alignItems:'center',gap:12,background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'13px 16px',cursor:'pointer',fontSize:14,fontWeight:600,color:'var(--tx1)',width:'100%',textAlign:'left'}}><IC.WC/> WalletConnect</button>
      <button onClick={onClose} style={{fontSize:13,color:'var(--tx2)',background:'none',border:'none',cursor:'pointer',marginTop:4}}>Back</button>
    </div>
  );
}
function AppInner() {
  const [provider,setProvider]=useState(null);const[signer,setSigner]=useState(null);const[address,setAddress]=useState('');const[balance,setBalance]=useState('0.00');const[walletName,setWalletName]=useState('');
  const wcProvRef=useRef(null);const[showPicker,setShowPicker]=useState(false);const[splash,setSplash]=useState(true);const[isResumed,setIsResumed]=useState(false);const[showOnboarding,setShowOnboarding]=useState(()=>!ls('arc_onboarded',false));const[faucetLoading,setFaucetLoading]=useState(false);const[faucetMsg,setFaucetMsg]=useState(null);const[lastClaim,setLastClaim]=useState(0);const[showFaucetFrame,setShowFaucetFrame]=useState(false);useEffect(()=>{if(address)setLastClaim(ls('arc_faucet_last_'+address,0));},[address]);
  const[tab,setTab]=useState('send');const[status,setStatus]=useState(null);const[loading,setLoading]=useState(false);const[mobOpen,setMobOpen]=useState(false);const[dm,setDm]=useState(false);
  const[showResumeModal,setShowResumeModal]=useState(false);const[savedSession,setSavedSession]=useState(null);
  const[showConfirm,setShowConfirm]=useState(false);const[confirmData,setConfirmData]=useState(null);const[confirmAction,setConfirmAction]=useState(null);
  const[showQR,setShowQR]=useState(false);const[rates,setRates]=useState({});
  const[sendTo,setSendTo]=useState('');const[sendAmt,setSendAmt]=useState('');const[sendCtry,setSendCtry]=useState(()=>ls('arc_ctry',''));
  const[multi,setMulti]=useState([{addr:'',amount:'',country:''}]);
  const[invPayer,setInvPayer]=useState('');const[invAmt,setInvAmt]=useState('');const[invDesc,setInvDesc]=useState('');const[invCtry,setInvCtry]=useState('');const[invId,setInvId]=useState('');
  const[payId,setPayId]=useState('');const[payDet,setPayDet]=useState(null);
  const[txns,setTxns]=useState([]);
  const[contractTxns,setContractTxns]=useState([]);
  const[contacts,setContacts]=useState(()=>ls('arc_contacts',[]));const[cName,setCName]=useState('');const[cAddr,setCAddr]=useState('');const[cCtry,setCCtry]=useState('');
  const[scheds,setScheds]=useState(()=>ls('arc_scheds',[]));const[newSched,setNewSched]=useState({addr:'',amount:'',country:'',freq:'weekly',next:''});
  const[defCtry,setDefCtry]=useState(()=>ls('arc_ctry',''));
  const[cashbackPending,setCashbackPending]=useState(()=>ls('arc_cashback_pending',0));const[cashbackHistory,setCashbackHistory]=useState(()=>ls('arc_cashback_history',[]));
  const[showCashbackToast,setShowCashbackToast]=useState(false);const[cashbackToastData,setCashbackToastData]=useState(null);const[claimLoading,setClaimLoading]=useState(false);const[claimSubmitted,setClaimSubmitted]=useState(false);

  useEffect(()=>lsSave('arc_contacts',contacts),[contacts]);
  useEffect(()=>lsSave('arc_scheds',scheds),[scheds]);
  useEffect(()=>{if(address)setTxns(ls('arc_txhistory_'+address,[]));},[address]);
  useEffect(()=>{if(address)lsSave('arc_txhistory_'+address,txns);},[txns,address]);
  useEffect(()=>lsSave('arc_dm',dm),[dm]);
  useEffect(()=>lsSave('arc_ctry',defCtry),[defCtry]);
  useEffect(()=>lsSave('arc_cashback_pending',cashbackPending),[cashbackPending]);
  useEffect(()=>lsSave('arc_cashback_history',cashbackHistory),[cashbackHistory]);
  useEffect(()=>{if(address)lsSave('arc_session',{address,walletType:walletName,ts:Date.now()});},[address,walletName]);
  useEffect(()=>{if(!splash){const s=ls('arc_session',null);if(s&&s.address&&!address&&Date.now()-s.ts<86400000){setSavedSession(s);setShowResumeModal(true);}}},[splash]);// eslint-disable-line
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const pa=p.get('pay');const pamt=p.get('amount');if(pa){setSendTo(pa);if(pamt)setSendAmt(pamt);setTab('send');}const inv=p.get('inv');if(inv){try{const i=JSON.parse(atob(inv));const s=ls('arc_invoices',[]);if(!s.find(x=>x.id===i.id))lsSave('arc_invoices',[i,...s]);setPayId(i.id);setTab('pay');}catch{}}},[]);
  useEffect(()=>{fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json()).then(d=>setRates(d.rates||{})).catch(()=>setRates({PKR:279,NGN:1371,INR:96.7,PHP:61.8,BDT:122.8,MXN:17.4,BRL:5.03,IDR:17713,VND:26222,GHS:11.5,KES:129,EGP:53.1,TRY:45.6,ARS:1399,COP:3795,UAH:44.2,ETB:155.9,TZS:2572,UGX:3734,NPR:154.6}));},[]);

  const doDisconnect=useCallback(()=>{if(wcProvRef.current){wcProvRef.current.disconnect();wcProvRef.current=null;}try{if(window.ethereum)window.ethereum.request({method:'wallet_revokePermissions',params:[{eth_accounts:{}}]});}catch{}setProvider(null);setSigner(null);setAddress('');setWalletName('');setStatus(null);setBalance('0.00');setIsResumed(false);lsSave('arc_session',null);},[]);

  useEffect(()=>{if(!window.ethereum)return;const onAcc=a=>{if(!a.length){setTimeout(()=>{if(window.ethereum)window.ethereum.request({method:'eth_accounts'}).then(accounts=>{if(!accounts.length)doDisconnect();})},1000);}else setAddress(a[0]);};const onChain=(chainId)=>{};window.ethereum.on('accountsChanged',onAcc);window.ethereum.on('chainChanged',onChain);return()=>{window.ethereum.removeListener('accountsChanged',onAcc);window.ethereum.removeListener('chainChanged',onChain);};},[doDisconnect]);

  const refreshBal=useCallback(async()=>{if(!provider||!address)return;try{const b=await provider.getBalance(address);setBalance(parseFloat(ethers.formatUnits(b,18)).toFixed(2));}catch{try{const c=new ethers.Contract(USDC_ADDR,ERC20_ABI,provider);const b=await c.balanceOf(address);setBalance(fmtUsdc(b));}catch{}}},[provider,address]);
  useEffect(()=>{if(signer&&address)refreshBal();},[signer,address,refreshBal]);

  const getC=()=>({remit:new ethers.Contract(REMIT_ADDR,REMIT_ABI,signer),usdc:new ethers.Contract(USDC_ADDR,ERC20_ABI,signer)});
  const loadContractHistory=useCallback(async()=>{try{const{remit}=getC();const p=await remit.getPayments(address);setContractTxns([...p].reverse());}catch{}},[signer,address]);// eslint-disable-line
  useEffect(()=>{if(tab==='history'&&signer)loadContractHistory();},[tab,signer,loadContractHistory]);

  const awardCashback=useCallback((txHash)=>{const rand=Math.random();let amount,rarity;if(rand<0.6){amount=(Math.random()*.2+.1).toFixed(3);rarity='Common';}else if(rand<0.9){amount=(Math.random()*.3+.3).toFixed(3);rarity='Rare';}else{amount=(Math.random()*.4+.6).toFixed(3);rarity='Epic';}const amt=parseFloat(amount);setCashbackPending(p=>parseFloat((p+amt).toFixed(3)));setCashbackHistory(prev=>[{amount:amt,rarity,txHash,ts:Date.now()},...prev.slice(0,49)]);setCashbackToastData({amount,rarity});setShowCashbackToast(true);},[]);

  const claimCashback=async()=>{if(cashbackPending<10||claimLoading)return;setClaimLoading(true);try{await sbInsert('cashback_claims',{wallet_address:address,amount:cashbackPending,timestamp:new Date().toISOString(),status:'pending'});setClaimSubmitted(true);setCashbackPending(0);setStatus({type:'success',msg:'Cashback claim submitted. Your USDC will be sent to your wallet shortly.'});}catch(e){setStatus({type:'error',msg:'Claim failed: '+e.message});}setClaimLoading(false);};

  const addArc=p=>({chainId:ARC_CHAIN_HEX,chainName:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:[ARC_RPC],blockExplorerUrls:['https://testnet.arcscan.app'],...p});
  const ensureArc=async eth=>{try{await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]});}catch(e){if(e.code===4902||e.code===-32603){setStatus({type:'info',msg:'Adding Arc Testnet to your wallet...'});try{await eth.request({method:'wallet_addEthereumChain',params:[addArc({})]});}catch(ae){setStatus({type:'error',msg:'Please add Arc Testnet manually in your wallet settings. Chain ID: 5042002, RPC: https://rpc.testnet.arc.network'});throw ae;}}else throw e;}};
  const finaliseConnect=async bp=>{bp.pollingInterval=800;const s=await bp.getSigner();const addr=await s.getAddress();setProvider(bp);setSigner(s);setAddress(addr);setIsResumed(false);setStatus({type:'success',msg:'Connected: '+short(addr)});};

  const connectBrowser=async(type,provObj)=>{try{const eth=provObj||await getProvider();if(!eth){setStatus({type:'error',msg:'No wallet found. Install MetaMask.'});return;}await eth.request({method:'eth_requestAccounts'});const bp=new ethers.BrowserProvider(eth,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});await ensureArc(eth);let name='Browser Wallet';if(eth.isMises||(window.mises?.ethereum===eth))name='Mises';else if(eth.isMetaMask&&!eth.isBraveWallet)name='MetaMask';else if(eth.isBraveWallet)name='Brave';else if(eth.isCoinbaseWallet)name='Coinbase';else if(eth.isOkxWallet||eth.isOKExWallet)name='OKX';setWalletName(name);await finaliseConnect(bp);}catch(e){setStatus({type:'error',msg:e.message||'Connection failed'});}};

  const connectWC=async()=>{try{const wcp=await EthereumProvider.init({projectId:WC_ID,chains:[ARC_CHAIN_ID],showQrModal:true,methods:['eth_sendTransaction','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'],events:['chainChanged','accountsChanged']});await wcp.enable();wcp.on('accountsChanged',a=>{if(!a.length)doDisconnect();else setAddress(a[0]);});wcp.on('disconnect',doDisconnect);try{await wcp.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]});}catch(e){if(e.code===4902)await wcp.request({method:'wallet_addEthereumChain',params:[addArc({})]});}const bp=new ethers.BrowserProvider(wcp,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});wcProvRef.current=wcp;setWalletName('WalletConnect');await finaliseConnect(bp);}catch(e){setStatus({type:'error',msg:e.message||'WalletConnect failed'});}};

  const handleSendReview=()=>{if(!sendTo||!sendAmt){setStatus({type:'error',msg:'Please fill all required fields'});return;}if(!ethers.isAddress(sendTo)){setStatus({type:'error',msg:'Invalid recipient address'});return;}const amt=parseFloat(sendAmt);if(isNaN(amt)||amt<=0){setStatus({type:'error',msg:'Invalid amount'});return;}const rows=[{k:'You Send',v:sendAmt+' USDC'},{k:'Recipient',v:short(sendTo)}];if(sendCtry&&rates[CURRENCY[sendCtry]])rows.push({k:'They Receive',v:'~'+(amt*rates[CURRENCY[sendCtry]]).toLocaleString('en',{maximumFractionDigits:0})+' '+CURRENCY[sendCtry],highlight:true});rows.push({k:'Estimated Fee',v:'~0.001 USDC',highlight:true},{k:'Network',v:'Arc Testnet'});if(walletName?.toLowerCase().includes('okx')){handleSend();}else{setConfirmData({rows,confirmLabel:'Send to Wallet'});setConfirmAction(()=>handleSend);setShowConfirm(true);}};

  const handleSend=async()=>{setShowConfirm(false);if(!signer){setStatus({type:'error',msg:'Please reconnect your wallet to send transactions'});return;}if(!sendTo||!sendAmt)return;const amt=parseFloat(sendAmt);if(isNaN(amt)||amt<=0)return;setLoading(true);setStatus({type:'info',msg:'Sending USDC...'});try{const value=ethers.parseUnits(sendAmt,18);let gasPrice;try{const rpcs=[ARC_RPC,ARC_RPC_FALLBACK].filter(Boolean);let feeData=null;for(const rpc of rpcs){try{const rp=new ethers.JsonRpcProvider(rpc,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});feeData=await Promise.race([rp.getFeeData(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]);if(feeData)break;}catch{}}const fp=feeData?.gasPrice;gasPrice=(fp&&fp>0n)?fp:ethers.parseUnits('100','gwei');}catch{gasPrice=ethers.parseUnits('100','gwei');}const nonce=await provider.getTransactionCount(address,'pending');const tx=await signer.sendTransaction({to:ethers.getAddress(sendTo.trim()),value,gasLimit:21000,gasPrice,nonce});const rec={hash:tx.hash,recipient:sendTo,amount:amt,country:sendCtry,timestamp:Math.floor(Date.now()/1000),status:'pending'};setTxns(prev=>{const u=[rec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});setStatus({type:'success',msg:'Sent '+sendAmt+' USDC to '+short(sendTo)});setSendTo('');setSendAmt('');awaitReceipt(provider,tx.hash).then(receipt=>{const confirmed=receipt==null?'pending':receipt.status===1?'confirmed':'failed';if(confirmed==='confirmed')awardCashback(tx.hash);setTxns(prev=>{const u=prev.map(t=>t.hash===tx.hash?{...t,status:confirmed}:t);lsSave('arc_txhistory_'+address,u);return u;});});setTimeout(refreshBal,6000);}catch(e){setStatus({type:'error',msg:e.reason||e.message||'Transaction failed'});}finally{setLoading(false);}};

  const handleMultiReview=()=>{const valid=multi.filter(r=>ethers.isAddress(r.addr)&&parseFloat(r.amount)>0);if(!signer||!valid.length){setStatus({type:'error',msg:'Add at least one valid recipient'});return;}const total=valid.reduce((s,r)=>s+(parseFloat(r.amount)||0),0);if(walletName?.toLowerCase().includes('okx')){handleMulti();}else{setConfirmData({rows:[{k:'Recipients',v:valid.length+' addresses'},{k:'Total',v:total.toFixed(2)+' USDC'},{k:'Est. Fee',v:'~'+(valid.length*.001).toFixed(3)+' USDC',highlight:true},{k:'Network',v:'Arc Testnet'}],confirmLabel:'Send All to Wallet'});setConfirmAction(()=>handleMulti);setShowConfirm(true);}};

  const handleMulti=async()=>{setShowConfirm(false);const valid=multi.filter(r=>ethers.isAddress(r.addr)&&parseFloat(r.amount)>0);if(!signer||!valid.length)return;setLoading(true);try{for(const r of valid){setStatus({type:'info',msg:'Sending to '+short(r.addr)+'...'});const value=ethers.parseUnits(r.amount,18);let gasPrice;try{const rpcs=[ARC_RPC,ARC_RPC_FALLBACK].filter(Boolean);let feeData=null;for(const rpc of rpcs){try{const rp=new ethers.JsonRpcProvider(rpc,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});feeData=await Promise.race([rp.getFeeData(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]);if(feeData)break;}catch{}}const fp=feeData?.gasPrice;gasPrice=(fp&&fp>0n)?fp:ethers.parseUnits('100','gwei');}catch{gasPrice=ethers.parseUnits('100','gwei');}const nonce=await provider.getTransactionCount(address,'pending');const tx=await signer.sendTransaction({to:r.addr,value,gasLimit:21000,gasPrice,nonce});const rec={hash:tx.hash,recipient:r.addr,amount:parseFloat(r.amount),country:r.country,timestamp:Math.floor(Date.now()/1000),status:'pending'};setTxns(prev=>{const u=[rec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});awaitReceipt(provider,tx.hash).then(receipt=>{const confirmed=receipt==null?'pending':receipt.status===1?'confirmed':'failed';if(confirmed==='confirmed')awardCashback(tx.hash);setTxns(prev=>{const u=prev.map(t=>t.hash===tx.hash?{...t,status:confirmed}:t);lsSave('arc_txhistory_'+address,u);return u;});});}setStatus({type:'success',msg:'Sent to '+valid.length+' recipients'});setMulti([{addr:'',amount:'',country:''}]);setTimeout(refreshBal,6000);}catch(e){setStatus({type:'error',msg:e.reason||e.message||'Failed'});}finally{setLoading(false);}};

  const handleCreateInv=async()=>{if(!address){setStatus({type:'error',msg:'Connect your wallet first'});return;}if(!invPayer||!invAmt){setStatus({type:'error',msg:'Fill required fields'});return;}setLoading(true);setStatus({type:'info',msg:'Creating invoice...'});try{const id='0x'+Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');const invoice={id,creator:address,payer:invPayer.trim(),amount:invAmt,description:invDesc,country:invCtry,paid:false};await sbInsert('invoices',invoice);const saved=ls('arc_invoices',[]);lsSave('arc_invoices',[{...invoice,desc:invDesc,ts:Math.floor(Date.now()/1000)},...saved.slice(0,99)]);setInvId(id);setStatus({type:'success',msg:'Invoice created. Share the ID with your client.'});setInvPayer('');setInvAmt('');setInvDesc('');}catch(e){setStatus({type:'error',msg:'Failed: '+e.message});}finally{setLoading(false);}};

  const handlePayInvReview=async()=>{if(!signer||!payId){setStatus({type:'error',msg:'Enter invoice ID'});return;}setLoading(true);setStatus({type:'info',msg:'Looking up invoice...'});try{const rows=await sbSelect('invoices','id=eq.'+payId.trim()+'&select=*');if(!rows||rows.length===0){setStatus({type:'error',msg:'Invoice not found'});setLoading(false);return;}const inv=rows[0];if(inv.paid){setStatus({type:'error',msg:'This invoice has already been paid'});setLoading(false);return;}setPayDet({creator:inv.creator,amount:ethers.parseUnits(inv.amount,18),description:inv.description,country:inv.country,rawAmount:inv.amount});setStatus(null);setConfirmData({rows:[{k:'Invoice ID',v:payId.trim().slice(0,16)+'...'},{k:'Amount',v:inv.amount+' USDC'},{k:'Description',v:inv.description},{k:'To',v:short(inv.creator)},{k:'Est. Fee',v:'~0.001 USDC',highlight:true}],confirmLabel:'Pay via Wallet'});setConfirmAction(()=>()=>handlePayInv(inv));setShowConfirm(true);}catch(e){setStatus({type:'error',msg:e.reason||e.message||'Lookup failed'});}finally{setLoading(false);}};

  const handlePayInv=async(inv)=>{setShowConfirm(false);if(!signer)return;setLoading(true);setStatus({type:'info',msg:'Processing payment...'});try{const value=ethers.parseUnits(inv.amount,18);let gasPrice;try{const rpcs=[ARC_RPC,ARC_RPC_FALLBACK].filter(Boolean);let feeData=null;for(const rpc of rpcs){try{const rp=new ethers.JsonRpcProvider(rpc,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});feeData=await Promise.race([rp.getFeeData(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]);if(feeData)break;}catch{}}const fp=feeData?.gasPrice;gasPrice=(fp&&fp>0n)?fp:ethers.parseUnits('100','gwei');}catch{gasPrice=ethers.parseUnits('100','gwei');}const nonce=await provider.getTransactionCount(address,'pending');const tx=await signer.sendTransaction({to:inv.creator,value,gasLimit:21000,gasPrice,nonce});await sbUpdate('invoices','id=eq.'+payId.trim(),{paid:true,paid_by:address,paid_tx:tx.hash});const rec={hash:tx.hash,recipient:inv.creator,amount:inv.amount,country:inv.country,timestamp:Math.floor(Date.now()/1000),status:'submitted'};setTxns(prev=>{const u=[rec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});awaitReceipt(provider,tx.hash).then(receipt=>{const confirmed=receipt==null?'pending':receipt.status===1?'confirmed':'failed';if(confirmed==='confirmed')awardCashback(tx.hash);setTxns(prev=>{const u=prev.map(t=>t.hash===tx.hash?{...t,status:confirmed}:t);lsSave('arc_txhistory_'+address,u);return u;});});setStatus({type:'success',msg:'Paid '+inv.amount+' USDC'});setPayId('');setPayDet(null);setTimeout(refreshBal,5000);}catch(e){setStatus({type:'error',msg:e.reason||e.message||'Payment failed'});}finally{setLoading(false);}};

  const exportCSV=()=>{const rows=[['Type','Hash','Recipient','Amount (USDC)','Country','Date','Status'],...txns.map(t=>['Send',t.hash||'',t.recipient||'',t.amount||'',t.country||'',fmtDate(t.timestamp),t.status||'']),...ls('arc_invoices',[]).map(i=>['Invoice',i.id||'',i.payer||'',i.amount||'',i.country||'',fmtDate(i.ts),i.paid?'Paid':'Unpaid']),...scheds.map(s=>['Scheduled','',s.addr||'',s.amount||'',s.country||'',s.next||'',s.freq||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='arcpay-history.csv';a.click();URL.revokeObjectURL(url);};

  const allTxns=[...txns,...contractTxns.filter(c=>!txns.find(l=>l.hash===c.transactionHash))];
  const chartData=buildChart(allTxns);const totalSent=txns.reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const hasPendingTx=txns.some(t=>t.status==='pending'||t.status==='submitted');
  const recentRecipients=[...new Set(txns.filter(t=>t.recipient&&!t.hash?.startsWith('0xdemo')).map(t=>t.recipient))].slice(0,5);
  const convertedVal=(()=>{if(!sendAmt||!sendCtry)return null;const r=rates[CURRENCY[sendCtry]];if(!r)return null;return(parseFloat(sendAmt)*r).toLocaleString('en',{maximumFractionDigits:0});})();
  const statusCls=s=>!s?null:({success:'ap-status ap-status-success',error:'ap-status ap-status-error',warning:'ap-status ap-status-warning',info:'ap-status ap-status-info'}[s.type]||'ap-status ap-status-info');
  const txBadge=st=>({confirmed:'ap-tx-badge ap-tx-confirmed',pending:'ap-tx-badge ap-tx-pending',failed:'ap-tx-badge ap-tx-failed',submitted:'ap-tx-badge ap-tx-submitted'}[st]||'ap-tx-badge ap-tx-pending');

  const isDesktop=window.innerWidth>=769;
  const SIDEBAR_SECTIONS=[
    {title:'Transfers',items:[{id:'send',label:'Send',ICN:IC.Send,info:'Transfer USDC to any wallet instantly on Arc Testnet'},{id:'multi',label:'Multi Send',ICN:IC.Multi,info:'Send USDC to multiple recipients in one session'},{id:'invoice',label:'Invoice',ICN:IC.Invoice,info:'Create USDC payment requests stored on Supabase'},{id:'pay',label:'Pay Invoice',ICN:IC.Pay,info:'Look up and pay an invoice using its unique ID'}]},
    ...(isDesktop?[{title:'My Account',items:[{id:'history',label:'History',ICN:IC.History,info:'View all your transactions',dot:hasPendingTx},{id:'receive',label:'Receive',ICN:IC.Receive,info:'Generate QR code or payment link'},{id:'contacts',label:'Contacts',ICN:IC.Contacts,info:'Save wallet addresses for quick access'},{id:'rewards',label:'Rewards',ICN:IC.Rewards,info:'Earn cashback on every confirmed transaction'}]}]:[]),
    {title:'Analytics',items:[{id:'rates',label:'Exchange Rates',ICN:IC.Rates,info:'Live USDC to local currency conversion rates for 20 countries'},{id:'fees',label:'Fee Compare',ICN:IC.Compare,info:'See how ArcPay compares to banks and other transfer services'}]},
    {title:'Tools',items:[{id:'schedule',label:'Scheduled',ICN:IC.Schedule,info:'Set up recurring payment reminders and pre-fill the Send form'},{id:'faucet',label:'Faucet',ICN:IC.Receive,info:'Claim 20 free testnet USDC every 2 hours via Circle Faucet'}]},
    {title:'More',items:[{id:'settings',label:'Settings',ICN:IC.Settings,info:'Customize your ArcPay experience'},{id:'about',label:'About Arc',ICN:IC.About,info:'Learn more about the Arc protocol and network details'}]},
  ];
  const BOTTOM_TABS=[{id:'history',label:'History',ICN:IC.History},{id:'receive',label:'Receive',ICN:IC.Receive},{id:'send',label:'Send',ICN:IC.Send,fab:true},{id:'contacts',label:'Contacts',ICN:IC.Contacts},{id:'rewards',label:'Rewards',ICN:IC.Rewards}];
  const PAGE_TITLES={send:'Send USDC',multi:'Multi Send',invoice:'Invoice',pay:'Pay Invoice',contacts:'Contacts',schedule:'Scheduled',history:'History',rates:'Exchange Rates',fees:'Fee Comparison',rewards:'Rewards',settings:'Settings',about:'About Arc',receive:'Receive',faucet:'Faucet'};

  const renderSend=()=>(<>
    
    {contacts.length>0&&<div style={{marginBottom:16}}><div className="ap-label">Quick Select</div><div className="ap-quick-wrap">{contacts.map(c=><button key={c.id} className="ap-quick-pill" onClick={()=>{setSendTo(c.address);setSendCtry(c.country);}}><span className="ap-cc">{CC[c.country]||'?'}</span>{c.name}</button>)}</div></div>}
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
      <input className="ap-input" placeholder="0x..." value={sendTo} onChange={e=>setSendTo(e.target.value)} style={{marginBottom:recentRecipients.length?12:14}}/>
      {recentRecipients.length>0&&<div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8}}>Recent</div><div className="ap-quick-wrap">{recentRecipients.map((r,i)=><button key={i} className="ap-quick-pill" onClick={()=>setSendTo(r)}>{short(r)}</button>)}</div></div>}
      <div className="ap-fee-note"><IC.Check/> Estimated fee: ~0.001 USDC on Arc Testnet</div>
      <button className="ap-btn ap-btn-primary" onClick={handleSendReview} disabled={loading||!sendTo||!sendAmt}>{loading?'Processing...':'Review Transfer'}</button>
    </div>
  </>);

  const renderMulti=()=>(<div className="ap-card"><div className="ap-card-title">Multi Send</div><div className="ap-card-sub">Send USDC to multiple recipients in one session.</div>{multi.map((r,i)=>(<div key={i} style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}><div style={{flex:2}}>{i===0&&<div className="ap-label">Address</div>}<input className="ap-input" style={{marginBottom:0}} placeholder="0x..." value={r.addr} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,addr:v}:x));}}/></div><div style={{flex:1}}>{i===0&&<div className="ap-label">USDC</div>}<input className="ap-input" style={{marginBottom:0}} type="number" placeholder="0.00" value={r.amount} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,amount:v}:x));}}/></div><div style={{flex:1}}>{i===0&&<div className="ap-label">Country</div>}<CountrySelect value={r.country} onChange={v=>setMulti(p=>p.map((x,j)=>j===i?{...x,country:v}:x))}/></div>{multi.length>1&&<button className="ap-btn ap-btn-danger" style={{marginTop:i===0?22:0,padding:'12px 10px'}} onClick={()=>setMulti(p=>p.filter((_,j)=>j!==i))}><IC.Close/></button>}</div>))}<button className="ap-btn ap-btn-ghost" style={{width:'100%',marginBottom:14}} onClick={()=>setMulti(p=>[...p,{addr:'',amount:'',country:''}])}>+ Add Recipient</button><div style={{padding:'12px 14px',background:'var(--elev)',borderRadius:12,border:'1px solid var(--b1)',fontSize:14,color:'var(--tx1)',marginBottom:8}}>Total: <strong>{multi.reduce((s,r)=>s+(parseFloat(r.amount)||0),0).toFixed(2)} USDC</strong> to <strong>{multi.filter(r=>r.addr&&r.amount).length}</strong> recipients</div><button className="ap-btn ap-btn-primary" onClick={handleMultiReview} disabled={loading}>{loading?'Sending...':'Review and Send All'}</button></div>);

  const renderInvoice=()=>(<div><div className="ap-card"><div className="ap-card-title">Create Invoice</div><div className="ap-card-sub">Request USDC payment. Stored on Supabase and payable from any device.</div><div className="ap-label">Client Wallet Address</div><input className="ap-input" placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Amount (USDC)</div><input className="ap-input" type="number" placeholder="500" value={invAmt} onChange={e=>setInvAmt(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Description</div><input className="ap-input" placeholder="Logo design - May 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Your Country (Optional)</div><CountrySelect value={invCtry} onChange={v=>setInvCtry(v)}/><button className="ap-btn ap-btn-primary" onClick={handleCreateInv} disabled={loading}>{loading?'Creating...':'Create Invoice'}</button>{invId&&(<div style={{marginTop:20}}><div style={{fontSize:13,fontWeight:700,color:'var(--cy)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><IC.Check/> Invoice created successfully</div><div className="ap-code">{invId}</div><div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}><button className="ap-btn ap-btn-sec" onClick={()=>navigator.clipboard?.writeText(invId)}><IC.Copy/> Copy ID</button><button className="ap-btn ap-btn-sec" onClick={()=>{setPayId(invId);setTab('pay');}}>Pay this Invoice</button></div></div>)}</div>{ls('arc_invoices',[]).length>0&&(<div className="ap-card"><div className="ap-card-title">Recent Invoices</div><div className="ap-div"/>{ls('arc_invoices',[]).slice(0,5).map((inv,i)=>(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--b0)'}}><div><div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>{inv.amount} USDC - {inv.desc?.slice(0,30)}</div><div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx3)',marginTop:2}}>{inv.id?.slice(0,18)}...</div></div><button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setPayId(inv.id);setTab('pay');}}>Pay</button></div>))}</div>)}</div>);

  const renderPay=()=>(<div className="ap-card"><div className="ap-card-title">Pay Invoice</div><div className="ap-card-sub">Enter an invoice ID to look it up and pay instantly.</div><div className="ap-label">Invoice ID</div><input className="ap-input" placeholder="0x..." value={payId} onChange={e=>{setPayId(e.target.value);setPayDet(null);}} style={{marginBottom:payDet?12:14}}/>{payDet&&(<div style={{background:'var(--acd)',border:'1px solid var(--acs)',borderRadius:12,padding:'14px 16px',marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:'var(--ac2)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>Invoice Details</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14}}><div><span style={{color:'var(--tx2)'}}>Amount:</span> <strong>{fmtUsdc(payDet.amount)} USDC</strong></div><div><span style={{color:'var(--tx2)'}}>Country:</span> {payDet.country?<><span className="ap-cc">{CC[payDet.country]}</span> {payDet.country}</>:'N/A'}</div><div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>Description:</span> {payDet.description}</div><div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>From:</span> <span style={{fontFamily:'monospace',fontSize:13}}>{short(payDet.creator)}</span></div></div></div>)}<button className="ap-btn ap-btn-primary" onClick={handlePayInvReview} disabled={loading}>{loading?'Looking up...':'Find and Pay Invoice'}</button></div>);

  const renderContacts=()=>(<div><div className="ap-card"><div className="ap-card-title">Add Contact</div><div className="ap-div"/><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}><div><div className="ap-label">Name</div><input className="ap-input" style={{marginBottom:0}} placeholder="Ahmed" value={cName} onChange={e=>setCName(e.target.value)}/></div><div><div className="ap-label">Country</div><select className="ap-select" style={{marginBottom:0}} value={cCtry} onChange={e=>setCCtry(e.target.value)}>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div></div><div className="ap-label">Wallet Address</div><input className="ap-input" placeholder="0x..." value={cAddr} onChange={e=>setCAddr(e.target.value)} style={{marginBottom:14}}/><button className="ap-btn ap-btn-primary" onClick={()=>{if(!cName||!ethers.isAddress(cAddr)){setStatus({type:'error',msg:'Enter a valid name and address'});return;}setContacts(p=>[{id:Date.now(),name:cName,address:cAddr,country:cCtry},...p]);setCName('');setCAddr('');setStatus({type:'success',msg:'Contact saved'});}}>Save Contact</button></div>{contacts.length>0&&(<div className="ap-card"><div className="ap-card-title">Contacts ({contacts.length})</div>{contacts.map(c=>(<div key={c.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 0',borderBottom:'1px solid var(--b0)'}}><div style={{width:40,height:40,borderRadius:12,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'var(--ac2)',flexShrink:0,fontFamily:'var(--fd)'}}>{c.name[0].toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}><span className="ap-cc" style={{marginRight:6}}>{CC[c.country]||'?'}</span>{c.name}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:2,overflow:'hidden',textOverflow:'ellipsis'}}>{c.address}</div></div><button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setSendTo(c.address);setSendCtry(c.country);setTab('send');}}>Send</button><button className="ap-btn ap-btn-danger" onClick={()=>setContacts(p=>p.filter(x=>x.id!==c.id))}><IC.Close/></button></div>))}</div>)}</div>);

  const renderSchedule=()=>(<div><div className="ap-card"><div className="ap-card-title">Schedule Payment</div><div className="ap-card-sub">Set up recurring payment reminders.</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}><div><div className="ap-label">Recipient</div><input className="ap-input" style={{marginBottom:0}} placeholder="0x..." value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}/></div><div><div className="ap-label">Amount (USDC)</div><input className="ap-input" style={{marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/></div><div><div className="ap-label">Country</div><CountrySelect value={newSched.country} onChange={v=>setNewSched(s=>({...s,country:v}))}/></div><div><div className="ap-label">Frequency</div><select className="ap-select" style={{marginBottom:0}} value={newSched.freq} onChange={e=>setNewSched(s=>({...s,freq:e.target.value}))}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div></div><div className="ap-label">Next Date</div><input className="ap-input" type="date" value={newSched.next} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))} style={{marginBottom:14}}/><button className="ap-btn ap-btn-primary" onClick={()=>{if(!newSched.addr||!newSched.amount||!newSched.next){setStatus({type:'error',msg:'Fill all required fields'});return;}setScheds(p=>[{id:Date.now(),...newSched},...p]);setNewSched({addr:'',amount:'',country:'',freq:'weekly',next:''});setStatus({type:'success',msg:'Payment scheduled'});}}>Schedule Payment</button></div>{scheds.length>0&&(<div className="ap-card"><div className="ap-card-title">Active Schedules</div><div className="ap-div"/>{scheds.map(s=>(<div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 0',borderBottom:'1px solid var(--b0)'}}><div style={{flex:1}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{s.country&&<span className="ap-cc" style={{marginRight:6}}>{CC[s.country]||'?'}</span>}{short(s.addr)}</div><div style={{fontSize:13,color:'var(--tx2)',marginTop:2}}>{s.amount} USDC - {s.freq} - Next: {s.next}</div></div><button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setSendTo(s.addr);setSendAmt(s.amount);setSendCtry(s.country);setTab('send');setStatus({type:'info',msg:'Pre-filled from schedule.'});}}>Execute</button><button className="ap-btn ap-btn-danger" onClick={()=>setScheds(p=>p.filter(x=>x.id!==s.id))}><IC.Close/></button></div>))}</div>)}</div>);

  const renderHistory=()=>(<div>{allTxns.length>0&&(<div className="ap-card"><div className="ap-card-title">Transfer Volume</div><div style={{marginTop:16}}><ResponsiveContainer width="100%" height={160}><AreaChart data={chartData} margin={{top:8,right:8,left:-20,bottom:0}}><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82C4" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82C4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--b0)"/><XAxis dataKey="label" tick={{fontSize:11,fill:'var(--tx3)'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:'var(--tx3)'}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:10,fontSize:13,color:'var(--tx1)'}}/><Area type="monotone" dataKey="sent" stroke="#3B82C4" fill="url(#cg)" strokeWidth={2} name="Sent (USDC)"/></AreaChart></ResponsiveContainer></div></div>)}<div className="ap-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div><div className="ap-card-title">Transactions ({allTxns.length})</div><div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Total sent: {totalSent.toFixed(2)} USDC</div></div><div style={{display:'flex',gap:8}}><button className="ap-btn ap-btn-sec" onClick={exportCSV} style={{fontSize:12,padding:'7px 12px'}}>Export CSV</button><button className="ap-btn ap-btn-sec" onClick={loadContractHistory} style={{fontSize:12,padding:'7px 12px'}}>Refresh</button></div></div>{allTxns.length===0?<div style={{textAlign:'center',color:'var(--tx3)',padding:'32px 0',fontSize:14}}>No transactions yet</div>:allTxns.map((t,i)=>(<div key={i} className="ap-hist-row"><div className="ap-hist-icon"><IC.Send/></div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>{t.country&&<span className="ap-cc">{CC[t.country]||'?'}</span>}{t.country||'Transfer'}<span className={txBadge(t.status)}>{t.status||'pending'}</span></div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:3,overflow:'hidden',textOverflow:'ellipsis'}}>{short(t.recipient)}</div></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{parseFloat(typeof t.amount==='object'?fmtUsdc(t.amount):t.amount).toFixed(2)} USDC</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>{fmtDate(t.timestamp)}</div></div>{t.hash&&!t.hash.startsWith('0xdemo')&&<a href={'https://testnet.arcscan.app/tx/'+t.hash} target="_blank" rel="noreferrer" style={{fontSize:12,color:'var(--ac)',textDecoration:'none',padding:'4px 6px',flexShrink:0}}><IC.Ext/></a>}</div>))}</div></div>);

  const renderRates=()=>(<div className="ap-card"><div className="ap-card-title">Live Exchange Rates</div><div className="ap-card-sub">1 USDC = 1 USD .com</div><div className="ap-rates-grid">{COUNTRIES.map(c=>{const cur=CURRENCY[c],rate=rates[cur];return(<div key={c} className="ap-rate-card"><div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><span className="ap-cc">{CC[c]}</span><span style={{fontSize:11,fontWeight:700,color:'var(--tx3)'}}>{cur}</span></div><div style={{fontSize:18,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{rate?rate.toLocaleString('en',{maximumFractionDigits:1}):'...'}</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>{c}</div></div>);})}</div></div>);

  const renderFees=()=>(<div className="ap-card"><div className="ap-card-title">Fee Comparison</div><div className="ap-card-sub">Sending $100 internationally.</div><table className="ap-table"><thead><tr><th>Service</th><th>Fee on $100</th><th>Speed</th><th>You Save</th></tr></thead><tbody>{[{name:'ArcPay',fee:'~$0.007',speed:'Under 1 sec',save:'$44.99',best:true},{name:'SWIFT / Bank',fee:'$25 to $45',speed:'3 to 5 days',save:'...'},{name:'Western Union',fee:'$4.99 + 3%',speed:'1 to 5 days',save:'...'},{name:'PayPal',fee:'5% (max $4.99)',speed:'1 to 3 days',save:'...'},{name:'Wise',fee:'0.5 to 2%',speed:'1 to 2 days',save:'...'},{name:'MoneyGram',fee:'$3.99 + spread',speed:'1 to 3 days',save:'...'}].map((r,i)=><tr key={i} className={r.best?'ap-best-row':''}><td style={{fontWeight:r.best?700:400}}>{r.name}{r.best?' (Best)':''}</td><td>{r.fee}</td><td>{r.speed}</td><td style={{fontWeight:700,color:r.save!=='...'?'var(--cy)':'var(--tx3)'}}>{r.save}</td></tr>)}</tbody></table><div style={{marginTop:18,background:'rgba(23,229,176,.06)',border:'1px solid rgba(23,229,176,.15)',borderRadius:14,padding:20,textAlign:'center'}}><div style={{fontSize:11,color:'var(--cy)',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>Annual savings vs bank wire at $500/month</div><div style={{fontSize:32,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)',letterSpacing:'-1px'}}>$2,699</div></div></div>);

  const renderRewards=()=>{const pct=Math.min((cashbackPending/10)*100,100);return(<div><div className="ap-card"><div className="ap-card-title">Cashback Rewards</div><div className="ap-card-sub">Earn USDC on every confirmed transaction. Claim when you reach 10 USDC.</div><div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:4}}><div style={{fontSize:32,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{parseFloat(cashbackPending).toFixed(3)}</div><div style={{fontSize:13,color:'var(--tx3)',marginBottom:6}}>USDC pending</div></div><div className="ap-rew-bar"><div className="ap-rew-fill" style={{width:pct+'%'}}/></div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:20}}>{parseFloat(cashbackPending).toFixed(3)} / 10.000 USDC to claim</div><div style={{background:'var(--elev)',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--tx2)',lineHeight:1.6}}><strong style={{color:'var(--tx1)'}}>How it works:</strong> Every confirmed transaction earns random cashback 0.1 to 1 USDC. Common (0.1-0.3), Rare (0.3-0.6), Epic (0.6-1.0). Claim once you hit 10 USDC.</div>{claimSubmitted?<div className="ap-status ap-status-success" style={{marginBottom:0}}><IC.Check/> Claim submitted. Your USDC will be sent to your wallet shortly.</div>:<button className="ap-btn ap-btn-primary" onClick={claimCashback} disabled={cashbackPending<10||claimLoading} style={{marginTop:0}}>{claimLoading?'Submitting...':cashbackPending>=10?'Claim '+parseFloat(cashbackPending).toFixed(3)+' USDC':'Need '+(10-cashbackPending).toFixed(3)+' more USDC'}</button>}</div>{cashbackHistory.length>0&&(<div className="ap-card"><div className="ap-card-title">Cashback History</div><div className="ap-div"/>{cashbackHistory.slice(0,10).map((item,i)=>(<div key={i} className="ap-reward-item"><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:32,height:32,borderRadius:10,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ac)',flexShrink:0}}><IC.Gift/></div><div><div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>+{item.amount} USDC</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{new Date(item.ts).toLocaleDateString('en',{month:'short',day:'numeric'})}</div></div></div><span className={'ap-cb-rarity '+(item.rarity==='Epic'?'ap-rarity-epic':item.rarity==='Rare'?'ap-rarity-rare':'ap-rarity-common')}>{item.rarity}</span></div>))}</div>)}</div>);};

  const renderReceive=()=>(<div className="ap-card"><div className="ap-card-title">Receive USDC</div><div className="ap-card-sub">Share your QR code or payment link to receive USDC.</div><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowQR(true)}>Open QR Code</button><div className="ap-div"/><div className="ap-label">Your Address</div><div style={{display:'flex',gap:8,alignItems:'center'}}><div className="ap-code" style={{flex:1}}>{address}</div><button className="ap-btn ap-btn-icon" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button></div></div>);

  const renderSettings=()=>(<div className="ap-card"><div className="ap-card-title">Settings</div><div className="ap-div"/><div className="ap-setting-row"><div><div className="ap-setting-label">Dark Mode</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Toggle between dark and light interface</div></div><button className="ap-toggle" style={{width:42,height:24,borderRadius:999,background:dm?'var(--ac)':'var(--b1)'}} onClick={()=>setDm(d=>!d)}><div className="ap-toggle-knob" style={{left:dm?22:4,width:16,height:16}}/></button></div><div className="ap-setting-row"><div><div className="ap-setting-label">Default Country</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Pre-selected when you open Send</div></div><select className="ap-select" style={{width:'auto',minWidth:140,marginBottom:0}} value={defCtry} onChange={e=>{setDefCtry(e.target.value);setSendCtry(e.target.value);}}><option value="">None</option>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div><div className="ap-setting-row"><div><div className="ap-setting-label">Customer Support</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Chat with us on Telegram</div></div><a href="https://t.me/Sam50506" target="_blank" rel="noreferrer" className="ap-btn ap-btn-sec" style={{textDecoration:'none',fontSize:13}}>Open Telegram</a></div><div className="ap-setting-row"><div><div className="ap-setting-label">Developer</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Sam on X</div></div><a href="https://x.com/Sam_50506" target="_blank" rel="noreferrer" className="ap-btn ap-btn-icon" style={{textDecoration:'none',color:'var(--tx1)'}}><IC.XLogo/></a></div><div className="ap-setting-row" style={{borderBottom:'none'}}><div><div className="ap-setting-label">Clear Local Data</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Removes all saved contacts, history, and schedules</div></div><button className="ap-btn ap-btn-danger" onClick={()=>{if(window.confirm('Clear all local data? This cannot be undone.')){setContacts([]);setScheds([]);setTxns([]);setCashbackPending(0);setCashbackHistory([]);setStatus({type:'success',msg:'Local data cleared'})}}}>Clear</button></div></div>);

  const renderAbout=()=>(<div><div className="ap-card"><div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}><ArcPayLogo size={48}/><div><div className="ap-card-title">Arc Protocol</div><div style={{fontSize:13,color:'var(--tx2)'}}>Decentralized Remittance Infrastructure</div></div></div><div style={{fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:20}}>Arc is a next-generation blockchain protocol for fast, near-zero-cost cross-border payments. ArcPay is the remittance interface built on Arc Testnet, enabling instant USDC transfers to 20 countries.</div><div className="ap-div"/><a href="https://x.com/arc" target="_blank" rel="noreferrer" className="ap-about-link"><IC.XLogo/><span style={{flex:1,fontWeight:600}}>Arc on X</span><IC.Ext/></a><a href="https://www.arc.io/blog" target="_blank" rel="noreferrer" className="ap-about-link"><IC.Blog/><span style={{flex:1,fontWeight:600}}>Arc Blog</span><IC.Ext/></a></div><div className="ap-card"><div className="ap-card-title">Network Details</div><div className="ap-div"/>{[['Chain ID','5042002'],['RPC','rpc.testnet.arc.network'],['USDC Contract',USDC_ADDR.slice(0,14)+'...'],['Remittance Contract',REMIT_ADDR.slice(0,14)+'...'],['Block Explorer','testnet.arcscan.app']].map(([k,v])=>(<div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--b0)'}}><span style={{fontSize:13,color:'var(--tx2)',fontWeight:500}}>{k}</span><span style={{fontSize:12,fontFamily:'monospace',color:'var(--tx1)'}}>{v}</span></div>))}</div></div>);

  const renderFaucet=()=>{
  const claimFaucet=async()=>{
    if(!address){setFaucetMsg({type:'error',msg:'Connect your wallet first'});return;}
    const now=Date.now();const cooldown=2*60*60*1000;
    if(now-lastClaim<cooldown){const mins=Math.ceil((cooldown-(now-lastClaim))/60000);setFaucetMsg({type:'error',msg:'Wait '+mins+' more minutes before claiming again'});return;}
    setFaucetLoading(true);setFaucetMsg(null);
    try{
      navigator.clipboard?.writeText(address);
    const w=window.open('https://faucet.circle.com','_blank');
    if(!w||w.closed)window.location.href='https://faucet.circle.com';
    setFaucetMsg({type:'info',msg:'Address copied! Paste it in the faucet. Waiting to confirm your claim...'});
    setFaucetLoading(false);
    const prevBal=parseFloat(balance);
    let attempts=0;
    const getBal=async()=>{
      try{
        const rp=new ethers.JsonRpcProvider(ARC_RPC||ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
        const b=await rp.getBalance(address);
        return parseFloat(ethers.formatUnits(b,18));
      }catch{return prevBal;}
    };
    const poll=setInterval(async()=>{
      attempts++;
      const newBal=await getBal();
      if(newBal>=prevBal+19){
        clearInterval(poll);
        lsSave('arc_faucet_last_'+address,Date.now());
        setLastClaim(Date.now());
        setBalance(newBal.toFixed(2));
        setFaucetMsg({type:'success',msg:'20 USDC received! Next claim in 2 hours.'});
      } else if(attempts>=20){
        clearInterval(poll);
        setFaucetMsg({type:'error',msg:'Claim not detected. Try again when ready.'});
      }
    },30000);
    return;
      const data=await res.json();
      const result=data?.data?.requestToken;
      if(result?.hash){lsSave('arc_faucet_last_'+address,Date.now());setLastClaim(Date.now());setFaucetMsg({type:'success',msg:'20 USDC claimed! It will arrive shortly.'});setTimeout(refreshBal,8000);}
      else if(data?.errors){setFaucetMsg({type:'error',msg:data.errors[0]?.message||'Claim failed'});}
      else{setFaucetMsg({type:'error',msg:'Claim failed. Try again later.'});}
    }catch(e){setFaucetMsg({type:'error',msg:'Network error. Try again.'});}
    setFaucetLoading(false);hcaptchaRef.current?.resetCaptcha();setCaptchaToken('');
  };
  const cooldownLeft=Math.max(0,Math.ceil((2*60*60*1000-(Date.now()-lastClaim))/60000));
  const canClaim=cooldownLeft===0;
  const steps=[
    {color:'var(--ac)',path:'M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5v5h5',title:'Claim',desc:'Request 20 USDC from Circle faucet'},
    {color:'var(--ye)',path:'M12 2a10 10 0 110 20A10 10 0 0112 2zm0 6v4l3 3',title:'Wait',desc:'2 hour cooldown between claims'},
    {color:'var(--cy)',path:'M12 2a10 10 0 110 20A10 10 0 0112 2zm-2 10l2 2 4-4',title:'Receive',desc:'USDC arrives in your wallet'},
  ];
  return(<div>
    <div className="ap-card">
      <div className="ap-card-title">Circle Testnet Faucet</div>
      <div className="ap-card-sub">Claim 20 free USDC on Arc Testnet every 2 hours. Powered by Circle.</div>
      <div style={{textAlign:'center',padding:'24px 0'}}>
        <div style={{fontSize:56,fontWeight:900,color:'var(--ac)',fontFamily:'var(--fd)',lineHeight:1}}>20</div>
        <div style={{fontSize:14,color:'var(--tx2)',marginTop:6}}>USDC per claim</div>
        <div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Every 2 hours per address</div>
      </div>
      {faucetMsg&&<div className={faucetMsg.type==='success'?'ap-status ap-status-success':'ap-status ap-status-error'} style={{marginBottom:12}}>{faucetMsg.msg}</div>}
      {!canClaim&&<div style={{fontSize:13,color:'var(--tx2)',marginBottom:12,textAlign:'center',padding:'10px',background:'var(--elev)',borderRadius:10}}>Next claim in {cooldownLeft} minutes</div>}
      <button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={claimFaucet} disabled={!canClaim}>
        {faucetLoading?'Claiming...':(canClaim?'Claim 20 USDC':'Cooldown Active')}
      </button>
    </div>
    <div className="ap-card" style={{marginTop:16}}>
      <div className="ap-card-title">How it works</div>
      <div className="ap-div"/>
      {steps.map(({color,path,title,desc})=>(
        <div key={title} style={{display:'flex',gap:12,padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
          <div style={{width:38,height:38,borderRadius:10,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>
          </div>
          <div><div style={{fontWeight:600,color:'var(--tx1)',fontSize:14}}>{title}</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>{desc}</div></div>
        </div>
      ))}
    </div>
  </div>);
};

  const renderPage=()=>{switch(tab){case 'send':return renderSend();case 'multi':return renderMulti();case 'invoice':return renderInvoice();case 'pay':return renderPay();case 'contacts':return renderContacts();case 'schedule':return renderSchedule();case 'history':return renderHistory();case 'rates':return renderRates();case 'fees':return renderFees();case 'rewards':return renderRewards();case 'receive':return renderReceive();case 'settings':return renderSettings();case 'about':return renderAbout();case 'faucet':return renderFaucet();default:return renderSend();}};

  return(
    <div className={'ap-root'+(dm?'':' light')}>
      <style>{CSS}</style>
      {splash&&<SplashScreen onDone={()=>setSplash(false)}/>}{!splash&&showOnboarding&&<OnboardingModal onDone={()=>{lsSave('arc_onboarded',true);setShowOnboarding(false);}}/>}
      {showFaucetFrame&&<div style={{position:'fixed',inset:0,zIndex:999,background:'#000',display:'flex',flexDirection:'column'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#111'}}><span style={{color:'#fff',fontWeight:700}}>Circle Faucet</span><button onClick={()=>setShowFaucetFrame(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>×</button></div><iframe src={'https://faucet.circle.com/?address='+address+'&blockchain=ARC&token=USDC'} style={{flex:1,border:'none',width:'100%'}} title="Circle Faucet"/></div>}
      {showResumeModal&&savedSession&&<ResumeModal session={savedSession} onResume={()=>{setShowResumeModal(false);const wt=savedSession.walletType||'';if(wt&&wt!=='WalletConnect'){connectBrowser(wt);}else{setShowPicker(true);}}} onNew={()=>setShowResumeModal(false)}/>}
      {showConfirm&&confirmData&&<ConfirmModal data={confirmData} walletName={walletName} onConfirm={()=>{if(confirmAction)confirmAction()();}} onCancel={()=>{setShowConfirm(false);setConfirmData(null);setConfirmAction(null);}}/>}
      {showQR&&address&&<QRModal address={address} onClose={()=>setShowQR(false)}/>}
      {showCashbackToast&&cashbackToastData&&<CashbackToast amount={cashbackToastData.amount} rarity={cashbackToastData.rarity} onClose={()=>setShowCashbackToast(false)}/>}

      {!splash&&!address&&(
        <div className="ap-connect">
          <div className="ap-connect-card">
            <ArcPayLogo size={56}/>
            <div className="ap-connect-title">ArcPay</div>
            <div className="ap-connect-sub">Cross-border USDC remittance on Arc Testnet. Near zero fees, instant settlement.</div>
            <div className="ap-connect-btns">
              {showPicker?<WalletPicker onPick={(type,p,name)=>{setShowPicker(false);if(name)setWalletName(name);connectBrowser(type,p);}} onClose={()=>setShowPicker(false)}/>:<><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowPicker(true)}>Connect Wallet</button><div className="ap-cdivider">or</div><button className="ap-btn ap-btn-outline-full" onClick={connectWC}><IC.WC/> Connect via WalletConnect</button></>}
            </div>
            {status&&<div style={{marginTop:16,padding:'10px 14px',borderRadius:10,background:'var(--acd)',border:'1px solid var(--acs)',fontSize:13,color:'var(--ac2)'}}>{status.msg}</div>}
            <div className="ap-connect-footer">
              <div className="ap-connect-row"><span>Network</span><span style={{color:'var(--cy)',fontWeight:600}}>Arc Testnet</span></div>
              <div className="ap-connect-row"><span>Chain ID</span><span style={{fontFamily:'monospace'}}>5042002</span></div>
              <div className="ap-connect-row"><span>Contract</span><span style={{fontFamily:'monospace'}}>{REMIT_ADDR.slice(0,10)}...</span></div>
            </div>
          </div>
        </div>
      )}

      {!splash&&address&&(
        <div className="ap-app">
          {mobOpen&&<div className="ap-mob-overlay on" onClick={()=>setMobOpen(false)}/>}
          <aside className={'ap-sidebar'+(mobOpen?' mob-open':'')}>
            <div className="ap-logo-area"><svg width="34" height="34" viewBox="0 0 100 100" fill="none"><defs><linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8F0FF"/><stop offset="100%" stopColor="#7AA8D8"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="#0F1A2E"/><path d="M50 18 C28 18 18 38 18 52 L18 76 L30 76 L30 52 C30 38 39 30 50 30 C61 30 70 38 70 52 L70 76 L82 76 L82 52 C82 38 72 18 50 18Z" fill="url(#lg1)"/><path d="M38 76 L38 58 C38 53 43 48 50 48 C57 48 62 53 62 58 L62 76 L50 76Z" fill="url(#lg1)" opacity="0.5"/></svg><div><div className="ap-logo-name">ArcPay</div><div className="ap-logo-tag">Remittance</div></div></div>
            <nav className="ap-nav">
              {SIDEBAR_SECTIONS.map(sec=>(<div key={sec.title}><div className="ap-nav-sec">{sec.title}</div>{sec.items.map(({id,label,ICN,info,dot})=>(<div key={id} className={'ap-nav-item'+(tab===id?' active':'')} onClick={()=>{setTab(id);setMobOpen(false);setStatus(null);}}><ICN/>{label}{dot&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--re)',display:'inline-block',marginLeft:2,flexShrink:0}}/>}<NavTooltip text={info}/></div>))}</div>))}
            </nav>
            <div className="ap-sidebar-foot">
              <div className="ap-net-badge"><span className="ap-net-dot"/>Arc Testnet<span style={{color:'var(--tx3)',marginLeft:4,fontWeight:500}}>#5042002</span></div>
              <div className="ap-wallet-pill"><div className="ap-wallet-icon"><IC.Wallet/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase'}}>{walletName||'Wallet'}</div><div style={{fontSize:12,fontWeight:600,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{short(address)}</div></div><div style={{fontSize:13,fontWeight:700,color:'var(--ac2)',fontFamily:'var(--fd)'}}>${balance}</div></div>
            </div>
          </aside>
          <main className="ap-content">
            <header className="ap-topbar">
              <div style={{display:'flex',alignItems:'center',gap:12}}><button className="ap-btn-icon mob-show" onClick={()=>setMobOpen(true)} style={{border:'none',background:'var(--elev)'}}><IC.Menu/></button><span style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:16,letterSpacing:'-.2px',color:'var(--tx1)'}}>{PAGE_TITLES[tab]||'ArcPay'}</span></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:13,color:'var(--ac2)',background:'var(--acd)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--acs)'}}>${balance}</div><div className="ap-badge ap-badge-blue mob-hide" style={{padding:'6px 12px',fontSize:12,fontFamily:'monospace'}}>{short(address)}</div><button className="ap-btn ap-btn-icon" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button><button className="ap-btn ap-btn-danger" onClick={doDisconnect}>Disconnect</button></div>
            </header>
            <div className="ap-page"><div className="ap-page-enter">{status&&<div className={statusCls(status)} style={{marginBottom:20}}>{status.msg}</div>}{renderPage()}<div style={{textAlign:'center',marginTop:28,fontSize:11,color:'var(--tx3)'}}>ArcPay on Arc Testnet, Chain {ARC_CHAIN_ID} &nbsp;<a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{color:'var(--ac)',textDecoration:'none'}}>Block Explorer</a></div></div></div>
          </main>
          <nav className="ap-botnav">
            {BOTTOM_TABS.map(({id,label,ICN,fab})=>fab?(<div key={id} className={'ap-bot-fab-wrap'+(tab===id?' active':'')} onClick={()=>setTab(id)}><div className="ap-fab"><ICN/></div><span>{label}</span></div>):(<div key={id} className={'ap-bot-item'+(tab===id?' active':'')} onClick={()=>setTab(id)}><div style={{position:'relative',display:'inline-flex'}}><ICN/>{id==='rewards'&&cashbackPending>0&&<span className="ap-ndot"/>}</div>{label}</div>))}
          </nav>
        </div>
      )}
    </div>
  );
}

export default function App(){return <AppInner/>;}
