path = "src/components/admin/PendingScheduledList.jsx"
with open(path) as f:
    content = f.read()

old = """        const count=Number(await sched.paymentCount());
        const list=[];
        for(let i=0;i<count;i++){
          const p=await sched.getPayment(i);
          if(!p.executed&&!p.cancelled){
            list.push({id:i,recipient:p.recipient,amount:p.amount,releaseTime:Number(p.releaseTime)});
          }
          if(count>1)await new Promise(r=>setTimeout(r,400));
        }"""

new = """        const count=Number(await sched.paymentCount());
        const list=[];
        const BATCH=4;
        for(let start=0;start<count;start+=BATCH){
          const batchIds=[];
          for(let i=start;i<Math.min(start+BATCH,count);i++)batchIds.push(i);
          const results=await Promise.all(batchIds.map(async id=>{
            const p=await sched.getPayment(id);
            return{id,p};
          }));
          for(const{id,p}of results){
            if(!p.executed&&!p.cancelled){
              list.push({id,recipient:p.recipient,amount:p.amount,releaseTime:Number(p.releaseTime)});
            }
          }
          if(start+BATCH<count)await new Promise(r=>setTimeout(r,250));
        }"""

if old not in content:
    print("STEP 1 FAILED: fetch loop not matched.")
else:
    content = content.replace(old, new, 1)

old2 = "<div style={{fontWeight:700,color:'var(--tx1)'}}>#{p.id} — {fmtUsdc(p.amount)} USDC {due&&<span style={{color:'var(--re)',fontWeight:700}}>(OVERDUE)</span>}</div>"
new2 = "<div style={{fontWeight:700,color:'var(--tx1)'}}>#{p.id}: {fmtUsdc(p.amount)} USDC {due&&<span style={{color:'var(--re)',fontWeight:700}}>(OVERDUE)</span>}</div>"

if old2 not in content:
    print("STEP 2 FAILED: dash line not matched.")
else:
    content = content.replace(old2, new2, 1)

with open(path, "w") as f:
    f.write(content)
print("Done — check STEP messages above for any failures")
