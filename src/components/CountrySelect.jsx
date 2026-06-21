import React from 'react';
import { ALL_COUNTRIES } from '../config';

export default function CountrySelect({value,onChange}){
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

