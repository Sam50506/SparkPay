path = "src/components/QRModal.jsx"
with open(path) as f:
    content = f.read()

old_import = "import { useState } from 'react';"
new_import = "import { useState } from 'react';"

old_state = "  const[amt,setAmt]=useState('');"
new_state = "  const[amt,setAmt]=useState('');\n  const[copied,setCopied]=useState('');"

old_buttons = """              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>navigator.clipboard?.writeText(link)}>Copy Link</button>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>navigator.clipboard?.writeText(address)}>Copy Address</button>
            </div>"""
new_buttons = """              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>{navigator.clipboard?.writeText(link);setCopied('link');setTimeout(()=>setCopied(''),2000);}}>{copied==='link'?'Copied!':'Copy Link'}</button>
              <button className="ap-btn ap-btn-sec" style={{flex:1}} onClick={()=>{navigator.clipboard?.writeText(address);setCopied('address');setTimeout(()=>setCopied(''),2000);}}>{copied==='address'?'Copied!':'Copy Address'}</button>
            </div>"""

ok=True
if old_state not in content:
    print("STEP 1 FAILED"); ok=False
else:
    content = content.replace(old_state, new_state, 1)
if old_buttons not in content:
    print("STEP 2 FAILED"); ok=False
else:
    content = content.replace(old_buttons, new_buttons, 1)

with open(path, "w") as f:
    f.write(content)
print("QRModal patched" if ok else "QRModal partial failure")
