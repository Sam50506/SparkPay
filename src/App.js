/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import Faucet from './components/Faucet';
import MultiSend from './components/MultiSend';

import Lottie from 'lottie-react';
import arcpayAnimation from './arcpay-animation.json';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

function QRScanner({onScan,onClose}){
  const scannerRef = React.useRef(null);
  const stoppedRef = React.useRef(false);
  React.useEffect(()=>{
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    stoppedRef.current = false;
    scanner.start(
      {facingMode:'environment'},
      {fps:10,qrbox:250,aspectRatio:1.0},
      (text)=>{
        if(stoppedRef.current)return;
        stoppedRef.current=true;
        scanner.stop().then(()=>scanner.clear()).catch(()=>{}).finally(()=>onScan(text));
      },
      ()=>{}
    ).catch((err)=>{console.error('Scanner start error:',err);});
    return ()=>{
      if(!stoppedRef.current && scannerRef.current){
        stoppedRef.current=true;
        scannerRef.current.stop().then(()=>scannerRef.current.clear()).catch(()=>{});
      }
    };
  },[]);
  const handleClose=()=>{
    if(!stoppedRef.current && scannerRef.current){
      stoppedRef.current=true;
      scannerRef.current.stop().then(()=>scannerRef.current.clear()).catch(()=>{}).finally(onClose);
    }else{
      onClose();
    }
  };
  const isPC=window.innerWidth>=900;
  return (<div style={{position:'fixed',inset:0,zIndex:999,background:isPC?'rgba(0,0,0,0.75)':'#000',display:'flex',alignItems:isPC?'center':'stretch',justifyContent:isPC?'center':'stretch'}}>
    <div style={{background:'#000',display:'flex',flexDirection:'column',width:isPC?'420px':'100%',height:isPC?'480px':'100%',borderRadius:isPC?16:0,overflow:'hidden',boxShadow:isPC?'0 24px 80px rgba(0,0,0,0.6)':'none'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 16px',background:'#111'}}>
        <span style={{color:'#fff',fontWeight:700,fontSize:15}}>Scan QR Code</span>
        <button onClick={handleClose} style={{background:'none',border:'none',color:'#fff',fontSize:22,cursor:'pointer'}}>×</button>
      </div>
      <div id="qr-reader" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}/>
    </div>
  </div>);
}

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

const IC = {
  SendFab:  ()=><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Send:     ({received})=>received?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="17" x2="7" y2="7"/><polyline points="17 7 17 17 7 17"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="7 17 7 7 17 7"/></svg>,
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

const SparkPayLogo = ({ size = 36 }) => (
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

function TimePicker({value, onChange}){
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  const hours = Array.from({length:12},(_,i)=>String(i+1).padStart(2,'0'));
  const mins = ['00','05','10','15','20','25','30','35','40','45','50','55'];
  React.useEffect(()=>{
    if(!open) return;
    const handler=(e)=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',handler);
    return()=>document.removeEventListener('mousedown',handler);
  },[open]);
  const parsed = value ? value.split(':') : ['12','00'];
  const h24 = parseInt(parsed[0]);
  const m = parsed[1]||'00';
  const isPM = h24 >= 12;
  const h12 = String(h24===0?12:h24>12?h24-12:h24).padStart(2,'0');
  const setTime = (newH12, newM, newPM) => {
    let h = parseInt(newH12);
    if(newPM && h!==12) h+=12;
    if(!newPM && h===12) h=0;
    onChange(String(h).padStart(2,'0')+':'+newM);
  };
  return(
    <div ref={wrapRef} style={{position:'relative'}}>
      <div className="ap-input" style={{marginBottom:0,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',userSelect:'none'}} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontWeight:600,fontSize:15}}>{h12}:{m} {isPM?'PM':'AM'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      {open&&<div style={{position:'absolute',top:'calc(100% + 6px)',left:0,right:0,background:'var(--card)',border:'1px solid var(--b1)',borderRadius:14,zIndex:300,padding:16,boxShadow:'0 8px 32px rgba(0,0,0,0.18)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Hour</div>
            <div style={{height:156,overflowY:'scroll',display:'flex',flexDirection:'column',scrollSnapType:'y mandatory',WebkitOverflowScrolling:'touch',scrollBehavior:'smooth'}}>
              {hours.map(h=><div key={h} onClick={()=>setTime(h,m,isPM)} style={{minHeight:52,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:'pointer',fontSize:16,fontWeight:h===h12?700:400,background:h===h12?'var(--acd)':'transparent',color:h===h12?'var(--ac)':'var(--tx1)',scrollSnapAlign:'start',flexShrink:0}}>{h}</div>)}
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>Min</div>
            <input type='number' min='0' max='59' value={parseInt(m)} onChange={e=>{const v=Math.max(0,Math.min(59,parseInt(e.target.value)||0));setTime(h12,String(v).padStart(2,'0'),isPM);}} style={{width:'100%',padding:'10px',borderRadius:8,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:18,fontWeight:700,textAlign:'center',outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6}}>AM/PM</div>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              {['AM','PM'].map(p=><div key={p} onClick={()=>setTime(h12,m,p==='PM')} style={{padding:'6px 10px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:(p==='PM')===isPM?700:400,background:(p==='PM')===isPM?'var(--acd)':'transparent',color:(p==='PM')===isPM?'var(--ac)':'var(--tx1)',textAlign:'center'}}>{p}</div>)}
            </div>
          </div>
        <button className="ap-btn ap-btn-primary" style={{width:'100%',fontSize:13,padding:'9px 0'}} onClick={()=>setOpen(false)}>Confirm</button>
      </div>}
    </div>
  );
}

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
const DEFAULT_MAINTENANCE=true;
const ADMIN_ADDRESS='0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const ARC_RPC    = process.env.REACT_APP_ARC_RPC||'';
const ARC_RPC_FALLBACK='https://rpc.testnet.arc.network';
const ARC_RPC_FALLBACK2='https://arc-testnet.drpc.org';
const ARC_RPC_FALLBACK3='https://5042002.rpc.thirdweb.com';
const SCHED_ADDR = '0x1Eb2088f3FE2bD64Dde3c770f87a5047f99b8946';
const REMIT_ADDR = process.env.REACT_APP_REMIT_ADDR||'0xEC605Cea7C1270C01A3e7B869f762CfDAB8c8E41';
const USDC_ADDR  = process.env.REACT_APP_USDC_ADDR||'0x3600000000000000000000000000000000000000';
const WC_ID      = process.env.REACT_APP_WC_ID||'';
const SB_URL     = process.env.REACT_APP_SUPABASE_URL||'';
const SB_KEY     = process.env.REACT_APP_SUPABASE_ANON_KEY||'';
const APP_URL    = 'https://sparkpay-app.vercel.app';

const sbFetch=(path,opts={})=>fetch(SB_URL+path,{...opts,headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}}).then(async r=>{if(!r.ok)throw new Error(await r.text());return r.json();});
const sbInsert=(table,data)=>sbFetch('/rest/v1/'+table,{method:'POST',body:JSON.stringify(data)});
const sbSelect=(table,query)=>sbFetch('/rest/v1/'+table+'?'+query);
const sbUpdate=(table,query,data)=>sbFetch('/rest/v1/'+table+'?'+query,{method:'PATCH',body:JSON.stringify(data)});

const COUNTRIES=['Pakistan','Nigeria','India','Philippines','Bangladesh','Mexico','Brazil','Indonesia','Vietnam','Ghana','Kenya','Egypt','Turkey','Argentina','Colombia','Ukraine','Ethiopia','Tanzania','Uganda','Nepal'];
const ALL_COUNTRIES=['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Haiti','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Macedonia','Norway','Oman','Pakistan','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
const ALL_CURRENCY={'Afghanistan':'AFN','Albania':'ALL','Algeria':'DZD','Argentina':'ARS','Armenia':'AMD','Australia':'AUD','Austria':'EUR','Azerbaijan':'AZN','Bahamas':'BSD','Bahrain':'BHD','Bangladesh':'BDT','Belarus':'BYN','Belgium':'EUR','Belize':'BZD','Benin':'XOF','Bhutan':'BTN','Bolivia':'BOB','Bosnia and Herzegovina':'BAM','Botswana':'BWP','Brazil':'BRL','Brunei':'BND','Bulgaria':'BGN','Burkina Faso':'XOF','Burundi':'BIF','Cambodia':'KHR','Cameroon':'XAF','Canada':'CAD','Chad':'XAF','Chile':'CLP','China':'CNY','Colombia':'COP','Costa Rica':'CRC','Croatia':'EUR','Cuba':'CUP','Cyprus':'EUR','Czech Republic':'CZK','Denmark':'DKK','Dominican Republic':'DOP','Ecuador':'USD','Egypt':'EGP','El Salvador':'USD','Estonia':'EUR','Ethiopia':'ETB','Fiji':'FJD','Finland':'EUR','France':'EUR','Gabon':'XAF','Gambia':'GMD','Georgia':'GEL','Germany':'EUR','Ghana':'GHS','Greece':'EUR','Guatemala':'GTQ','Guinea':'GNF','Haiti':'HTG','Honduras':'HNL','Hong Kong':'HKD','Hungary':'HUF','Iceland':'ISK','India':'INR','Indonesia':'IDR','Iran':'IRR','Iraq':'IQD','Ireland':'EUR','Israel':'ILS','Italy':'EUR','Ivory Coast':'XOF','Jamaica':'JMD','Japan':'JPY','Jordan':'JOD','Kazakhstan':'KZT','Kenya':'KES','Kuwait':'KWD','Kyrgyzstan':'KGS','Laos':'LAK','Latvia':'EUR','Lebanon':'LBP','Lesotho':'LSL','Liberia':'LRD','Libya':'LYD','Lithuania':'EUR','Luxembourg':'EUR','Madagascar':'MGA','Malawi':'MWK','Malaysia':'MYR','Maldives':'MVR','Mali':'XOF','Malta':'EUR','Mauritania':'MRU','Mauritius':'MUR','Mexico':'MXN','Moldova':'MDL','Mongolia':'MNT','Montenegro':'EUR','Morocco':'MAD','Mozambique':'MZN','Myanmar':'MMK','Namibia':'NAD','Nepal':'NPR','Netherlands':'EUR','New Zealand':'NZD','Nicaragua':'NIO','Niger':'XOF','Nigeria':'NGN','North Macedonia':'MKD','Norway':'NOK','Oman':'OMR','Pakistan':'PKR','Panama':'PAB','Papua New Guinea':'PGK','Paraguay':'PYG','Peru':'PEN','Philippines':'PHP','Poland':'PLN','Portugal':'EUR','Qatar':'QAR','Romania':'RON','Russia':'RUB','Rwanda':'RWF','Saudi Arabia':'SAR','Senegal':'XOF','Serbia':'RSD','Singapore':'SGD','Slovakia':'EUR','Slovenia':'EUR','Somalia':'SOS','South Africa':'ZAR','South Korea':'KRW','South Sudan':'SSP','Spain':'EUR','Sri Lanka':'LKR','Sudan':'SDG','Sweden':'SEK','Switzerland':'CHF','Syria':'SYP','Taiwan':'TWD','Tajikistan':'TJS','Tanzania':'TZS','Thailand':'THB','Togo':'XOF','Tunisia':'TND','Turkey':'TRY','Turkmenistan':'TMT','Uganda':'UGX','Ukraine':'UAH','United Arab Emirates':'AED','United Kingdom':'GBP','United States':'USD','Uruguay':'UYU','Uzbekistan':'UZS','Venezuela':'VES','Vietnam':'VND','Yemen':'YER','Zambia':'ZMW','Zimbabwe':'ZWL'};
const ALL_CC={'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Argentina':'AR','Armenia':'AM','Australia':'AU','Austria':'AT','Azerbaijan':'AZ','Bahamas':'BS','Bahrain':'BH','Bangladesh':'BD','Belarus':'BY','Belgium':'BE','Belize':'BZ','Benin':'BJ','Bhutan':'BT','Bolivia':'BO','Bosnia and Herzegovina':'BA','Botswana':'BW','Brazil':'BR','Brunei':'BN','Bulgaria':'BG','Burkina Faso':'BF','Burundi':'BI','Cambodia':'KH','Cameroon':'CM','Canada':'CA','Chad':'TD','Chile':'CL','China':'CN','Colombia':'CO','Costa Rica':'CR','Croatia':'HR','Cuba':'CU','Cyprus':'CY','Czech Republic':'CZ','Denmark':'DK','Dominican Republic':'DO','Ecuador':'EC','Egypt':'EG','El Salvador':'SV','Estonia':'EE','Ethiopia':'ET','Fiji':'FJ','Finland':'FI','France':'FR','Gabon':'GA','Gambia':'GM','Georgia':'GE','Germany':'DE','Ghana':'GH','Greece':'GR','Guatemala':'GT','Guinea':'GN','Haiti':'HT','Honduras':'HN','Hong Kong':'HK','Hungary':'HU','Iceland':'IS','India':'IN','Indonesia':'ID','Iran':'IR','Iraq':'IQ','Ireland':'IE','Israel':'IL','Italy':'IT','Ivory Coast':'CI','Jamaica':'JM','Japan':'JP','Jordan':'JO','Kazakhstan':'KZ','Kenya':'KE','Kuwait':'KW','Kyrgyzstan':'KG','Laos':'LA','Latvia':'LV','Lebanon':'LB','Lesotho':'LS','Liberia':'LR','Libya':'LY','Lithuania':'LT','Luxembourg':'LU','Madagascar':'MG','Malawi':'MW','Malaysia':'MY','Maldives':'MV','Mali':'ML','Malta':'MT','Mauritania':'MR','Mauritius':'MU','Mexico':'MX','Moldova':'MD','Mongolia':'MN','Montenegro':'ME','Morocco':'MA','Mozambique':'MZ','Myanmar':'MM','Namibia':'NA','Nepal':'NP','Netherlands':'NL','New Zealand':'NZ','Nicaragua':'NI','Niger':'NE','Nigeria':'NG','North Macedonia':'MK','Norway':'NO','Oman':'OM','Pakistan':'PK','Panama':'PA','Papua New Guinea':'PG','Paraguay':'PY','Peru':'PE','Philippines':'PH','Poland':'PL','Portugal':'PT','Qatar':'QA','Romania':'RO','Russia':'RU','Rwanda':'RW','Saudi Arabia':'SA','Senegal':'SN','Serbia':'RS','Singapore':'SG','Slovakia':'SK','Slovenia':'SI','Somalia':'SO','South Africa':'ZA','South Korea':'KR','South Sudan':'SS','Spain':'ES','Sri Lanka':'LK','Sudan':'SD','Sweden':'SE','Switzerland':'CH','Syria':'SY','Taiwan':'TW','Tajikistan':'TJ','Tanzania':'TZ','Thailand':'TH','Togo':'TG','Tunisia':'TN','Turkey':'TR','Turkmenistan':'TM','Uganda':'UG','Ukraine':'UA','United Arab Emirates':'AE','United Kingdom':'GB','United States':'US','Uruguay':'UY','Uzbekistan':'UZ','Venezuela':'VE','Vietnam':'VN','Yemen':'YE','Zambia':'ZM','Zimbabwe':'ZW'};
const CC={Pakistan:'PK',Nigeria:'NG',India:'IN',Philippines:'PH',Bangladesh:'BD',Mexico:'MX',Brazil:'BR',Indonesia:'ID',Vietnam:'VN',Ghana:'GH',Kenya:'KE',Egypt:'EG',Turkey:'TR',Argentina:'AR',Colombia:'CO',Ukraine:'UA',Ethiopia:'ET',Tanzania:'TZ',Uganda:'UG',Nepal:'NP',Australia:'AU',Cambodia:'KH',Canada:'CA',Chile:'CL',China:'CN',Japan:'JP',Malaysia:'MY',Morocco:'MA',Peru:'PE',Poland:'PL',Romania:'RO',Russia:'RU','Saudi Arabia':'SA',Singapore:'SG','South Africa':'ZA','South Korea':'KR','Sri Lanka':'LK',Thailand:'TH','United Arab Emirates':'AE','United Kingdom':'GB'};
const flagEmoji=cc=>cc?String.fromCodePoint(...cc.toUpperCase().split('').map(c=>0x1F1E6+c.charCodeAt(0)-65)):'';
const CURRENCY={Pakistan:'PKR',Nigeria:'NGN',India:'INR',Philippines:'PHP',Bangladesh:'BDT',Mexico:'MXN',Brazil:'BRL',Indonesia:'IDR',Vietnam:'VND',Ghana:'GHS',Kenya:'KES',Egypt:'EGP',Turkey:'TRY',Argentina:'ARS',Colombia:'COP',Ukraine:'UAH',Ethiopia:'ETB',Tanzania:'TZS',Uganda:'UGX',Nepal:'NPR',Australia:'AUD',Cambodia:'KHR',Canada:'CAD',Chile:'CLP',China:'CNY',Japan:'JPY',Malaysia:'MYR',Morocco:'MAD',Peru:'PEN',Poland:'PLN',Romania:'RON',Russia:'RUB','Saudi Arabia':'SAR',Singapore:'SGD','South Africa':'ZAR','South Korea':'KRW','Sri Lanka':'LKR',Thailand:'THB','United Arab Emirates':'AED','United Kingdom':'GBP'};

const REMIT_ABI=[
  {inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}],name:'createInvoice',outputs:[{name:'',type:'bytes32'}],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}],name:'payInvoice',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}],name:'sendMoney',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:"recipients",type:"address[]"},{name:"amounts",type:"uint256[]"},{name:"countries",type:"string[]"}],name:"batchSend",outputs:[],stateMutability:"payable",type:"function"},
  {inputs:[{name:'user',type:'address'}],name:'getPayments',outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'},{name:'invoiceId',type:'bytes32'}],name:'',type:'tuple[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getUserInvoices',outputs:[{name:'',type:'bytes32[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'bytes32'}],name:'invoices',outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'createdAt',type:'uint256'},{name:'nonce',type:'uint256'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'address'}],name:'nonces',outputs:[{name:'',type:'uint256'}],stateMutability:'view',type:'function'}
];
const ERC20_ABI=['function balanceOf(address) view returns (uint256)','function allowance(address,address) view returns (uint256)','function approve(address,uint256) returns (bool)','function transfer(address,uint256) returns (bool)','function decimals() view returns (uint8)'];

