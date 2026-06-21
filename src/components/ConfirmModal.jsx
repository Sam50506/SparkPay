import React from 'react';

export default function ConfirmModal({data,onConfirm,onCancel,walletName}){
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


