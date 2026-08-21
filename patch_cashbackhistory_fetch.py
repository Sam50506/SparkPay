path = "src/App.js"
with open(path) as f:
    content = f.read()

old = """    const fetchCashback=()=>{
      sbSelect('cashback_balances','wallet_address=eq.'+address+'&select=pending_amount').then(rows=>{
        setCashbackPending(rows?.[0]?.pending_amount?parseFloat(rows[0].pending_amount):0);
      }).catch(()=>{});
    };
    fetchCashback();
    const t=setInterval(fetchCashback,15000);
    return()=>clearInterval(t);
  },[address]);"""

new = """    const fetchCashback=()=>{
      sbSelect('cashback_balances','wallet_address=eq.'+address+'&select=pending_amount').then(rows=>{
        setCashbackPending(rows?.[0]?.pending_amount?parseFloat(rows[0].pending_amount):0);
      }).catch(()=>{});
    };
    fetchCashback();
    const t=setInterval(fetchCashback,15000);
    sbSelect('cashback_events','wallet_address=eq.'+address+'&select=amount,tx_hash,created_at&order=created_at.desc&limit=50').then(rows=>{
      setCashbackHistory((rows||[]).map(r=>({amount:parseFloat(r.amount),txHash:r.tx_hash,ts:new Date(r.created_at).getTime()})));
    }).catch(()=>{});
    return()=>clearInterval(t);
  },[address]);"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: cashbackHistory now loads from Supabase on mount, in addition to live session updates")