const short  =a=>a?a.slice(0,6)+'...'+a.slice(-4):'';
const sendNotif=(title,body)=>{if('Notification' in window&&Notification.permission==='granted'){if(navigator.serviceWorker?.controller){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:'/sparkpay-logo.jpg'}));}else{try{new Notification(title,{body,icon:'/sparkpay-logo.jpg'});}catch(_){}}}};
const requestNotifPermission=async()=>{if('Notification' in window&&Notification.permission==='default'){await Notification.requestPermission();}};
const fmtUsdc=v=>v!=null?parseFloat(ethers.formatUnits(BigInt(v.toString()),18)).toFixed(2):'0.00';
const fmtDate=ts=>{if(!ts)return'';const d=new Date(Number(ts)*1000);return d.toLocaleDateString('en',{month:'short',day:'numeric',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});};
const fmtTime=ts=>{if(!ts)return'';const d=new Date(Number(ts)*1000);return d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});};
const ls     =(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
const lsSave =(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

async function awaitReceipt(provider,hash,ms=120000){
  const end=Date.now()+ms;
  let rpcProvider=null;
  try{rpcProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});}catch(_){}
  while(Date.now()<end){
    try{
      if(rpcProvider){const r=await rpcProvider.getTransactionReceipt(hash);if(r&&r.blockNumber)return r;}
      const r2=await provider.getTransactionReceipt(hash);if(r2&&r2.blockNumber)return r2;
    }catch(_){}
    await new Promise(res=>setTimeout(res,3000));
  }
  return null;
}

function buildChart(txns){
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return{label:d.toLocaleDateString('en',{weekday:'short'}),date:d,sent:0};});
  txns.filter(tx=>!tx.received&&tx.type!=='refund'&&tx.status!=='cancelled'&&tx.status!=='scheduled').forEach(tx=>{const txDate=new Date(Number(tx.timestamp)*1000);const label=txDate.toLocaleDateString('en',{weekday:'short'});const slot=days.find(d=>d.label===label&&d.date.toDateString()===txDate.toDateString());if(slot){let n;if(typeof tx.amount==='bigint'||typeof tx.amount==='object'){try{n=parseFloat(ethers.formatUnits(BigInt(tx.amount.toString()),18));}catch{n=0;}}else{n=parseFloat(tx.amount);}slot.sent+=isNaN(n)?0:n;}});
  return days;
}

