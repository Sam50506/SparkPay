/* eslint-disable no-undef */
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IC } from '../icons';
import { short, fmtDate, fmtTime, lsSave } from '../config';
import { ALL_CC } from '../config';
import { sbInsert } from '../config';

const txBadge = st => ({
  confirmed:'ap-tx-badge ap-tx-confirmed',
  pending:'ap-tx-badge ap-tx-pending',
  failed:'ap-tx-badge ap-tx-failed',
  submitted:'ap-tx-badge ap-tx-submitted'
}[st]||'ap-tx-badge ap-tx-pending');

export default function HistoryPage({
  allTxns, txns, chartData, totalSent,
  dedupedTxns, filtered, totalPages,
  txSearch, setTxSearch, txFilter, setTxFilter,
  txPage, setTxPage,
  manageTxns, setManageTxns,
  selectedTxns, setSelectedTxns,
  expandedTx, setExpandedTx,
  exportCSV, refreshPendingTxns, loadContractHistory,
  address, deletedHashes, setDeletedHashes, setTxns
}) {
  const [showExport, setShowExport] = useState(false);
  const [chartRange, setChartRange] = useState(7);
  const [chartRange, setChartRange] = useState(7);
  const [exportRange, setExportRange] = useState('all');
  const [exportCount, setExportCount] = useState(50);

  const buildLocalChart = (days) => {
    const slots = Array.from({length: days}, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      return { label: days <= 7 ? d.toLocaleDateString('en',{weekday:'short'}) : d.toLocaleDateString('en',{month:'numeric',day:'numeric'}), date: d, sent: 0 };
    });
    allTxns.filter(tx => !tx.received && tx.type !== 'refund' && tx.type !== 'received' && tx.status !== 'cancelled' && tx.status !== 'scheduled').forEach(tx => {
      const ts = Number(tx.timestamp);
      if (!ts || ts < 1000000) return;
      const txDate = new Date(ts * 1000);
      const slot = slots.find(d => d.date.toDateString() === txDate.toDateString());
      if (slot) {
        let n;
        if (typeof tx.amount === 'bigint' || (typeof tx.amount === 'object' && tx.amount !== null)) { try { n = parseFloat(ethers.formatUnits(BigInt(tx.amount.toString()), 18)); } catch { n = 0; } }
        else { n = parseFloat(tx.amount); }
        slot.sent += isNaN(n) ? 0 : n;
      }
    });
    return slots;
  };
  const localChartData = buildLocalChart(chartRange);

  const buildLocalChart = (days) => {
    const slots = Array.from({length:days},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(days-1-i));return{label:days<=7?d.toLocaleDateString('en',{weekday:'short'}):d.toLocaleDateString('en',{month:'numeric',day:'numeric'}),date:d,sent:0};});
    allTxns.filter(tx=>!tx.received&&tx.type!=='refund'&&tx.type!=='received'&&tx.status!=='cancelled'&&tx.status!=='scheduled').forEach(tx=>{const ts=Number(tx.timestamp);if(!ts||ts<1000000)return;const txDate=new Date(ts*1000);const slot=slots.find(d=>d.date.toDateString()===txDate.toDateString());if(slot){let n;if(typeof tx.amount==='bigint'||(typeof tx.amount==='object'&&tx.amount!==null)){try{n=parseFloat(ethers.formatUnits(BigInt(tx.amount.toString()),18));}catch{n=0;}}else{n=parseFloat(tx.amount);}slot.sent+=isNaN(n)?0:n;}});
    return slots;
  };
  const localChartData = buildLocalChart(chartRange);
  const doExport = () => {
    let data = allTxns;
    if (exportRange === 'today') data = allTxns.filter(t => new Date(Number(t.timestamp)*1000).toDateString() === new Date().toDateString());
    else if (exportRange === 'week') { const w = new Date(); w.setDate(w.getDate()-7); data = allTxns.filter(t => new Date(Number(t.timestamp)*1000) >= w); }
    else if (exportRange === 'month') { const m = new Date(); m.setMonth(m.getMonth()-1); data = allTxns.filter(t => new Date(Number(t.timestamp)*1000) >= m); }
    else if (exportRange === 'count') data = allTxns.slice(0, exportCount);
    const rows = [['Type','Hash','Recipient','Amount (USDC)','Country','Date','Status'], ...data.map(t => {
      let amt = t.amount;
      if (typeof amt === 'bigint' || (typeof amt === 'object' && amt !== null)) { try { amt = parseFloat(ethers.formatUnits(BigInt(amt.toString()), 18)); } catch { amt = 0; } }
      return [t.type||'Send', t.hash||'', t.recipient||'', parseFloat(amt||0).toFixed(2), t.country||'', fmtDate(t.timestamp), t.status||''];
    })];
    const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sparkpay-history.csv'; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const fmtAmt = t => parseFloat(
    typeof t.amount === 'bigint' || (typeof t.amount === 'object' && t.amount !== null)
      ? ethers.formatUnits(BigInt(t.amount.toString()), 18)
      : t.amount
  ).toFixed(2);

  const groupedNR = filtered.reduce((acc, t, i) => {
    const d = t.timestamp ? new Date(Number(t.timestamp) * 1000) : new Date();
    let label;
    if (d.toDateString() === today.toDateString()) label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en', {month:'short', day:'numeric', year:'numeric'});
    if (!acc[label]) acc[label] = [];
    acc[label].push({...t, _idx: i});
    return acc;
  }, {});

  const deleteOneTx = (hash) => {
    const updated = txns.filter(x => x.hash !== hash);
    lsSave('arc_txhistory_' + address, updated);
    setTxns(updated);
    const newDeleted = new Set([...deletedHashes, hash]);
    lsSave('arc_deleted_hashes_' + address, [...newDeleted]);
    setDeletedHashes(newDeleted);
    sbInsert('deleted_txns', {wallet_address: address, tx_hash: hash}).catch(() => {});
  };

  const deleteManyTx = (hashes) => {
    const updated = txns.filter(t => !hashes.includes(t.hash));
    lsSave('arc_txhistory_' + address, updated);
    setTxns(updated);
    const newDeleted = new Set([...deletedHashes, ...hashes]);
    lsSave('arc_deleted_hashes_' + address, [...newDeleted]);
    setDeletedHashes(newDeleted);
    hashes.forEach(h => sbInsert('deleted_txns', {wallet_address: address, tx_hash: h}).catch(() => {}));
  };

  return (
    <div>
      {showExport && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowExport(false)}>
          <div style={{background:'var(--card)',borderRadius:16,padding:24,width:'100%',maxWidth:360,boxShadow:'var(--shl)'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:'var(--tx1)',marginBottom:4}}>Export Transactions</div>
            <div style={{fontSize:12,color:'var(--tx3)',marginBottom:20}}>Choose what to include in your CSV export.</div>
            {[['all','All transactions'],['today','Today only'],['week','Last 7 days'],['month','Last 30 days'],['count','Custom count (min. 5)']].map(([val,label])=>(
              <div key={val} onClick={()=>setExportRange(val)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,marginBottom:6,border:`1px solid ${exportRange===val?'var(--ac)':'var(--b1)'}`,background:exportRange===val?'var(--acd)':'var(--elev)',cursor:'pointer'}}>
                <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${exportRange===val?'var(--ac)':'var(--b1)'}`,background:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>{exportRange===val&&<div style={{width:9,height:9,borderRadius:'50%',background:'var(--ac)'}}/>}</div>
                <span style={{fontSize:13,fontWeight:600,color:'var(--tx1)'}}>{label}</span>
              </div>
            ))}
            {exportRange==='count'&&<input className="ap-input" type="number" value={exportCount} onChange={e=>setExportCount(Math.max(1,parseInt(e.target.value)||50))} placeholder="Number of transactions" style={{marginTop:8,marginBottom:0}}/>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button className="ap-btn ap-btn-ghost" style={{flex:1}} onClick={()=>setShowExport(false)}>Cancel</button>
              <button className="ap-btn ap-btn-primary" style={{flex:2,marginTop:0}} onClick={doExport}>Export CSV</button>
            </div>
          </div>
        </div>
      )}
      {allTxns.length > 0 && (
        <div className="ap-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div className="ap-card-title">Transfer Volume</div>
              <div style={{display:'flex',gap:4}}>{[7,14,30].map(r=>(<button key={r} onClick={()=>setChartRange(r)} style={{padding:'4px 10px',borderRadius:8,border:`1px solid ${chartRange===r?'var(--ac)':'var(--b1)'}`,background:chartRange===r?'var(--acd)':'none',color:chartRange===r?'var(--ac)':'var(--tx3)',fontSize:11,fontWeight:700,cursor:'pointer'}}>{r}d</button>))}</div>
            </div>
          <div style={{marginTop:16}}>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={localChartData} margin={{top:8,right:8,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82C4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82C4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b0)"/>
                <XAxis dataKey="label" tick={{fontSize:11,fill:'var(--tx3)'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:'var(--tx3)'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?(v/1000).toFixed(1).replace('.0','')+'k':Math.round(v)} width={35} tickCount={5} allowDecimals={false}/>
                <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--b1)',borderRadius:10,fontSize:13,color:'var(--tx1)'}}/>
                <Area type="monotone" dataKey="sent" stroke="#3B82C4" fill="url(#cg)" strokeWidth={2} name="Sent (USDC)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="ap-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <div className="ap-card-title">Transactions ({filtered.length})</div>
            <div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Total sent: {totalSent.toFixed(2)} USDC</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="ap-btn ap-btn-sec" onClick={()=>setShowExport(true)} style={{fontSize:12,padding:'7px 12px'}}>Export CSV</button>
            <button className="ap-btn ap-btn-sec" onClick={async()=>{await refreshPendingTxns();loadContractHistory();}} style={{fontSize:12,padding:'7px 12px'}}>Refresh</button>
            <button className="ap-btn ap-btn-sec" onClick={()=>setManageTxns(m=>!m)} style={{fontSize:12,padding:'7px 12px',color:manageTxns?'var(--re)':undefined}}>{manageTxns?'Done':'Manage'}</button>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input value={txSearch} onChange={e=>{setTxSearch(e.target.value);setTxPage(1);}} placeholder="Search address or hash..." style={{flex:1,minWidth:0,padding:'8px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none'}}/>
          <select value={txFilter} onChange={e=>{setTxFilter(e.target.value);setTxPage(1);}} style={{padding:'8px 10px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none'}}>
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        {manageTxns && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select transactions to delete. This only removes them from this device.</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>setSelectedTxns(dedupedTxns.map(t=>t.hash))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button>
              <button onClick={()=>setSelectedTxns([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>
              {selectedTxns.length>0&&<button onClick={()=>{if(window.confirm('Delete '+selectedTxns.length+' transactions?')){deleteManyTx(selectedTxns);setSelectedTxns([]);setManageTxns(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Delete {selectedTxns.length} Selected</button>}
            </div>
          </div>
        )}
        {filtered.length===0
          ? <div style={{textAlign:'center',color:'var(--tx3)',padding:'32px 0',fontSize:14}}>No transactions found</div>
          : Object.entries(groupedNR).map(([date,txs])=>(
              <div key={date}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--tx3)',textTransform:'uppercase',letterSpacing:1,padding:'8px 0 4px'}}>{date}</div>
                {txs.map((t,i)=>{
                  const isExp = expandedTx === t._idx;
                  const amt = fmtAmt(t);
                  return(
                    <div key={i}>
                      <div className="ap-hist-row" onClick={()=>{if(!manageTxns)setExpandedTx(isExp?null:t._idx);}} style={{cursor:'pointer'}}>
                        <div className="ap-hist-icon">
                          {manageTxns
                            ? <input type="checkbox" checked={!!(selectedTxns||[]).includes(t.hash)} onChange={e=>{e.stopPropagation();setSelectedTxns(prev=>e.target.checked?[...(Array.isArray(prev)?prev:[]),t.hash]:(Array.isArray(prev)?prev:[]).filter(h=>h!==t.hash));}} style={{width:18,height:18,cursor:'pointer'}} onClick={e=>e.stopPropagation()}/>
                            : <IC.Send received={t.received}/>
                          }
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                            {!t.isBatch&&t.country&&<span className="ap-cc">{ALL_CC[t.country]||'?'}</span>}
                            {t.type==='scheduled'?'Scheduled Payment':t.type==='received'?'Received':t.type==='invoice'?'Invoice Payment':t.type==='refund'?'Refund':t.isBatch?'Batch Send ('+t.batchTxns.length+' recipients)':(t.country||'Transfer')}
                            <span className={txBadge(t.status)}>{t.status||'pending'}</span>
                            {t.isBatch&&<span style={{fontSize:11,padding:'2px 8px',borderRadius:999,background:'rgba(59,130,196,.15)',color:'var(--ac)',fontWeight:600}}>Batch</span>}
                          </div>
                          <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:3,overflow:'hidden',textOverflow:'ellipsis'}}>{short(t.recipient)}</div>
                        </div>
                        <div style={{textAlign:'right',flexShrink:0}}>
                          <div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{amt} USDC</div>
                          <div style={{fontSize:11,color:'var(--tx3)',marginTop:3}}>{fmtDate(t.timestamp)}{t.type!=='refund'&&t.timestamp?' '+fmtTime(t.timestamp):''}</div>
                        </div>
                      </div>
                      {isExp&&(
                        <div style={{background:'var(--elev)',borderRadius:10,padding:'10px 14px',marginBottom:8,fontSize:12,color:'var(--tx2)'}}>
                          {t.isBatch
                            ? <div style={{marginBottom:6}}>
                                <span style={{color:'var(--tx3)',fontWeight:600,display:'block',marginBottom:4}}>Recipients:</span>
                                {t.batchTxns.map((bt,bi)=>(
                                  <div key={bi} style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:8,alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--b0)'}}>
                                    <span style={{fontFamily:'monospace',fontSize:11,color:'var(--tx1)',overflow:'hidden',textOverflow:'ellipsis'}}>{short(bt.recipient)}</span>
                                    <span style={{fontSize:11,color:'var(--tx2)'}}>{bt.country||'—'}</span>
                                    <span style={{fontWeight:600,fontSize:11,textAlign:'right'}}>{parseFloat(bt.amount).toFixed(2)} USDC</span>
                                  </div>
                                ))}
                              </div>
                            : <div style={{marginBottom:6}}><span style={{color:'var(--tx3)'}}>To: </span><span style={{fontFamily:'monospace',wordBreak:'break-all'}}>{t.recipient}</span></div>
                          }
                          {t.hash&&!t.hash.startsWith('0xdemo')&&<div style={{marginBottom:6}}><span style={{color:'var(--tx3)'}}>Hash: </span><span style={{fontFamily:'monospace',wordBreak:'break-all'}}>{t.hash}</span></div>}
                          <div style={{display:'flex',gap:8,marginTop:8}}>
                            {t.hash&&!t.hash.startsWith('0xdemo')&&<a href={'https://testnet.arcscan.app/tx/'+t.hash} target="_blank" rel="noreferrer" className="ap-btn ap-btn-sec" style={{fontSize:11,padding:'5px 10px'}}>View on Explorer</a>}
                            {manageTxns&&<button onClick={e=>{e.stopPropagation();if(window.confirm('Delete this transaction?')){deleteOneTx(t.hash);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 10px',fontSize:11,borderRadius:8,fontWeight:600}}>Delete</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
        }
        {totalPages>1&&(
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,marginTop:12}}>
            <button onClick={()=>setTxPage(1)} disabled={txPage===1} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>«</button>
            <button onClick={()=>setTxPage(p=>Math.max(1,p-1))} disabled={txPage===1} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>Prev</button>
            <span style={{fontSize:12,color:'var(--tx3)'}}>{txPage} / {totalPages}</span>
            <button onClick={()=>setTxPage(p=>Math.min(totalPages,p+1))} disabled={txPage===totalPages} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'6px 12px'}}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
