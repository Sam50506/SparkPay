path = "src/components/ScheduledPaymentsPanel.jsx"
with open(path) as f:
    content = f.read()

old_import = "import { SB_URL, SB_KEY, SCHED_ADDR, ARC_RPC_FALLBACK, ARC_CHAIN_ID, ls, lsSave, ALL_CURRENCY } from '../config';"
new_import = "import { SB_URL, SB_KEY, SCHED_ADDR, ARC_RPC_FALLBACK, ARC_RPC_FALLBACK2, ARC_RPC_FALLBACK3, ARC_CHAIN_ID, ls, lsSave, ALL_CURRENCY } from '../config';"

old_body = """    // Reads go through a dedicated RPC provider, not the wallet's injected
    // provider (MetaMask etc). Racing reads against the wallet's own request
    // queue was triggering "Request is being rate limited" on mobile, which
    // ethers then surfaced as a confusing "missing revert data" error even
    // though the contract call itself was fine. Writes still go through the
    // wallet provider elsewhere - only these background reads changed.
    const readProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
    try{
      const results=await attempt(readProvider);
      setPayments(results);
      setFetchError(null);
    }catch(primaryErr){
      try{
        const results=await attempt(provider);
        setPayments(results);
        setFetchError(null);
      }catch(fallbackErr){
        console.error(primaryErr);
        console.error(fallbackErr);
        setFetchError('Could not load scheduled payments right now. Your payments are safe on-chain. This is just a network hiccup.');
      }
    }"""

new_body = """    // Reads go through a rotation of public RPC endpoints instead of the
    // wallet's injected provider. The primary testnet RPC 429s under normal
    // polling load (shared public endpoint, not us doing anything wrong), so
    // try each known endpoint in turn before falling back to the wallet's
    // own provider as a last resort. Writes still go through the wallet
    // provider elsewhere - only these background reads changed.
    const rpcUrls=[ARC_RPC_FALLBACK,ARC_RPC_FALLBACK2,ARC_RPC_FALLBACK3];
    let results=null,lastErr=null;
    for(const url of rpcUrls){
      try{
        const readProvider=new ethers.JsonRpcProvider(url,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
        results=await attempt(readProvider);
        break;
      }catch(e){lastErr=e;}
    }
    if(results){
      setPayments(results);
      setFetchError(null);
    }else{
      try{
        results=await attempt(provider);
        setPayments(results);
        setFetchError(null);
      }catch(fallbackErr){
        console.error(lastErr);
        console.error(fallbackErr);
        setFetchError('Could not load scheduled payments right now. Your payments are safe on-chain. This is just a network hiccup.');
      }
    }"""

old_delay = "if(ids.length>1)await new Promise(r=>setTimeout(r,150));"
new_delay = "if(ids.length>1)await new Promise(r=>setTimeout(r,600));"

ok = True
if old_import not in content:
    print("STEP 1 FAILED: import line not matched.")
    ok = False
else:
    content = content.replace(old_import, new_import, 1)

if old_body not in content:
    print("STEP 2 FAILED: attempt/fallback block not matched.")
    ok = False
else:
    content = content.replace(old_body, new_body, 1)

if old_delay not in content:
    print("STEP 3 FAILED: 150ms delay line not matched.")
    ok = False
else:
    content = content.replace(old_delay, new_delay, 1)

with open(path, "w") as f:
    f.write(content)

if ok:
    print("PATCH OK: RPC rotation across 3 public endpoints + 600ms pacing")
else:
    print("Some steps failed - check messages above, file may be partially patched.")