function addrColor(addr){const colors=['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#EF4444','#06B6D4','#F97316'];return colors[parseInt(addr.slice(2,4),16)%colors.length];}
function isValidAddr(a){return a.trim().length===42&&a.trim().slice(0,2).toLowerCase()==='0x';}
function CountrySelect({value,onChange}){
  const[open,setOpen]=React.useState(false);
  const[ctrySearch,setCtrySearch]=React.useState('');
  const sheetRef=React.useRef(null);
  const isOKX=navigator.userAgent.includes('OKApp')||navigator.userAgent.includes('OKX');
  if(isOKX){
    return(<>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: 999, cursor: 'pointer', fontSize: 13, color: value ? 'var(--tx1)' : 'var(--tx3)', whiteSpace: 'nowrap', minWidth: 100, display: 'inline-flex' }} onClick={()=>{setOpen(o=>!o);window.scrollTo(0,0);}}>
        {value?<span style={{maxWidth:90,overflow:'hidden',textOverflow:'ellipsis'}}>{value}</span>:<span>Country</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open&&<div style={{position:'fixed',top:0,bottom:0,right:0,left:window.innerWidth>=900?256:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start'}} onClick={()=>setOpen(false)}>
        <div style={{background:'var(--card)',width:'100%',maxHeight:'40vh',display:'flex',flexDirection:'column',borderRadius:'0 0 20px 20px'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
            <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',fontSize:14,color:'var(--ac)',cursor:'pointer',fontWeight:600}}>Cancel</button>
            <span style={{fontWeight:700,fontSize:15,color:'var(--tx1)'}}>Select Country</span>
            <span style={{width:56}}/>
          </div>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
            <input value={ctrySearch} onChange={e=>setCtrySearch(e.target.value)} placeholder="Search country..." autoFocus style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div ref={el=>{if(el)el.scrollTop=0;}} style={{overflowY:'auto',flex:1}}>
            <div onClick={()=>{onChange('');setOpen(false);setCtrySearch('');}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx2)',borderBottom:'1px solid var(--b0)'}}>None (Optional)</div>
            {ALL_COUNTRIES.filter(c=>!ctrySearch||c.toLowerCase().includes(ctrySearch.toLowerCase())).map(c=><div key={c} onClick={()=>{onChange(c);setOpen(false);setCtrySearch('');}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx1)',borderBottom:'1px solid var(--b0)',display:'flex',alignItems:'center',gap:8,background:value===c?'var(--acd)':'transparent'}}>{c}</div>)}
          </div>
        </div>
      </div>}
    </>);
  }
  return(<>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: 999, cursor: 'pointer', fontSize: 13, color: value ? 'var(--tx1)' : 'var(--tx3)', whiteSpace: 'nowrap', minWidth: 100, display:'inline-flex' }} onClick={()=>setOpen(o=>!o)}>
      {value?<span style={{maxWidth:90,overflow:'hidden',textOverflow:'ellipsis'}}>{value}</span>:<span>Country</span>}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:'auto',flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    {open&&<div style={{position:'fixed',top:0,bottom:0,right:0,left:window.innerWidth>=900?256:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start'}} onClick={()=>{setOpen(false);setCtrySearch('');}}>
      <div style={{background:'var(--card)',width:'100%',maxHeight:'40vh',display:'flex',flexDirection:'column',borderRadius:'0 0 20px 20px'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
          <button onClick={()=>{setOpen(false);setCtrySearch('');}} style={{background:'none',border:'none',fontSize:14,color:'var(--ac)',cursor:'pointer',fontWeight:600}}>Cancel</button>
          <span style={{fontWeight:700,fontSize:15,color:'var(--tx1)'}}>Select Country</span>
          <span style={{width:56}}/>
        </div>
        <div style={{padding:'10px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
          <input value={ctrySearch} onChange={e=>setCtrySearch(e.target.value)} placeholder="Search country..." autoFocus style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
        </div>
        <div style={{overflowY:'auto',flex:1}}>
          <div onClick={()=>{onChange('');setOpen(false);setCtrySearch('');}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx2)',borderBottom:'1px solid var(--b0)'}}>None (Optional)</div>
          {ALL_COUNTRIES.filter(c=>!ctrySearch||c.toLowerCase().includes(ctrySearch.toLowerCase())).map(c=><div key={c} onClick={()=>{onChange(c);setOpen(false);setCtrySearch('');}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx1)',borderBottom:'1px solid var(--b0)',display:'flex',alignItems:'center',gap:8,background:value===c?'var(--acd)':'transparent'}}>{c}</div>)}
        </div>
      </div>
    </div>}
  </>);
}

function OKXSelect({value, onChange, options, style}){
  const[open,setOpen]=React.useState(false);
  const isOKX=navigator.userAgent.includes('OKApp')||navigator.userAgent.includes('OKX');
  if(isOKX){
    return(<>
      <div style={{...style,padding:'10px 14px',borderRadius:12,border:'1px solid var(--b1)',background:'var(--elev)',fontSize:14,color:value?'var(--tx1)':'var(--tx3)',cursor:'pointer',display:'flex',alignItems:'center',gap:4,minHeight:44}} onClick={()=>setOpen(o=>!o)}>
        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{options.find(o=>o.value===value)?.label||'Select...'}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open&&<div style={{position:'fixed',top:0,bottom:0,right:0,left:window.innerWidth>=900?256:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start'}} onClick={()=>setOpen(false)}>
        <div style={{background:'var(--card)',width:'100%',height:'55vh',overflowY:'auto',borderRadius:'0 0 20px 20px',paddingBottom:16}} onClick={e=>e.stopPropagation()}>
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
  return(<span ref={ref} style={{position:'relative',display:'inline-flex',flexShrink:0}}>{open&&<div className="ap-tip-pop">{text}</div>}</span>);
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
        <SparkPayLogo size={44}/>
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
    eip6963.forEach((w,i)=>{const name=w.info.name.toLowerCase();if(name.includes('phantom')||name.includes('solflare')||name.includes('solana'))return;options.push({type:'eip6963_'+i,label:w.info.name,icon:w.info.icon,p:w.provider});});
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
      
      <button onClick={onClose} style={{fontSize:13,color:'var(--tx2)',background:'none',border:'none',cursor:'pointer',marginTop:4}}>Back</button>
    </div>
  );
}
function NeedHelpMenu({paymentId,address,contractAddress,signer,schedAbi,payment,onRefresh}){
  const[open,setOpen]=React.useState(false);
  const[step,setStep]=React.useState(null);
  const[reason,setReason]=React.useState('');
  const[newRecipient,setNewRecipient]=React.useState('');
  const[newAmount,setNewAmount]=React.useState('');
  const[newDate,setNewDate]=React.useState('');
  const[newTime,setNewTime]=React.useState('');
  const[loading,setLoading]=React.useState(false);
  const[done,setDone]=React.useState(false);

  const submit=async(type)=>{
    setLoading(true);
    try{
      if(type==='edit'){
        const contract=new ethers.Contract(contractAddress,schedAbi,signer);
        const cancelTx=await contract.cancel(paymentId,{gasPrice:ethers.parseUnits('100','gwei'),gasLimit:100000});
        await cancelTx.wait();
        const recipient=newRecipient||payment.recipient;
        const amount=newAmount?ethers.parseUnits(newAmount,18):ethers.parseUnits(payment.amount.toString(),18);
        const dateStr=newDate?(newTime?`${newDate}T${newTime}:00`:`${newDate}T00:00:00`):null;
        const releaseTime=dateStr?Math.floor(new Date(dateStr).getTime()/1000):payment.releaseTime;
        if(releaseTime<=Math.floor(Date.now()/1000))throw new Error('Release time must be in the future');
        const scheduleTx=await contract.schedule(recipient,releaseTime,payment.country||'',{value:amount,gasPrice:ethers.parseUnits('100','gwei'),gasLimit:200000});
        await scheduleTx.wait();
        await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:paymentId,wallet_address:address,request_type:'edit',reason:'On-chain edit completed',new_recipient:recipient,new_amount:newAmount||null,new_date:newDate||null,new_time:newTime||null,contract_address:contractAddress,original_recipient:null,original_amount:null})});
        setDone(true);setOpen(false);setStep(null);
        if(onRefresh)onRefresh();
      } else {
        const r=await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:paymentId,wallet_address:address,request_type:type,reason:reason||null,new_recipient:newRecipient||null,new_amount:newAmount||null,new_date:newDate||null,new_time:newTime||null,contract_address:contractAddress,original_recipient:null,original_amount:null})});
        if(!r.ok)throw new Error('Failed');
        setDone(true);setOpen(false);setStep(null);
      }
    }catch(e){alert(e.message||'Failed to submit request. Please try again.');}
    setLoading(false);
  };

  if(done)return(<div style={{marginTop:8,fontSize:12,color:'var(--cy)',fontWeight:600,padding:'8px 12px',background:'rgba(23,229,176,.08)',borderRadius:10,textAlign:'center'}}>Request submitted. We will review and get back to you shortly.</div>);

  return(<div style={{marginTop:8}}>
    {!open&&<button onClick={()=>setOpen(true)} style={{width:'100%',background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:12,color:'var(--tx2)',fontWeight:600,cursor:'pointer'}}>Need Help?</button>}
    {open&&!step&&<div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px',marginTop:4}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:12}}>How can we help?</div>
      <div onClick={()=>setStep('cancel')} style={{padding:'12px 14px',borderRadius:10,border:'1px solid var(--b0)',marginBottom:8,cursor:'pointer',background:'var(--elev)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)'}}>Request Cancellation</div>
        <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>Ask admin to cancel and refund this payment</div>
      </div>
      <div onClick={()=>setStep('edit')} style={{padding:'12px 14px',borderRadius:10,border:'1px solid var(--b0)',cursor:'pointer',background:'var(--elev)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)'}}>Edit Payment Details</div>
        <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>Request to update recipient, amount or date</div>
      </div>
      <button onClick={()=>setOpen(false)} style={{marginTop:10,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Cancel</button>
    </div>}
    {open&&step==='cancel'&&<div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px',marginTop:4}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:10}}>Reason for cancellation</div>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Please explain why you want to cancel..." style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',minHeight:80,resize:'vertical',boxSizing:'border-box',fontFamily:'inherit'}}/>
      <button className="ap-btn ap-btn-primary" style={{width:'100%',marginTop:10}} onClick={()=>submit('cancel')} disabled={loading||!reason.trim()}>{loading?'Submitting...':'Submit Request'}</button>
      <button onClick={()=>setStep(null)} style={{marginTop:8,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Back</button>
    </div>}
    {open&&step==='edit'&&<div style={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:12,padding:'14px',marginTop:4}}>
      <div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:10}}>Edit Payment Details</div>
      <div style={{fontSize:11,color:'var(--tx3)',marginBottom:10}}>Fill in only the fields you want to change.</div>
      <div className="ap-label">New Recipient Address</div>
      <input className="ap-input" style={{marginBottom:10}} placeholder="0x..." value={newRecipient} onChange={e=>setNewRecipient(e.target.value)}/>
      <div className="ap-label">New Amount (USDC)</div>
      <input className="ap-input" type="number" style={{marginBottom:10}} placeholder="0.00" value={newAmount} onChange={e=>setNewAmount(e.target.value)}/>
      <div className="ap-label">New Release Date</div>
      <input className="ap-input" type="date" style={{marginBottom:10}} value={newDate} onChange={e=>setNewDate(e.target.value)}/>
      <div className="ap-label">New Release Time</div>
      <input className="ap-input" type="time" style={{marginBottom:10}} value={newTime} onChange={e=>setNewTime(e.target.value)}/>
      <button className="ap-btn ap-btn-primary" style={{width:'100%',marginTop:4}} onClick={()=>submit('edit')} disabled={loading||(!newRecipient&&!newAmount&&!newDate&&!newTime)}>{loading?'Submitting...':'Submit Request'}</button>
      <button onClick={()=>setStep(null)} style={{marginTop:8,width:'100%',background:'none',border:'none',fontSize:12,color:'var(--tx3)',cursor:'pointer'}}>Back</button>
    </div>}
  </div>);
}

function OnChainSchedules({address,provider,signer,schedAddr,schedAbi,onExecute,onCancel,loading}){
  const[payments,setPayments]=React.useState([]);
  const[fetching,setFetching]=React.useState(false);
  const[blockTime,setBlockTime]=React.useState(Math.floor(Date.now()/1000));
  const[requests,setRequests]=React.useState({});
  const[changesModal,setChangesModal]=React.useState(null);const fetchRequests=React.useCallback(()=>{if(!address)return;fetch(SB_URL+'/rest/v1/scheduled_payment_requests?wallet_address=eq.'+address+'&contract_address=eq.'+SCHED_ADDR+'&order=created_at.desc',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}}).then(r=>r.json()).then(d=>{const map={};(d||[]).forEach(r=>{if(!map[r.payment_id])map[r.payment_id]=[];map[r.payment_id].push(r);});setRequests(map);}).catch(()=>{});},[address]);React.useEffect(()=>{fetchRequests();const t=setInterval(fetchRequests,15000);return()=>clearInterval(t);},[fetchRequests]);
  const fetchPayments=React.useCallback(async()=>{
    if(!address||!provider)return;
    setFetching(true);
    try{
      const sched=new ethers.Contract(schedAddr,schedAbi,provider);
      const count=Number(await sched.paymentCount());
      const results=[];
      for(let i=count-1;i>=0&&results.length<20;i--){
        const p=await sched.getPayment(i);
        if(p.sender.toLowerCase()===address.toLowerCase()){
          results.push({id:i,recipient:p.recipient,amount:ethers.formatUnits(p.amount,18),releaseTime:Number(p.releaseTime),executed:p.executed,cancelled:p.cancelled,country:p.country});
        }
      }
      setPayments(results);
      const block=await provider.getBlock('latest');
      if(block)setBlockTime(block.timestamp);
    }catch(e){console.error(e);}
    setFetching(false);
  },[address,provider,schedAddr,schedAbi]);
  React.useEffect(()=>{fetchPayments();},[fetchPayments]);
  React.useEffect(()=>{const t=setInterval(()=>fetchPayments(),10000);return()=>clearInterval(t);},[fetchPayments]);
  if(payments.length===0&&!fetching)return null;
  const ChangesModal=()=>!changesModal?null:(<div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setChangesModal(null)}><div style={{background:'var(--card)',borderRadius:16,padding:20,width:'100%',maxWidth:380,boxShadow:'var(--shl)'}} onClick={e=>e.stopPropagation()}><div style={{fontSize:15,fontWeight:800,color:'var(--tx1)',marginBottom:4}}>Edit Request Details</div><div style={{fontSize:12,color:changesModal.status==='approved'?'var(--cy)':changesModal.status==='rejected'?'var(--re)':'#f59e0b',fontWeight:600,marginBottom:16}}>{changesModal.status==='approved'?'Approved by admin':changesModal.status==='rejected'?'Rejected by admin':'Waiting for admin review'}</div>{[changesModal.new_recipient&&{field:'Recipient',before:changesModal.original_recipient||'Original',after:changesModal.new_recipient,mono:true},changesModal.new_amount&&{field:'Amount',before:changesModal.original_amount?changesModal.original_amount+' USDC':'Original',after:changesModal.new_amount+' USDC'},changesModal.new_date&&{field:'Date',before:'Original',after:changesModal.new_date},changesModal.new_time&&{field:'Time',before:'Original',after:changesModal.new_time}].filter(Boolean).map((row,i)=>(<div key={i} style={{marginBottom:12,padding:'10px 12px',background:'var(--elev)',borderRadius:10}}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:8}}>{row.field}</div><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{flex:1,padding:'6px 10px',borderRadius:8,background:'rgba(255,79,97,.08)',border:'1px solid rgba(255,79,97,.2)'}}><div style={{fontSize:10,color:'var(--re)',fontWeight:700,marginBottom:2}}>Before</div><div style={{fontSize:12,color:'var(--tx1)',fontFamily:row.mono?'monospace':undefined,wordBreak:'break-all'}}>{row.mono&&row.before!=='Original'?row.before.slice(0,10)+'...'+row.before.slice(-6):row.before}</div></div><div style={{fontSize:16,color:'var(--tx3)'}}>→</div><div style={{flex:1,padding:'6px 10px',borderRadius:8,background:'rgba(23,229,176,.08)',border:'1px solid rgba(23,229,176,.2)'}}><div style={{fontSize:10,color:'var(--cy)',fontWeight:700,marginBottom:2}}>After</div><div style={{fontSize:12,color:'var(--tx1)',fontFamily:row.mono?'monospace':undefined,wordBreak:'break-all'}}>{row.mono?row.after.slice(0,10)+'...'+row.after.slice(-6):row.after}</div></div></div></div>))}<button className="ap-btn ap-btn-sec" style={{width:'100%',marginTop:4}} onClick={()=>setChangesModal(null)}>Close</button></div></div>);
  const now=blockTime;
  const hasCancelApproved=p=>!!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'&&r.status==='approved'));
  const sc=p=>p.executed?{bg:'rgba(23,229,176,.1)',cl:'var(--cy)'}:(p.cancelled||hasCancelApproved(p))?{bg:'rgba(255,79,97,.1)',cl:'var(--re)'}:now>=p.releaseTime?{bg:'rgba(59,130,196,.15)',cl:'var(--ac)'}:{bg:'rgba(100,100,100,.08)',cl:'var(--tx3)'};
  const sl=p=>p.executed?'Released':p.cancelled?'Cancelled':hasCancelApproved(p)?'Cancellation Approved — Refund Pending':now>=p.releaseTime?'Processing Payment':'Scheduled';
  return(<div className="ap-card"><ChangesModal/><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><div><div className="ap-card-title" style={{marginBottom:2}}>Scheduled Payments</div><div style={{fontSize:12,color:'var(--tx3)'}}>{payments.filter(p=>!p.executed&&!p.cancelled&&!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'&&r.status==='approved'))).length} active</div></div><button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0}} onClick={fetchPayments}>{fetching?'Loading...':'Refresh'}</button></div>{fetching&&payments.length===0&&<div style={{textAlign:'center',color:'var(--tx3)',padding:'20px 0',fontSize:13}}>Loading...</div>}{payments.map(p=>{const s=sc(p);return(<div key={p.id} style={{background:'var(--elev)',borderRadius:14,padding:'14px 16px',marginBottom:10,border:'1px solid var(--b0)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}><div style={{flex:1}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{fontSize:16,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{parseFloat(p.amount).toFixed(2)}</span><span style={{fontSize:12,fontWeight:600,color:'var(--tx3)'}}>USDC</span>{p.country&&<span className="ap-cc">{p.country}</span>}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginBottom:6}}>{p.recipient.slice(0,10)}...{p.recipient.slice(-6)}</div><div style={{marginTop:6}}><span style={{fontSize:11,fontWeight:700,padding:'4px 12px',borderRadius:999,background:s.bg,color:s.cl}}>{sl(p)}</span>{!p.executed&&!p.cancelled&&!hasCancelApproved(p)&&now>=p.releaseTime&&<div style={{fontSize:12,color:'var(--tx2)',marginTop:8,lineHeight:1.6}}>Your payment is being processed and will be delivered to the recipient within 60 minutes.</div>}{requests[p.id]&&requests[p.id].length>0&&<div style={{marginTop:8}}>{requests[p.id].slice(0,1).map((r,i)=>r.status==='approved'&&r.request_type==='cancel'?(<div key={i} style={{padding:'8px 12px',borderRadius:8,background:'rgba(23,229,176,.1)',marginBottom:4}}><span style={{fontSize:11,fontWeight:700,color:'var(--cy)'}}>Admin approved your cancellation — USDC refunded to your wallet.</span></div>):(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'6px 10px',borderRadius:8,background:r.status==='approved'?'rgba(23,229,176,.1)':r.status==='rejected'?'rgba(255,79,97,.1)':'rgba(240,196,63,.1)'}}><span style={{fontSize:11,fontWeight:700,color:r.status==='approved'?'var(--cy)':r.status==='rejected'?'var(--re)':'#f59e0b'}}>{r.request_type==='cancel'?'Cancel':'Edit'} Request: {r.status==='pending'?'Waiting for admin':r.status==='approved'?'Approved by admin':'Rejected by admin'}</span>{r.request_type==='edit'&&(r.new_recipient||r.new_amount||r.new_date||r.new_time)&&<button onClick={()=>setChangesModal(r)} style={{background:'none',border:'1px solid currentColor',borderRadius:6,padding:'2px 8px',fontSize:10,fontWeight:700,cursor:'pointer',color:r.status==='approved'?'var(--cy)':r.status==='rejected'?'var(--re)':'#f59e0b',whiteSpace:'nowrap',flexShrink:0}}>Check here</button>}</div>))}</div>}</div></div></div><div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 10px',background:'var(--card)',borderRadius:10,marginBottom:10}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tx3)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span style={{fontSize:11,color:'var(--tx2)',fontWeight:500}}>{new Date(p.releaseTime*1000).toLocaleString('en',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})}</span></div>{!p.executed&&!p.cancelled&&now<p.releaseTime&&<div style={{display:'flex',gap:8}}><button className="ap-btn ap-btn-danger" style={{flex:1,fontSize:12,padding:'10px 16px'}} onClick={()=>onCancel(p.id)} disabled={loading}>Cancel Payment</button></div>}{!p.executed&&!p.cancelled&&hasCancelApproved(p)&&<div style={{marginTop:8,fontSize:12,color:'var(--cy)',fontWeight:600,padding:'8px 12px',background:'rgba(23,229,176,.08)',borderRadius:10}}>Cancellation approved! Your USDC has been refunded to your wallet. Please refresh your balance.</div>}{!p.executed&&!p.cancelled&&!hasCancelApproved(p)&&now>=p.releaseTime&&<NeedHelpMenu paymentId={p.id} address={address} contractAddress={schedAddr} signer={signer} schedAbi={schedAbi} payment={p} onRefresh={fetchPayments}/>}</div>);})}
  </div>);
}

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
  const[sendTo,setSendTo]=useState('');const[sendAmt,setSendAmt]=useState('');const[showScanner,setShowScanner]=useState(false);const[sendCtry,setSendCtry]=useState(()=>ls('arc_ctry',''));
  const[multi,setMulti]=useState([{addr:'',amount:'',country:''}]);
  const[invPayer,setInvPayer]=useState('');const[invAmt,setInvAmt]=useState('');const[invDesc,setInvDesc]=useState('');const[invCtry,setInvCtry]=useState('');const[invId,setInvId]=useState('');
  const[payId,setPayId]=useState('');const[payDet,setPayDet]=useState(null);
  const[txns,setTxns]=useState([]);
  const[contractTxns,setContractTxns]=useState([]);
  const[contacts,setContacts]=useState([]);const[contactsLoaded,setContactsLoaded]=useState(false);const[cName,setCName]=useState('');const[cAddr,setCAddr]=useState('');const[cCtry,setCCtry]=useState('');const[editId,setEditId]=useState(null);
  const[scheds,setScheds]=useState(()=>ls('arc_scheds',[]));const[newSched,setNewSched]=useState({addr:'',amount:'',country:'',freq:'weekly',next:'',time:'09:00'});const[editSchedId,setEditSchedId]=useState(null);const[editSchedData,setEditSchedData]=useState(null);
  const[defCtry,setDefCtry]=useState(()=>ls('arc_ctry',''));
  const[cashbackPending,setCashbackPending]=useState(0);const[cashbackHistory,setCashbackHistory]=useState(()=>ls('arc_cashback_history',[]));
  useEffect(()=>{
    if(!address)return;
    sbSelect('cashback_balances','wallet_address=eq.'+address+'&select=pending_amount').then(rows=>{
      setCashbackPending(rows?.[0]?.pending_amount?parseFloat(rows[0].pending_amount):0);
    }).catch(()=>{});
  },[address]);
  const[showCashbackToast,setShowCashbackToast]=useState(false);const[cashbackToastData,setCashbackToastData]=useState(null);const[claimLoading,setClaimLoading]=useState(false);const[claimSubmitted,setClaimSubmitted]=useState(false);const[claimAmt,setClaimAmt]=useState('');const[myClaimsHistory,setMyClaimsHistory]=useState([]);const[claimsLoading,setClaimsLoading]=useState(false);const[manageTxns,setManageTxns]=useState(false);const[rateSearch,setRateSearch]=useState('');const[manageContacts,setManageContacts]=useState(false);const[selectedContacts,setSelectedContacts]=useState([]);const[cSearch,setCSearch]=useState('');const[showAdd,setShowAdd]=useState(false);const[selectedTxns,setSelectedTxns]=useState([]);const[deletedHashes,setDeletedHashes]=useState(()=>new Set(ls('arc_deleted_hashes_'+address||'',[])));const[txSearch,setTxSearch]=useState('');const[txFilter,setTxFilter]=useState('all');const[txPage,setTxPage]=useState(1);const[expandedTx,setExpandedTx]=useState(null);const[showTxns,setShowTxns]=useState(true);const[pendingClaimsCount,setPendingClaimsCount]=useState(0);

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
  useEffect(()=>{if(signer&&address){refreshBal();setContacts(ls('arc_contacts_'+address,[]));setContactsLoaded(true);}},[signer,address,refreshBal]);

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

  const awardCashback=useCallback(async(txHash,txAmount)=>{if(!txAmount||parseFloat(txAmount)<5)return;const amt=parseFloat((parseFloat(txAmount)*0.01).toFixed(3));if(amt<=0)return;
    try{
      const r=await fetch('/api/cashback-award',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wallet_address:address,amount:amt,tx_hash:txHash})});
      const d=await r.json();
      if(d.success){setCashbackPending(d.newBalance);}
    }catch(e){console.error('Cashback award failed:',e);}
    setCashbackHistory(prev=>[{amount:amt,txHash,ts:Date.now()},...prev.slice(0,49)]);setCashbackToastData({amount:amt.toFixed(3)});setShowCashbackToast(true);
  },[address]);

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

  const handleSendReview=()=>{if(!sendTo||!sendAmt){setStatus({type:'error',msg:'Please fill all required fields'});return;}if(!ethers.isAddress(sendTo)&&!/^0x[0-9a-fA-F]{40}$/.test(sendTo)){setStatus({type:'error',msg:'Invalid recipient address'});return;}const amt=parseFloat(sendAmt);if(isNaN(amt)||amt<=0){setStatus({type:'error',msg:'Invalid amount'});return;}const rows=[{k:'You Send',v:sendAmt+' USDC'},{k:'Recipient',v:short(sendTo)}];if(sendCtry&&rates[CURRENCY[sendCtry]])rows.push({k:'They Receive',v:'~'+(amt*rates[CURRENCY[sendCtry]]).toLocaleString('en',{maximumFractionDigits:0})+' '+CURRENCY[sendCtry],highlight:true});rows.push({k:'Estimated Fee',v:'~0.0005 USDC',highlight:true},{k:'Network',v:'Arc Testnet'});if(walletName?.toLowerCase().includes('okx')){handleSend();}else{setConfirmData({rows,confirmLabel:'Send to Wallet'});setConfirmAction(()=>handleSend);setShowConfirm(true);}};

  const handleSend=async()=>{setShowConfirm(false);if(!signer){setStatus({type:'error',msg:'Please reconnect your wallet to send transactions'});return;}if(!sendTo||!sendAmt)return;const amt=parseFloat(sendAmt);if(isNaN(amt)||amt<=0)return;setLoading(true);setStatus({type:'info',msg:'Sending USDC...'});try{const value=ethers.parseUnits(sendAmt,18);let gasPrice;try{const rpcs=[ARC_RPC,ARC_RPC_FALLBACK].filter(Boolean);let feeData=null;for(const rpc of rpcs){try{const rp=new ethers.JsonRpcProvider(rpc,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});feeData=await Promise.race([rp.getFeeData(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]);if(feeData)break;}catch{}}const fp=feeData?.gasPrice;gasPrice=(fp&&fp>0n)?fp:ethers.parseUnits('100','gwei');}catch{gasPrice=ethers.parseUnits('100','gwei');}const nonce=await provider.getTransactionCount(address,'pending');const tx=await signer.sendTransaction({to:ethers.getAddress(sendTo.trim().toLowerCase()),value,gasPrice,nonce});const rec={id:tx.hash+'_'+sendTo,hash:tx.hash,recipient:sendTo,amount:amt,country:sendCtry,timestamp:Math.floor(Date.now()/1000),status:'pending'};setTxns(prev=>{const u=[rec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});setStatus({type:'success',msg:'Sent '+sendAmt+' USDC to '+short(sendTo)});setSendTo('');setSendAmt('');awaitReceipt(provider,tx.hash).then(receipt=>{const confirmed=receipt==null?'pending':receipt.status===1?'confirmed':'failed';if(confirmed==='confirmed'){awardCashback(tx.hash,amt);sendNotif('Transaction Confirmed','Your USDC transfer was confirmed on Arc Testnet.');}setTxns(prev=>{const u=prev.map(t=>t.hash===tx.hash?{...t,status:confirmed}:t);lsSave('arc_txhistory_'+address,u);return u;});});setTimeout(refreshBal,6000);}catch(e){setStatus({type:'error',msg:cleanErr(e)});}finally{setLoading(false);}};

  const handleMultiReview=()=>{const valid=multi.filter(r=>(ethers.isAddress(r.addr)||/^0x[0-9a-fA-F]{40}$/.test(r.addr))&&parseFloat(r.amount)>0);if(!signer||!valid.length){setStatus({type:'error',msg:'Add at least one valid recipient'});return;}const total=valid.reduce((s,r)=>s+(parseFloat(r.amount)||0),0);if(walletName?.toLowerCase().includes('okx')){handleMulti();}else{setConfirmData({rows:[{k:'Recipients',v:valid.length+' addresses'},{k:'Total',v:total.toFixed(2)+' USDC'},{k:'Est. Fee',v:'~'+(valid.length*.001).toFixed(3)+' USDC',highlight:true},{k:'Network',v:'Arc Testnet'}],confirmLabel:'Send to All Wallets'});setConfirmAction(()=>handleMulti);setShowConfirm(true);}};

  const handleMulti=async()=>{setShowConfirm(false);const valid=multi.filter(r=>(ethers.isAddress(r.addr)||/^0x[0-9a-fA-F]{40}$/.test(r.addr))&&parseFloat(r.amount)>0);if(!signer||!valid.length)return;setLoading(true);try{const{remit}=getC();const recipients=valid.map(r=>ethers.getAddress(r.addr.toLowerCase()));const amounts=valid.map(r=>ethers.parseUnits(parseFloat(r.amount).toString(),18));const countries=valid.map(r=>r.country||'');const total=amounts.reduce((a,b)=>a+b,0n);setStatus({type:'info',msg:'Estimating gas...'});const rp=new ethers.JsonRpcProvider(ARC_RPC||ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});const iface=new ethers.Interface(['function batchSend(address[] recipients, uint256[] amounts, string[] countries) payable']);const data=iface.encodeFunctionData('batchSend',[recipients,amounts,countries]);let gasLimit=300000;try{const est=await rp.send('eth_estimateGas',[{from:address,to:REMIT_ADDR,value:'0x'+total.toString(16),data}]);gasLimit=Math.ceil(parseInt(est,16)*1.3);}catch(e){}setShowWalletPrompt(true);let tx;try{tx=await remit.batchSend(recipients,amounts,countries,{value:total,gasLimit,gasPrice:ethers.parseUnits('21','gwei')});}catch(ue){if(ue?.code===4001||ue?.code==='ACTION_REJECTED'){setShowWalletPrompt(false);setStatus({type:'error',msg:'Transaction cancelled'});setLoading(false);return;}throw ue;}setStatus({type:'info',msg:'Waiting for confirmation...'});await tx.wait();valid.forEach((r)=>{const rec={id:tx.hash+'_'+r.addr,hash:tx.hash,recipient:r.addr,amount:parseFloat(r.amount),country:r.country,timestamp:Math.floor(Date.now()/1000),status:'confirmed'};setTxns(prev=>{const u=[rec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});awardCashback(tx.hash,r.amount);});setShowWalletPrompt(false);setStatus({type:'success',msg:'Sent to '+valid.length+' recipients in one transaction!'});setMulti([{addr:'',amount:'',country:''}]);setTimeout(refreshBal,3000);setTimeout(refreshBal,6000);}catch(e){setShowWalletPrompt(false);setStatus({type:'error',msg:cleanErr(e)});}finally{setLoading(false);}};

  const handleCreateInv=async()=>{if(!address){setStatus({type:'error',msg:'Connect your wallet first'});return;}if(!invPayer||!invAmt){setStatus({type:'error',msg:'Fill required fields'});return;}setLoading(true);setStatus({type:'info',msg:'Creating invoice...'});try{const id='0x'+Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');const invoice={id,creator:address,payer:invPayer.trim(),amount:invAmt,description:invDesc,country:invCtry,paid:false};await sbInsert('invoices',invoice);const saved=ls('arc_invoices',[]);lsSave('arc_invoices',[{...invoice,desc:invDesc,ts:Math.floor(Date.now()/1000)},...saved.slice(0,99)]);setInvId(id);setStatus({type:'success',msg:'Invoice created. Share the ID with your client.'});setInvPayer('');setInvAmt('');setInvDesc('');}catch(e){setStatus({type:'error',msg:'Failed: '+e.message});}finally{setLoading(false);}};

  const handlePayInvReview=async()=>{if(!signer||!payId){setStatus({type:'error',msg:'Enter invoice ID'});return;}setLoading(true);setStatus({type:'info',msg:'Looking up invoice...'});try{const rows=await sbSelect('invoices','id=eq.'+payId.trim()+'&select=*');if(!rows||rows.length===0){setStatus({type:'error',msg:'Invoice not found'});setLoading(false);return;}const inv=rows[0];if(inv.paid){setStatus({type:'error',msg:'This invoice has already been paid'});setLoading(false);return;}setPayDet({creator:inv.creator,amount:ethers.parseUnits(inv.amount,18),description:inv.description,country:inv.country,rawAmount:inv.amount});setStatus(null);setConfirmData({rows:[{k:'Invoice ID',v:payId.trim().slice(0,16)+'...'},{k:'Amount',v:inv.amount+' USDC'},{k:'Description',v:inv.description},{k:'To',v:short(inv.creator)},{k:'Est. Fee',v:'~0.0005 USDC',highlight:true}],confirmLabel:'Pay via Wallet'});setConfirmAction(()=>()=>handlePayInv(inv));setShowConfirm(true);}catch(e){setStatus({type:'error',msg:cleanErr(e)});}finally{setLoading(false);}};

  const handlePayInv=async(inv)=>{setShowConfirm(false);if(!signer)return;setLoading(true);setStatus({type:'info',msg:'Processing payment...'});try{const value=ethers.parseUnits(inv.amount,18);let gasPrice;try{const rpcs=[ARC_RPC,ARC_RPC_FALLBACK].filter(Boolean);let feeData=null;for(const rpc of rpcs){try{const rp=new ethers.JsonRpcProvider(rpc,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});feeData=await Promise.race([rp.getFeeData(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),4000))]);if(feeData)break;}catch{}}const fp=feeData?.gasPrice;gasPrice=(fp&&fp>0n)?fp:ethers.parseUnits('100','gwei');}catch{gasPrice=ethers.parseUnits('100','gwei');}const nonce=await provider.getTransactionCount(address,'pending');const tx=await signer.sendTransaction({to:inv.creator,value,gasPrice,nonce});await sbUpdate('invoices','id=eq.'+payId.trim(),{paid:true,paid_by:address,paid_tx:tx.hash});const rec={hash:tx.hash,recipient:inv.creator,amount:inv.amount,country:inv.country,timestamp:Math.floor(Date.now()/1000),status:'submitted',type:'invoice'};setTxns(prev=>{const u=[rec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});awaitReceipt(provider,tx.hash).then(receipt=>{const confirmed=receipt==null?'pending':receipt.status===1?'confirmed':'failed';if(confirmed==='confirmed'){awardCashback(tx.hash,amt);sendNotif('Transaction Confirmed','Your USDC transfer was confirmed on Arc Testnet.');}setTxns(prev=>{const u=prev.map(t=>t.hash===tx.hash?{...t,status:confirmed}:t);lsSave('arc_txhistory_'+address,u);return u;});});setStatus({type:'success',msg:'Paid '+inv.amount+' USDC'});setPayId('');setPayDet(null);setTimeout(refreshBal,5000);}catch(e){setStatus({type:'error',msg:cleanErr(e)});}finally{setLoading(false);}};

  const exportCSV=()=>{const rows=[['Type','Hash','Recipient','Amount (USDC)','Country','Date','Status'],...txns.map(t=>['Send',t.hash||'',t.recipient||'',t.amount||'',t.country||'',fmtDate(t.timestamp),t.status||'']),...ls('arc_invoices',[]).map(i=>['Invoice',i.id||'',i.payer||'',i.amount||'',i.country||'',fmtDate(i.ts),i.paid?'Paid':'Unpaid']),...scheds.map(s=>['Scheduled','',s.addr||'',s.amount||'',s.country||'',s.next||'',s.freq||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sparkpay-history.csv';a.click();URL.revokeObjectURL(url);};

  const schedHashes=new Set(contractTxns.filter(r=>r.type==='scheduled'||r.type==='refund'||r.type==='scheduled_received').map(r=>r.hash));const allTxns=[...txns.filter(t=>!(t.type==='scheduled'&&contractTxns.some(c=>c.type==='scheduled'&&c.recipient.toLowerCase()===(t.recipient||'').toLowerCase()&&Math.abs(parseFloat(c.amount)-parseFloat(t.amount))<0.01))),...contractTxns.filter(r=>!txns.find(l=>l.hash===r.hash))].filter(t=>!deletedHashes.has(t.hash)).sort((a,b)=>Number(b.sortTime||b.timestamp||0)-Number(a.sortTime||a.timestamp||0));
  const chartData=buildChart(allTxns);const totalSent=allTxns.filter(t=>!t.received&&t.type!=='refund'&&t.status!=='scheduled').reduce((s,t)=>{const n=typeof t.amount==='bigint'||typeof t.amount==='object'?parseFloat(ethers.formatUnits(BigInt(t.amount.toString()),18)):parseFloat(t.amount);const v=isNaN(n)?0:n;return s+(v<0?0:v);},0);
  const hasPendingTx=txns.some(t=>t.status==='pending'||t.status==='submitted');
  const recentRecipients=[...new Set(txns.filter(t=>t.recipient&&!t.hash?.startsWith('0xdemo')).map(t=>t.recipient))].slice(0,5);
  const convertedVal=(()=>{if(!sendAmt||!sendCtry)return null;const r=rates[CURRENCY[sendCtry]];if(!r)return null;return(parseFloat(sendAmt)*r).toLocaleString('en',{maximumFractionDigits:0});})();
  const statusCls=s=>!s?null:({success:'ap-status ap-status-success',error:'ap-status ap-status-error',warning:'ap-status ap-status-warning',info:'ap-status ap-status-info'}[s.type]||'ap-status ap-status-info');
  const cleanErr=e=>{if(!e)return'Something went wrong. Please try again.';if(e?.code===4001||e?.code==='ACTION_REJECTED')return'Transaction cancelled.';if(e?.reason)return e.reason;if(e?.message){const m=e.message;if(m.includes('insufficient'))return'Insufficient balance.';if(m.includes('reverted'))return'Transaction reverted: '+(e?.data?.message||e?.error?.message||'Check balance and release time must be at least 10 mins in future.');if(m.includes('Too early'))return'Release time must be in the future.';if(m.includes('user rejected'))return'Transaction cancelled.';if(m.includes('network'))return'Network error. Please check your connection.';if(m.length<100)return m;}return'Transaction failed. Please try again.';};
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

  const renderMulti=()=>(<div className="ap-card"><div className="ap-card-title">Multi Send</div><div className="ap-card-sub">Send USDC to multiple recipients in one session.</div>{multi.map((r,i)=>(<div key={i} style={{marginBottom:10}}><div style={{display:'flex',gap:8,alignItems:'flex-start'}}><div style={{flex:2}}>{i===0&&<div className="ap-label">Address</div>}<input className="ap-input" style={{marginBottom:0}} placeholder="0x..." value={r.addr} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,addr:v}:x));}}/></div><div style={{flex:1}}>{i===0&&<div className="ap-label">Amount</div>}<input className="ap-input" style={{marginBottom:0}} type="number" placeholder="0.00" value={r.amount} onChange={e=>{const v=e.target.value;setMulti(p=>p.map((x,j)=>j===i?{...x,amount:v}:x));}}/></div>{multi.length>1&&<button className="ap-btn ap-btn-danger" style={{marginTop:i===0?22:0,padding:'12px 10px'}} onClick={()=>setMulti(p=>p.filter((_,j)=>j!==i))}><IC.Close/></button>}</div><div style={{marginTop:6}}>{i===0&&<div className="ap-label">Country</div>}<CountrySelect value={r.country} onChange={v=>setMulti(p=>p.map((x,j)=>j===i?{...x,country:v}:x))}/></div></div>))}<button className="ap-btn ap-btn-ghost" style={{width:'100%',marginBottom:14}} onClick={()=>setMulti(p=>[...p,{addr:'',amount:'',country:''}])}>+ Add Recipient</button><div style={{padding:'12px 14px',background:'var(--elev)',borderRadius:12,border:'1px solid var(--b1)',fontSize:14,color:'var(--tx1)',marginBottom:8}}>Total: <strong>{multi.reduce((s,r)=>s+(parseFloat(r.amount)||0),0).toFixed(2)} USDC</strong> to <strong>{multi.filter(r=>r.addr&&r.amount).length}</strong> recipients</div><button className="ap-btn ap-btn-primary" onClick={handleMultiReview} disabled={loading}>{loading?'Sending...':'Review and Send All'}</button></div>);

  const renderInvoice=()=>(<div><div className="ap-card"><div className="ap-card-title">Create Invoice</div><div className="ap-card-sub">Request USDC payment. Stored on Supabase and payable from any device.</div><div className="ap-label">Client Wallet Address</div><input className="ap-input" placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Amount (USDC)</div><input className="ap-input" type="number" placeholder="500" value={invAmt} onChange={e=>setInvAmt(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Description</div><input className="ap-input" placeholder="Logo design - May 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)} style={{marginBottom:14}}/><div className="ap-label">Your Country (Optional)</div><CountrySelect value={invCtry} onChange={v=>setInvCtry(v)}/><button className="ap-btn ap-btn-primary" onClick={handleCreateInv} disabled={loading}>{loading?'Creating...':'Create Invoice'}</button>{invId&&(<div style={{marginTop:20}}><div style={{fontSize:13,fontWeight:700,color:'var(--cy)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><IC.Check/> Invoice created successfully</div><div className="ap-code">{invId}</div><div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}><button className="ap-btn ap-btn-sec" onClick={()=>navigator.clipboard?.writeText(invId)}><IC.Copy/> Copy ID</button><button className="ap-btn ap-btn-sec" onClick={()=>{setPayId(invId);setTab('pay');}}>Pay this Invoice</button></div></div>)}</div>{ls('arc_invoices',[]).length>0&&(<div className="ap-card"><div className="ap-card-title">Recent Invoices</div><div className="ap-div"/>{ls('arc_invoices',[]).slice(0,5).map((inv,i)=>(<div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 0',borderBottom:'1px solid var(--b0)'}}><div><div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>{inv.amount} USDC - {inv.desc?.slice(0,30)}</div><div style={{fontSize:11,fontFamily:'monospace',color:'var(--tx2)',marginTop:2}}>{inv.id?.slice(0,18)}...</div></div><button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}} onClick={()=>{setPayId(inv.id);setTab('pay');}}>Pay</button></div>))}</div>)}</div>);

  const renderPay=()=>(<div className="ap-card"><div className="ap-card-title">Pay Invoice</div><div className="ap-card-sub">Enter an invoice ID to look it up and pay instantly.</div><div className="ap-label">Invoice ID</div><input className="ap-input" placeholder="0x..." value={payId} onChange={e=>{setPayId(e.target.value);setPayDet(null);}} style={{marginBottom:payDet?12:14}}/>{payDet&&(<div style={{background:'var(--acd)',border:'1px solid var(--acs)',borderRadius:12,padding:'14px 16px',marginBottom:14}}><div style={{fontSize:11,fontWeight:700,color:'var(--ac2)',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:10}}>Invoice Details</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14}}><div><span style={{color:'var(--tx2)'}}>Amount:</span> <strong>{fmtUsdc(payDet.amount)} USDC</strong></div><div><span style={{color:'var(--tx2)'}}>Country:</span> {payDet.country?<><span className="ap-cc">{ALL_CC[payDet.country]}</span> {payDet.country}</>:'N/A'}</div><div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>Description:</span> {payDet.description}</div><div style={{gridColumn:'1/-1'}}><span style={{color:'var(--tx2)'}}>From:</span> <span style={{fontFamily:'monospace',fontSize:13}}>{short(payDet.creator)}</span></div></div></div>)}<button className="ap-btn ap-btn-primary" onClick={handlePayInvReview} disabled={loading}>{loading?'Looking up...':'Find and Pay Invoice'}</button></div>);

  const renderContacts=()=>(<div><div className="ap-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><div className="ap-card-title">Contacts ({contacts.length})</div><div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Your saved wallet addresses</div></div><div style={{display:'flex',gap:8}}>{contacts.length>0&&<button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'7px 12px',color:manageContacts?'var(--re)':undefined}} onClick={()=>{setManageContacts(m=>!m);setSelectedContacts([]);}}>{manageContacts?'Done':'Manage'}</button>}<button className="ap-btn ap-btn-primary" style={{fontSize:13,padding:'8px 16px',whiteSpace:'nowrap',width:'auto'}} onClick={()=>{setShowAdd(s=>!s);setEditId(null);setCName('');setCAddr('');setCCtry('');}}>{showAdd?'Cancel':'+ Add'}</button></div></div>{showAdd&&<div style={{background:'var(--elev)',borderRadius:12,padding:14,marginBottom:12}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}><div><div className="ap-label">Name</div><input className="ap-input" style={{marginBottom:0}} placeholder="Sam" value={cName} onChange={e=>setCName(e.target.value)}/></div><div><div className="ap-label">Country</div><CountrySelect value={cCtry} onChange={v=>setCCtry(v)}/></div></div><div className="ap-label">Wallet Address</div><input className="ap-input" placeholder="0x..." value={cAddr} onChange={e=>setCAddr(e.target.value)} style={{marginBottom:10}}/><button className="ap-btn ap-btn-primary" style={{width:'100%'}} onClick={()=>{if(!cName.trim()||cAddr.trim().length!==42){setStatus({type:'error',msg:'Enter a valid name and address'});return;}if(editId){setContacts(p=>p.map(c=>c.id===editId?{...c,name:cName.trim(),address:cAddr.trim(),country:cCtry}:c));setEditId(null);}else{setContacts(p=>[{id:Date.now(),name:cName.trim(),address:cAddr.trim(),country:cCtry},...p]);}setCName('');setCAddr('');setCCtry('');setShowAdd(false);setStatus({type:'success',msg:'Contact saved'});}}>{editId?'Update Contact':'Save Contact'}</button></div>}{contacts.length>0&&<input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search contacts..." style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',marginBottom:12,boxSizing:'border-box'}}/>}{manageContacts&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select contacts to delete.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setSelectedContacts(contacts.map(c=>c.id))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button><button onClick={()=>setSelectedContacts([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>{selectedContacts.length>0&&<button onClick={()=>{if(window.confirm('Delete '+selectedContacts.length+' contacts?')){setContacts(p=>p.filter(c=>!selectedContacts.includes(c.id)));setSelectedContacts([]);setManageContacts(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Delete {selectedContacts.length} Selected</button>}</div></div>}{contacts.filter(ct=>!cSearch||ct.name.toLowerCase().includes(cSearch.toLowerCase())||ct.address.toLowerCase().includes(cSearch.toLowerCase())).map(ct=>(<div key={ct.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>{manageContacts?<input type="checkbox" checked={selectedContacts.includes(ct.id)} onChange={e=>setSelectedContacts(p=>e.target.checked?[...p,ct.id]:p.filter(x=>x!==ct.id))} style={{width:18,height:18,flexShrink:0}}/>:<div style={{width:44,height:44,borderRadius:14,background:addrColor(ct.address),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',flexShrink:0}}>{ct.name[0].toUpperCase()}</div>}<div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:6}}>{ct.country&&<span className="ap-cc">{ALL_CC[ct.country]||'?'}</span>}{ct.name}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:2,overflow:'hidden',textOverflow:'ellipsis'}}>{ct.address}</div></div><div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}><button className="ap-btn ap-btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>{setSendTo(ct.address);setSendCtry(ct.country);setTab('send');}}>Send</button><button onClick={()=>{setCAddr(ct.address);setCName(ct.name);setCCtry(ct.country||'');setEditId(ct.id);setShowAdd(true);}} style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}}>Edit Contact</button></div></div>))}</div>{[...new Set(txns.slice(0,20).map(t=>t.recipient).filter(Boolean))].slice(0,5).length>0&&<div className="ap-card"><div className="ap-card-title">Recent Recipients</div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:12}}>Quickly save from your recent transactions</div>{[...new Set(txns.slice(0,20).map(t=>t.recipient).filter(Boolean))].slice(0,5).map((addr,i)=>{const saved=contacts.find(ct=>ct.address.toLowerCase()===addr.toLowerCase());return(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--b0)'}}><div style={{width:44,height:44,borderRadius:14,background:addrColor(addr),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff',fontWeight:700,fontSize:14}}>{saved?saved.name[0].toUpperCase():addr.slice(2,4).toUpperCase()}</div><div style={{flex:1,minWidth:0,overflow:'hidden'}}>{saved?<div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{saved.name}</div>:<div/>}<div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis'}}>{addr.slice(0,10)}...{addr.slice(-6)}</div></div><div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}><button className="ap-btn ap-btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>{setSendTo(addr);setTab('send');}}>Send</button>{saved?<button style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}} onClick={()=>{setCAddr(saved.address);setCName(saved.name);setCCtry(saved.country||'');setEditId(saved.id);setShowAdd(true);}}>Edit Contact</button>:<button style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}} onClick={()=>{setCAddr(addr);setShowAdd(true);}}>Save Contact</button>}</div></div>);})}</div>}</div>);
