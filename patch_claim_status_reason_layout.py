path = "src/components/RewardsPage.jsx"
with open(path) as f:
    content = f.read()

old = """          {myClaimsHistory.map((claim,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
              <div>
                <div style={{fontWeight:600,color:'var(--tx1)',fontSize:14}}>{parseFloat(claim.amount).toFixed(3)} USDC</div>
                <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{new Date(claim.timestamp).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {claim.tx_hash&&<a href={'https://testnet.arcscan.app/tx/'+claim.tx_hash} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ac)'}}>View Tx</a>}
              {claim.status==='rejected'&&claim.rejection_reason&&<div style={{fontSize:11,color:'var(--re)',marginTop:4,maxWidth:160,textAlign:'right'}}>{claim.rejection_reason}</div>}
                <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,
                  background:claim.status==='paid'?'rgba(23,229,176,.1)':claim.status==='failed'||claim.status==='rejected'?'rgba(255,79,97,.1)':claim.status==='pending'?'rgba(240,196,63,.1)':'rgba(59,130,196,.1)',
                  color:claim.status==='paid'?'var(--cy)':claim.status==='failed'||claim.status==='rejected'?'var(--re)':claim.status==='pending'?'#f59e0b':'var(--ac)'}}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}"""

new = """          {myClaimsHistory.map((claim,i)=>(
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

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: Status and Reason now shown as separate labeled sections")
