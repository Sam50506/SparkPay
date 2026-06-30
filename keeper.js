const { ethers } = require("ethers");

const RPC = "https://rpc.testnet.arc.network";
const SCHED_ADDR = "0xD8668A6b776e8b6aAcaAaad16240Bb57DcD89C57";
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;

const SCHED_ABI = [
  "function paymentCount() external view returns (uint256)",
  "function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))",
  "function execute(uint256 id) external"
];

async function main() {
  if (!PRIVATE_KEY) { console.error("No private key"); process.exit(1); }
  const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(RPC, 5042002);
  const wallet = new ethers.Wallet(key, provider);
  const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
  const count = Number(await contract.paymentCount());
  const now = Math.floor(Date.now() / 1000);
  console.log("Checking " + count + " payments");

  let executed = 0, failed = 0, skipped = 0;

  for (let i = 0; i < count; i++) {
    try {
      const p = await contract.getPayment(i);
      // Check Supabase for overridden release time
      let releaseTime = Number(p.releaseTime);
      try {
        const SB_URL = process.env.REACT_APP_SUPABASE_URL;
        const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
        const ovRes = await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${i}&select=release_time`, {
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
        });
        const ovData = await ovRes.json();
        if (ovData[0]?.release_time) releaseTime = Number(ovData[0].release_time);
      } catch(e) {}

      if (p.executed || p.cancelled || releaseTime > now) { skipped++; continue; }

      // Skip if pending cancel request
      const SB_URL = process.env.REACT_APP_SUPABASE_URL;
      const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
      const reqRes = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?payment_id=eq.${i}&status=eq.pending&request_type=eq.cancel`, { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } });
      const reqs = await reqRes.json();
      if (reqs.length > 0) { console.log("Skipping payment " + i + " — pending cancel request"); skipped++; continue; }

      console.log("Executing payment " + i);
      const tx = await contract.execute(i, { gasPrice: ethers.parseUnits("100", "gwei"), gasLimit: 100000 });
      await tx.wait();
      console.log("Done: " + tx.hash);
      executed++;
      // Save tx hash to Supabase
      try {
        const SB_URL = process.env.REACT_APP_SUPABASE_URL;
        const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
        await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${i}`, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_hash: tx.hash })
        });
      } catch(he) { console.error('Failed to save tx hash:', he.message); }

      try {
        const sendAmount = parseFloat(ethers.formatUnits(p.amount, 18));
        if (sendAmount >= 5) {
          const cashbackAmt = parseFloat((sendAmount * 0.01).toFixed(3));
          const SB_URL = process.env.REACT_APP_SUPABASE_URL;
          const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
          const getRes = await fetch(`${SB_URL}/rest/v1/cashback_balances?wallet_address=eq.${p.sender}&select=*`, {
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
          });
          const rows = await getRes.json();
          const current = rows[0]?.pending_amount || 0;
          const newBalance = parseFloat((parseFloat(current) + cashbackAmt).toFixed(3));
          await fetch(`${SB_URL}/rest/v1/cashback_balances`, {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': `Bearer ${SB_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ wallet_address: p.sender, pending_amount: newBalance, updated_at: new Date().toISOString() })
          });
          console.log("Cashback awarded: " + cashbackAmt + " to " + p.sender);
        }
      } catch (ce) { console.error("Cashback failed for payment " + i + ":", ce.message); }

    } catch (e) {
      console.error("Payment " + i + " failed:", e.message);
      failed++;
    }
  }

  // Save last run time
  try {
    const SB_URL = process.env.REACT_APP_SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    await fetch(`${SB_URL}/rest/v1/keeper_status`, { method: "POST", headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" }, body: JSON.stringify({ id: 1, last_run: new Date().toISOString() }) });
  } catch(e) { console.error("Failed to save keeper status:", e.message); }

  console.log(`Keeper finished — executed: ${executed}, failed: ${failed}, skipped: ${skipped}`);
  
}

main().catch(e => { console.error(e.message); });
// v3


