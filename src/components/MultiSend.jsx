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
      {open && <div style={{position:'fixed',top:0,bottom:0,right:0,left:window.innerWidth>=900?256:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'flex-start'}} onClick={()=>{setOpen(false);setSearch('');}}>
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

export default function MultiSend({ multi, setMulti, loading, handleMultiReview, contacts }) {
  const fileRef = useRef(null);
  const rowRefs = useRef({});
  const [fileError, setFileError] = React.useState(null);
  const [fileWarning, setFileWarning] = React.useState(null);
  const [showSkipped, setShowSkipped] = React.useState(false);
  const [highlightIdx, setHighlightIdx] = React.useState(null);
  const [showContactsPicker, setShowContactsPicker] = React.useState(false);
  const [contactSearch, setContactSearch] = React.useState('');
  const [selectedContactIds, setSelectedContactIds] = React.useState(new Set());

  const toggleContactSelect = (id) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSelectedContacts = () => {
    const chosen = (contacts||[]).filter(c => selectedContactIds.has(c.id));
    if (chosen.length === 0) return;
    setMulti(p => {
      const base = (p.length === 1 && !p[0].addr && !p[0].amount) ? [] : p;
      return [...base, ...chosen.map(c => ({ addr: c.address, amount: '', country: c.country || '' }))];
    });
    setSelectedContactIds(new Set());
    setContactSearch('');
    setShowContactsPicker(false);
  };

  const truncateAddr = (a) => (a && a.length > 14) ? `${a.slice(0,6)}...${a.slice(-4)}` : (a || '');

  const addAndFocus = (item, i) => {
    const newIdx = multi.length;
    setMulti(p => [...p, { addr: item.raw, amount: item.amount || '', country: item.country || '' }]);
    setFileWarning(w => {
      const next = { ...w, items: w.items.map((it, j) => j === i ? { ...it, linkedIdx: newIdx } : it) };
      return next;
    });
    setHighlightIdx(newIdx);
    setTimeout(() => {
      const el = rowRefs.current[newIdx];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  // Clear highlight + issue entry once the linked row is valid
  React.useEffect(() => {
    if (highlightIdx === null) return;
    const r = multi[highlightIdx];
    if (r && /^0x[0-9a-fA-F]{40}$/.test(r.addr) && parseFloat(r.amount) > 0) {
      const idxToRemove = highlightIdx;
      setHighlightIdx(null);
      setFileWarning(w => {
        if (!w) return w;
        const next = { ...w, items: w.items.filter(it => it.linkedIdx !== idxToRemove) };
        return next.items.length === 0 ? null : next;
      });
    }
  }, [multi, highlightIdx]);

  const handleCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError(null);
    setFileWarning(null);
    setShowSkipped(false);
    const name = file.name.toLowerCase();

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const wb = XLSX.read(ev.target.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const parsed = [];
          const skipped = [];
          let rowNum = 0;
          let dataRowNum = 0;
          for (const row of rows) {
            rowNum++;
            const addr = String(row[0] || '').trim();
            const amount = String(row[1] || '').trim();
            const country = String(row[2] || '').trim();
            if (!addr.toLowerCase().startsWith('0x')) continue;
            dataRowNum++;
            if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) { skipped.push({ snippet: addr, reason: 'Invalid wallet address format', fileRow: rowNum }); continue; }
            const parsedAmt = parseFloat(amount);
            if (!amount || isNaN(parsedAmt) || parsedAmt === 0) { skipped.push({ snippet: addr, reason: 'Missing amount', fileRow: rowNum, raw: addr }); continue; }
            if (parsedAmt < 0) { skipped.push({ snippet: addr, reason: `Invalid amount (negative: ${amount})`, fileRow: rowNum, raw: addr }); continue; }
            parsed.push({ addr, amount, country });
          }
          if (parsed.length > 0) {
            setMulti(parsed);
            setFileWarning(skipped.length > 0 ? { total: parsed.length + skipped.length, valid: parsed.length, items: skipped } : null);
          } else {
            setMulti([]);
            setFileWarning(null);
            setFileError('No valid rows found in spreadsheet.');
          }
        } catch (err) {
          setMulti([]);
          setFileError('Could not read spreadsheet file.');
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
          console.log('PDF extracted text:', text);
          const parsed = [];
          const skipped = [];
          // Collapse all whitespace/newlines so wrapped addresses are found
          const flatText = text.replace(/\s+/g, ' ');
          // Find all valid 40-char hex addresses globally
          const addrRegex = /0x[0-9a-fA-F]{40}/g;
          let m;
          const allAddrs = [];
          while ((m = addrRegex.exec(flatText)) !== null) {
            allAddrs.push({ addr: m[0], index: m.index });
          }
          // Scan for short/malformed 0x tokens (not full 40-char) to report as invalid
          // Only match short/malformed 0x tokens — must NOT be part of a valid 40-char address
          const validAddrSet = new Set(allAddrs.map(a => a.addr));
          const anyAddrRegex = /0x[0-9a-fA-F]{1,39}(?![0-9a-fA-F])/g;
          let m2;
          let malformedCount = 0;
          while ((m2 = anyAddrRegex.exec(flatText)) !== null) {
            if (validAddrSet.has(m2[0])) continue;
            malformedCount++;
            skipped.push({ snippet: m2[0].slice(0, 20) + (m2[0].length > 20 ? '...' : ''), reason: 'Invalid wallet address format' });
          }
          for (let i = 0; i < allAddrs.length; i++) {
            // Start segment AFTER the address itself to avoid matching hex digits inside it as amount
            const start = allAddrs[i].index + allAddrs[i].addr.length;
            const end = i + 1 < allAddrs.length ? allAddrs[i+1].index : flatText.length;
            const segment = flatText.slice(start, end);
            const country = MS_COUNTRIES.find(c => segment.includes(c)) || '';
            // Match signed numbers so we can distinguish negative from missing
            const numMatches = [...segment.matchAll(/(-?\d+(\.\d+)?)/g)].map(n => n[1]);
            const amount = numMatches.find(n => parseFloat(n) > 0);
            const negAmount = numMatches.find(n => parseFloat(n) < 0);
            if (!amount) {
              const reason = negAmount
                ? `Invalid amount (negative: ${negAmount})`
                : 'Missing amount';
              skipped.push({ snippet: allAddrs[i].addr, reason, raw: allAddrs[i].addr });
              continue;
            }
            parsed.push({ addr: allAddrs[i].addr, amount, country });
          }
          // total = unique addresses found (no double counting)
          const trueTotal = allAddrs.length + malformedCount;
          console.log('Parsed:', parsed.length, 'Skipped:', skipped.length, 'Total:', trueTotal, skipped);
          if (parsed.length > 0) {
            setMulti(parsed);
            setFileWarning(skipped.length > 0 ? { total: null, valid: parsed.length, items: skipped } : null);
          } else {
            setMulti([]);
            setFileWarning(null);
            setFileError('Could not find recipient rows in PDF. Try CSV or XLSX instead.');
          }
        } catch (err) {
          console.error('PDF parse error:', err);
          setMulti([]);
          setFileError('Could not read PDF file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split('\n').filter(l => l.trim());
        const parsed = [];
        const skipped = [];
        let csvRowNum = 0;
        for (const line of lines) {
          csvRowNum++;
          const parts = line.split(',').map(p => p.trim().replace(/"/g, ''));
          const addr = parts[0] || '';
          const amount = parts[1] || '';
          const country = parts[2] || '';
          if (!addr.toLowerCase().startsWith('0x')) {
            if (addr || amount) skipped.push({ snippet: addr ? addr.slice(0, 20) : '(empty)', reason: 'Invalid wallet address format', fileRow: csvRowNum });
            continue;
          }
          if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) { skipped.push({ snippet: addr, reason: 'Invalid wallet address format', fileRow: csvRowNum }); continue; }
          const parsedAmt = parseFloat(amount);
          if (!amount || isNaN(parsedAmt) || parsedAmt === 0) { skipped.push({ snippet: addr, reason: 'Missing amount', fileRow: csvRowNum, raw: addr }); continue; }
          if (parsedAmt < 0) { skipped.push({ snippet: addr, reason: `Invalid amount (negative: ${amount})`, fileRow: csvRowNum, raw: addr }); continue; }
          parsed.push({ addr, amount, country });
        }
        if (parsed.length > 0) {
          setMulti(parsed);
          setFileWarning(skipped.length > 0 ? { total: parsed.length + skipped.length, valid: parsed.length, items: skipped } : null);
        } else {
          setMulti([]);
          setFileWarning(null);
          setFileError('No valid rows found in CSV.');
        }
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
        {contacts?.length>0 && (
          <button
            className="ap-btn ap-btn-sec"
            style={{ fontSize: 12, padding: "7px 12px", flexShrink: 0, marginTop: 0, marginLeft: 8 }}
            onClick={() => setShowContactsPicker(true)}
          >
            Choose from Contacts
          </button>
        )}
      </div>

      {showContactsPicker && (
        <div style={{position:'fixed',inset:0,zIndex:999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>{setShowContactsPicker(false);setContactSearch('');setSelectedContactIds(new Set());}}>
          <div style={{background:'var(--card)',borderRadius:16,width:'100%',maxWidth:400,maxHeight:'70vh',display:'flex',flexDirection:'column',boxShadow:'0 24px 60px rgba(0,0,0,0.4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--b0)',flexShrink:0}}>
              <div style={{fontSize:15,fontWeight:800,color:'var(--tx1)',marginBottom:10}}>Choose Contacts</div>
              <input autoFocus placeholder="Search contacts..." onChange={e=>setContactSearch(e.target.value)} value={contactSearch} style={{width:'100%',padding:'8px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{overflowY:'auto',flex:1}}>
              {(contacts||[]).filter(c=>!contactSearch||c.name?.toLowerCase().includes(contactSearch.toLowerCase())||c.address?.toLowerCase().includes(contactSearch.toLowerCase())).length===0
                ? <div style={{padding:20,fontSize:12,color:'var(--tx3)',textAlign:'center'}}>No contacts found</div>
                : (contacts||[]).filter(c=>!contactSearch||c.name?.toLowerCase().includes(contactSearch.toLowerCase())||c.address?.toLowerCase().includes(contactSearch.toLowerCase())).map(c=>{
                  const checked = selectedContactIds.has(c.id);
                  return (
                    <div key={c.id} onClick={()=>toggleContactSelect(c.id)} style={{padding:'10px 16px',cursor:'pointer',borderBottom:'1px solid var(--b0)',display:'flex',alignItems:'center',gap:10,background:checked?'var(--acd)':'transparent'}}>
                      <div style={{width:20,height:20,borderRadius:6,border:checked?'none':'2px solid var(--b1)',background:checked?'var(--ac)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{width:32,height:32,borderRadius:'50%',background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontWeight:700,fontSize:13,color:'var(--ac)'}}>{c.name?.[0]?.toUpperCase()||'?'}</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,color:'var(--tx1)'}}>{c.name}</div>
                        <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace'}}>{c.address.slice(0,6)}...{c.address.slice(-4)}</div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
            <div style={{padding:16,borderTop:'1px solid var(--b0)',display:'flex',gap:10,flexShrink:0}}>
              <button onClick={()=>{setShowContactsPicker(false);setContactSearch('');setSelectedContactIds(new Set());}} style={{flex:1,background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'10px',fontSize:13,color:'var(--tx2)',fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={addSelectedContacts} disabled={selectedContactIds.size===0} className="ap-btn ap-btn-primary" style={{flex:1,marginTop:0}}>Add {selectedContactIds.size>0?selectedContactIds.size:''} Selected</button>
            </div>
          </div>
        </div>
      )}

      {fileError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#ef4444', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span>{fileError}</span>
          <button onClick={() => setFileError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: 0, lineHeight: 1, flexShrink: 0 }}>&times;</button>
        </div>
      )}

      {fileWarning && (
        <div style={{ background: 'var(--card)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 14, marginBottom: 16, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(245,158,11,0.10)', borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                {fileWarning.items.length} row{fileWarning.items.length !== 1 ? 's' : ''} need attention
              </span>
              <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{fileWarning.total != null ? `(${fileWarning.valid} of ${fileWarning.total} imported)` : `(${fileWarning.valid} imported)`}</span>
            </div>
            <button onClick={() => setFileWarning(null)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: 18, fontWeight: 700, padding: 0, lineHeight: 1 }}>&times;</button>
          </div>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 70px', columnGap: 8, padding: '8px 12px', borderBottom: '1px solid var(--b0)', background: 'var(--elev)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Row</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Issue</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Address</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Action</span>
          </div>
          {/* Rows */}
          {fileWarning.items.map((item, i) => {
            const recoverable = /^0x[0-9a-fA-F]{40}$/.test(item.snippet);
            const isLinked = item.linkedIdx !== undefined;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 70px', columnGap: 8, padding: '13px 12px', borderBottom: i < fileWarning.items.length - 1 ? '1px solid var(--b0)' : 'none', alignItems: 'center', background: isLinked ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                {/* Col 1 — position */}
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx3)' }}>
                  {item.fileRow ?? i + 1}
                </span>
                {/* Col 2 — issue */}
                <span style={{ fontSize: 12, color: recoverable ? '#f59e0b' : 'var(--re)', fontWeight: 500, paddingRight: 8 }}>
                  {item.reason}
                </span>
                {/* Col 3 — address */}
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--tx2)' }}>
                  {truncateAddr(item.snippet) || '(empty)'}
                </span>
                {/* Col 4 — action */}
                <div style={{ textAlign: 'right' }}>
                  {recoverable && !isLinked && (
                    <button
                      onClick={() => addAndFocus({ raw: item.snippet, amount: '', country: '' }, i)}
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 7, color: '#f59e0b', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '4px 10px', whiteSpace: 'nowrap' }}
                    >
                      Edit
                    </button>
                  )}
                  {isLinked && (
                    <button
                      onClick={() => {
                        const el = rowRefs.current[item.linkedIdx];
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setHighlightIdx(item.linkedIdx);
                      }}
                      style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, color: '#f59e0b', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '4px 10px', whiteSpace: 'nowrap' }}
                    >
                      Go to row
                    </button>
                  )}
                  {!recoverable && (
                    <span style={{ fontSize: 11, color: 'var(--tx3)' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: 'var(--elev)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: 'var(--tx3)', marginBottom: 14 }}>
        Format required: wallet address, amount, country (optional)
        <br /><br />
        CSV/XLSX and PDF files are allowed
      </div>

      {multi.map((r, i) => (
        <div key={i} ref={el => rowRefs.current[i] = el} style={{ marginBottom: 10, borderRadius: 12, transition: 'box-shadow 0.3s, background 0.3s', boxShadow: highlightIdx === i ? '0 0 0 2px #f59e0b' : 'none', background: highlightIdx === i ? 'rgba(245,158,11,0.06)' : 'transparent', padding: highlightIdx === i ? '8px' : '0' }}>
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
        {loading ? 'Sending...' : fileWarning ? 'Send to Valid Recipients Only' : 'Review and Send All'}
      </button>
    </div>
  );
}
