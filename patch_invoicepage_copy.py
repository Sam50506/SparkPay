path = "src/components/InvoicePage.jsx"
with open(path) as f:
    content = f.read()

old = "<button className=\"ap-btn ap-btn-sec\" onClick={()=>navigator.clipboard?.writeText(invId)}><IC.Copy/> Copy ID</button>"
new = "<button className=\"ap-btn ap-btn-sec\" onClick={()=>{navigator.clipboard?.writeText(invId);setCopiedId(true);setTimeout(()=>setCopiedId(false),2000);}}><IC.Copy/> {copiedId?'Copied!':'Copy ID'}</button>"

if old not in content:
    print("STEP 1 FAILED: button not matched.")
else:
    content = content.replace(old, new, 1)

with open(path, "w") as f:
    f.write(content)
print("Button updated - now need to add copiedId state declaration")
