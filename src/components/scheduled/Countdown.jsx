import React, { useState, useEffect } from 'react';

export function Countdown({releaseTime}){
  const[now,setNow]=useState(Math.floor(Date.now()/1000));
  useEffect(()=>{const t=setInterval(()=>setNow(Math.floor(Date.now()/1000)),1000);return()=>clearInterval(t);},[]);
  const diff=releaseTime-now;
  if(diff<=0)return null;
  const h=Math.floor(diff/3600);
  const m=Math.floor((diff%3600)/60);
  const s=diff%60;
  return(<span style={{fontFamily:'monospace',fontWeight:700,color:'var(--ac)',fontSize:13}}>{String(h).padStart(2,'0')}H : {String(m).padStart(2,'0')}M : {String(s).padStart(2,'0')}S</span>);
}
