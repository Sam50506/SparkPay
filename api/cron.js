const { ethers } = require('ethers');

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x13474Fe73628949236DA25D38b7207ecEC0E6058';
const SCHED_ABI = [
  'function execute(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];
const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  // Verify cron secret to prevent unauthorized calls
  if(req.headers['authorization'] !== 'Bearer '+process.env.CRON_SECRET){
    return res.status(401).json({error:'Unauthorized'});
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
    const wallet = new ethers.Wallet(process.env.PAYOUT_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);

    // Fetch pending scheduled payments from Supabase
    const r = await fetch(`${SB_URL}/rest/v1/scheduled_payments?executed=eq.false&cancelled=eq.false&select=*`, {
      headers: { 'apikey': SB_SERVICE_KEY, 'Authorization': 'Bearer ' + SB_SERVICE_KEY }
    });
    const pending = await r.json();

    const now = Math.floor(Date.now() / 1000);
    const results = { executed: [], skipped: [], failed: [] };

    for (const p of pending) {
      if (p.release_time > now) {
        results.skipped.push(p.payment_id);
        continue;
      }
      try {
        // Verify on-chain status
        const onChain = await contract.getPayment(p.payment_id);
        if (onChain.executed || onChain.cancelled) {
          // Mark as executed in Supabase
          await fetch(`${SB_URL}/rest/v1/scheduled_payments?id=eq.${p.id}`, {
            method: 'PATCH',
            headers: { 'apikey': SB_SERVICE_KEY, 'Authorization': 'Bearer ' + SB_SERVICE_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ executed: true })
          });
          continue;
        }
        const tx = await contract.execute(p.payment_id, { gasPrice: ethers.parseUnits('21', 'gwei') });
        await tx.wait();
        // Mark as executed in Supabase
        await fetch(`${SB_URL}/rest/v1/scheduled_payments?id=eq.${p.id}`, {
          method: 'PATCH',
          headers: { 'apikey': SB_SERVICE_KEY, 'Authorization': 'Bearer ' + SB_SERVICE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ executed: true })
        });
        results.executed.push(p.payment_id);
      } catch(e) {
        results.failed.push({ id: p.payment_id, error: e.message });
      }
    }

    return res.json({ success: true, ...results });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