const renderSchedule=()=>{
  const SCHED_ABI=['function schedule(address payable recipient,uint256 releaseTime,string calldata country) external payable returns (uint256)','function execute(uint256 id) external','function cancel(uint256 id) external','function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))','function paymentCount() external view returns (uint256)'];
  const ERC20_APPROVE_ABI=['function approve(address spender,uint256 amount) external returns (bool)'];
  const handleSchedule=async()=>{
    if(!newSched.addr||!newSched.amount||!newSched.next){setStatus({type:'error',msg:'Fill all required fields'});return;}
    if(!signer){setStatus({type:'error',msg:'Connect your wallet first'});return;}
    const releaseTime=Math.floor(new Date(newSched.next+'T'+(newSched.time||'12:00')).getTime()/1000);
    if(releaseTime<=Math.floor(Date.now()/1000)){setStatus({type:'error',msg:'Release time must be in the future. Please select a later date or time.'});return;}
    setLoading(true);
    try{
      const amt=ethers.parseUnits(newSched.amount,18);
      const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer);
      setStatus({type:'info',msg:'Locking USDC in escrow...'});
      const sched2=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer);
      let tx=await sched2.schedule(ethers.getAddress(newSched.addr.trim()),releaseTime,newSched.country||'',{value:amt,gasPrice:ethers.parseUnits('100','gwei'),gasLimit:200000});
      setStatus({type:'info',msg:'Transaction submitted! Waiting for confirmation...'});
      try{
        await Promise.race([tx.wait(),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),30000))]);
      }catch(waitErr){
        if(waitErr.message==='timeout'){
          setStatus({type:'success',msg:'Payment scheduled! USDC locked in escrow until '+new Date(releaseTime*1000).toLocaleString()+' (Confirmation pending)'});
          setNewSched({addr:'',amount:'',country:'',freq:'once',next:'',time:''});
          setTimeout(refreshBal,4000);
          setLoading(false);
          return;
        }
        throw waitErr;
      }
      setStatus({type:'success',msg:'Payment scheduled! USDC locked in escrow until '+new Date(releaseTime*1000).toLocaleString()});
      const schedRec={id:tx.hash+'_sched',hash:tx.hash,recipient:newSched.addr,amount:parseFloat(newSched.amount),country:newSched.country,timestamp:releaseTime,status:'scheduled',type:'scheduled',releaseTime:releaseTime};
      setTxns(prev=>{const u=[schedRec,...prev.slice(0,499)];lsSave('arc_txhistory_'+address,u);return u;});
      setNewSched({addr:'',amount:'',country:'',freq:'once',next:'',time:''});
      setTimeout(refreshBal,4000);
    }catch(e){
      console.error('Schedule error full:', e);
      let msg='Scheduling failed: '+(e?.reason||e?.shortMessage||e?.message||'Unknown error');
      if(e?.code===4001||e?.code==='ACTION_REJECTED')msg='Transaction cancelled.';
      else if(e?.message?.includes('Too early'))msg='Release time must be in the future.';
      else if(e?.message?.includes('insufficient'))msg='Insufficient balance to lock this amount.';
      else if(e?.message?.includes('reverted'))msg='Transaction reverted. Check your balance and try again.';
      setStatus({type:'error',msg});
    }
    setLoading(false);
  };
  const handleExecute=async(id)=>{
    if(!signer)return;
    setLoading(true);
    try{
      const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer);
      const tx=await sched.execute(id);
      await tx.wait();
      const execData=ls('arc_sched_exec_'+address,{});
      execData[id]={hash:tx.hash,ts:Math.floor(Date.now()/1000)};
      lsSave('arc_sched_exec_'+address,execData);
      setStatus({type:'success',msg:'Payment released successfully!'});
    }catch(e){setStatus({type:'error',msg:cleanErr(e)});}
    setLoading(false);
  };
  const handleCancelSched=async(id)=>{
    if(!signer)return;
    setLoading(true);
    try{
      const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer);
      const payment=await sched.getPayment(id);
      const tx=await sched.cancel(id);
      await tx.wait();
      setTxns(prev=>{const updatedOld=prev.map(t=>t.type==='scheduled'&&t.recipient===payment.recipient&&Math.abs(parseFloat(t.amount)-parseFloat(ethers.formatUnits(payment.amount,18)))<0.001&&t.status==='scheduled'?{...t,status:'cancelled'}:t);lsSave('arc_txhistory_'+address,updatedOld);return updatedOld;});
      setStatus({type:'success',msg:'Cancelled. USDC refunded to your wallet.'});
      setTimeout(refreshBal,4000);
    }catch(e){setStatus({type:'error',msg:cleanErr(e)});}
    setLoading(false);
  };
  return(<div><div className="ap-card"><div className="ap-card-title">Schedule Payment</div><div className="ap-card-sub">Lock USDC now. It releases to the recipient automatically at your chosen time.</div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:16,lineHeight:1.7,paddingLeft:12,borderLeft:'2px solid var(--b2)'}}>USDC is locked in a smart contract escrow and released automatically when the time arrives. You can cancel anytime before release to get your USDC back.</div><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}><div><div className="ap-label">Recipient Address</div><input className="ap-input" style={{marginBottom:0}} placeholder="0x..." value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}/></div><div><div className="ap-label">Amount (USDC)</div><input className="ap-input" style={{marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/></div><div><div className="ap-label">Country</div><CountrySelect value={newSched.country} onChange={v=>setNewSched(s=>({...s,country:v}))}/></div><div><div className="ap-label">Release Date</div><input className="ap-input" style={{marginBottom:0}} type="date" value={newSched.next||''} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))} min={new Date(Date.now()+5*60000).toISOString().slice(0,10)}/></div><div><div className="ap-label">Release Time</div><TimePicker value={newSched.time||'12:00'} onChange={v=>setNewSched(s=>({...s,time:v}))}/></div></div><button className="ap-btn ap-btn-primary" onClick={handleSchedule} disabled={loading}>{loading?'Processing...':'Lock and Schedule Payment'}</button></div><OnChainSchedules address={address} provider={provider} signer={signer} schedAddr={SCHED_ADDR} schedAbi={SCHED_ABI} onExecute={handleExecute} onCancel={handleCancelSched} loading={loading}/></div>);};

