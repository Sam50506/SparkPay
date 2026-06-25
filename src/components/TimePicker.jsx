import React from 'react';

export function TimePicker({value, onChange}){
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

  const parsed = value ? value.split(':') : ['09','00'];
  const h24 = parseInt(parsed[0]);
  const m = parsed[1]||'00';
  const isPM = h24 >= 12;
  const h12 = String(h24===0?12:h24>12?h24-12:h24).padStart(2,'0');

  // Snap minute to nearest 5
  const mSnapped = mins.reduce((a,b)=>Math.abs(parseInt(b)-parseInt(m))<Math.abs(parseInt(a)-parseInt(m))?b:a);

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

      {open&&<div style={{
        position:'absolute',
        bottom:'calc(100% + 8px)',
        left:0,right:0,
        background:'var(--card)',
        border:'1px solid var(--b1)',
        borderRadius:14,
        zIndex:300,
        padding:16,
        boxShadow:'0 -8px 32px rgba(0,0,0,0.22)'
      }}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,marginBottom:12}}>

          {/* Hour */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6,textAlign:'center'}}>Hour</div>
            <div style={{height:156,overflowY:'scroll',display:'flex',flexDirection:'column',scrollSnapType:'y mandatory',WebkitOverflowScrolling:'touch',scrollBehavior:'smooth'}}>
              {hours.map(h=>(
                <div key={h} onClick={()=>setTime(h,mSnapped,isPM)} style={{minHeight:52,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:'pointer',fontSize:16,fontWeight:h===h12?700:400,background:h===h12?'var(--acd)':'transparent',color:h===h12?'var(--ac)':'var(--tx1)',scrollSnapAlign:'start',flexShrink:0}}>{h}</div>
              ))}
            </div>
          </div>

          {/* Min */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6,textAlign:'center'}}>Min</div>
            <div style={{height:156,overflowY:'scroll',display:'flex',flexDirection:'column',scrollSnapType:'y mandatory',WebkitOverflowScrolling:'touch',scrollBehavior:'smooth'}}>
              {mins.map(mn=>(
                <div key={mn} onClick={()=>setTime(h12,mn,isPM)} style={{minHeight:52,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,cursor:'pointer',fontSize:16,fontWeight:mn===mSnapped?700:400,background:mn===mSnapped?'var(--acd)':'transparent',color:mn===mSnapped?'var(--ac)':'var(--tx1)',scrollSnapAlign:'start',flexShrink:0}}>{mn}</div>
              ))}
            </div>
          </div>

          {/* AM/PM */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:6,textAlign:'center'}}>AM/PM</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {['AM','PM'].map(p=>(
                <div key={p} onClick={()=>setTime(h12,mSnapped,p==='PM')} style={{padding:'10px 6px',borderRadius:8,cursor:'pointer',fontSize:14,fontWeight:(p==='PM')===isPM?700:400,background:(p==='PM')===isPM?'var(--acd)':'var(--elev)',color:(p==='PM')===isPM?'var(--ac)':'var(--tx1)',textAlign:'center',border:'1px solid ',borderColor:(p==='PM')===isPM?'var(--acs)':'var(--b1)'}}>{p}</div>
              ))}
            </div>
          </div>
        </div>

        <button className="ap-btn ap-btn-primary" style={{width:'100%',fontSize:13,padding:'9px 0'}} onClick={()=>setOpen(false)}>Confirm</button>
      </div>}
    </div>
  );
}

export default TimePicker;
