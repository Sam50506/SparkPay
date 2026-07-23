path = "src/App.js"
with open(path) as f:
    content = f.read()

old_import = "import { ARC_CHAIN_ID, DEFAULT_MAINTENANCE, ADMIN_ADDRESS, ARC_RPC_FALLBACK, ARC_RPC_FALLBACK2, ARC_RPC_FALLBACK3, SCHED_ADDR, REMIT_ADDR, USDC_ADDR, SB_URL, SB_KEY, APP_URL } from './config';"
# ARC_RPC_FALLBACK2/3 already imported here - no import change needed, just confirming presence
if old_import not in content:
    print("IMPORT CHECK FAILED: expected import line not found verbatim - aborting, no changes made.")
else:
    old_provider = "const readProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,readProvider);"
    new_provider = "let sched=null;for(const url of [ARC_RPC_FALLBACK,ARC_RPC_FALLBACK2,ARC_RPC_FALLBACK3]){try{const rp=new ethers.JsonRpcProvider(url,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});await rp.getBlockNumber();sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,rp);break;}catch(_){}}if(!sched){sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer.provider||provider);}"

    old_delay = "if(ids.length>1)await new Promise(r=>setTimeout(r,150));"
    new_delay = "if(ids.length>1)await new Promise(r=>setTimeout(r,600));"

    ok = True
    if old_provider not in content:
        print("STEP 1 FAILED: readProvider/sched line not matched.")
        ok = False
    else:
        content = content.replace(old_provider, new_provider, 1)

    if old_delay not in content:
        print("STEP 2 FAILED: 150ms delay line not matched.")
        ok = False
    else:
        content = content.replace(old_delay, new_delay, 1)

    with open(path, "w") as f:
        f.write(content)

    if ok:
        print("PATCH OK: App.js history-sync now rotates 3 public RPCs (probed via getBlockNumber) with wallet-provider fallback, 600ms pacing")
    else:
        print("Some steps failed - check messages above, file may be partially patched.")
