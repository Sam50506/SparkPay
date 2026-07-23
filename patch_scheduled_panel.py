path = "src/components/ScheduledPaymentsPanel.jsx"
with open(path) as f:
    content = f.read()

old = """  const fetchPayments=useCallback(async()=>{
    if(!address||!provider)return;
    setFetching(true);
    // On-chain read via the connected wallet's RPC. If that endpoint is rate-limited
    // or otherwise unreachable, fall back to ARC_RPC_FALLBACK (same pattern as
    // refreshPendingTxns) instead of failing the whole panel silently.
    const attempt=async(readProvider)=>{
      const sched=new ethers.Contract(schedAddr,schedAbi,readProvider);
      const count=Number(await sched.paymentCount());
      const results=[];
      for(let i=count-1;i>=0&&results.length<50;i--){
        const p=await sched.getPayment(i);
        if(p.sender.toLowerCase()===address.toLowerCase()){
          results.push({id:i,recipient:p.recipient,amount:ethers.formatUnits(p.amount,18),releaseTime:Number(p.releaseTime),executed:p.executed,cancelled:p.cancelled,country:p.country});
        }
      }
      return results;
    };
    try{
      const results=await attempt(provider);
      setPayments(results);
      setFetchError(null);
    }catch(primaryErr){
      try{
        const fallbackProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
        const results=await attempt(fallbackProvider);
        setPayments(results);
        setFetchError(null);
      }catch(fallbackErr){
        console.error(primaryErr);
        console.error(fallbackErr);
        setFetchError('Could not load scheduled payments right now. Your payments are safe on-chain. This is just a network hiccup.');
      }
    }
    setFetching(false);
  },[address,provider,schedAddr,schedAbi]);"""

new = """  const fetchPayments=useCallback(async()=>{
    if(!address||!provider)return;
    setFetching(true);
    // On-chain read via the connected wallet's RPC. If that endpoint is rate-limited
    // or otherwise unreachable, fall back to ARC_RPC_FALLBACK (same pattern as
    // refreshPendingTxns) instead of failing the whole panel silently.
    //
    // Previously this scanned EVERY payment on the whole contract (all users)
    // to find the caller's own ones - that gets slower and more rate-limit-prone
    // for everyone as the app grows. Now it asks the contract directly for just
    // this wallet's payment IDs via getUserPayments(), then fetches only those,
    // paced with a small delay between calls instead of firing them all at once.
    const attempt=async(readProvider)=>{
      const sched=new ethers.Contract(schedAddr,schedAbi,readProvider);
      const rawIds=await sched.getUserPayments(address);
      const ids=[...rawIds].map(x=>Number(x)).sort((a,b)=>b-a).slice(0,50);
      const results=[];
      for(const id of ids){
        const p=await sched.getPayment(id);
        results.push({id,recipient:p.recipient,amount:ethers.formatUnits(p.amount,18),releaseTime:Number(p.releaseTime),executed:p.executed,cancelled:p.cancelled,country:p.country});
        if(ids.length>1)await new Promise(r=>setTimeout(r,150));
      }
      return results;
    };
    try{
      const results=await attempt(provider);
      setPayments(results);
      setFetchError(null);
    }catch(primaryErr){
      try{
        const fallbackProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
        const results=await attempt(fallbackProvider);
        setPayments(results);
        setFetchError(null);
      }catch(fallbackErr){
        console.error(primaryErr);
        console.error(fallbackErr);
        setFetchError('Could not load scheduled payments right now. Your payments are safe on-chain. This is just a network hiccup.');
      }
    }
    setFetching(false);
  },[address,provider,schedAddr,schedAbi]);"""

if old not in content:
    print("PATCH 1 FAILED: fetchPayments block not matched exactly. No changes made.")
else:
    content = content.replace(old, new, 1)
    old2 = "useEffect(()=>{const t=setInterval(fetchPayments,30000);return()=>clearInterval(t);},[fetchPayments]);"
    new2 = "useEffect(()=>{const t=setInterval(fetchPayments,120000);return()=>clearInterval(t);},[fetchPayments]);"
    if old2 not in content:
        print("PATCH 2 FAILED: refresh interval line not matched. Part 1 succeeded but interval NOT slowed down.")
    else:
        content = content.replace(old2, new2, 1)
        print("PATCH OK: getUserPayments-based fetch + paced calls + slower 2-minute auto-refresh")
    with open(path, "w") as f:
        f.write(content)
