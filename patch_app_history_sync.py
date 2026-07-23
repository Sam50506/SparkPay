path = "src/App.js"
with open(path) as f:
    content = f.read()

old = "const count=Number(await sched.paymentCount());const onChainMap={};for(let i=0;i<count;i++){const p=await sched.getPayment(i);if(p.sender.toLowerCase()===address.toLowerCase()){onChainMap[i]=p;}}"

new = "const rawIds=await sched.getUserPayments(address);const ids=[...rawIds].map(x=>Number(x));const onChainMap={};for(const i of ids){const p=await sched.getPayment(i);onChainMap[i]=p;if(ids.length>1)await new Promise(r=>setTimeout(r,150));}"

if old not in content:
    print("PATCH FAILED: could not find the exact text to replace. No changes made.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: App.js history-sync loop now uses getUserPayments instead of scanning paymentCount")
