path = "src/components/InvoicePage.jsx"
with open(path) as f:
    content = f.read()

old = "  const [showContactsPicker, setShowContactsPicker] = useState(false);"
new = "  const [showContactsPicker, setShowContactsPicker] = useState(false);\n  const [copiedId, setCopiedId] = useState(false);"

if old not in content:
    print("PATCH FAILED: line not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: copiedId state added to InvoicePage")
