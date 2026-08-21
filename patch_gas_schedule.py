path = "src/hooks/useSchedule.js"
with open(path) as f:
    content = f.read()

old = """      const sched = new ethers.Contract(SCHED_ADDR, SCHED_ABI, signer);
      setStatus({ type: 'info', msg: 'Locking USDC in escrow...' });
      let tx = await sched.schedule(
        ethers.getAddress(newSched.addr.trim()),
        releaseTime,
        newSched.country || '',
        { value: amt, gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 200000 }
      );"""

new = """      const sched = new ethers.Contract(SCHED_ADDR, SCHED_ABI, signer);
      setStatus({ type: 'info', msg: 'Locking USDC in escrow...' });
      const feeData = await signer.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('21', 'gwei');
      let tx = await sched.schedule(
        ethers.getAddress(newSched.addr.trim()),
        releaseTime,
        newSched.country || '',
        { value: amt, gasPrice, gasLimit: 200000 }
      );"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: schedule() now uses real network gas price instead of hardcoded 100 gwei")
