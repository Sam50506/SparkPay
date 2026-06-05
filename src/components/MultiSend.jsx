import React, { useRef } from 'react';

function CountrySelect({ value, onChange }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 10, paddingRight: 6, gap: 4, zIndex: 0, pointerEvents: 'none', fontSize: 13, color: 'var(--tx1)' }}>
        {value ? <span>{value}</span> : <span style={{ color: 'var(--tx3)' }}>Country</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ position: 'relative', zIndex: 1, opacity: 0.01, cursor: 'pointer', width: 120, height: 40, fontSize: 16, border: 'none', background: 'transparent' }}>
        <option value="">None</option>
        {['Pakistan','India','Nigeria','Ghana','Kenya','Bangladesh','Philippines','Mexico','Brazil','Indonesia','Vietnam','Egypt','Turkey','Colombia','Morocco','Tanzania','Ethiopia','Uganda','Argentina','Peru'].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}

export default function MultiSend({ multi, setMulti, loading, handleMultiReview }) {
  const fileRef = useRef(null);

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(l => l.trim());
      const parsed = [];
      for (const line of lines) {
        const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
        const addr = parts[0];
        const amount = parts[1];
        const country = parts[2] || '';
        if (addr && amount) parsed.push({ addr, amount, country });
      }
      if (parsed.length > 0) {
        setMulti(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const total = multi.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const validCount = multi.filter(r => r.addr && r.amount).length;

  return (
    <div className="ap-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <div className="ap-card-title">Multi Send</div>
          <div className="ap-card-sub">Send USDC to multiple recipients in one session.</div>
        </div>
        <button
          className="ap-btn ap-btn-sec"
          style={{ fontSize: 12, padding: '7px 12px', flexShrink: 0, marginTop: 0 }}
          onClick={() => fileRef.current?.click()}
        >
          Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
      </div>

      <div style={{ background: 'var(--elev)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--tx3)', marginBottom: 14 }}>
        CSV format: <span style={{ fontFamily: 'monospace', color: 'var(--tx2)' }}>address, amount, country</span>
      </div>

      {multi.map((r, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 2 }}>
              {i === 0 && <div className="ap-label">Address</div>}
              <input
                className="ap-input"
                style={{ marginBottom: 0 }}
                placeholder="0x..."
                value={r.addr}
                onChange={e => { const v = e.target.value; setMulti(p => p.map((x, j) => j === i ? { ...x, addr: v } : x)); }}
              />
            </div>
            <div style={{ flex: 1 }}>
              {i === 0 && <div className="ap-label">Amount</div>}
              <input
                className="ap-input"
                style={{ marginBottom: 0 }}
                type="number"
                placeholder="0.00"
                value={r.amount}
                onChange={e => { const v = e.target.value; setMulti(p => p.map((x, j) => j === i ? { ...x, amount: v } : x)); }}
              />
            </div>
            {multi.length > 1 && (
              <button
                className="ap-btn ap-btn-danger"
                style={{ marginTop: i === 0 ? 22 : 0, padding: '12px 10px' }}
                onClick={() => setMulti(p => p.filter((_, j) => j !== i))}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ marginTop: 6 }}>
            {i === 0 && <div className="ap-label">Country</div>}
            <CountrySelect value={r.country} onChange={v => setMulti(p => p.map((x, j) => j === i ? { ...x, country: v } : x))} />
          </div>
        </div>
      ))}

      <button
        className="ap-btn ap-btn-ghost"
        style={{ width: '100%', marginBottom: 14 }}
        onClick={() => setMulti(p => [...p, { addr: '', amount: '', country: '' }])}
      >
        + Add Recipient
      </button>

      <div style={{ padding: '12px 14px', background: 'var(--elev)', borderRadius: 12, border: '1px solid var(--b1)', fontSize: 14, color: 'var(--tx1)', marginBottom: 8 }}>
        Total: <strong>{total.toFixed(2)} USDC</strong> to <strong>{validCount}</strong> recipients
      </div>

      <button className="ap-btn ap-btn-primary" onClick={handleMultiReview} disabled={loading}>
        {loading ? 'Sending...' : 'Review and Send All'}
      </button>
    </div>
  );
}
