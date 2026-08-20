path = "src/components/ScheduledPaymentsPanel.jsx"
with open(path) as f:
    content = f.read()

old1 = "const[requests,setRequests]=useState({});"
new1 = "const[requests,setRequests]=useState({});\n  const[adminActions,setAdminActions]=useState({});"
if old1 not in content:
    print("STEP 1 FAILED")
else:
    content = content.replace(old1, new1, 1)

old2 = "    fetch(SB_URL+'/rest/v1/scheduled_payment_requests?wallet_address=eq.'+address+'&contract_address=eq.'+SCHED_ADDR+'&order=created_at.desc',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}})\n      .then(r=>r.json()).then(d=>{const map={};(d||[]).forEach(r=>{if(!map[r.payment_id])map[r.payment_id]=[];map[r.payment_id].push(r);});setRequests(map);}).catch(()=>{});"
new2 = old2 + "\n    fetch(SB_URL+'/rest/v1/admin_payment_actions?select=*&order=created_at.desc',{headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}})\n      .then(r=>r.json()).then(d=>{const map={};(d||[]).forEach(r=>{if(!map[r.payment_id])map[r.payment_id]=r;});setAdminActions(map);}).catch(()=>{});"
if old2 not in content:
    print("STEP 2 FAILED")
else:
    content = content.replace(old2, new2, 1)

old3 = "  const hasCancelRequest=p=>!!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'));"
new3 = "  const hasCancelRequest=p=>!!(requests[p.id]&&requests[p.id].some(r=>r.request_type==='cancel'));\n  const adminCancelInfo=p=>adminActions[p.id]&&adminActions[p.id].action==='cancel_refund'?adminActions[p.id]:null;"
if old3 not in content:
    print("STEP 3 FAILED")
else:
    content = content.replace(old3, new3, 1)

old4 = "    if(p.cancelled)return hasCancelRequest(p)?'cancelled_admin':'cancelled_user';"
new4 = "    if(p.cancelled)return (hasCancelRequest(p)||adminCancelInfo(p))?'cancelled_admin':'cancelled_user';"
if old4 not in content:
    print("STEP 4 FAILED")
else:
    content = content.replace(old4, new4, 1)

old5 = "          {st==='cancelled_admin'?'Cancelled by admin request. USDC has been refunded to your wallet.':'You cancelled this payment. USDC has been refunded to your wallet.'}"
new5 = "          {st==='cancelled_admin'?(adminCancelInfo(p)?'Cancelled by admin: \"'+adminCancelInfo(p).admin_reason+'\". USDC has been refunded to your wallet.':'Cancelled by admin request. USDC has been refunded to your wallet.'):'You cancelled this payment. USDC has been refunded to your wallet.'}"
if old5 not in content:
    print("STEP 5 FAILED")
else:
    content = content.replace(old5, new5, 1)

with open(path, "w") as f:
    f.write(content)
print("Done — check STEP messages above")
