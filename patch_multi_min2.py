path = "src/hooks/useMulti.js"
with open(path) as f:
    content = f.read()

old = "if (!signer || !valid.length) { setStatus({ type: 'error', msg: 'Add at least one valid recipient' }); return; }"
new = "if (!signer || valid.length < 2) { setStatus({ type: 'error', msg: 'Add at least two valid recipients for multi-send' }); return; }"

if old not in content:
    print("PATCH FAILED: line not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: multipay now requires 2+ recipients")
