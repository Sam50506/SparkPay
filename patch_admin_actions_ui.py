path = "src/components/admin/PendingScheduledList.jsx"
with open(path) as f:
    content = f.read()

old = """            <button className="ap-btn ap-btn-primary" style={{marginTop:0,padding:'8px 16px'}} disabled={execId===p.id||!due} onClick={()=>executeOne(p.id)}>
              {execId===p.id?'Executing...':(due?'Execute Manually':'Not due yet')}
            </button>"""

new = """            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button className="ap-btn ap-btn-primary" style={{marginTop:0,padding:'8px 16px'}} disabled={execId===p.id||!due} onClick={()=>executeOne(p.id)}>
                {execId===p.id?'Executing...':(due?'Execute Manually':'Not due yet')}
              </button>
              <button className="ap-btn" style={{marginTop:0,padding:'8px 16px'}} onClick={()=>adminAction(p.id,'cancel_refund')}>Cancel & Refund</button>
              <button className="ap-btn" style={{marginTop:0,padding:'8px 16px'}} onClick={()=>adminAction(p.id,'under_review')}>Send Under Review</button>
            </div>"""

if old not in content:
    print("STEP 1 FAILED: button block not matched.")
else:
    content = content.replace(old, new, 1)

old2 = "  const now=Math.floor(Date.now()/1000);"
new2 = """  const adminAction=async(id,action)=>{
    const reason=window.prompt(action==='cancel_refund'?'Reason for cancelling & refunding payment #'+id+':':'Reason for marking payment #'+id+' under review:');
    if(!reason||!reason.trim())return;
    setExecId(id);setResult(null);
    try{
      const token=sessionStorage.getItem('sp_admin_jwt');
      if(!token){alert('Session expired. Please re-verify with passkey.');window.location.reload();return;}
      const r=await fetch('/api/admin-payment-action',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({payment_id:id,action,reason})});
      const d=await r.json();
      if(d.error){setResult({id,type:'error',msg:d.error});}
      else{setResult({id,type:'success',msg:(action==='cancel_refund'?'Cancelled & refunded. ':'Marked under review. ')+(d.failureReason?'Failure reason: '+d.failureReason:'')});if(action==='cancel_refund')load();}
    }catch(e){setResult({id,type:'error',msg:e.message});}
    setExecId(null);
  };

  const now=Math.floor(Date.now()/1000);"""

if old2 not in content:
    print("STEP 2 FAILED: now= line not matched.")
else:
    content = content.replace(old2, new2, 1)

with open(path, "w") as f:
    f.write(content)
print("Done — check STEP messages above")
