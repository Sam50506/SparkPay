path = "src/components/ScheduledPaymentsPanel.jsx"
with open(path) as f:
    content = f.read()

old = """    try{
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
    }"""

new = """    // Reads go through a dedicated RPC provider, not the wallet's injected
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

if old not in content:
    print("PATCH FAILED: could not find the exact text to replace. No changes made.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: ScheduledPaymentsPanel now reads via dedicated RPC provider first, wallet provider as fallback only")
