import React from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({onScan,onClose}){
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

