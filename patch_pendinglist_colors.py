path = "src/components/admin/PendingScheduledList.jsx"
with open(path) as f:
    content = f.read()

old = """            <div style={{fontSize:13}}>
              <div style={{fontWeight:700}}>#{p.id} — {fmtUsdc(p.amount)} USDC {due&&<span style={{color:'var(--re)',fontWeight:700}}>(OVERDUE)</span>}</div>
              <div style={{opacity:.7,fontSize:12}}>To: {short(p.recipient)}</div>
              <div style={{opacity:.7,fontSize:12}}>Release: {fmtDate(p.releaseTime)} {fmtTime(p.releaseTime)}</div>
            </div>"""

new = """            <div style={{fontSize:13,color:'var(--tx1)'}}>
              <div style={{fontWeight:700,color:'var(--tx1)'}}>#{p.id} — {fmtUsdc(p.amount)} USDC {due&&<span style={{color:'var(--re)',fontWeight:700}}>(OVERDUE)</span>}</div>
              <div style={{opacity:.7,fontSize:12,color:'var(--tx2)'}}>To: {short(p.recipient)}</div>
              <div style={{opacity:.7,fontSize:12,color:'var(--tx2)'}}>Release: {fmtDate(p.releaseTime)} {fmtTime(p.releaseTime)}</div>
            </div>"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: explicit text colors added to PendingScheduledList rows")
