const { ethers } = require("ethers");

const RPC = "https://rpc.testnet.arc.network";
const SCHED_ADDR = "0xfb319b6BFf115bDFc6B4b76e0155E9d224f37771";
const PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;

const SCHED_ABI = [
  "function paymentCount() external view returns (uint256)",
  "function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))",
  "function execute(uint256 id) external"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const PAYOUT_WALLET_ADDRESS = process.env.PAYOUT_WALLET_ADDRESS;
const USDC_ADDR = process.env.REACT_APP_USDC_ADDR || "0x3600000000000000000000000000000000000000";
const LOW_BALANCE_THRESHOLD = 20;

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

async function sendTelegramAlert(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram not configured, skipping alert");
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: "HTML" })
    });
  } catch (e) {
    console.error("Telegram alert failed:", e.message);
  }
}

async function checkPayoutBalance(provider) {
  if (!PAYOUT_WALLET_ADDRESS) {
    console.log("PAYOUT_WALLET_ADDRESS not set, skipping balance check");
    return;
  }
  try {
    const usdc = new ethers.Contract(USDC_ADDR, ERC20_ABI, provider);
    const decimals = await usdc.decimals();
    const raw = await usdc.balanceOf(PAYOUT_WALLET_ADDRESS);
    const balance = parseFloat(ethers.formatUnits(raw, decimals));
    console.log(`Payout wallet balance: ${balance} USDC`);

    if (balance >= LOW_BALANCE_THRESHOLD) return;

    const statusRes = await fetch(`${SB_URL}/rest/v1/keeper_status?id=eq.1&select=last_balance_alert`, {
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` }
    });
    const statusRows = await statusRes.json();
    const lastAlert = statusRows[0]?.last_balance_alert ? new Date(statusRows[0].last_balance_alert) : null;
    const hoursSinceLastAlert = lastAlert ? (Date.now() - lastAlert.getTime()) / 3600000 : Infinity;

    if (hoursSinceLastAlert < 12) {
      console.log(`Low balance but alert sent ${hoursSinceLastAlert.toFixed(1)}h ago, skipping`);
      return;
    }

    await sendTelegramAlert(
      `⚠️ <b>SparkPay Low Balance Alert</b>\n\nPayout wallet balance: <b>${balance.toFixed(2)} USDC</b>\nThreshold: ${LOW_BALANCE_THRESHOLD} USDC\n\nTop up soon to avoid failed cashback payouts.`
    );

    await fetch(`${SB_URL}/rest/v1/keeper_status`, {
      method: "POST",
      headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ id: 1, last_balance_alert: new Date().toISOString() })
    });
  } catch (e) {
    console.error("Balance check failed:", e.message);
  }
}

async function processPayment(contract, i, now, counters) {
  try {
    const p = await contract.getPayment(i);

    // SECURITY: on-chain state is the only source of truth for execution decisions.
    // Supabase is used elsewhere purely to discover candidate IDs faster — never to
    // override whether a payment is due, executed, or cancelled. A bad/stale DB row
    // (e.g. release_time=0) must never cause early or incorrect execution.
    const releaseTime = Number(p.releaseTime);

    if (p.executed || p.cancelled || releaseTime > now) { counters.skipped++; return; }

    const reqRes = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?payment_id=eq.${i}&status=eq.pending&request_type=eq.cancel`, { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } });
    const reqs = await reqRes.json();
    if (reqs.length > 0) { console.log("Skipping payment " + i + " — pending cancel request"); counters.skipped++; return; }

    console.log("Executing payment " + i);
    const tx = await contract.execute(i, { gasPrice: ethers.parseUnits("100", "gwei"), gasLimit: 100000 });
    await tx.wait();
    console.log("Done: " + tx.hash);
    counters.executed++;

    try {
      await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${i}`, {
        method: 'PATCH',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_hash: tx.hash, executed: true })
      });
    } catch (he) { console.error('Failed to save tx hash/executed flag:', he.message); }

    try {
      // Compute cashback in integer wei-space (BigInt) to avoid any floating-point
      // precision loss. Only convert to a decimal string at the very end, for display
      // and for passing to Postgres NUMERIC (which accepts exact decimal strings).
      const FIVE_USDC_WEI = ethers.parseUnits("5", 18);
      if (p.amount >= FIVE_USDC_WEI) {
        const cashbackWei = p.amount / 100n; // exact 1%, integer division, no rounding drift
        const cashbackAmtStr = ethers.formatUnits(cashbackWei, 18);
        const rpcRes = await fetch(`${SB_URL}/rest/v1/rpc/increment_cashback`, {
          method: 'POST',
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: p.sender, amt: cashbackAmtStr })
        });
        if (!rpcRes.ok) {
          const errBody = await rpcRes.text();
          console.error('increment_cashback RPC failed:', rpcRes.status, errBody);
        }
        console.log("Cashback awarded: " + cashbackAmtStr + " to " + p.sender);
      }
    } catch (ce) { console.error("Cashback failed for payment " + i + ":", ce.message); }

  } catch (e) {
    console.error("Payment " + i + " failed:", e.message);
    counters.failed++;
  }
}

async function main() {
  if (!PRIVATE_KEY) { console.error("No private key"); process.exit(1); }
  const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(RPC, 5042002);
  const wallet = new ethers.Wallet(key, provider);
  const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
  const now = Math.floor(Date.now() / 1000);

  const onChainCount = Number(await contract.paymentCount());

  let sbCount = null;
  try {
    const countRes = await fetch(`${SB_URL}/rest/v1/scheduled_payments?select=payment_id`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    const rows = await countRes.json();
    sbCount = Array.isArray(rows) ? rows.length : null;
  } catch (e) {
    console.error("Could not read scheduled_payments count, falling back to full sweep:", e.message);
  }

  const counters = { executed: 0, failed: 0, skipped: 0 };
  const inSync = sbCount !== null && sbCount === onChainCount;

  if (inSync) {
    console.log(`Supabase in sync (${sbCount}/${onChainCount}) — using fast candidate query`);
    const candRes = await fetch(
      `${SB_URL}/rest/v1/scheduled_payments?release_time=lte.${now}&executed=eq.false&cancelled=eq.false&select=payment_id`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const candidates = await candRes.json();
    console.log("Checking " + candidates.length + " candidate payment(s)");
    for (const row of candidates) {
      await processPayment(contract, row.payment_id, now, counters);
    }
  } else {
    console.warn(`SYNC MISMATCH: Supabase has ${sbCount ?? 'unknown'} rows, on-chain has ${onChainCount}. Falling back to full on-chain sweep for safety.`);
    await sendTelegramAlert(
      `⚠️ <b>SparkPay Keeper Sync Warning</b>\n\nSupabase rows: <b>${sbCount ?? 'unknown'}</b>\nOn-chain paymentCount: <b>${onChainCount}</b>\n\nFalling back to full sweep this run. Investigate the data gap.`
    );
    console.log("Checking all " + onChainCount + " payments (full sweep)");
    for (let i = 0; i < onChainCount; i++) {
      await processPayment(contract, i, now, counters);
    }
  }

  try {
    await fetch(`${SB_URL}/rest/v1/keeper_status`, { method: "POST", headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" }, body: JSON.stringify({ id: 1, last_run: new Date().toISOString() }) });
  } catch (e) { console.error("Failed to save keeper status:", e.message); }

  await checkPayoutBalance(provider);

  console.log(`Keeper finished — mode: ${inSync ? 'fast' : 'full-sweep-fallback'}, executed: ${counters.executed}, failed: ${counters.failed}, skipped: ${counters.skipped}`);
}

main().catch(e => { console.error(e.message); });
// v4 - hybrid with self-healing sync check
