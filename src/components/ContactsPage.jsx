import React from 'react';
import { ALL_CC, addrColor } from '../config';
import CountrySelect from './CountrySelect';

export default function ContactsPage({
  contacts, setContacts, txns, setTab, setSendTo, setSendCtry, setStatus,
  cName, setCName, cAddr, setCAddr, cCtry, setCCtry,
  cSearch, setCSearch, editId, setEditId,
  showAdd, setShowAdd, manageContacts, setManageContacts,
  selectedContacts, setSelectedContacts
}) {
  return (
    <div>
      <div className="ap-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div>
            <div className="ap-card-title">Contacts ({contacts.length})</div>
            <div style={{fontSize:12,color:'var(--tx3)',marginTop:2}}>Your saved wallet addresses</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            {contacts.length>0&&<button className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'7px 12px',color:manageContacts?'var(--re)':undefined}} onClick={()=>{setManageContacts(m=>!m);setSelectedContacts([]);}}>
              {manageContacts?'Done':'Manage'}
            </button>}
            <button className="ap-btn ap-btn-primary" style={{fontSize:13,padding:'8px 16px',whiteSpace:'nowrap',width:'auto'}} onClick={()=>{setShowAdd(s=>!s);setEditId(null);setCName('');setCAddr('');setCCtry('');}}>
              {showAdd?'Cancel':'+ Add'}
            </button>
          </div>
        </div>
        {showAdd&&(
          <div style={{background:'var(--elev)',borderRadius:12,padding:14,marginBottom:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div>
                <div className="ap-label">Name</div>
                <input className="ap-input" style={{marginBottom:0}} placeholder="Sam" value={cName} onChange={e=>setCName(e.target.value)}/>
              </div>
              <div>
                <div className="ap-label">Country</div>
                <CountrySelect value={cCtry} onChange={v=>setCCtry(v)}/>
              </div>
            </div>
            <div className="ap-label">Wallet Address</div>
            <input className="ap-input" placeholder="0x..." value={cAddr} onChange={e=>setCAddr(e.target.value)} style={{marginBottom:10}}/>
            <button className="ap-btn ap-btn-primary" style={{width:'100%'}} onClick={()=>{
              if(!cName.trim()||cAddr.trim().length!==42){setStatus({type:'error',msg:'Enter a valid name and address'});return;}
              if(editId){setContacts(p=>p.map(c=>c.id===editId?{...c,name:cName.trim(),address:cAddr.trim(),country:cCtry}:c));setEditId(null);}
              else{setContacts(p=>[{id:Date.now(),name:cName.trim(),address:cAddr.trim(),country:cCtry},...p]);}
              setCName('');setCAddr('');setCCtry('');setShowAdd(false);setStatus({type:'success',msg:'Contact saved'});
            }}>{editId?'Update Contact':'Save Contact'}</button>
          </div>
        )}
        {contacts.length>0&&<input value={cSearch} onChange={e=>setCSearch(e.target.value)} placeholder="Search contacts..." style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1px solid var(--b1)',background:'var(--elev)',color:'var(--tx1)',fontSize:13,outline:'none',marginBottom:12,boxSizing:'border-box'}}/>}
        {manageContacts&&(
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:'var(--tx2)',background:'var(--elev)',borderRadius:10,padding:'8px 12px',marginBottom:8}}>Select contacts to delete.</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button onClick={()=>setSelectedContacts(contacts.map(c=>c.id))} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Select All</button>
              <button onClick={()=>setSelectedContacts([])} className="ap-btn ap-btn-sec" style={{fontSize:12,padding:'5px 10px'}}>Deselect All</button>
              {selectedContacts.length>0&&<button onClick={()=>{if(window.confirm('Delete '+selectedContacts.length+' contacts?')){setContacts(p=>p.filter(c=>!selectedContacts.includes(c.id)));setSelectedContacts([]);setManageContacts(false);}}} style={{background:'var(--re)',border:'none',color:'#fff',cursor:'pointer',padding:'5px 12px',fontSize:12,borderRadius:8,fontWeight:600}}>Delete {selectedContacts.length} Selected</button>}
            </div>
          </div>
        )}
        {contacts.filter(ct=>!cSearch||ct.name.toLowerCase().includes(cSearch.toLowerCase())||ct.address.toLowerCase().includes(cSearch.toLowerCase())).map(ct=>(
          <div key={ct.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid var(--b0)'}}>
            {manageContacts
              ?<input type="checkbox" checked={selectedContacts.includes(ct.id)} onChange={e=>setSelectedContacts(p=>e.target.checked?[...p,ct.id]:p.filter(x=>x!==ct.id))} style={{width:18,height:18,flexShrink:0}}/>
              :<div style={{width:44,height:44,borderRadius:14,background:addrColor(ct.address),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#fff',flexShrink:0}}>{ct.name[0].toUpperCase()}</div>
            }
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,color:'var(--tx1)',fontSize:14,display:'flex',alignItems:'center',gap:6}}>
                {ct.country&&<span className="ap-cc">{ALL_CC[ct.country]||'?'}</span>}
                {ct.name}
              </div>
              <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',marginTop:2,overflow:'hidden',textOverflow:'ellipsis'}}>{ct.address}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
              <button className="ap-btn ap-btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>{setSendTo(ct.address);setSendCtry(ct.country);setTab('send');}}>Send</button>
              <button onClick={()=>{setCAddr(ct.address);setCName(ct.name);setCCtry(ct.country||'');setEditId(ct.id);setShowAdd(true);}} style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}}>Edit Contact</button>
            </div>
          </div>
        ))}
      </div>
      {[...new Set(txns.slice(0,20).map(t=>t.recipient).filter(Boolean))].slice(0,5).length>0&&(
        <div className="ap-card">
          <div className="ap-card-title">Recent Recipients</div>
          <div style={{fontSize:12,color:'var(--tx3)',marginBottom:12}}>Quickly save from your recent transactions</div>
          {[...new Set(txns.slice(0,20).map(t=>t.recipient).filter(Boolean))].slice(0,5).map((addr,i)=>{
            const saved=contacts.find(ct=>ct.address.toLowerCase()===addr.toLowerCase());
            return(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--b0)'}}>
                <div style={{width:44,height:44,borderRadius:14,background:addrColor(addr),display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff',fontWeight:700,fontSize:14}}>
                  {saved?saved.name[0].toUpperCase():addr.slice(2,4).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                  {saved?<div style={{fontWeight:700,color:'var(--tx1)',fontSize:14}}>{saved.name}</div>:<div/>}
                  <div style={{fontSize:11,color:'var(--tx3)',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis'}}>{addr.slice(0,10)}...{addr.slice(-6)}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:6,flexShrink:0}}>
                  <button className="ap-btn ap-btn-primary" style={{fontSize:12,padding:'6px 14px'}} onClick={()=>{setSendTo(addr);setTab('send');}}>Send</button>
                  {saved
                    ?<button style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}} onClick={()=>{setCAddr(saved.address);setCName(saved.name);setCCtry(saved.country||'');setEditId(saved.id);setShowAdd(true);}}>Edit Contact</button>
                    :<button style={{background:'none',border:'1px solid var(--b1)',borderRadius:8,padding:'6px 8px',cursor:'pointer',color:'var(--tx2)',fontSize:12,textAlign:'center'}} onClick={()=>{setCAddr(addr);setShowAdd(true);}}>Save Contact</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
