path = "src/components/admin/PendingScheduledList.jsx"
with open(path) as f:
    content = f.read()

old = "if(row.status==='stuck')return <span style={{color:'var(--re)',fontWeight:700}}>(STUCK: {row.failReason})</span>;"
new = "if(row.status==='stuck')return <span style={{color:'var(--re)',fontWeight:700}}>(Would fail if executed now — {row.failReason})</span>;"

if old not in content:
    print("PATCH FAILED: line not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: wording now reflects this is a simulation result, not a confirmed failed attempt")
