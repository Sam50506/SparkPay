path = "src/components/admin/PendingScheduledList.jsx"
with open(path) as f:
    content = f.read()

old = """          let status='not_due',failReason=null;
          if(due){
            const minsSince=(now-releaseTime)/60;
            try{
              await sched.execute.staticCall(id,{from:ADMIN_ADDRESS});
              status=minsSince<KEEPER_WINDOW_MIN?'waiting_keeper':'keeper_delayed';
            }catch(e){
              status='stuck';
              failReason=e.reason||e.shortMessage||e.message;
            }
          }"""

new = """          let status='not_due',failReason=null;
          if(due){
            const minsSince=(now-releaseTime)/60;
            try{
              const chk=await fetch('/api/check-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payment_id:id})}).then(r=>r.json());
              if(chk.ready){
                status=minsSince<KEEPER_WINDOW_MIN?'waiting_keeper':'keeper_delayed';
              }else{
                status='stuck';
                failReason=chk.reason||'Unknown';
              }
            }catch(e){
              status='keeper_delayed';
            }
          }"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: real backend check replaces unreliable client-side spoofed staticCall")
