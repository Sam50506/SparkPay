path = "api/cashback.js"
with open(path) as f:
    content = f.read()

old = """      const getRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}&select=pending_amount`);
      const rows = await getRes.json();
      const newBalance = rows[0]?.pending_amount ?? null;
      return res.json({ success: true, newBalance });"""

new = """      const getRes = await sb(`cashback_balances?wallet_address=eq.${wallet_address}&select=pending_amount`);
      const rows = await getRes.json();
      const newBalance = rows[0]?.pending_amount ?? null;
      try {
        await sb('cashback_events', {
          method: 'POST',
          body: JSON.stringify({ wallet_address, amount, tx_hash: tx_hash || null })
        });
      } catch (e) { console.error('cashback_events insert failed:', e.message); }
      return res.json({ success: true, newBalance });"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: cashback.js now records each award in cashback_events")
