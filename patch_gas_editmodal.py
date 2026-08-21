path = "src/components/scheduled/EditPaymentModal.jsx"
with open(path) as f:
    content = f.read()

old = "      const tx=await contract.edit(paymentId,recipientArg,releaseTimeArg,'',{value,gasPrice:ethers.parseUnits('100','gwei'),gasLimit:300000});"
new = "      const feeData=await contract.runner.provider.getFeeData();\n      const gasPrice=feeData.gasPrice||ethers.parseUnits('21','gwei');\n      const tx=await contract.edit(paymentId,recipientArg,releaseTimeArg,'',{value,gasPrice,gasLimit:300000});"

if old not in content:
    print("PATCH FAILED: line not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: EditPaymentModal now uses real network gas price")
