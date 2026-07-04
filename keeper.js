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

    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
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

async function main() {
  if (!PRIVATE_KEY) { console.error("No private key"); process.exit(1); }
  const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : '0x' + PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(RPC, 5042002);
  const wallet = new ethers.Wallet(key, provider);
  const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
  const now = Math.floor(Date.now() / 1000);

  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  let executed = 0, failed = 0, skipped = 0;

  // Only fetch candidates that are due, not cancelled, and not yet marked executed —
  // instead of looping every payment ID from 0 to paymentCount every run.
  const candRes = await fetch(
    `${SB_URL}/rest/v1/scheduled_payments?release_time=lte.${now}&executed=eq.false&cancelled=eq.false&select=payment_id`,
    { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
  );
  const candidates = await candRes.json();
  console.log("Checking " + candidates.length + " candidate payment(s)");

  for (const row of candidates) {
    const i = row.payment_id;
    try {
      const p = await contract.getPayment(i);

      // Self-heal: if chain shows executed/cancelled but Supabase didn't know, sync it and skip.
      if (p.executed || p.cancelled) {
        await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${i}`, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ executed: p.executed, cancelled: p.cancelled })
        }).catch(() => {});
        skipped++;
        continue;
      }

      // Skip if pending cancel request
      const reqRes = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?payment_id=eq.${i}&status=eq.pending&request_type=eq.cancel`, { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } });
      const reqs = await reqRes.json();
      if (reqs.length > 0) { console.log("Skipping payment " + i + " — pending cancel request"); skipped++; continue; }

      console.log("Executing payment " + i);
      const tx = await contract.execute(i, { gasPrice: ethers.parseUnits("100", "gwei"), gasLimit: 100000 });
      await tx.wait();
      console.log("Done: " + tx.hash);
      executed++;
      // Mark executed + save tx hash in one update
      try {
        await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${i}`, {
          method: 'PATCH',
          headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_hash: tx.hash, executed: true })
        });
      } catch(he) { console.error('Failed to save tx hash/executed flag:', he.message); }

      try {
        const sendAmount = parseFloat(ethers.formatUnits(p.amount, 18));
        if (sendAmount >= 5) {
          const cashbackAmt = parseFloat((sendAmount * 0.01).toFixed(3));
          const rpcRes = await fetch(`${SB_URL}/rest/v1/rpc/increment_cashback`, {
            method: 'POST',
            headers: {
              'apikey': SB_KEY,
              'Authorization': `Bearer ${SB_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallet: p.sender, amt: cashbackAmt })
          });
          if (!rpcRes.ok) {
            const errBody = await rpcRes.text();
            console.error('increment_cashback RPC failed:', rpcRes.status, errBody);
          }
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
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    await fetch(`${SB_URL}/rest/v1/keeper_status`, { method: "POST", headers: { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates" }, body: JSON.stringify({ id: 1, last_run: new Date().toISOString() }) });
  } catch(e) { console.error("Failed to save keeper status:", e.message); }

  await checkPayoutBalance(provider);

  console.log(`Keeper finished — executed: ${executed}, failed: ${failed}, skipped: ${skipped}`);
  
}

main().catch(e => { console.error(e.message); });
// v3


