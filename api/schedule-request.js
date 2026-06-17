const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SB_URL = process.env.REACT_APP_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

async function sendTelegram(msg) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'HTML'})
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { payment_id, wallet_address, request_type, reason, new_recipient, new_amount, new_date } = req.body;

  try {
    // Save to Supabase
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

    // Send Telegram notification
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
