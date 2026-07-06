import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { rateLimit } from '../src/lib/rateLimit.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PAYOUT_PRIVATE_KEY;
const ADMIN_ADDRESS = (process.env.ADMIN_ADDRESS || '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306').toLowerCase();
const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x79a1C363Afd912212B7581F735a9096fB453F8be';
const SCHED_ABI = [
  'function cancel(uint256 id) external',
  'function adminEdit(uint256 id, address payable newRecipient, uint256 newAmount, uint256 newReleaseTime, string calldata newCountry) external payable',
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
const JWT_SECRET = process.env.PAYOUT_JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const allowed = await rateLimit(req, res, 'normal');
  if (!allowed) return;

  const { action, request_id, payment_id, request_type, request_ids } = req.body;

  if (action === 'create') {
    const { payment_id: newId, sender, recipient, amount, release_time, country, tx_hash } = req.body;
    try {
      const r = await fetch(`${SB_URL}/rest/v1/scheduled_payments`, {
        method: 'POST',
        headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=representation'},
        body: JSON.stringify({payment_id: newId, sender, recipient, amount, release_time, country: country || '', executed: false, cancelled: false, tx_hash})
      });
      if (!r.ok) throw new Error(await r.text());
      return res.status(200).json({success: true});
    } catch(e) {
      return res.status(500).json({error: e.message});
    }
  }

  if (action === 'delete') {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let authorized = false;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.address?.toLowerCase() === ADMIN_ADDRESS) authorized = true;
      } catch (e) {}
    }
        if (!authorized) return res.status(401).json({error: 'Unauthorized - please re-verify with passkey'});
    if (!Array.isArray(request_ids) || request_ids.length === 0) return res.status(400).json({error: 'request_ids required'});
    try {
      const idsFilter = request_ids.join(',');
      await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?id=in.(${idsFilter})`, {
        method: 'DELETE',
        headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`}
      });
      return res.json({success: true});
    } catch(e) {
      return res.status(500).json({error: e.message});
    }
  }

  if (action === 'approve' || action === 'reject') {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let authorized = false;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.address?.toLowerCase() === ADMIN_ADDRESS) authorized = true;
      } catch (e) {}
    }
        if (!authorized) return res.status(401).json({error: 'Unauthorized - please re-verify with passkey'});
    try {
      if (action === 'approve' && request_type === 'cancel') {
        const provider = new ethers.JsonRpcProvider(RPC, {name: 'Arc Testnet', chainId: 5042002});
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const contract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, wallet);
        const tx = await contract.cancel(payment_id, {gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000});
        await tx.wait();
        await fetch(`${SB_URL}/rest/v1/scheduled_payments?payment_id=eq.${payment_id}`, {
          method: 'PATCH',
          headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json'},
          body: JSON.stringify({cancelled: true})
        });
      }
      if (action === 'approve' && request_type === 'edit') {
        const reqRes = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?id=eq.${request_id}&select=*`, {
          headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`}
        });
        const [editReq] = await reqRes.json();

        const adminProvider = new ethers.JsonRpcProvider(RPC, {name: 'Arc Testnet', chainId: 5042002});
        const adminWallet = new ethers.Wallet(PRIVATE_KEY, adminProvider);
        const adminContract = new ethers.Contract(SCHED_ADDR, SCHED_ABI, adminWallet);

        const current = await adminContract.getPayment(payment_id);
        const newRecipient = editReq.new_recipient || ethers.ZeroAddress;
        const newAmount = editReq.new_amount ? ethers.parseUnits(editReq.new_amount.toString(), 18) : 0n;
        let newReleaseTime = 0;
        if (editReq.new_date) {
          const timeStr = editReq.new_time || '12:00';
          const dateStr = `${editReq.new_date}T${timeStr}:00`;
          const tzOffset = editReq.tz_offset != null ? Number(editReq.tz_offset) : 0;
          // Parse as UTC then subtract offset to get correct UTC from local time
          const utcMs = new Date(dateStr + 'Z').getTime() - (tzOffset * 60 * 1000);
          newReleaseTime = Math.floor(utcMs / 1000);
          if (newReleaseTime <= Math.floor(Date.now() / 1000)) {
            return res.status(400).json({ error: 'New release time must be in the future' });
          }
        }

        let value = 0n;
        if (newAmount > 0n && newAmount > current.amount) value = newAmount - current.amount;

        const editTx = await adminContract.adminEdit(
          payment_id, newRecipient, newAmount, newReleaseTime, '',
          {value, gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 200000}
        );
        await editTx.wait();

        const updates = {};
        if (editReq.new_recipient) updates.recipient = editReq.new_recipient;
        if (editReq.new_amount) updates.amount = editReq.new_amount;
        if (newReleaseTime) updates.release_time = newReleaseTime;
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
      return res.status(500).json({error: e.message, reason: e?.reason, code: e?.code});
    }
  }

  const { payment_id: pid, wallet_address, request_type: rtype, reason, new_recipient, new_amount, new_date, new_time: ntime, tz_offset } = req.body;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests`, {
      method: 'POST',
      headers: {'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
      body: JSON.stringify({payment_id: pid, wallet_address, request_type: rtype, reason, new_recipient, new_amount, new_date, new_time: ntime||null, tz_offset: tz_offset||null, status: 'pending'})
    });
    if (!r.ok) throw new Error(await r.text());
    // Mask wallet address in Telegram alerts to limit PII exposure if the bot token
    // is ever leaked/logged — full details remain visible in the admin portal itself.
    const maskedWallet = wallet_address ? `${wallet_address.slice(0,6)}...${wallet_address.slice(-4)}` : 'unknown';
    const msg = rtype === 'cancel'
      ? `🚨 <b>Cancel Request</b>\n\nPayment ID: #${pid}\nWallet: <code>${maskedWallet}</code>\n\nReview in admin portal.`
      : `✏️ <b>Edit Request</b>\n\nPayment ID: #${pid}\nWallet: <code>${maskedWallet}</code>\n\nReview in admin portal.`;
    await sendTelegram(msg);
    res.status(200).json({success: true});
  } catch(e) {
    res.status(500).json({error: e.message});
  }
}
