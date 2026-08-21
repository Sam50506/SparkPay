path = "src/components/RewardsPage.jsx"
with open(path) as f:
    content = f.read()

ok = True

# 1. Add amount validation feedback near the input
old1 = """                  <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                    <input className="ap-input" type="number" placeholder={'Max '+parseFloat(cashbackPending).toFixed(3)} value={claimAmt} onChange={e=>setClaimAmt(e.target.value)} style={{marginBottom:0,flex:1}}/>
                    <button className="ap-btn ap-btn-sec" style={{marginTop:0,flexShrink:0}} onClick={()=>setClaimAmt(cashbackPending.toFixed(3))}>Max</button>
                  </div>"""
new1 = """                  <div style={{display:'flex',gap:8,marginBottom:4,alignItems:'center'}}>
                    <input className="ap-input" type="number" max={cashbackPending} placeholder={'Max '+parseFloat(cashbackPending).toFixed(3)} value={claimAmt} onChange={e=>setClaimAmt(e.target.value)} style={{marginBottom:0,flex:1}}/>
                    <button className="ap-btn ap-btn-sec" style={{marginTop:0,flexShrink:0}} onClick={()=>setClaimAmt(cashbackPending.toFixed(3))}>Max</button>
                  </div>
                  {parseFloat(claimAmt)>cashbackPending&&<div style={{fontSize:12,color:'var(--re)',marginBottom:8}}>Amount cannot exceed {parseFloat(cashbackPending).toFixed(3)} USDC available.</div>}"""

if old1 not in content:
    print("STEP 1 FAILED (validation message)"); ok=False
else:
    content = content.replace(old1, new1, 1)

# 2. Disable claim button when amount exceeds pending
old2 = "<button className=\"ap-btn ap-btn-primary\" onClick={()=>claimCashback(turnstileToken)} disabled={claimLoading||!turnstileToken} style={{marginTop:0}}>"
new2 = "<button className=\"ap-btn ap-btn-primary\" onClick={()=>claimCashback(turnstileToken)} disabled={claimLoading||!turnstileToken||(parseFloat(claimAmt)>cashbackPending)||(claimAmt&&parseFloat(claimAmt)<=0)} style={{marginTop:0}}>"

if old2 not in content:
    print("STEP 2 FAILED (button disable)"); ok=False
else:
    content = content.replace(old2, new2, 1)

# 3. Fix Cashback History section to use real cashbackHistory data
old3 = """      {myClaimsHistory.length>0&&(
        <div className="ap-card">
          <div className="ap-card-title">Cashback History</div>
          <div className="ap-div"/>
          {myClaimsHistory.slice(0,10).map((item,i)=>(
            <div key={i} className="ap-reward-item">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ac)',flexShrink:0}}>
                  <IC.Gift/>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>+{item.amount} USDC</div>
                  <div style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{new Date(item.timestamp).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
                </div>
              </div>
              <span style={{fontSize:11,fontWeight:600,color:item.status==='paid'?'var(--cy)':'var(--ye)',background:item.status==='paid'?'rgba(23,229,176,0.08)':'rgba(240,196,63,0.08)',padding:'2px 8px',borderRadius:999}}>{item.status==='paid'?'Paid':'Pending'}</span>
            </div>
          ))}
        </div>
      )}"""

new3 = """      {cashbackHistory.length>0&&(
        <div className="ap-card">
          <div className="ap-card-title">Cashback History</div>
          <div className="ap-card-sub">Cashback earned per confirmed transaction.</div>
          <div className="ap-div"/>
          {cashbackHistory.slice(0,10).map((item,i)=>(
            <div key={i} className="ap-reward-item">
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--ac)',flexShrink:0}}>
                  <IC.Gift/>
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>+{parseFloat(item.amount).toFixed(3)} USDC</div>
                  <div style={{fontSize:11,color:'var(--tx3)',marginTop:1}}>{new Date(item.ts).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
              {item.txHash&&<a href={'https://testnet.arcscan.app/tx/'+item.txHash} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ac)'}}>View Tx</a>}
            </div>
          ))}
        </div>
      )}"""

if old3 not in content:
    print("STEP 3 FAILED (history section)"); ok=False
else:
    content = content.replace(old3, new3, 1)

with open(path, "w") as f:
    f.write(content)
print("PATCH OK - all steps applied" if ok else "Some steps failed, check messages above")
