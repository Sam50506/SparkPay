path = "src/components/RewardsPage.jsx"
with open(path) as f:
    content = f.read()

old = """          {myClaimsHistory.map((claim,i)=>(
            <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontWeight:600,color:'var(--tx1)',fontSize:14}}>{parseFloat(claim.amount).toFixed(3)} USDC</div>
                  <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{new Date(claim.timestamp).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                {claim.tx_hash&&<a href={'https://testnet.arcscan.app/tx/'+claim.tx_hash} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ac)'}}>View Tx</a>}
              </div>
              <div style={{display:'flex',gap:20,marginTop:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'0.03em',marginBottom:3}}>Status</div>
                  <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,display:'inline-block',
                    background:claim.status==='paid'?'rgba(23,229,176,.1)':claim.status==='failed'||claim.status==='rejected'?'rgba(255,79,97,.1)':claim.status==='pending'?'rgba(240,196,63,.1)':'rgba(59,130,196,.1)',
                    color:claim.status==='paid'?'var(--cy)':claim.status==='failed'||claim.status==='rejected'?'var(--re)':claim.status==='pending'?'#f59e0b':'var(--ac)'}}>
                    {claim.status}
                  </span>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:'0.03em',marginBottom:3}}>Reason</div>
                  <div style={{fontSize:12,color:claim.status==='rejected'?'var(--re)':'var(--tx3)'}}>{claim.status==='rejected'&&claim.rejection_reason?claim.rejection_reason:'-'}</div>
                </div>
              </div>
            </div>
          ))}"""

new = """          {myClaimsHistory.map((claim,i)=>{
            const statusColor=claim.status==='paid'?'var(--cy)':claim.status==='failed'||claim.status==='rejected'?'var(--re)':claim.status==='pending'?'#f59e0b':'var(--ac)';
            const isDone=claim.status==='paid'||claim.status==='rejected'||claim.status==='failed';
            return (
            <div key={i} style={{display:'flex',gap:12,padding:'14px 4px',borderLeft:'3px solid '+statusColor,paddingLeft:14,marginBottom:8,background:'var(--elev)',borderRadius:10}}>
              <div style={{width:34,height:34,borderRadius:10,background:statusColor+'1a',display:'flex',alignItems:'center',justifyContent:'center',color:statusColor,flexShrink:0}}>
                {isDone?(claim.status==='paid'?<IC.Check/>:<IC.Close/>):<div style={{width:8,height:8,borderRadius:'50%',background:statusColor}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:8}}>
                  <div style={{fontWeight:700,color:'var(--tx1)',fontSize:15}}>{parseFloat(claim.amount).toFixed(3)} USDC</div>
                  <span style={{fontSize:11,fontWeight:700,color:statusColor,textTransform:'capitalize',flexShrink:0}}>{claim.status}</span>
                </div>
                <div style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{new Date(claim.timestamp).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                {claim.status==='rejected'&&claim.rejection_reason&&<div style={{fontSize:12,color:'var(--tx2)',marginTop:6,fontStyle:'italic'}}>"{claim.rejection_reason}"</div>}
                {claim.tx_hash&&<a href={'https://testnet.arcscan.app/tx/'+claim.tx_hash} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ac)',marginTop:6,display:'inline-block'}}>View Transaction →</a>}
              </div>
            </div>
          )})}"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: claim requests redesigned with status icon/dot, colored left border, italic reason quote")
