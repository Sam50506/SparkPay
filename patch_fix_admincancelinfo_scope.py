path = "src/components/ScheduledPaymentsPanel.jsx"
with open(path) as f:
    content = f.read()

ok = True

old1 = "function PaymentCard({p,st,manageSched,selectedSched,setSelectedSched,expandedId,setExpandedId,requests,changesModal,setChangesModal,address,signer,schedAddr,schedAbi,fetchPayments,onCancel,loading,rates}){"
new1 = "function PaymentCard({p,st,manageSched,selectedSched,setSelectedSched,expandedId,setExpandedId,requests,adminActions,changesModal,setChangesModal,address,signer,schedAddr,schedAbi,fetchPayments,onCancel,loading,rates}){\n  const adminCancelInfo=adminActions&&adminActions[p.id]&&adminActions[p.id].action==='cancel_refund'?adminActions[p.id]:null;"
if old1 not in content:
    print("STEP 1 FAILED"); ok=False
else:
    content = content.replace(old1, new1, 1)

old2 = "{shownActive.map(p=><PaymentCard key={p.id} p={p} st={getStatus(p)} manageSched={manageSched} selectedSched={selectedSched} setSelectedSched={setSelectedSched} expandedId={expandedId} setExpandedId={setExpandedId} requests={requests} changesModal={changesModal}"
new2 = "{shownActive.map(p=><PaymentCard key={p.id} p={p} st={getStatus(p)} manageSched={manageSched} selectedSched={selectedSched} setSelectedSched={setSelectedSched} expandedId={expandedId} setExpandedId={setExpandedId} requests={requests} adminActions={adminActions} changesModal={changesModal}"
if old2 not in content:
    print("STEP 2 FAILED"); ok=False
else:
    content = content.replace(old2, new2, 1)

old3 = "{shownHistory.map(p=><PaymentCard key={p.id} p={p} st={getStatus(p)} manageSched={manageSched} selectedSched={selectedSched} setSelectedSched={setSelectedSched} expandedId={expandedId} setExpandedId={setExpandedId} requests={requests} changesModal={changesModal}"
new3 = "{shownHistory.map(p=><PaymentCard key={p.id} p={p} st={getStatus(p)} manageSched={manageSched} selectedSched={selectedSched} setSelectedSched={setSelectedSched} expandedId={expandedId} setExpandedId={setExpandedId} requests={requests} adminActions={adminActions} changesModal={changesModal}"
if old3 not in content:
    print("STEP 3 FAILED"); ok=False
else:
    content = content.replace(old3, new3, 1)

old4 = "  const adminCancelInfo=p=>adminActions[p.id]&&adminActions[p.id].action==='cancel_refund'?adminActions[p.id]:null;"
if old4 not in content:
    print("STEP 4 FAILED (old parent-level function not found)"); ok=False
else:
    content = content.replace(old4, "", 1)

old5 = "st===='cancelled_admin')return (hasCancelRequest(p)||adminCancelInfo(p))?'cancelled_admin':'cancelled_user';"
old5b = "if(p.cancelled)return (hasCancelRequest(p)||adminCancelInfo(p))?'cancelled_admin':'cancelled_user';"
new5b = "if(p.cancelled)return (hasCancelRequest(p)||(adminActions[p.id]&&adminActions[p.id].action==='cancel_refund'))?'cancelled_admin':'cancelled_user';"
if old5b not in content:
    print("STEP 5 FAILED"); ok=False
else:
    content = content.replace(old5b, new5b, 1)

old6 = "{st==='cancelled_admin'?(adminCancelInfo(p)?'Cancelled by admin: \"'+adminCancelInfo(p).admin_reason+'\". USDC has been refunded to your wallet.':'Cancelled by admin request. USDC has been refunded to your wallet.'):'You cancelled this payment. USDC has been refunded to your wallet.'}"
new6 = "{st==='cancelled_admin'?(adminCancelInfo?'Cancelled by admin: \"'+adminCancelInfo.admin_reason+'\". USDC has been refunded to your wallet.':'Cancelled by admin request. USDC has been refunded to your wallet.'):'You cancelled this payment. USDC has been refunded to your wallet.'}"
if old6 not in content:
    print("STEP 6 FAILED"); ok=False
else:
    content = content.replace(old6, new6, 1)

with open(path, "w") as f:
    f.write(content)
print("PATCH OK - all steps applied" if ok else "Some steps failed, check messages above")
