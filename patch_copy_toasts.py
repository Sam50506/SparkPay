import re

fixes = [
    ("src/components/ReceivePage.jsx",
     "<button className=\"ap-btn ap-btn-icon\" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button>",
     "<button className=\"ap-btn ap-btn-icon\" onClick={()=>{navigator.clipboard?.writeText(address);setStatus&&setStatus({type:'success',msg:'Address copied to clipboard'});}}><IC.Copy/></button>",
     "ReceivePage({address,setShowQR,setStatus}) {"),
]

path = "src/components/ReceivePage.jsx"
with open(path) as f:
    content = f.read()

old_sig = "export default function ReceivePage({address,setShowQR})"
new_sig = "export default function ReceivePage({address,setShowQR,setStatus})"
old_btn = "<button className=\"ap-btn ap-btn-icon\" onClick={()=>navigator.clipboard?.writeText(address)}><IC.Copy/></button>"
new_btn = "<button className=\"ap-btn ap-btn-icon\" onClick={()=>{navigator.clipboard?.writeText(address);setStatus&&setStatus({type:'success',msg:'Address copied to clipboard'});}}><IC.Copy/></button>"

ok=True
if old_sig not in content:
    print("STEP 1 FAILED (signature)"); ok=False
else:
    content = content.replace(old_sig, new_sig, 1)
if old_btn not in content:
    print("STEP 2 FAILED (button)"); ok=False
else:
    content = content.replace(old_btn, new_btn, 1)

with open(path, "w") as f:
    f.write(content)
print("ReceivePage patched" if ok else "ReceivePage partial failure")
