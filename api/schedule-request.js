import { ethers } from 'ethers';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const PRIVATE_KEY = process.env.PAYOUT_PRIVATE_KEY;
const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x13474Fe73628949236DA25D38b7207ecEC0E6058';
const SCHED_ABI = [
  'function cancel(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

async function sendTelegram(msg) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML'})
  });
}

export default async function handler(req, res) {
  if (req.method === 'POST' && req.body.action === 'approve') {
    // Admin approving a request
    const { request_id, payment_id, request_type } = req.body;
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.PAYOUT_ADMIN_KEY) return res.status(401).json({error:'Unauthorized'});

    try {
      if (request_type === 'cancel') {
        // Call cancel on smart contract
        const provider = new ethers.JsonRpcProvider(RPC, {name:'Arc Testnet', chainId:5042002});
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
        const tx = await contract.cancel(payment_id, {gasPrice: ethers.parseUnits('21','gwei')});
        await tx.wait();
      }

      // Update status in Supabase
      await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?id=eq.${request_id}`, {
        method: 'PATCH',
        headers: {'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({status:'approved'})
      });

      await sendTelegram(`✅ Request #${request_id} approved. Payment #${payment_id} ${request_type === 'cancel' ? 'cancelled on-chain.' : 'updated.'}`);
      return res.json({success:true});
    } catch(e) {
      console.error(e);
      return res.status(500).json({error: e.message});
    }
  }

  if (req.method === 'POST' && req.body.action === 'reject') {
    const { request_id } = req.body;
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.PAYOUT_ADMIN_KEY) return res.status(401).json({error:'Unauthorized'});

    try {
      await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?id=eq.${request_id}`, {
        method: 'PATCH',
        headers: {'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({status:'rejected'})
      });
      return res.json({success:true});
    } catch(e) {
      return res.status(500).json({error: e.message});
    }
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { payment_id, wallet_address, request_type, reason, new_recipient, new_amount, new_date } = req.body;

  try {
    const r = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ payment_id, wallet_address, request_type, reason, new_recipient, new_amount, new_date, status: 'pending' })
    });

    if (!r.ok) throw new Error(await r.text());

    const msg = request_type === 'cancel'
      ? `🚨 <b>Cancel Request</b>\n\nPayment ID: #${payment_id}\nWallet: <code>${wallet_address}</code>\nReason: ${reason}\n\nReview in admin portal.`
      : `✏️ <b>Edit Request</b>\n\nPayment ID: #${payment_id}\nWallet: <code>${wallet_address}</code>\nNew Recipient: ${new_recipient||'-'}\nNew Amount: ${new_amount||'-'}\nNew Date: ${new_date||'-'}\n\nReview in admin portal.`;

    await sendTelegram(msg);
    res.status(200).json({ success: true });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
