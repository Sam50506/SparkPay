path = "api/manual-execute.js"
with open(path) as f:
    content = f.read()

old = "const RPC = 'https://rpc.testnet.arc.network';"
new = """const RPCS = [
  'https://rpc.testnet.arc.network',
  'https://arc-testnet.drpc.org',
  'https://5042002.rpc.thirdweb.com'
];"""

if old not in content:
    print("STEP 1 FAILED: RPC const not matched.")
else:
    content = content.replace(old, new, 1)

old2 = """    const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);"""

new2 = """    let provider, wallet, contract, lastErr;
    for (const url of RPCS) {
      try {
        provider = new ethers.JsonRpcProvider(url, { name: 'Arc Testnet', chainId: 5042002 });
        await provider.getBlockNumber();
        wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI_FULL, wallet);
        break;
      } catch (e) { lastErr = e; provider = null; }
    }
    if (!provider) throw lastErr || new Error('All RPC endpoints unreachable');"""

if old2 not in content:
    print("STEP 2 FAILED: provider setup block not matched.")
else:
    content = content.replace(old2, new2, 1)

old3 = """const SCHED_ABI = [
  'function execute(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))',
  'function paymentCount() external view returns (uint256)'
];"""

new3 = """const SCHED_ABI_FULL = [
  'function execute(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))',
  'function paymentCount() external view returns (uint256)'
];"""

if old3 not in content:
    print("STEP 3 FAILED: ABI const not matched.")
else:
    content = content.replace(old3, new3, 1)

old4 = "    const tx = await contract.execute(id, { gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000 });"
new4 = """    try {
      await contract.execute.staticCall(id);
    } catch (simErr) {
      return res.status(400).json({ error: 'Simulation failed: ' + (simErr.reason || simErr.shortMessage || simErr.message) });
    }

    const tx = await contract.execute(id, { gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000 });"""

if old4 not in content:
    print("STEP 4 FAILED: execute call not matched.")
else:
    content = content.replace(old4, new4, 1)

with open(path, "w") as f:
    f.write(content)
print("Done — check STEP messages above for any failures")