const batchGroups={};allTxns.forEach(t=>{if(!t.hash)return;if(!batchGroups[t.hash])batchGroups[t.hash]=[];batchGroups[t.hash].push(t);});
  const dedupedTxns=Object.entries(batchGroups).map(([hash,txs])=>txs.length>1?{...txs[0],isBatch:true,batchTxns:txs,amount:txs.reduce((s,t)=>s+parseFloat(t.amount||0),0)}:txs[0]);
  const PAGE_SIZE=10;const filtered=dedupedTxns.filter(t=>{const ms=!txSearch||(t.recipient||'').toLowerCase().includes(txSearch.toLowerCase())||(t.hash||'').toLowerCase().includes(txSearch.toLowerCase());const mf=txFilter==='all'||(txFilter==='confirmed'&&(t.status==='confirmed'||t.status==='scheduled'))||(txFilter==='pending'&&(t.status==='pending'||t.status==='submitted'))||(txFilter==='failed'&&t.status==='failed');return ms&&mf;});const totalPages=Math.ceil(filtered.length/PAGE_SIZE)||1;const paginated=filtered.slice((txPage-1)*PAGE_SIZE,txPage*PAGE_SIZE);const today=new Date();const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const grouped=paginated.reduce((acc,t,i)=>{const d=t.timestamp?new Date(Number(t.timestamp)*1000):new Date();let label;if(d.toDateString()===today.toDateString())label='Today';else if(d.toDateString()===yesterday.toDateString())label='Yesterday';else label=d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});if(!acc[label])acc[label]=[];acc[label].push({...t,_idx:(txPage-1)*PAGE_SIZE+i});return acc;},{});const renderHistory=()=>(<div>{allTxns.length>0&&(<div className="ap-card"><div className="ap-card-title">Transfer Volume</div><div style={{marginTop:16}}><ResponsiveContainer width="100%" height={160}><AreaChart data={chartData} margin={{top:8,right:8,left:0,bottom:0}}><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82C4" stopOpacity={0.2}/><stop offset="95%" stopColor="#3B82C4" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--b0)"/><XAxis dataKey="label" tick={{fontSize:11,fill:'var(--tx3)'}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:'var(--tx3)'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?Math.round(v/1000)+'k':v} width={35}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:10,fontSize:13,color:'var(--tx1)'}}/><Area type="monotone" dataKey="sent" stroke="#3B82C4" fill="url(#cg)" strokeWidth={2} name="Sent (USDC)"/></AreaChart></ResponsiveContainer></div></div>)}<div className="ap-card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><div className="ap-card-title">Transactions ({filtered.length})</div><div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Total sent: {totalSent.toFixed(2)} USDC</div></div><div style={{display:'flex',gap:8}}><button className="ap-btn ap-btn-sec" onClick={exportCSV} style={{fontSize:12,padding:'7px 12px'}}>Export CSV</button><button className="ap-btn ap-btn-sec" onClick={async()=>{await refreshPendingTxns();loadContractHistory();}} style={{fontSize:12,padding:'7px 12px'}}>Refresh</button><button className="ap-btn ap-btn-sec" onClick={()=>setManageTxns(m=>!m)} style={{fontSize:12,padding:'7px 12px',color:manageTxns?'var(--re)':undefined}}>{manageTxns?'Done':'Manage'}</button></div></div><div style={{display:'flex',gap:8,marginBottom:12}}><input value={txSearch} onChange={e=>{setTxSearch(e.target.value);setTxPage(1);}} placeholder="Search address or hash..." style={{flex:1,minWidth:0,padding:'8px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none'}}/><select value={txFilter} onChange={e=>{setTxFilter(e.target.value);setTxPage(1);}} style={{padding:'8px 10px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none'}}><option value="all">All</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></div>{manageTxns&&<div style={{marginBottom:12}}><div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select transactions to delete. This only removes them from this device.</div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>setSelectedTxns(dedupedTxns.map(t=>t.hash))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button><button onClick={()=>setSelectedTxns([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>{selectedTxns.length>0&&<button onClick={()=>{if(window.confirm('Delete '+selectedTxns.length+' transactions?')){const updated=txns.filter(t=>!selectedTxns.includes(t.hash));lsSave('arc_txhistory_'+address,updated);setTxns(updated);const newDeleted=new Set([...deletedHashes,...selectedTxns]);lsSave('arc_deleted_hashes_'+address,[...newDeleted]);setDeletedHashes(newDeleted);selectedTxns.forEach(h=>sbInsert('deleted_txns',{wallet_address:address,tx_hash:h}).catch(()=>{}));setSelectedTxns([]);setManageTxns(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Delete {selectedTxns.length} Selected</button>}</div></div>}{(()=>{const refunds=filtered.filter(t=>t.type==='refund');const nonRefunds=filtered.filter(t=>t.type!=='refund');const groupedNR=nonRefunds.reduce((acc,t,i)=>{const d=t.timestamp?new Date(Number(t.timestamp)*1000):new Date();let label;if(d.toDateString()===today.toDateString())label='Today';else if(d.toDateString()===yesterday.toDateString())label='Yesterday';else label=d.toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});if(!acc[label])acc[label]=[];acc[label].push({...t,_idx:i});return acc;},{});return(<>{refunds.length>0&&<div style={{marginBottom:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:1,padding:'8px 0 4px'}}>Refunds</div>{refunds.map((t,i)=>{const amt=Math.abs(parseFloat(typeof t.amount==='bigint'||(typeof t.amount==='object'&&t.amount!==null)?ethers.formatUnits(BigInt(t.amount.toString()),18):t.amount)).toFixed(2);return(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--b0)'}}><div style={{width:32,height:32,borderRadius:10,background:'rgba(23,229,176,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--cy)'}}><IC.Check/></div><div style={{flex:1}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>Refund</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{fmtDate(t.timestamp)}</div></div><div style={{textAlign:'right'}}><div style={{fontWeight:700,color:'var(--cy)',fontSize:14}}>+{amt} USDC</div></div></div>);})}</div>}{nonRefunds.length===0&&refunds.length===0?<div style={{textAlign:'center',color:'var(--tx3)',padding:'32px 0',fontSize:14}}>No transactions found</div>:Object.entries(groupedNR).map(([date,txs])=>(<div key={date}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:1,padding:'8px 0 4px'}}>{date}</div>{txs.map((t,i)=>{const isExp=expandedTx===t._idx;const amt=parseFloat(typeof t.amount==='bigint'||(typeof t.amount==='object'&&t.amount!==null)?ethers.formatUnits(BigInt(t.amount.toString()),18):t.amount).toFixed(2);return(<div key={i}><div className="ap-hist-row" onClick={()=>{if(!manageTxns)setExpandedTx(isExp?null:t._idx);}} style={{cursor:'pointer'}}><div className="ap-hist-icon">{manageTxns?<input type="checkbox" checked={!!(selectedTxns||[]).includes(t.hash)} onChange={e=>{e.stopPropagation();setSelectedTxns(prev=>e.target.checked?[...(Array.isArray(prev)?prev:[]),t.hash]:(Array.isArray(prev)?prev:[]).filter(h=>h!==t.hash));}} style={{width:18,height:18,cursor:'pointer'}} onClick={e=>e.stopPropagation()}/>:<IC.Send received={t.received}/>}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>{!t.isBatch&&t.country&&<span className="ap-cc">{ALL_CC[t.country]||'?'}</span>}{t.type==='scheduled'?'Scheduled Payment':t.type==='received'?'Received':t.type==='invoice'?'Invoice Payment':t.type==='refund'?'Refund':t.isBatch?'Batch Send ('+t.batchTxns.length+' recipients)':(t.country||'Transfer')}<span className={txBadge(t.status)}>{t.status||'pending'}</span>{t.isBatch&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:999,background:'rgba(59,130,196,.15)',color:'var(--ac)',fontWeight:600}}>Batch</span>}</div><div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:3,overflow:'hidden',textOverflow:'ellipsis'}}>{short(t.recipient)}</div></div><div style={{textAlign:'right',flexShrink:0}}><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{amt} USDC</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>{fmtDate(t.timestamp)}{t.type!=='refund'&&t.timestamp?' '+fmtTime(t.timestamp):''}</div></div></div>{isExp&&<div style={{background:'var(--elev)',borderRadius:10,padding:'10px 14px',marginBottom:8,fontSize:12,color:'var(--tx2)'}}>{t.isBatch?(<div style={{marginBottom:6}}><span style={{color:'var(--tx3)',fontWeight:600,display:'block',marginBottom:4}}>Recipients:</span>{t.batchTxns.map((bt,bi)=>(<div key={bi} style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:8,alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--b0)'}}><span style={{fontFamily:'monospace',fontSize:11,color:'var(--tx1)',overflow:'hidden',textOverflow:'ellipsis'}}>{short(bt.recipient)}</span><span style={{fontSize:11,color:'var(--tx2)'}}>{bt.country||'—'}</span><span style={{fontWeight:600,fontSize:11,textAlign:'right'}}>{parseFloat(bt.amount).toFixed(2)} USDC</span></div>))}</div>):(<div style={{marginBottom:6}}><span style={{color:'var(--tx3)'}}>To: </span><span style={{fontFamily:'monospace',wordBreak:'break-all'}}>{t.recipient}</span></div>)}{t.hash&&!t.hash.startsWith('0xdemo')&&<div style={{marginBottom:6}}><span style={{color:'var(--tx3)'}}>Hash: </span><span style={{fontFamily:'monospace',wordBreak:'break-all'}}>{t.hash}</span></div>}<div style={{display:'flex',gap:8,marginTop:8}}>{t.hash&&!t.hash.startsWith('0xdemo')&&<a href={'https://testnet.arcscan.app/tx/'+t.hash} target="_blank" rel="noreferrer" className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px'}}>View on Explorer</a>}{manageTxns&&<button onClick={e=>{e.stopPropagation();if(window.confirm('Delete this transaction?')){const updated=txns.filter(x=>x.hash!==t.hash);lsSave('arc_txhistory_'+address,updated);setTxns(updated);const newDeleted=new Set([...deletedHashes,t.hash]);lsSave('arc_deleted_hashes_'+address,[...newDeleted]);setDeletedHashes(newDeleted);sbInsert('deleted_txns',{wallet_address:address,tx_hash:t.hash}).catch(()=>{});}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 10px',fontSize:11,borderRadius:8,fontWeight:600}}>Delete</button>}</div></div>}</div>);})}</div>))}{totalPages>1&&<div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:12}}><button onClick={()=>setTxPage(1)} disabled={txPage===1} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>«</button><button onClick={()=>setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>Prev</button><span style={{fontSize:12,color:'var(--tx3)'}}>{txPage} / {totalPages}</span><button onClick={()=>setTxPage(p=>Math.min(totalPages,p+1))} disabled={txPage===totalPages} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>Next</button></div>}</>);})()}</div></div>);


  const renderRates=()=>(<div className="ap-card"><div className="ap-card-title">Live Exchange Rates</div><div className="ap-card-sub">1 USDC = 1 USD, updated live</div><input value={rateSearch} onChange={e=>setRateSearch(e.target.value)} placeholder="Search country..." style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:14,outline:'none',marginTop:14,marginBottom:8,boxSizing:'border-box'}}/><div>{ALL_COUNTRIES.filter(c=>!rateSearch||c.toLowerCase().includes(rateSearch.toLowerCase())).map(c=>{const cur=ALL_CURRENCY[c],rate=rates[cur];return(<div key={c} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--b0)'}}><div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:20}}>{flagEmoji(ALL_CC[c])}</span><div><div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{c}</div><div style={{fontSize:11,color:'var(--tx3)'}}>{cur}</div></div></div><div style={{fontSize:15,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{rate?rate.toLocaleString('en',{maximumFractionDigits:2}):'...'}</div></div>);})}</div></div>);

  const renderFees=()=>(<div className="ap-card"><div className="ap-card-title">Fee Comparison</div><div className="ap-card-sub">Sending $100 internationally.</div><table className="ap-table"><thead><tr><th>Service</th><th>Fee on $100</th><th>Speed</th><th>You Save</th></tr></thead><tbody>{[{name:'SparkPay',fee:'~$0.007',speed:'Under 1 sec',save:'$44.99',best:true},{name:'SWIFT / Bank',fee:'$25 to $45',speed:'3 to 5 days',save:'...'},{name:'Western Union',fee:'$4.99 + 3%',speed:'1 to 5 days',save:'...'},{name:'PayPal',fee:'5% (max $4.99)',speed:'1 to 3 days',save:'...'},{name:'Wise',fee:'0.5 to 2%',speed:'1 to 2 days',save:'...'},{name:'MoneyGram',fee:'$3.99 + spread',speed:'1 to 3 days',save:'...'}].map((r,i)=><tr key={i} className={r.best?'ap-best-row':''}><td style={{fontWeight:r.best?700:400}}>{r.name}{r.best?' (Best)':''}</td><td>{r.fee}</td><td>{r.speed}</td><td style={{fontWeight:700,color:r.save!=='...'?'var(--cy)':'var(--tx3)'}}>{r.save}</td></tr>)}</tbody></table><div style={{marginTop:18,background:'rgba(23,229,176,.06)',border:'1px solid rgba(23,229,176,.15)',borderRadius:14,padding:20,textAlign:'center'}}><div style={{fontSize:11,color:'var(--cy)',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>Annual savings vs bank wire at $500/month</div><div style={{fontSize:32,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)',letterSpacing:'-1px'}}>$2,699</div></div></div>);

  const renderRewards=()=>{const pct=Math.min((cashbackPending/5)*100,100);return(<div><div className="ap-card"><div className="ap-card-title">Cashback Rewards</div><div className="ap-card-sub">Earn USDC on every confirmed transaction. Claim when you reach 5 USDC.</div><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}><div style={{fontSize:32,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{parseFloat(cashbackPending).toFixed(3)}</div>{cashbackPending>0&&<div style={{fontSize:13,color:'var(--tx3)',marginBottom:6}}>USDC pending</div>}</div><div className="ap-rew-bar"><div className="ap-rew-fill" style={{width:pct+'%'}}/></div><div style={{fontSize:12,color:'var(--tx3)',marginBottom:20}}>{parseFloat(cashbackPending).toFixed(3)} / 5.000 USDC to claim</div><div style={{background:'var(--elev)',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--tx2)',lineHeight:1.6}}><strong style={{color:'var(--tx1)'}}>How it works:</strong> Earn 1% cashback on every confirmed transaction of 5 USDC or more. Cashback accumulates and can be claimed once you reach 5 USDC.</div>{claimSubmitted==='paid'?<div className="ap-status ap-status-success" style={{marginBottom:0}}><IC.Check/> Reward received! USDC has been sent to your wallet.</div>:claimSubmitted?<div className="ap-status ap-status-success" style={{marginBottom:0}}><IC.Check/> Claim submitted. Processing your reward shortly.</div>:cashbackPending>=5?(<div><div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}><input className="ap-input" type='number' placeholder={'Max '+parseFloat(cashbackPending).toFixed(3)} value={claimAmt} onChange={e=>setClaimAmt(e.target.value)} style={{marginBottom:0,flex:1}}/><button className="ap-btn ap-btn-sec" style={{marginTop:0,flexShrink:0}} onClick={()=>setClaimAmt(cashbackPending.toFixed(3))}>Max</button></div><button className="ap-btn ap-btn-primary" onClick={claimCashback} disabled={claimLoading} style={{marginTop:0}}>{claimLoading?'Submitting...':'Claim '+(parseFloat(claimAmt)||cashbackPending).toFixed(3)+' USDC'}</button></div>):<button className="ap-btn ap-btn-primary" disabled style={{marginTop:0}}>{'Need '+(5-cashbackPending).toFixed(3)+' more USDC'}</button>}</div>{myClaimsHistory.length>0&&(<div className="ap-card" style={{marginTop:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}><div className="ap-card-title">Claim Requests</div><button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0}} onClick={fetchMyClaims}>{claimsLoading?'Loading...':'Refresh'}</button></div><div className="ap-div"/>{myClaimsHistory.map((claim,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--b0)'}}><div><div style={{fontWeight:600,color:'var(--tx1)',fontSize:14}}>{parseFloat(claim.amount).toFixed(3)} USDC</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{new Date(claim.timestamp).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div><div style={{display:'flex',alignItems:'center',gap:8}}>{claim.tx_hash&&<a href={'https://testnet.arcscan.app/tx/'+claim.tx_hash} target='_blank' rel='noreferrer' style={{fontSize:11,color:'var(--ac)'}}>View Tx</a>}<span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,background:claim.status==='paid'?'rgba(23,229,176,.1)':claim.status==='failed'?'rgba(255,79,97,.1)':'rgba(59,130,196,.1)',color:claim.status==='paid'?'var(--cy)':claim.status==='failed'?'var(--re)':'var(--ac)'}}>{claim.status}</span></div></div>))}</div>)}
        {cashbackHistory.length>0&&(<div className="ap-card"><div className="ap-card-title">Cashback History</div><div className="ap-div"/>{cashbackHistory.slice(0,10).map((item,i)=>(<div key={i} className="ap-reward-item"><div style={{display:'flex',alignItems:'center',gap:10}}><div style={{width:32,height:32,borderRadius:10,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ac)',flexShrink:0}}><IC.Gift/></div><div><div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>+{item.amount} USDC</div><div style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{new Date(item.ts).toLocaleDateString('en',{month:'short',day:'numeric'})}</div></div></div><span className={'ap-cb-rarity '+(item.rarity==='Epic'?'ap-rarity-epic':item.rarity==='Rare'?'ap-rarity-rare':'ap-rarity-common')}>{item.rarity}</span></div>))}</div>)}</div>);};

  const renderReceive=()=>(<div className="ap-card"><div className="ap-card-title">Receive USDC</div><div className="ap-card-sub">Share your QR code or payment link to receive USDC.</div><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowQR(true)}>Open QR Code</button><div className="ap-div"/><div className="ap-label">Your Address</div><div style={{display:'flex',gap:8,alignItems:'center'}}><div className="ap-code" style={{flex:1}}>{address}</div><button className="ap-btn ap-btn-icon" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button></div></div>);

  const renderSettings=()=>(<div className="ap-card"><div className="ap-card-title">Settings</div><div className="ap-div"/><div className="ap-setting-row"><div><div className="ap-setting-label">Dark Mode</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Toggle between dark and light interface</div></div><button className="ap-toggle" style={{width:42,height:24,borderRadius:999,background:dm?'var(--ac)':'var(--b1)'}} onClick={()=>setDm(d=>!d)}><div className="ap-toggle-knob" style={{left:dm?22:4,width:16,height:16}}/></button></div><div className="ap-setting-row"><div><div className="ap-setting-label">Default Country</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Pre-selected when you open Send</div></div><select className="ap-select" style={{width:'auto',minWidth:140,marginBottom:0}} value={defCtry} onChange={e=>{setDefCtry(e.target.value);setSendCtry(e.target.value);}}><option value="">None</option>{ALL_COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div><div className="ap-setting-row"><div><div className="ap-setting-label">Customer Support</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Chat with us on Telegram</div></div><a href="https://t.me/Sam50506" target="_blank" rel="noreferrer" className="ap-btn ap-btn-sec" style={{textDecoration:'none',fontSize:13}}>Open Telegram</a></div><div className="ap-setting-row"><div><div className="ap-setting-label">Developer</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Sam on X</div></div><a href="https://x.com/Sam_50506" target="_blank" rel="noreferrer" className="ap-btn ap-btn-icon" style={{textDecoration:'none',color:'var(--tx1)'}}><IC.XLogo/></a></div>{address&&address.toLowerCase()==='0x9e086e6c07d5108ce40d84e9df1ce43caedd2306'&&<div className="ap-setting-row"><div><div className="ap-setting-label">Process Cashback Payouts</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Send USDC to all pending cashback claims</div></div><button className="ap-btn ap-btn-primary" style={{marginTop:0,fontSize:12}} onClick={async(e)=>{e.stopPropagation();const key=prompt('Enter admin key:');if(!key)return;e.target.disabled=true;try{const r=await fetch('/api/payout',{method:'POST',headers:{'x-admin-key':key,'Content-Type':'application/json'}});const d=await r.json();setPendingClaimsCount(0);alert(d.message+' Paid: '+d.paid);}catch(e){alert('Error: '+e.message);}finally{e.target.disabled=false;}}}>{`Process Payouts${pendingClaimsCount>0?' ('+pendingClaimsCount+' pending)':' (0 pending)'}`}</button></div>}<div className="ap-setting-row" style={{borderBottom:'none'}}><div><div className="ap-setting-label">Clear Local Data</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>Removes all saved contacts, history, and schedules</div></div><button className="ap-btn ap-btn-danger" onClick={()=>{if(window.confirm('Clear all local data? This cannot be undone.')){setContacts([]);setScheds([]);setTxns([]);setCashbackPending(0);setCashbackHistory([]);setStatus({type:'success',msg:'Local data cleared'})}}}>Clear</button></div></div>);

  const renderAbout=()=>(<div><div className="ap-card"><div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}><SparkPayLogo size={48}/><div><div className="ap-card-title">SparkPay</div><div style={{fontSize:13,color:'var(--tx2)'}}>Cross-border USDC Remittance</div></div></div><div style={{fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:16}}>SparkPay lets you send USDC instantly to anyone, anywhere across 150+ countries, with zero fees and instant settlement. No banks. No KYC. Non-custodial.</div><div style={{fontSize:13,color:'var(--tx2)',lineHeight:1.7,marginBottom:20}}>Built on Arc Testnet, SparkPay uses blockchain technology to make cross-border payments as simple as sending a message. Your funds go directly to the recipient wallet with no intermediaries.</div><div className="ap-div" style={{marginBottom:16}}/><div style={{fontSize:12,fontWeight:700,color:'var(--tx3)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:12}}>Key Features</div>{[['Send USDC Instantly','Transfer USDC to any wallet across 150+ countries in seconds. Zero fees, no bank delays, no KYC required.'],['Multi Send','Send USDC to multiple recipients in a single session. Ideal for payroll, batch payments, or splitting costs across a team.'],['Scheduled Payments','Schedule a payment to release at a future time. Funds are locked on-chain and automatically released when the time comes.'],['Invoice and Pay','Create a USDC payment request and share the invoice ID with your client. They can pay it instantly from anywhere in the world.'],['1% Cashback','Earn 1% back in USDC rewards on every confirmed transfer of 5 USDC or more. Claim your rewards directly to your wallet once they reach 5 USDC.'],['Non-custodial and No KYC','SparkPay never holds your funds. You connect your own wallet and send directly from it. No passport, no selfie, no bank details needed.']].map(([title,desc])=>(<div key={title} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'10px 0',borderBottom:'1px solid var(--b0)'}}><div style={{width:6,height:6,borderRadius:999,background:'var(--ac)',marginTop:5,flexShrink:0}}/><div><div style={{fontSize:13,fontWeight:700,color:'var(--tx1)'}}>{title}</div><div style={{fontSize:12,color:'var(--tx2)',marginTop:2}}>{desc}</div></div></div>))}</div><div className="ap-card"><div className="ap-card-title">Network Details</div><div className="ap-div"/>{[['Chain ID','5042002'],['RPC','rpc.testnet.arc.network'],['USDC Contract',USDC_ADDR],['Remittance Contract',REMIT_ADDR],['Block Explorer','testnet.arcscan.app']].map(([k,v])=>(<div key={k} style={{padding:'10px 0',borderBottom:'1px solid var(--b0)'}}><div style={{fontSize:12,color:'var(--tx3)',fontWeight:600,marginBottom:3}}>{k}</div><div style={{fontSize:12,fontFamily:'monospace',color:'var(--tx1)',wordBreak:'break-all'}}>{v}</div></div>))}</div></div>);


  const FaqPage=()=>{const[open,setOpen]=React.useState(null);const faqs=[['General',[['What is SparkPay?','SparkPay is a free app that lets you send USDC to anyone in the world. You connect your crypto wallet, enter the recipient address and amount, and the money reaches the recipient in seconds.'],['Do I need to create an account?','No. You just connect your existing crypto wallet like MetaMask or any WalletConnect compatible wallet. There is no sign up, no email, and no password required.'],['Is it really free to send?','Yes. SparkPay charges zero fees. The only cost would be network gas fees, but on Arc Testnet those are also effectively zero.'],['How long does a transfer take?','Usually a few seconds. Once your transaction is submitted to the blockchain, it confirms almost instantly on Arc Testnet.'],['Is my money safe?','SparkPay never touches your funds. You send directly from your own wallet. Nobody at SparkPay can access, hold, or move your money.']]],['Features',[['What is USDC Cashback?','Every time you send 5 USDC or more and the transaction confirms on chain, you earn 1% of the amount back as a reward. When your rewards reach 5 USDC, you can claim it directly to your wallet.'],['What is the Faucet?','The Faucet lets you claim free testnet USDC every 2 hours so you can try SparkPay without using real money. This is available because SparkPay runs on Arc Testnet.'],['Can I schedule payments?','Yes. The Scheduled tab lets you set up a reminder for a future payment. On the scheduled date, SparkPay will pre-fill the Send form so you can confirm with one tap.'],['What is Multi Send?','Multi Send lets you send USDC to multiple wallet addresses in one go. This is useful for paying several people at once, like a team or group.'],['What is an Invoice?','You can create a payment request with a specific amount and share it as a link or ID. The recipient can open it in SparkPay and pay it directly without needing to copy your address manually.']]],['Troubleshooting',[['I sent to the wrong address. What do I do?','Blockchain transactions cannot be reversed once confirmed. Always double check the recipient address before confirming. Save trusted addresses in your Contacts to avoid this in the future.'],['My transaction is stuck as pending.','Wait a few minutes and refresh the History tab. If it stays pending, check the transaction hash on testnet.arcscan.app. If it still does not resolve, contact support on Telegram.'],['My cashback is not showing up.','Cashback only applies to transactions of 5 USDC or more that are fully confirmed on chain. Check the Rewards tab after your transaction shows as confirmed in History.'],['I need more help.','If you cannot find an answer here, reach out directly on Telegram. Tap the button below and send a message describing your issue.']]]];return(<div><div className="ap-card"><div className="ap-card-title">Frequently Asked Questions</div><div className="ap-card-sub">Tap a question to see the answer.</div>{faqs.map(([section,items])=>(<div key={section} style={{marginTop:16}}><div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:8}}>{section}</div><div className="ap-div"/>{items.map(([q,a],i)=>{const key=section+i;return(<div key={key} style={{borderBottom:'1px solid var(--b0)'}}><div onClick={()=>setOpen(open===key?null:key)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 0',cursor:'pointer'}}><div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',paddingRight:12}}>{q}</div><div style={{fontSize:18,color:'var(--tx3)',flexShrink:0}}>{open===key?'−':'+'}</div></div>{open===key&&<div style={{fontSize:13,color:'var(--tx2)',lineHeight:1.8,paddingBottom:14}}>{a}</div>}</div>);})}</div>))}</div><div className="ap-card" style={{textAlign:'center'}}><div style={{fontSize:13,fontWeight:700,color:'var(--tx1)',marginBottom:6}}>Still need help?</div><div style={{fontSize:12,color:'var(--tx2)',marginBottom:16}}>Contact us on Telegram and we will get back to you as soon as possible.</div><a href="https://t.me/Sam50506" target="_blank" rel="noreferrer" className="ap-btn ap-btn-primary" style={{textDecoration:'none',display:'block',textAlign:'center'}}>Chat on Telegram</a></div></div>);};
  const renderFaq=()=><FaqPage/>;
  const renderPage=()=>{switch(tab){case 'send':return renderSend();case 'multi':return <MultiSend multi={multi} setMulti={setMulti} loading={loading} handleMultiReview={handleMultiReview}/>;case 'invoice':return renderInvoice();case 'pay':return renderPay();case 'contacts':return renderContacts();case 'schedule':return renderSchedule();case 'history':return renderHistory();case 'rates':return renderRates();case 'fees':return renderFees();case 'rewards':return renderRewards();case 'receive':return renderReceive();case 'settings':return renderSettings();case 'about':return renderAbout();case 'faq':return renderFaq();case 'faucet':return <Faucet address={address} balance={balance} setBalance={setBalance} faucetLoading={faucetLoading} setFaucetLoading={setFaucetLoading} faucetMsg={faucetMsg} setFaucetMsg={setFaucetMsg} lastClaim={lastClaim} setLastClaim={setLastClaim}/>;default:return renderSend();}};

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


function ScheduledRequests(){
  const SB_URL=process.env.REACT_APP_SUPABASE_URL;
  const SB_KEY=process.env.REACT_APP_SUPABASE_ANON_KEY;
  const[requests,setRequests]=React.useState([]);
  const[loading,setLoading]=React.useState(true);
  const fetchRequests=async()=>{setLoading(true);try{const r=await fetch(SB_URL+'/rest/v1/scheduled_payment_requests?order=created_at.desc&limit=20',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}});const d=await r.json();setRequests(d||[]);}catch(e){console.error(e);}setLoading(false);};
  const updateStatus=async(id,status,request_type,payment_id)=>{try{const token=sessionStorage.getItem('sp_admin_jwt');if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}const r=await fetch('/api/schedule-request',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({action:status==='approved'?'approve':'reject',request_id:id,payment_id,request_type})});const d=await r.json();if(d.error){alert('Failed: '+d.error);return;}fetchRequests();
      if(status==='approved'&&request_type==='edit'){
        const req=requests.find(r=>r.id===id);
        const changes=[];
        if(req?.new_recipient)changes.push('Recipient: '+req.new_recipient.slice(0,10)+'...'+req.new_recipient.slice(-6));
        if(req?.new_amount)changes.push('Amount: '+req.new_amount+' USDC');
        if(req?.new_date)changes.push('Date: '+req.new_date);
        if(req?.new_time)changes.push('Time: '+req.new_time);
        alert('Edit approved!\n\nChanges recorded:\n'+changes.join('\n'));
      } else {
        alert(status==='approved'?'Approved successfully!':'Rejected successfully.');
      }}catch(e){alert('Failed: '+e.message);}};
  const[showAll,setShowAll]=React.useState(false);
  React.useEffect(()=>{fetchRequests();},[]);
  if(loading)return <div style={{fontSize:13,color:'var(--tx3)',padding:'12px 0'}}>Loading...</div>;
  if(requests.length===0)return <div style={{fontSize:13,color:'var(--tx3)',padding:'12px 0'}}>No requests yet.</div>;
  const visible=showAll?requests:requests.slice(0,5);
  return(<div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <div style={{fontSize:12,color:'var(--tx3)'}}>{requests.filter(r=>r.status==='pending').length} pending</div>
      <button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'4px 10px',marginTop:0}} onClick={fetchRequests}>Refresh</button>
    </div>
    {visible.map(r=>(<div key={r.id} style={{padding:'14px 0',borderBottom:'1px solid var(--b0)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:999,background:r.request_type==='cancel'?'rgba(255,79,97,.1)':'rgba(59,130,196,.1)',color:r.request_type==='cancel'?'var(--re)':'var(--ac)'}}>{r.request_type==='cancel'?'Cancel Request':'Edit Request'}</span>
            <span style={{fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:999,background:r.status==='pending'?'rgba(240,196,63,.1)':r.status==='approved'?'rgba(23,229,176,.1)':'rgba(255,79,97,.1)',color:r.status==='pending'?'#f59e0b':r.status==='approved'?'var(--cy)':'var(--re)'}}>{r.status}</span>
          </div>
          <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginBottom:4}}>Payment #{r.payment_id} • {r.wallet_address.slice(0,10)}...{r.wallet_address.slice(-6)}</div>
          <div style={{fontSize:11,color:'var(--tx3)',marginBottom:4}}>{new Date(r.created_at).toLocaleString()}</div>
          {r.reason&&<div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:8,padding:'8px 10px',marginTop:4}}>{r.reason}</div>}
          {r.request_type==='edit'&&<div style={{fontSize:12,color:'var(--tx2)',marginTop:4,background:'var(--elev)',borderRadius:8,padding:'8px 10px'}}>{r.new_recipient&&<div>📍 New recipient: <span style={{fontFamily:'monospace'}}>{r.new_recipient.slice(0,10)}...{r.new_recipient.slice(-6)}</span></div>}{r.new_amount&&<div>💰 New amount: {r.new_amount} USDC</div>}{r.new_date&&<div>📅 New date: {r.new_date}</div>}{r.new_time&&<div>🕐 New time: {r.new_time}</div>}</div>}
        </div>
      </div>
      {r.status==='pending'&&<div style={{display:'flex',gap:8}}>
        <button className="ap-btn ap-btn-primary" style={{fontSize:11,padding:'6px 12px',marginTop:0}} onClick={()=>updateStatus(r.id,'approved',r.request_type,r.payment_id)}>Approve</button>
        <button className="ap-btn ap-btn-danger" style={{fontSize:11,padding:'6px 12px'}} onClick={()=>updateStatus(r.id,'rejected',r.request_type,r.payment_id)}>Reject</button>
      </div>}
    </div>))}
    {requests.length>5&&<button onClick={()=>setShowAll(s=>!s)} style={{width:'100%',marginTop:8,padding:'10px',background:'var(--elev)',border:'1px solid var(--b1)',borderRadius:10,color:'var(--ac)',fontSize:13,fontWeight:600,cursor:'pointer'}}>{showAll?'Show less':'Show all ('+requests.length+')'}</button>}
  </div>);
}

function AdminPanel({address,signer,maintenanceMode,setMaintenanceMode}){
  const isAdmin = address && address.toLowerCase()===ADMIN_ADDRESS;
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
      const r=await fetch('/api/pin-setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,pin:pinValue})});
      const d=await r.json();
      if(d.error)throw new Error(d.error);
      setPinSetup(true);setPinMode('verify');setPinValue('');setPinConfirm('');
    }catch(e){setPkError(e.message);}
    setPkLoading(false);
  };

  const verifyPin=async()=>{
    setPkLoading(true);setPkError('');
    try{
      const r=await fetch('/api/pin-verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,pin:pinValue})});
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
      const optRes=await fetch('/api/webauthn-register-options',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address})});
      const options=await optRes.json();
      if(options.error)throw new Error(options.error);
      const attResp=await startRegistration(options);
      const verRes=await fetch('/api/webauthn-register-verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,response:attResp})});
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
      const optRes=await fetch('/api/webauthn-login-options',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address})});
      const options=await optRes.json();
      if(options.error)throw new Error(options.error);
      const authResp=await startAuthentication(options);
      const verRes=await fetch('/api/webauthn-login-verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address,response:authResp})});
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
      <input type="password" inputMode="numeric" maxLength={12} value={pinValue} onChange={e=>setPinValue(e.target.value.replace(/\D/g,''))} placeholder="Enter PIN" style={{width:220,padding:'14px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:18,textAlign:'center',letterSpacing:6,outline:'none',marginBottom:pinMode==='setup'?12:20}}/>
      {pinMode==='setup'&&<input type="password" inputMode="numeric" maxLength={12} value={pinConfirm} onChange={e=>setPinConfirm(e.target.value.replace(/\D/g,''))} placeholder="Confirm PIN" style={{width:220,padding:'14px 16px',borderRadius:14,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.05)',color:'#fff',fontSize:18,textAlign:'center',letterSpacing:6,outline:'none',marginBottom:20}}/>}
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

  return(<div style={{minHeight:'100vh',background:'var(--bg)',padding:24}}>
    <div style={{maxWidth:800,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div>
          <div style={{fontFamily:'var(--fd)',fontSize:26,fontWeight:900,color:'var(--tx1)'}}>Admin Dashboard</div>
          <div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>{ADMIN_ADDRESS.slice(0,8)}...{ADMIN_ADDRESS.slice(-6)}</div>
        </div>
        <div style={{width:38,height:38,borderRadius:12,background:'rgba(34,197,94,0.1)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M12 2a4 4 0 0 0-4 4v2a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z"/><path d="M6 11v2a6 6 0 0 0 12 0v-2"/></svg>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24}}>
        <div className="ap-card">
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <div style={{fontSize:12,color:'var(--tx3)'}}>Total Transactions</div>
          </div>
          <div style={{fontSize:28,fontWeight:900,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{loading?'...':stats.txCount}</div>
        </div>
        <div className="ap-card">
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
            <div style={{fontSize:12,color:'var(--tx3)'}}>Total Volume (USDC)</div>
          </div>
          <div style={{fontSize:28,fontWeight:900,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{loading?'...':stats.volume.toFixed(2)}</div>
        </div>
      </div>

      <div className="ap-card" style={{marginBottom:24}}>
        <div className="ap-card-title">Maintenance Mode</div>
        <div style={{fontSize:13,color:'var(--tx2)',marginTop:4,marginBottom:14}}>When enabled, only the admin wallet can access the app.</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{padding:'6px 14px',borderRadius:999,fontSize:12,fontWeight:700,background:maintenanceMode?'rgba(239,68,68,0.15)':'rgba(34,197,94,0.15)',color:maintenanceMode?'#ef4444':'#22c55e'}}>
            {maintenanceMode?'MAINTENANCE ON':'LIVE'}
          </div>
          <button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 14px'}} onClick={async()=>{
            const newVal=!maintenanceMode;
            try{
              await fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode',{
                method:'PATCH',
                headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'},
                body:JSON.stringify({value:String(newVal)})
              });
              setMaintenanceMode(newVal);
            }catch(e){alert('Failed to update maintenance mode: '+e.message);}
          }}>{maintenanceMode?'Turn Off':'Turn On'}</button>
        </div>
      </div>

      <div className="ap-card" style={{marginBottom:24}}>
        <div className="ap-card-title">Cashback Payouts</div>
        <div style={{fontSize:13,color:'var(--tx2)',marginTop:4,marginBottom:14}}>Pending claims: {loading?'...':stats.pendingClaims}</div>
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

      <div className="ap-card" style={{marginBottom:24}}>
        <div className="ap-card-title">Scheduled Payment Requests</div>
        <ScheduledRequests/>
      </div>

      <div className="ap-card" style={{marginBottom:24}}>
        <div className="ap-card-title">Quick Links</div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:12}}>
          <a href={'https://testnet.arcscan.app/address/'+ADMIN_ADDRESS} target="_blank" rel="noreferrer" style={{fontSize:13,color:'var(--ac)'}}>View Admin Wallet on Explorer</a>
          <a href="#" onClick={(e)=>{e.preventDefault();sessionStorage.removeItem('sp_admin_jwt');window.location.hash='';window.location.reload();}} style={{fontSize:13,color:'var(--ac)'}}>Sign Out & Back to App</a>
        </div>
      </div>
    </div>
  </div>);
}


const ConnectTroubleshoot=()=>{const[open,setOpen]=React.useState(false);const[item,setItem]=React.useState(null);const issues=[['My wallet is not showing up in the list.','Make sure your wallet app is installed on this device and you are using a browser that supports wallet connections. On mobile, try opening SparkPay directly inside your wallet app browser.'],['I approved the connection but nothing happened.','Close the wallet popup and try connecting again. Sometimes the connection request times out. If it keeps happening, refresh the page and try once more.'],['It says wrong network or chain.','SparkPay runs on Arc Testnet. Open your wallet, go to network settings, and switch to Arc Testnet. If Arc Testnet is not listed, SparkPay will add it automatically when you connect.'],['WalletConnect QR code is not appearing.','Make sure you are not blocking popups in your browser. Try switching to a different browser or use the direct Connect Wallet button instead.'],['I clicked WalletConnect but nothing happened.','WalletConnect takes a few seconds to load all supported wallets. Wait 6 to 7 seconds and the popup will appear on its own. Do not tap the button again.'],['Nothing is working.','Reach out on Telegram and describe what is happening. We will help you get connected.']];return(<div style={{marginTop:16}}><button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',color:'var(--tx3)',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 0',display:'flex',alignItems:'center',gap:6,width:'100%',justifyContent:'center'}}><span>{open?'Hide':'Having trouble connecting?'}</span><span style={{fontSize:14}}>{open?'−':'+'}</span></button>{open&&<div style={{marginTop:12,borderRadius:12,border:'1px solid var(--b1)',overflow:'hidden'}}>{issues.map(([q,a],i)=>(<div key={i} style={{borderBottom:i<issues.length-1?'1px solid var(--b0)':'none'}}><div onClick={()=>setItem(item===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',cursor:'pointer'}}><div style={{fontSize:12,fontWeight:600,color:'var(--tx1)',paddingRight:8,textAlign:'left'}}>{q}</div><div style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>{item===i?'−':'+'}</div></div>{item===i&&<div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.8,padding:'0 14px 12px'}}>{a}{i===issues.length-1&&<a href='https://t.me/Sam50506' target='_blank' rel='noreferrer' style={{display:'block',marginTop:10,color:'var(--ac)',fontWeight:700,textDecoration:'none'}}>Open Telegram</a>}</div>}</div>))}</div>}</div>);};

function App(){return <AppInner/>;}
export default App;
