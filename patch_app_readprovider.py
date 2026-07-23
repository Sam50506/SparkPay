path = "src/App.js"
with open(path) as f:
    content = f.read()

old = "const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer.provider||provider);"

new = "const readProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,readProvider);"

if old not in content:
    print("PATCH FAILED: could not find the exact text to replace. No changes made.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: App.js history-sync now reads via dedicated RPC provider instead of wallet provider")
