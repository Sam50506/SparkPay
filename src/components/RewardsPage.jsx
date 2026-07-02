import React, { useState, useRef } from 'react';
import { IC } from '../icons';
import { Turnstile } from '@marsidev/react-turnstile';

export default function RewardsPage({
  cashbackPending, claimAmt, setClaimAmt,
  claimCashback, claimLoading, claimSubmitted,
  myClaimsHistory, claimsLoading, fetchMyClaims,
  cashbackHistory
}) {
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);
  const pct = Math.min((cashbackPending / 5) * 100, 100);
  return (
    <div>
      <div className="ap-card">
        <div className="ap-card-title">Cashback Rewards</div>
        <div className="ap-card-sub">Earn USDC on every confirmed transaction. Claim when you reach 5 USDC.</div>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
          <div style={{fontSize:32,fontWeight:800,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{parseFloat(cashbackPending).toFixed(3)}</div>
          {cashbackPending>0&&<div style={{fontSize:13,color:'var(--tx3)',marginBottom:6}}>USDC pending</div>}
        </div>
        <div className="ap-rew-bar"><div className="ap-rew-fill" style={{width:pct+'%'}}/></div>
        <div style={{fontSize:12,color:'var(--tx3)',marginBottom:20}}>{parseFloat(cashbackPending).toFixed(3)} / 5.000 USDC to claim</div>
        <div style={{background:'var(--elev)',borderRadius:12,padding:'12px 16px',marginBottom:16,fontSize:13,color:'var(--tx2)',lineHeight:1.6}}>
          <strong style={{color:'var(--tx1)'}}>How it works:</strong> Earn 1% cashback on every confirmed transaction of 5 USDC or more. Cashback accumulates and can be claimed once you reach 5 USDC.
        </div>
        {claimSubmitted==='paid'
          ? <div className="ap-status ap-status-success" style={{marginBottom:0}}><IC.Check/> Reward received! USDC has been sent to your wallet.</div>
          : claimSubmitted
            ? <div className="ap-status ap-status-success" style={{marginBottom:0}}><IC.Check/> Claim submitted. Processing your reward shortly.</div>
            : cashbackPending>=5
              ? <div>
                  <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                    <input className="ap-input" type="number" placeholder={'Max '+parseFloat(cashbackPending).toFixed(3)} value={claimAmt} onChange={e=>setClaimAmt(e.target.value)} style={{marginBottom:0,flex:1}}/>
                    <button className="ap-btn ap-btn-sec" style={{marginTop:0,flexShrink:0}} onClick={()=>setClaimAmt(cashbackPending.toFixed(3))}>Max</button>
                  </div>
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.REACT_APP_TURNSTILE_SITE_KEY||''}
                    onSuccess={(token)=>setTurnstileToken(token)}
                    onExpire={()=>setTurnstileToken(null)}
                    options={{appearance:'interaction-only'}}
                  />
                  <button className="ap-btn ap-btn-primary" onClick={()=>claimCashback(turnstileToken)} disabled={claimLoading||!turnstileToken} style={{marginTop:0}}>
                    {claimLoading?'Submitting...':'Claim '+(parseFloat(claimAmt)||cashbackPending).toFixed(3)+' USDC'}
                  </button>
                </div>
              : <button className="ap-btn ap-btn-primary" disabled style={{marginTop:0}}>{'Need '+(5-cashbackPending).toFixed(3)+' more USDC'}</button>
        }
      </div>
      {myClaimsHistory.length>0&&(
        <div className="ap-card" style={{marginTop:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
            <div className="ap-card-title">Claim Requests</div>
            <button className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px',marginTop:0}} onClick={fetchMyClaims}>
              {claimsLoading?'Loading...':'Refresh'}
            </button>
          </div>
          <div className="ap-div"/>
          {myClaimsHistory.map((claim,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
              <div>
                <div style={{fontWeight:600,color:'var(--tx1)',fontSize:14}}>{parseFloat(claim.amount).toFixed(3)} USDC</div>
                <div style={{fontSize:11,color:'var(--tx3)',marginTop:2}}>{new Date(claim.timestamp).toLocaleDateString('en',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {claim.tx_hash&&<a href={'https://testnet.arcscan.app/tx/'+claim.tx_hash} target="_blank" rel="noreferrer" style={{fontSize:11,color:'var(--ac)'}}>View Tx</a>}
                <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:999,
                  background:claim.status==='paid'?'rgba(23,229,176,.1)':claim.status==='failed'?'rgba(255,79,97,.1)':'rgba(59,130,196,.1)',
                  color:claim.status==='paid'?'var(--cy)':claim.status==='failed'?'var(--re)':'var(--ac)'}}>
                  {claim.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {myClaimsHistory.length>0&&(
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
      )}
    </div>
  );
}
