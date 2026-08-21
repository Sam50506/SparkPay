path = "src/components/ReceivePage.jsx"
with open(path) as f:
    content = f.read()

old = "export default function ReceivePage({ address, setShowQR }) {"
new = "export default function ReceivePage({ address, setShowQR, setStatus }) {"

if old not in content:
    print("PATCH FAILED: line not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: setStatus now properly destructured in ReceivePage")
