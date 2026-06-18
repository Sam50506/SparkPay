import { ethers } from 'ethers';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PAYOUT_PRIVATE_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x4dd5BD2e2FB59E1591ED769783fC277C8F7B2990';
const SCHED_ABI = [
  'function cancel(uint256 id) external',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];

async function sendTelegram(msg) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML'})
    });
  } catch(e) {}
}

const ADMIN_KEY = process.env.PAYOUT_ADMIN_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { action, request_id, payment_id, request_type } = req.body;

  // Handle approve/reject actions
  if (action === 'approve' || action === 'reject') {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) {
      return res.status(401).json({error: 'Unauthorized'});
    }
    try {

      if (action === 'approve' && request_type === 'cancel') {
        const provider = new ethers.JsonRpcProvider(RPC, {name: 'Arc Testnet', chainId: 5042002});
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
        const tx = await contract.cancel(payment_id, {gasPrice: ethers.parseUnits('21', 'gwei')});
        await tx.wait();
      }

      if (action === 'approve' && request_type === 'edit') {
        const reqRes = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?id=eq.${request_id}&select=*`, {
          headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`}
        });
        const [editReq] = await reqRes.json();
        const updates = {};
        if (editReq.new_recipient) updates.recipient = editReq.new_recipient;
        if (editReq.new_amount)    updates.amount = editReq.new_amount;
        if (editReq.new_date)      updates.release_time = Math.floor(new Date(editReq.new_date).getTime() / 1000);
        if (Object.keys(updates).length > 0) {
          await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${payment_id}`, {
            method: 'PATCH',
            headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(updates)
          });
        }
      }

      await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?id=eq.${request_id}`, {
        method: 'PATCH',
        headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({status: action === 'approve' ? 'approved' : 'rejected'})
      });

      await sendTelegram(`${action === 'approve' ? '✅ Approved' : '❌ Rejected'} request #${request_id} for payment #${payment_id}`);
      return res.json({success: true});
    } catch(e) {
      console.error(e);
      return res.status(500).json({error: e.message});
    }
  }

  // Handle new request submission
  const { payment_id: pid, wallet_address, request_type: rtype, reason, new_recipient, new_amount, new_date } = req.body;

  try {
    const r = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests`, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({payment_id: pid, wallet_address, request_type: rtype, reason, new_recipient, new_amount, new_date, status: 'pending'})
    });

    if (!r.ok) throw new Error(await r.text());

    const msg = rtype === 'cancel'
      ? `🚨 <b>Cancel Request</b>\n\nPayment ID: #${pid}\nWallet: <code>${wallet_address}</code>\nReason: ${reason}\n\nReview in admin portal.`
      : `✏️ <b>Edit Request</b>\n\nPayment ID: #${pid}\nWallet: <code>${wallet_address}</code>\nNew Recipient: ${new_recipient||'-'}\nNew Amount: ${new_amount||'-'}\nNew Date: ${new_date||'-'}\n\nReview in admin portal.`;

    await sendTelegram(msg);
    res.status(200).json({success: true});
  } catch(e) {
    console.error(e);
    res.status(500).json({error: e.message});
  }
}
