import { ethers } from 'ethers';

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x1Eb2088f3FE2bD64Dde3c770f87a5047f99b8946';
const SCHED_ABI = [
  'function execute(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function updateSupabase(SB_URL, SB_SERVICE_KEY, id, fields) {
  await fetch(`${SB_URL}/rest/v1/scheduled_payments?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': 'Bearer ' + SB_SERVICE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fields)
  });
}

export default async function handler(req, res) {
  if (req.headers['authorization'] !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
    const wallet = new ethers.Wallet(process.env.PAYOUT_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);

    const r = await fetch(`${SB_URL}/rest/v1/scheduled_payments?executed=eq.false&cancelled=eq.false&select=*`, {
      headers: {
        'apikey': SB_SERVICE_KEY,
        'Authorization': 'Bearer ' + SB_SERVICE_KEY
      }
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
        const onChain = await contract.getPayment(p.payment_id);

        // FIX 2: Handle executed and cancelled separately
        if (onChain.executed) {
          await updateSupabase(SB_URL, SB_SERVICE_KEY, p.id, { executed: true });
          continue;
        }

        if (onChain.cancelled) {
          await updateSupabase(SB_URL, SB_SERVICE_KEY, p.id, { cancelled: true });
          continue;
        }

        // Use Supabase recipient/amount if an approved edit exists, else use on-chain
        const recipient = p.recipient || onChain.recipient;
        const amount    = p.amount    || onChain.amount;

        if (p.recipient || p.amount) {
          // Approved edit — send USDC directly to updated recipient
          const USDC_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];
          const USDC_ADDR = process.env.REACT_APP_USDC_ADDR || '0x3600000000000000000000000000000000000000';
          const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, wallet);
          const tx = await usdc.transfer(recipient, amount, {
            gasPrice: ethers.parseUnits('21', 'gwei'),
            gasLimit: 100000
          });
          await tx.wait();
        } else {
          // No edits — normal on-chain execution
          const tx = await contract.execute(p.payment_id, {
            gasPrice: ethers.parseUnits('21', 'gwei'),
            gasLimit: 100000
          });
          await tx.wait();
        }

        await updateSupabase(SB_URL, SB_SERVICE_KEY, p.id, { executed: true });
        results.executed.push(p.payment_id);

      } catch (e) {
        results.failed.push({ id: p.payment_id, error: e.message });
      }
    }

    return res.json({ success: true, ...results });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
