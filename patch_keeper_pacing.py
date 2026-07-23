path = "keeper.js"
with open(path) as f:
    content = f.read()

old = """async function processPayment(contract, i, now, counters) {
  try {
    const p = await contract.getPayment(i);"""

new = """async function processPayment(contract, i, now, counters) {
  try {
    await new Promise(r => setTimeout(r, 400));
    let p;
    try {
      p = await contract.getPayment(i);
    } catch (rpcErr) {
      await new Promise(r => setTimeout(r, 1500));
      p = await contract.getPayment(i);
    }"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: keeper.js now paces reads 400ms apart with a single retry on RPC failure")
