import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const MS_COUNTRIES=['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Haiti','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Macedonia','Norway','Oman','Pakistan','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: 999, cursor: 'pointer', fontSize: 13, color: value ? 'var(--tx1)' : 'var(--tx3)', whiteSpace: 'nowrap', minWidth: 100 }} onClick={() => setOpen(true)}>
        {value ? <span style={{maxWidth:90,overflow:'hidden',textOverflow:'ellipsis'}}>{value}</span> : <span>Country</span>}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {open && <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start'}} onClick={()=>{setOpen(false);setSearch('');}}>
        <div style={{background:'var(--card)',width:'100%',maxHeight:'40vh',display:'flex',flexDirection:'column',borderRadius:'0 0 20px 20px'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
            <button onClick={()=>{setOpen(false);setSearch('');}} style={{background:'none',border:'none',fontSize:14,color:'var(--ac)',cursor:'pointer',fontWeight:600}}>Cancel</button>
            <span style={{fontWeight:700,fontSize:15,color:'var(--tx1)'}}>Select Country</span>
            <span style={{width:56}}/>
          </div>
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country..." autoFocus style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{overflowY:'auto',flex:1}}>
            <div onClick={()=>{onChange('');setOpen(false);setSearch('');}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx2)',borderBottom:'1px solid var(--b0)'}}>None</div>
            {MS_COUNTRIES.filter(c=>!search||c.toLowerCase().includes(search.toLowerCase())).map(c => <div key={c} onClick={()=>{onChange(c);setOpen(false);setSearch('');}} style={{padding:'12px 20px',fontSize:14,color:'var(--tx1)',borderBottom:'1px solid var(--b0)',background:value===c?'var(--acd)':'transparent'}}>{c}</div>)}
          </div>
        </div>
      </div>}
    </>
  );
}

export default function MultiSend({ multi, setMulti, loading, handleMultiReview }) {
  const fileRef = useRef(null);

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const parsed = [];
          for (const row of rows) {
            const addr = String(row[0] || '').trim();
            const amount = String(row[1] || '').trim();
            const country = String(row[2] || '').trim();
            if (addr && amount && addr.match(/^0x[0-9a-fA-F]{40}$/)) parsed.push({ addr, amount, country });
          }
          if (parsed.length > 0) setMulti(parsed);
          else alert('No valid rows found in spreadsheet.');
        } catch (err) {
          alert('Could not read spreadsheet file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (name.endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const pdf = await pdfjsLib.getDocument({ data: ev.target.result }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const rows = {};
            content.items.forEach(it => {
              const y = Math.round(it.transform[5]);
              (rows[y] = rows[y] || []).push(it);
            });
            const lines = Object.keys(rows)
              .map(Number)
              .sort((a, b) => b - a)
              .map(y => rows[y]
                .sort((a, b) => a.transform[4] - b.transform[4])
                .map(it => it.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim());
            text += lines.join('\n') + '\n';
          }
          const parsed = [];
          for (const line of text.split('\n')) {
            const addrMatch = line.match(/0x[0-9a-fA-F]{40}/);
            if (!addrMatch) continue;
            const rest = line.slice(addrMatch.index + addrMatch[0].length);
            const numMatches = rest.match(/\d+(\.\d+)?/g) || [];
            const amount = numMatches.find(n => parseFloat(n) > 0);
            if (!amount) continue;
            const country = MS_COUNTRIES.find(c => rest.includes(c)) || '';
            parsed.push({ addr: addrMatch[0], amount, country });
          }
          if (parsed.length > 0) setMulti(parsed);
          else alert('Could not find recipient rows in PDF. Try CSV or XLSX instead.');
        } catch (err) {
          console.error('PDF parse error:', err);
          alert('Could not read PDF file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
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
        if (parsed.length > 0) setMulti(parsed);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const total = multi.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const validCount = multi.filter(r => r.addr && r.amount).length;
  const invalidAddrs = multi.filter(r => r.addr && !r.addr.match(/^0x[0-9a-fA-F]{40}$/));

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
          Import File
        </button>
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf" style={{ display: 'none' }} onChange={handleCSV} />
      </div>

      <div style={{ background: 'var(--elev)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--tx3)', marginBottom: 14 }}>
        Format required: wallet address, amount, country (optional)
        <br /><br />
        CSV/XLSX and PDF files are allowed
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

      {invalidAddrs.length > 0 && <div style={{background:'rgba(255,79,97,.1)',border:'1px solid rgba(255,79,97,.3)',borderRadius:10,padding:'8px 12px',fontSize:12,color:'var(--re)',marginBottom:8}}>{invalidAddrs.length} invalid address(es) will be skipped</div>}
      <div style={{ padding: '12px 14px', background: 'var(--elev)', borderRadius: 12, border: '1px solid var(--b1)', fontSize: 14, color: 'var(--tx1)', marginBottom: 8 }}>
        Total: <strong>{total.toFixed(2)} USDC</strong> to <strong>{validCount}</strong> recipients
      </div>

      <button className="ap-btn ap-btn-primary" onClick={handleMultiReview} disabled={loading}>
        {loading ? 'Sending...' : 'Review and Send All'}
      </button>
    </div>
  );
}
