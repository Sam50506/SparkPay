import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const _f = document.createElement('link');
_f.rel = 'stylesheet';
_f.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
document.head.appendChild(_f);

// ─── Wait for MetaMask to be ready (fixes Mises browser conflict) ─────────────
function getProvider() {
  return new Promise((resolve) => {
    // If ethereum already exists and has MetaMask
    if (window.ethereum) {
      if (window.ethereum.providers?.length) {
        const mm = window.ethereum.providers.find(p => p.isMetaMask);
        if (mm) return resolve(mm);
      }
      if (window.ethereum.isMetaMask) return resolve(window.ethereum);
      return resolve(window.ethereum);
    }
    // Wait for ethereum to be injected (up to 3 seconds)
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.ethereum) {
        clearInterval(interval);
        if (window.ethereum.providers?.length) {
          const mm = window.ethereum.providers.find(p => p.isMetaMask);
          return resolve(mm || window.ethereum.providers[0]);
        }
        return resolve(window.ethereum);
      }
      if (attempts > 30) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ARC_CHAIN_ID     = 5042002;
const ARC_CHAIN_HEX    = '0x4CEF52';
const ARC_RPC          = 'https://bitter-bitter-spring.arc-testnet.quiknode.pro/f2ba4c49b3dfe5b37f32f3404c666f3f596bd43c/';
const REMIT_ADDR       = '0x91F07CE441cD7c39C4c43EB86A7ABd6F9cc48F44'; // v2 deployed 2026-05-25
const USDC_ADDR        = '0x3600000000000000000000000000000000000000';
const WC_ID            = '8bb24a433758c9a403057e2e3f2c371b';
const SB_URL           = 'https://iwxwcyuabtasghfmqrpi.supabase.co';
const SB_KEY           = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eHdjeXVhYnRhc2doZm1xcnBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDcyMzAsImV4cCI6MjA5NTI4MzIzMH0.fFTTD8BNGfcnHV8H3jZuZ4nnyUe_pypjoQYyx6HAKL8';

// Supabase helpers
const sbFetch = async (path, opts={}) => {
  const r = await fetch(SB_URL + path, {
    ...opts,
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts.headers||{}) }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const sbInsert = (table, data) => sbFetch('/rest/v1/' + table, { method:'POST', body: JSON.stringify(data) });
const sbSelect = (table, query) => sbFetch('/rest/v1/' + table + '?' + query);
const sbUpdate = (table, query, data) => sbFetch('/rest/v1/' + table + '?' + query, { method:'PATCH', body: JSON.stringify(data) });

const COUNTRIES = ['Pakistan','Nigeria','India','Philippines','Bangladesh','Mexico','Brazil','Indonesia','Vietnam','Ghana','Kenya','Egypt','Turkey','Argentina','Colombia','Ukraine','Ethiopia','Tanzania','Uganda','Nepal'];
const FLAG = {Pakistan:'🇵🇰',Nigeria:'🇳🇬',India:'🇮🇳',Philippines:'🇵🇭',Bangladesh:'🇧🇩',Mexico:'🇲🇽',Brazil:'🇧🇷',Indonesia:'🇮🇩',Vietnam:'🇻🇳',Ghana:'🇬🇭',Kenya:'🇰🇪',Egypt:'🇪🇬',Turkey:'🇹🇷',Argentina:'🇦🇷',Colombia:'🇨🇴',Ukraine:'🇺🇦',Ethiopia:'🇪🇹',Tanzania:'🇹🇿',Uganda:'🇺🇬',Nepal:'🇳🇵'};
const CURRENCY = {Pakistan:'PKR',Nigeria:'NGN',India:'INR',Philippines:'PHP',Bangladesh:'BDT',Mexico:'MXN',Brazil:'BRL',Indonesia:'IDR',Vietnam:'VND',Ghana:'GHS',Kenya:'KES',Egypt:'EGP',Turkey:'TRY',Argentina:'ARS',Colombia:'COP',Ukraine:'UAH',Ethiopia:'ETB',Tanzania:'TZS',Uganda:'UGX',Nepal:'NPR'};

// ─── ABIs ─────────────────────────────────────────────────────────────────────
const REMIT_ABI = [
  {inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}],name:'createInvoice',outputs:[{name:'',type:'bytes32'}],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}],name:'payInvoice',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}],name:'sendMoney',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getPayments',outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'},{name:'invoiceId',type:'bytes32'}],name:'',type:'tuple[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getUserInvoices',outputs:[{name:'',type:'bytes32[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'bytes32'}],name:'invoices',outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'createdAt',type:'uint256'},{name:'nonce',type:'uint256'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'address'}],name:'nonces',outputs:[{name:'',type:'uint256'}],stateMutability:'view',type:'function'}
];
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function transfer(address,uint256) returns (bool)',
  'function decimals() view returns (uint8)'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const short   = a => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '';
const fmtUsdc = v => v !== undefined && v !== null ? parseFloat(ethers.formatUnits(BigInt(v.toString()), 6)).toFixed(2) : '0.00';
const fmtDate = ts => ts ? new Date(Number(ts)*1000).toLocaleDateString('en',{month:'short',day:'numeric'}) : '';
const ls   = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const lsSave = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };

// ─── Arc-specific: poll for receipt instead of tx.wait() ─────────────────────
async function awaitReceipt(provider, hash, ms=45000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await provider.getTransactionReceipt(hash);
      if (r) return r;
    } catch(_) {}
    await new Promise(res => setTimeout(res, 1500));
  }
  return null; // timed out but tx still lives on-chain
}

// ─── Analytics helper ─────────────────────────────────────────────────────────
function buildChart(txns) {
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    return { label: d.toLocaleDateString('en',{weekday:'short'}), sent: 0 };
  });
  txns.forEach(tx => {
    const label = new Date(Number(tx.timestamp)*1000).toLocaleDateString('en',{weekday:'short'});
    const slot  = days.find(d => d.label === label);
    if (slot) {
      const n = typeof tx.amount === 'string' || typeof tx.amount === 'number'
        ? parseFloat(tx.amount) : parseFloat(fmtUsdc(tx.amount));
      slot.sent += isNaN(n) ? 0 : n;
    }
  });
  return days;
}

// ─── Wallet picker ────────────────────────────────────────────────────────────
function WalletPicker({ onPick, onClose, dm }) {
  const eth = window.ethereum;
  const options = [];
  if (eth) {
    const providers = eth.providers?.length ? eth.providers : [eth];
    providers.forEach((p,i) => {
      let label = '🌐 Browser Wallet', type = 'p_'+i;
      if (p.isMetaMask && !p.isBraveWallet) label = '🦊 MetaMask';
      else if (p.isBraveWallet)  label = '🦁 Brave Wallet';
      else if (p.isCoinbaseWallet) label = '🔵 Coinbase Wallet';
      else if (p.isRabby)  label = '👛 Rabby';
      else if (p.isTrust)  label = '💙 Trust Wallet';
      options.push({ type, label, p });
    });
  }
  options.push({ type:'wc', label:'📱 WalletConnect' });
  const bg = dm ? '#1e293b' : '#fff';
  const br = dm ? '#334155' : '#e2e8f0';
  const tc = dm ? '#f1f5f9' : '#0f172a';
  return (
    <div style={{background:bg,border:`1px solid ${br}`,borderRadius:16,padding:20,display:'flex',flexDirection:'column',gap:10,boxShadow:'0 8px 40px rgba(0,0,0,0.15)'}}>
      <div style={{fontSize:15,fontWeight:700,color:tc,fontFamily:'"Bricolage Grotesque",sans-serif'}}>Choose your wallet</div>
      {options.map((o,i) => (
        <button key={i} onClick={() => onPick(o.type, o.p)}
          style={{display:'flex',alignItems:'center',gap:12,background:dm?'#0f172a':'#f8faff',border:`1px solid ${br}`,borderRadius:12,padding:'13px 16px',cursor:'pointer',fontSize:14,fontWeight:600,color:tc,width:'100%',textAlign:'left'}}>
          {o.label}
        </button>
      ))}
      <button onClick={onClose} style={{fontSize:13,color:'#94a3b8',background:'none',border:'none',cursor:'pointer',marginTop:4}}>← Back</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
console.log('ArcPay v2 | Contract:', '0x91F07CE441cD7c39C4c43EB86A7ABd6F9cc48F44');
export default function App() {
  // wallet
  const [provider,  setProvider]  = useState(null);
  const [signer,    setSigner]    = useState(null);
  const [address,   setAddress]   = useState('');
  const [balance,   setBalance]   = useState('0.00');
  const [walletName,setWalletName]= useState('');
  const [wcProv,    setWcProv]    = useState(null);
  const [showPicker,setShowPicker]= useState(false);
  // ui
  const [tab,    setTab]    = useState('send');
  const [status, setStatus] = useState(null);  // {type,msg}
  const [loading,setLoading]= useState(false);
  const [dm,     setDm]     = useState(() => ls('arc_dm',false));
  // rates
  const [rates,  setRates]  = useState({});
  // send
  const [sendTo,  setSendTo]  = useState('');
  const [sendAmt, setSendAmt] = useState('');
  const [sendCtry,setSendCtry]= useState(() => ls('arc_ctry',''));
  // multi-send
  const [multi, setMulti] = useState([{addr:'',amount:'',country:'Pakistan'}]);
  // invoice
  const [invPayer,setInvPayer] = useState('');
  const [invAmt,  setInvAmt]   = useState('');
  const [invDesc, setInvDesc]  = useState('');
  const [invCtry, setInvCtry]  = useState('Pakistan');
  const [invId,   setInvId]    = useState('');
  // pay
  const [payId,  setPayId]  = useState('');
  const [payDet, setPayDet] = useState(null);
  // history (localStorage + contract)
  const [txns,   setTxns]   = useState(() => ls('arc_txhistory',[]));
  const [contractTxns, setContractTxns] = useState([]);
  // contacts
  const [contacts, setContacts] = useState(() => ls('arc_contacts',[]));
  const [cName,setCName] = useState(''); const [cAddr,setCAddr] = useState(''); const [cCtry,setCCtry] = useState('Pakistan');
  // scheduled
  const [scheds,  setScheds]  = useState(() => ls('arc_scheds',[]));
  const [newSched,setNewSched]= useState({addr:'',amount:'',country:'Pakistan',freq:'weekly',next:''});
  // settings
  const [defCtry, setDefCtry] = useState(() => ls('arc_ctry',''));

  // persist
  useEffect(() => lsSave('arc_contacts', contacts),  [contacts]);
  useEffect(() => lsSave('arc_scheds',   scheds),    [scheds]);
  useEffect(() => lsSave('arc_txhistory',txns),      [txns]);
  useEffect(() => lsSave('arc_dm',       dm),        [dm]);
  useEffect(() => lsSave('arc_ctry',     defCtry),   [defCtry]);

  // Handle incoming invoice link (?inv=base64data)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invParam = params.get('inv');
    if (invParam) {
      try {
        const inv = JSON.parse(atob(invParam));
        // Save to localStorage so payer can pay it
        const saved = ls('arc_invoices',[]);
        if (!saved.find(i=>i.id===inv.id)) {
          lsSave('arc_invoices',[inv,...saved]);
        }
        setPayId(inv.id);
        setTab('pay');
        setStatus({type:'info',msg:`Invoice from ${short(inv.creator)}: ${inv.amount} USDC for "${inv.desc}"`});
      } catch {}
    }
  }, []);

  // rates
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r=>r.json()).then(d=>setRates(d.rates||{}))
      .catch(()=>setRates({PKR:279,NGN:1371,INR:96.7,PHP:61.8,BDT:122.8,MXN:17.4,BRL:5.03,IDR:17713,VND:26222,GHS:11.5,KES:129,EGP:53.1,TRY:45.6,ARS:1399,COP:3795,UAH:44.2,ETB:155.9,TZS:2572,UGX:3734,NPR:154.6}));
  },[]);

  // account listener
  useEffect(() => {
    if (!window.ethereum) return;
    const onAcc = a => { if (!a.length) doDisconnect(); else setAddress(a[0]); };
    const onChain = () => window.location.reload();
    window.ethereum.on('accountsChanged', onAcc);
    window.ethereum.on('chainChanged', onChain);
    return () => { window.ethereum.removeListener('accountsChanged',onAcc); window.ethereum.removeListener('chainChanged',onChain); };
  }, []);

  // load contract history when tab opens
  useEffect(() => {
    if (tab === 'history' && signer) loadContractHistory();
  }, [tab, signer]);

  useEffect(() => { if (signer && address) refreshBal(); }, [signer, address]);

  // ── wallet helpers ──────────────────────────────────────────────────────────
  const addArc = params => ({
    chainId: ARC_CHAIN_HEX, chainName: 'Arc Testnet',
    nativeCurrency: {name:'USDC',symbol:'USDC',decimals:18},
    rpcUrls: [ARC_RPC], blockExplorerUrls: ['https://testnet.arcscan.app'],
    ...params
  });

  const ensureArc = async (eth) => {
    try { await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]}); }
    catch(e) { if(e.code===4902) await eth.request({method:'wallet_addEthereumChain',params:[addArc({})]}); else throw e; }
  };

  const finaliseConnect = async (bp, eth) => {
    bp.pollingInterval = 800;
    const s    = await bp.getSigner();
    const addr = await s.getAddress();
    setProvider(bp); setSigner(s); setAddress(addr);
    setStatus({type:'success',msg:`Connected: ${short(addr)}`});
  };

  const connectBrowser = async (type, provObj) => {
    try {
      // Use passed provider or detect automatically
      // getProvider() handles Mises browser conflict by waiting for MetaMask
      const eth = provObj || await getProvider();
      if (!eth) { setStatus({type:'error',msg:'No wallet found. Install MetaMask.'}); return; }
      await eth.request({method:'eth_requestAccounts'});
      const bp = new ethers.BrowserProvider(eth, {name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      await ensureArc(eth);
      let name = '🌐 Browser Wallet';
      if (eth.isMetaMask && !eth.isBraveWallet) name = '🦊 MetaMask';
      else if (eth.isBraveWallet) name = '🦁 Brave';
      else if (eth.isCoinbaseWallet) name = '🔵 Coinbase';
      setWalletName(name);
      await finaliseConnect(bp, eth);
    } catch(e) { setStatus({type:'error',msg:e.message||'Connection failed'}); }
  };

  const connectWC = async () => {
    try {
      const wcp = await EthereumProvider.init({
        projectId:WC_ID, chains:[ARC_CHAIN_ID], showQrModal:true,
        methods:['eth_sendTransaction','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'],
        events:['chainChanged','accountsChanged'],
      });
      await wcp.enable();
      wcp.on('accountsChanged', a => { if(!a.length) doDisconnect(); else setAddress(a[0]); });
      wcp.on('disconnect', doDisconnect);
      try { await wcp.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]}); }
      catch(e){ if(e.code===4902) await wcp.request({method:'wallet_addEthereumChain',params:[addArc({})]}); }
      const bp = new ethers.BrowserProvider(wcp, {name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      setWcProv(wcp); setWalletName('📱 WalletConnect');
      await finaliseConnect(bp, wcp);
    } catch(e) { setStatus({type:'error',msg:e.message||'WalletConnect failed'}); }
  };

  const doDisconnect = useCallback(() => {
    if (wcProv) wcProv.disconnect();
    setProvider(null); setSigner(null); setAddress(''); setWalletName(''); setWcProv(null);
    setStatus(null); setBalance('0.00');
  }, [wcProv]);

  const refreshBal = async () => {
    if (!provider || !address) return;
    try {
      // Use native balance (Arc USDC = native token, 18 decimals)
      const b = await provider.getBalance(address);
      setBalance(parseFloat(ethers.formatUnits(b,18)).toFixed(2));
    } catch {
      try {
        const c = new ethers.Contract(USDC_ADDR,ERC20_ABI,provider);
        const b = await c.balanceOf(address);
        setBalance(fmtUsdc(b));
      } catch {}
    }
  };

  const getC = () => ({
    remit: new ethers.Contract(REMIT_ADDR, REMIT_ABI, signer),
    usdc:  new ethers.Contract(USDC_ADDR,  ERC20_ABI, signer),
  });

  // ── SEND ──────────────────────────────────────────────────────────────────
  // Arc USDC is the NATIVE token. Transfer it like ETH: signer.sendTransaction({value})
  // Using 18 decimals (native precision). This is the ONLY reliable way from browser wallets.
  const handleSend = async () => {
    if (!signer||!sendTo||!sendAmt) { setStatus({type:'error',msg:'Fill all fields'}); return; }
    if (!ethers.isAddress(sendTo))  { setStatus({type:'error',msg:'Invalid address'}); return; }
    const sendToNorm = ethers.getAddress(sendTo.trim().toLowerCase());
    const amt = parseFloat(sendAmt);
    if (isNaN(amt)||amt<=0)         { setStatus({type:'error',msg:'Invalid amount'}); return; }
    setLoading(true); setStatus({type:'info',msg:'Sending USDC…'});
    try {
      const value = ethers.parseUnits(sendAmt, 18); // native = 18 dec
      const tx = await signer.sendTransaction({ to: sendToNorm, value, gasLimit: 21000, gasPrice: ethers.parseUnits("50","gwei") });
      // Save to history immediately — don't wait for receipt
      const rec = { hash:tx.hash, recipient:sendToNorm, amount:amt, country:sendCtry, timestamp:Math.floor(Date.now()/1000), status:'pending' };
      setTxns(prev => { const u=[rec,...prev.slice(0,499)]; lsSave('arc_txhistory',u); return u; });
      setStatus({type:'success',msg:`✓ Sent ${sendAmt} USDC → ${short(sendTo)}`});
      setSendTo(''); setSendAmt('');
      setTimeout(refreshBal, 6000);
    } catch(e) { setStatus({type:'error',msg:e.reason||e.message||'Failed'}); }
    finally { setLoading(false); }
  };

  // ── MULTI-SEND ─────────────────────────────────────────────────────────────
  const handleMulti = async () => {
    const valid = multi.filter(r => ethers.isAddress(r.addr) && parseFloat(r.amount)>0);
    if (!signer||!valid.length) { setStatus({type:'error',msg:'Add valid recipients'}); return; }
    setLoading(true);
    try {
      for (const r of valid) {
        setStatus({type:'info',msg:`Sending to ${short(r.addr)}…`});
        const value = ethers.parseUnits(r.amount, 18);
        const tx = await signer.sendTransaction({ to: r.addr, value, gasLimit: 21000, gasPrice: ethers.parseUnits("50","gwei") });
        const rec = { hash:tx.hash, recipient:r.addr, amount:parseFloat(r.amount), country:r.country, timestamp:Math.floor(Date.now()/1000), status:'pending' };
        setTxns(prev => { const u=[rec,...prev.slice(0,499)]; lsSave('arc_txhistory',u); return u; });
      }
      setStatus({type:'success',msg:`✓ Sent to ${valid.length} recipients`});
      setMulti([{addr:'',amount:'',country:'Pakistan'}]);
      setTimeout(refreshBal, 6000);
    } catch(e) { setStatus({type:'error',msg:e.reason||e.message||'Failed'}); }
    finally { setLoading(false); }
  };

  // ── INVOICE ────────────────────────────────────────────────────────────────
  const handleCreateInv = async () => {
    if (!address||!invPayer||!invAmt||!invDesc) { setStatus({type:'error',msg:'Fill all fields and connect wallet'}); return; }
    setLoading(true); setStatus({type:'info',msg:'Creating invoice…'});
    try {
      const id = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2,'0')).join('');
      const invoice = {
        id,
        creator: address,
        payer: invPayer.trim(),
        amount: invAmt,
        description: invDesc,
        country: invCtry,
        paid: false
      };
      // Save to Supabase — works across all devices
      await sbInsert('invoices', invoice);
      // Also save locally as cache
      const saved = ls('arc_invoices',[]);
      lsSave('arc_invoices',[{...invoice,desc:invDesc,ts:Math.floor(Date.now()/1000)},...saved.slice(0,99)]);
      setInvId(id);
      setStatus({type:'success',msg:'✓ Invoice created! Share this ID with your client — they can pay from any device.'});
      setInvPayer(''); setInvAmt(''); setInvDesc('');
    } catch(e) {
      setStatus({type:'error',msg:'Failed to create invoice: ' + e.message});
    }
    finally { setLoading(false); }
  };

  // ── PAY INVOICE ────────────────────────────────────────────────────────────
  const handlePayInv = async () => {
    if (!signer||!payId) { setStatus({type:'error',msg:'Enter invoice ID'}); return; }
    const id = payId.trim();
    setLoading(true); setStatus({type:'info',msg:'Looking up invoice…'});
    try {
      // Fetch invoice from Supabase
      const rows = await sbSelect('invoices', `id=eq.${id}&select=*`);
      if (!rows || rows.length === 0) { setStatus({type:'error',msg:'Invoice not found.'}); setLoading(false); return; }
      const inv = rows[0];
      if (inv.paid) { setStatus({type:'error',msg:'This invoice has already been paid.'}); setLoading(false); return; }
      setPayDet({creator:inv.creator, amount:ethers.parseUnits(inv.amount,6), description:inv.description, country:inv.country});
      setStatus({type:'info',msg:`Invoice found: ${inv.amount} USDC for "${inv.description}". Sending payment…`});
      // Pay via direct native USDC transfer
      const value = ethers.parseUnits(inv.amount, 18);
      const tx = await signer.sendTransaction({
        to: inv.creator,
        value,
        gasLimit: 21000,
        gasPrice: ethers.parseUnits('50','gwei')
      });
      // Mark as paid in Supabase
      await sbUpdate('invoices', `id=eq.${id}`, { paid: true, paid_by: address, paid_tx: tx.hash });
      // Save to tx history
      const rec = {hash:tx.hash, recipient:inv.creator, amount:inv.amount, country:inv.country, timestamp:Math.floor(Date.now()/1000), status:'submitted'};
      setTxns(prev => { const u=[rec,...prev.slice(0,499)]; lsSave('arc_txhistory',u); return u; });
      setStatus({type:'success',msg:`✓ Paid ${inv.amount} USDC! TX: ${tx.hash.slice(0,10)}…`});
      setPayId(''); setPayDet(null);
      setTimeout(refreshBal, 5000);
    } catch(e) { setStatus({type:'error',msg:e.reason||e.message||'Failed'}); }
    finally { setLoading(false); }
  };

  // ── HISTORY ────────────────────────────────────────────────────────────────
  const loadContractHistory = async () => {
    try {
      const {remit} = getC();
      const p = await remit.getPayments(address);
      setContractTxns([...p].reverse());
    } catch {}
  };

  // merge local + contract history, dedup by hash
  const allTxns = [
    ...txns,
    ...contractTxns.filter(c => !txns.find(l => l.hash === c.transactionHash))
  ];
  const chartData = buildChart(allTxns);
  const totalSent = txns.reduce((s,t) => s+(parseFloat(t.amount)||0), 0);

  // ── STYLES ─────────────────────────────────────────────────────────────────
  const bg   = dm ? '#0d1117' : '#f8faff';
  const bg2  = dm ? '#161b27' : '#fff';
  const bg3  = dm ? '#1e293b' : '#f1f5f9';
  const bdr  = dm ? '#30363d' : '#e2e8f0';
  const txt  = dm ? '#e6edf3' : '#0f172a';
  const txt2 = dm ? '#8b949e' : '#64748b';
  const grid = dm ? '#1e293b' : '#e2e8f0';
  const acc  = '#6d28d9';

  const S = {
    root:  {minHeight:'100vh',background:bg,fontFamily:'"Plus Jakarta Sans",sans-serif',color:txt,backgroundImage:`linear-gradient(${grid} 1px,transparent 1px),linear-gradient(90deg,${grid} 1px,transparent 1px)`,backgroundSize:'48px 48px'},
    nav:   {position:'sticky',top:0,zIndex:100,background:dm?'rgba(13,17,23,0.95)':'rgba(248,250,255,0.95)',backdropFilter:'blur(12px)',borderBottom:`1px solid ${bdr}`,padding:'0 20px'},
    navi:  {maxWidth:960,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:58},
    logo:  {fontSize:19,fontWeight:800,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt,letterSpacing:'-0.3px'},
    pill:  {background:bg2,border:`1px solid ${bdr}`,borderRadius:999,padding:'6px 14px',fontSize:13,fontWeight:600,color:txt},
    discB: {background:'#fef2f2',border:'1px solid #fecaca',borderRadius:999,padding:'6px 14px',fontSize:12,fontWeight:700,color:'#dc2626',cursor:'pointer'},
    wrap:  {maxWidth:960,margin:'0 auto',padding:'28px 20px'},
    card:  {background:bg2,border:`1px solid ${bdr}`,borderRadius:16,padding:24,marginBottom:16},
    cTitle:{fontSize:17,fontWeight:700,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt,marginBottom:4},
    cSub:  {fontSize:14,color:txt2,marginBottom:20},
    lbl:   {display:'block',fontSize:11,fontWeight:700,color:txt2,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:6},
    inp:   {width:'100%',padding:'11px 14px',borderRadius:10,border:`1.5px solid ${bdr}`,fontSize:14,color:txt,background:dm?'#0d1117':bg,boxSizing:'border-box',marginBottom:14,fontFamily:'inherit',outline:'none'},
    sel:   {width:'100%',padding:'11px 14px',borderRadius:10,border:`1.5px solid ${bdr}`,fontSize:14,color:txt,background:dm?'#0d1117':bg,boxSizing:'border-box',marginBottom:14,fontFamily:'inherit'},
    btnP:  {width:'100%',padding:'13px',borderRadius:12,border:'none',background:acc,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginTop:4},
    btnS:  {padding:'9px 16px',borderRadius:10,border:`1.5px solid ${bdr}`,background:bg2,color:txt,fontSize:13,fontWeight:600,cursor:'pointer'},
    btnD:  {padding:'8px 12px',borderRadius:8,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:600,cursor:'pointer'},
    btnG:  {width:'100%',padding:'10px',borderRadius:10,border:`1.5px dashed ${bdr}`,background:'transparent',color:txt2,fontSize:13,cursor:'pointer',marginTop:4},
    tabBar:{display:'flex',gap:6,overflowX:'auto',marginBottom:24,paddingBottom:2},
    tab:   (a) => ({display:'flex',alignItems:'center',gap:5,padding:'8px 14px',borderRadius:10,border:a?'none':`1px solid ${bdr}`,cursor:'pointer',fontSize:13,fontWeight:600,whiteSpace:'nowrap',background:a?acc:bg2,color:a?'#fff':txt2}),
    stats: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20},
    stat:  {background:bg2,border:`1px solid ${bdr}`,borderRadius:14,padding:'16px 20px'},
    sVal:  {fontSize:24,fontWeight:900,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt,letterSpacing:'-1px'},
    sLbl:  {fontSize:11,fontWeight:700,color:txt2,letterSpacing:'0.08em',textTransform:'uppercase',marginTop:4},
    convB: {background:dm?'#1a1f35':'#faf5ff',border:`1px solid ${dm?'#3d2c8d':'#e9d5ff'}`,borderRadius:12,padding:'14px 16px',marginBottom:14},
    hRow:  {display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:`1px solid ${bdr}`},
    hIcon: {width:38,height:38,borderRadius:12,background:'#fef2f2',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0},
    invB:  {background:bg3,border:`1px solid ${bdr}`,borderRadius:10,padding:14,fontFamily:'monospace',fontSize:12,wordBreak:'break-all',marginTop:12,color:txt},
    table: {width:'100%',borderCollapse:'collapse',fontSize:14},
    th:    {background:bg3,padding:'11px 14px',textAlign:'left',fontWeight:700,fontSize:12,color:txt2,letterSpacing:'0.05em',textTransform:'uppercase',borderBottom:`1px solid ${bdr}`},
    td:    {padding:'12px 14px',borderBottom:`1px solid ${bdr}`,color:txt},
    tog:   {width:50,height:27,borderRadius:999,background:dm?acc:'#e2e8f0',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0,border:'none'},
    togKnob:{position:'absolute',top:3,left:dm?25:3,width:21,height:21,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'},
  };

  const tabs = [
    {id:'send',label:'Send',icon:'↑'},
    {id:'multi',label:'Multi-Send',icon:'⇈'},
    {id:'invoice',label:'Invoice',icon:'◻'},
    {id:'pay',label:'Pay',icon:'$'},
    {id:'contacts',label:'Contacts',icon:'◑'},
    {id:'schedule',label:'Scheduled',icon:'⊙'},
    {id:'history',label:'History',icon:'↺'},
    {id:'rates',label:'Rates',icon:'⟲'},
    {id:'fees',label:'Compare',icon:'≈'},
    {id:'settings',label:'Settings',icon:'⚙'},
  ];

  const converted = () => {
    if (!sendAmt||!sendCtry) return null;
    const r = rates[CURRENCY[sendCtry]];
    if (!r) return null;
    return (parseFloat(sendAmt)*r).toLocaleString('en',{maximumFractionDigits:0});
  };

  const Toast = ({s}) => {
    if (!s) return null;
    const colors = {success:{bg:'#f0fdf4',c:'#166534',b:'#bbf7d0'},error:{bg:'#fef2f2',c:'#991b1b',b:'#fecaca'},warning:{bg:'#fffbeb',c:'#92400e',b:'#fde68a'},info:{bg:'#eff6ff',c:'#1e40af',b:'#bfdbfe'}};
    const cs = colors[s.type]||colors.info;
    return <div style={{padding:'12px 16px',borderRadius:12,marginBottom:20,fontSize:14,fontWeight:500,background:cs.bg,color:cs.c,border:`1px solid ${cs.b}`}}>{s.msg}</div>;
  };

  // ─── LANDING ───────────────────────────────────────────────────────────────
  if (!address) return (
    <div style={{...S.root,display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:24,textAlign:'center'}}>
      <div style={{maxWidth:420,width:'100%'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:dm?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.8)',border:`1px solid ${bdr}`,borderRadius:999,padding:'6px 16px',marginBottom:36,backdropFilter:'blur(4px)'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:acc,display:'inline-block'}}/>
          <span style={{fontSize:12,fontWeight:700,color:acc,letterSpacing:'0.1em'}}>ARC TESTNET · LIVE</span>
        </div>
        <h1 style={{fontSize:'clamp(36px,9vw,56px)',fontWeight:800,fontFamily:'"Bricolage Grotesque",sans-serif',lineHeight:1.08,margin:'0 0 20px',color:txt,letterSpacing:'-1.5px'}}>
          Send Money<br/><span style={{color:acc}}>Globally.</span><br/>Instantly.
        </h1>
        <p style={{fontSize:16,color:txt2,margin:'0 0 40px',lineHeight:1.6}}>Transfer USDC across borders in under a second.<br/>Zero hidden fees. Fully on-chain.</p>
        <div style={{display:'flex',gap:0,marginBottom:40,border:`1px solid ${bdr}`,borderRadius:14,overflow:'hidden',background:bg2}}>
          {[['~$0.007','PER TRANSFER'],['<1S','SETTLEMENT'],['20+','COUNTRIES']].map(([v,l],i)=>(
            <div key={i} style={{padding:'18px 24px',borderRight:i<2?`1px solid ${bdr}`:'none',flex:1}}>
              <div style={{fontSize:20,fontWeight:900,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt,letterSpacing:'-0.5px'}}>{v}</div>
              <div style={{fontSize:10,fontWeight:700,color:txt2,letterSpacing:'0.1em',marginTop:3}}>{l}</div>
            </div>
          ))}
        </div>
        {!showPicker ? (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <button onClick={()=>setShowPicker(true)} style={{...S.btnP,fontSize:16,padding:'16px 24px',borderRadius:14}}>⬡ Connect Wallet</button>
            <button onClick={connectWC} style={{...S.btnS,fontSize:16,padding:'16px 24px',borderRadius:14,width:'100%'}}>📱 WalletConnect</button>
          </div>
        ) : (
          <WalletPicker dm={dm} onPick={(t,p)=>{setShowPicker(false);connectBrowser(t,p);}} onClose={()=>setShowPicker(false)}/>
        )}
        {status && <Toast s={status}/>}
        <p style={{marginTop:20,fontSize:13,color:txt2}}>🔒 Non-custodial · Your keys, your funds</p>
      </div>
    </div>
  );

  // ─── DASHBOARD ─────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      {/* Nav */}
      <nav style={S.nav}>
        <div style={S.navi}>
          <div style={S.logo}>Arc<span style={{color:acc}}>Pay</span></div>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <div style={S.pill}>${balance} USDC</div>
            <div style={{...S.pill,fontFamily:'monospace',fontWeight:500}}>{short(address)}</div>
            <button style={S.discB} onClick={doDisconnect}>Disconnect</button>
          </div>
        </div>
      </nav>

      <div style={S.wrap}>
        <Toast s={status}/>

        {/* Stats */}
        <div style={S.stats}>
          {[
            {v:`$${balance}`,l:'USDC BALANCE',c:txt},
            {v:allTxns.length,l:'TRANSACTIONS',c:acc},
            {v:`$${totalSent.toFixed(0)}`,l:'TOTAL SENT',c:txt},
            {v:contacts.length,l:'CONTACTS',c:'#059669'},
          ].map((s,i)=>(
            <div key={i} style={S.stat}>
              <div style={{...S.sVal,color:s.c}}>{s.v}</div>
              <div style={S.sLbl}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={S.tabBar}>
          {tabs.map(t=><button key={t.id} style={S.tab(tab===t.id)} onClick={()=>setTab(t.id)}>{t.icon} {t.label}</button>)}
        </div>

        {/* ══ SEND ══════════════════════════════════════════════════════════ */}
        {tab==='send'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Send USDC</div>
            <div style={S.cSub}>Transfer USDC instantly. Arc USDC is native — sends like ETH.</div>
            {contacts.length>0&&(
              <div style={{marginBottom:16}}>
                <label style={S.lbl}>Quick Select</label>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {contacts.map(c=><button key={c.id} style={{...S.btnS,fontSize:12,padding:'6px 12px'}} onClick={()=>{setSendTo(c.address);setSendCtry(c.country);}}>{FLAG[c.country]} {c.name}</button>)}
                </div>
              </div>
            )}
            <label style={S.lbl}>Recipient Address</label>
            <input style={S.inp} placeholder="0x…" value={sendTo} onChange={e=>setSendTo(e.target.value)}/>
            <label style={S.lbl}>Amount (USDC)</label>
            <input style={S.inp} type="number" placeholder="0.00" value={sendAmt} onChange={e=>setSendAmt(e.target.value)}/>
            <label style={S.lbl}>Destination Country</label>
            <select style={S.sel} value={sendCtry} onChange={e=>setSendCtry(e.target.value)}>
              <option value="">— Select country —</option>
              {COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}
            </select>
            {converted()&&(
              <div style={S.convB}>
                <div style={{fontSize:12,color:acc,fontWeight:700,marginBottom:4}}>RECIPIENT GETS APPROXIMATELY</div>
                <div style={{fontSize:22,fontWeight:900,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt}}>{FLAG[sendCtry]} {converted()} {CURRENCY[sendCtry]}</div>
                <div style={{fontSize:12,color:txt2,marginTop:4}}>1 USDC ≈ {rates[CURRENCY[sendCtry]]?.toFixed(2)} {CURRENCY[sendCtry]} · Live rate</div>
              </div>
            )}
            <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handleSend} disabled={loading}>{loading?'Sending…':'Send USDC →'}</button>
          </div>
        )}

        {/* ══ MULTI-SEND ════════════════════════════════════════════════════ */}
        {tab==='multi'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Multi-Send</div>
            <div style={S.cSub}>Send USDC to multiple recipients in one session.</div>
            {multi.map((r,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}>
                <div style={{flex:2}}>{i===0&&<label style={S.lbl}>Address</label>}<input style={{...S.inp,marginBottom:0}} placeholder="0x…" value={r.addr} onChange={e=>{const n=[...multi];n[i].addr=e.target.value;setMulti(n);}}/></div>
                <div style={{flex:1}}>{i===0&&<label style={S.lbl}>USDC</label>}<input style={{...S.inp,marginBottom:0}} type="number" placeholder="0.00" value={r.amount} onChange={e=>{const n=[...multi];n[i].amount=e.target.value;setMulti(n);}}/></div>
                <div style={{flex:1}}>{i===0&&<label style={S.lbl}>Country</label>}<select style={{...S.sel,marginBottom:0}} value={r.country} onChange={e=>{const n=[...multi];n[i].country=e.target.value;setMulti(n);}}>{COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                {multi.length>1&&<button style={{...S.btnD,marginTop:i===0?22:0}} onClick={()=>setMulti(p=>p.filter((_,j)=>j!==i))}>✕</button>}
              </div>
            ))}
            <button style={S.btnG} onClick={()=>setMulti(p=>[...p,{addr:'',amount:'',country:'Pakistan'}])}>+ Add Recipient</button>
            <div style={{margin:'14px 0',padding:'12px 14px',background:bg3,borderRadius:10,border:`1px solid ${bdr}`,fontSize:14,color:txt}}>
              Total: <strong>${multi.reduce((s,r)=>s+(parseFloat(r.amount)||0),0).toFixed(2)} USDC</strong> to <strong>{multi.filter(r=>r.addr&&r.amount).length}</strong> recipient(s)
            </div>
            <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handleMulti} disabled={loading}>{loading?'Sending…':'Send All →'}</button>
          </div>
        )}

        {/* ══ INVOICE ═══════════════════════════════════════════════════════ */}
        {tab==='invoice'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Create Invoice</div>
            <div style={S.cSub}>Request USDC payment from a client. Share the invoice ID.</div>
            <label style={S.lbl}>Client Wallet Address</label>
            <input style={S.inp} placeholder="0x…" value={invPayer} onChange={e=>setInvPayer(e.target.value)}/>
            <label style={S.lbl}>Amount (USDC)</label>
            <input style={S.inp} type="number" placeholder="500" value={invAmt} onChange={e=>setInvAmt(e.target.value)}/>
            <label style={S.lbl}>Description</label>
            <input style={S.inp} placeholder="Logo design – May 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)}/>
            <label style={S.lbl}>Your Country</label>
            <select style={S.sel} value={invCtry} onChange={e=>setInvCtry(e.target.value)}>{COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}</select>
            <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handleCreateInv} disabled={loading}>{loading?'Creating…':'Create Invoice'}</button>
            {invId&&(
              <div>
                <div style={{marginTop:16,fontSize:14,fontWeight:700,color:'#166534'}}>✓ Invoice created!</div>
                <div style={S.invB}>{invId}</div>
                <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                  <button style={S.btnS} onClick={()=>navigator.clipboard?.writeText(invId)}>Copy ID</button>
                  <button style={{...S.btnP,width:'auto',padding:'9px 16px',marginTop:0}} onClick={()=>{setPayId(invId);setTab('pay');}}>Pay this Invoice →</button>
                </div>
              </div>
            )}
            {/* Saved invoices */}
            {ls('arc_invoices',[]).length>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontSize:13,fontWeight:700,color:txt2,marginBottom:10,letterSpacing:'0.05em',textTransform:'uppercase'}}>Recent Invoices</div>
                {ls('arc_invoices',[]).slice(0,5).map((inv,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${bdr}`}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:txt}}>${inv.amount} USDC · {inv.desc?.slice(0,30)}</div>
                      <div style={{fontSize:11,fontFamily:'monospace',color:txt2}}>{inv.id?.slice(0,16)}…</div>
                    </div>
                    <button style={{...S.btnS,fontSize:12,padding:'6px 10px'}} onClick={()=>{setPayId(inv.id);setTab('pay');}}>Pay →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ PAY ═══════════════════════════════════════════════════════════ */}
        {tab==='pay'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Pay Invoice</div>
            <div style={S.cSub}>Enter an invoice ID to pay it instantly.</div>
            <label style={S.lbl}>Invoice ID</label>
            <input style={S.inp} placeholder="0x…" value={payId} onChange={e=>setPayId(e.target.value)}/>
            {payDet&&(
              <div style={{...S.convB,marginBottom:16}}>
                <div style={{fontSize:12,color:acc,fontWeight:700,marginBottom:8}}>INVOICE DETAILS</div>
                <div style={{fontSize:14,color:txt,display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                  <div><span style={{color:txt2}}>Amount:</span> <strong>{fmtUsdc(payDet.amount)} USDC</strong></div>
                  <div><span style={{color:txt2}}>Country:</span> {FLAG[payDet.country]||''} {payDet.country}</div>
                  <div style={{gridColumn:'1/-1'}}><span style={{color:txt2}}>Desc:</span> {payDet.description}</div>
                  <div style={{gridColumn:'1/-1'}}><span style={{color:txt2}}>From:</span> <span style={{fontFamily:'monospace'}}>{short(payDet.creator)}</span></div>
                </div>
              </div>
            )}
            <button style={{...S.btnP,opacity:loading?0.6:1}} onClick={handlePayInv} disabled={loading}>{loading?'Processing…':'Pay Invoice →'}</button>
          </div>
        )}

        {/* ══ CONTACTS ══════════════════════════════════════════════════════ */}
        {tab==='contacts'&&(
          <div>
            <div style={S.card}>
              <div style={S.cTitle}>Add Contact</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={S.lbl}>Name</label><input style={{...S.inp,marginBottom:0}} placeholder="Ahmed" value={cName} onChange={e=>setCName(e.target.value)}/></div>
                <div><label style={S.lbl}>Country</label><select style={{...S.sel,marginBottom:0}} value={cCtry} onChange={e=>setCCtry(e.target.value)}>{COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}</select></div>
              </div>
              <label style={{...S.lbl,marginTop:14}}>Wallet Address</label>
              <input style={S.inp} placeholder="0x…" value={cAddr} onChange={e=>setCAddr(e.target.value)}/>
              <button style={S.btnP} onClick={()=>{
                if(!cName||!ethers.isAddress(cAddr)){setStatus({type:'error',msg:'Enter name and valid address'});return;}
                setContacts(p=>[{id:Date.now(),name:cName,address:cAddr,country:cCtry},...p]);
                setCName('');setCAddr('');setStatus({type:'success',msg:'Contact saved'});
              }}>Save Contact</button>
            </div>
            {contacts.length>0&&(
              <div style={S.card}>
                <div style={S.cTitle}>Saved Contacts ({contacts.length})</div>
                {contacts.map(c=>(
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:`1px solid ${bdr}`}}>
                    <div style={{width:40,height:40,borderRadius:12,background:bg3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:800,color:txt,flexShrink:0}}>{c.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:txt,fontSize:14}}>{FLAG[c.country]} {c.name}</div>
                      <div style={{fontSize:12,color:txt2,fontFamily:'monospace'}}>{c.address}</div>
                    </div>
                    <button style={{...S.btnS,fontSize:12}} onClick={()=>{setSendTo(c.address);setSendCtry(c.country);setTab('send');}}>Send →</button>
                    <button style={S.btnD} onClick={()=>setContacts(p=>p.filter(x=>x.id!==c.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SCHEDULE ══════════════════════════════════════════════════════ */}
        {tab==='schedule'&&(
          <div>
            <div style={S.card}>
              <div style={S.cTitle}>Schedule Payment</div>
              <div style={S.cSub}>Set up recurring transfers. Click Execute to pre-fill the Send tab.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><label style={S.lbl}>Recipient</label><input style={{...S.inp,marginBottom:0}} placeholder="0x…" value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))}/></div>
                <div><label style={S.lbl}>Amount (USDC)</label><input style={{...S.inp,marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))}/></div>
                <div><label style={S.lbl}>Country</label><select style={{...S.sel,marginBottom:0}} value={newSched.country} onChange={e=>setNewSched(s=>({...s,country:e.target.value}))}>{COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}</select></div>
                <div><label style={S.lbl}>Frequency</label><select style={{...S.sel,marginBottom:0}} value={newSched.freq} onChange={e=>setNewSched(s=>({...s,freq:e.target.value}))}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
              </div>
              <label style={{...S.lbl,marginTop:14}}>Next Date</label>
              <input style={S.inp} type="date" value={newSched.next} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))}/>
              <button style={S.btnP} onClick={()=>{
                if(!newSched.addr||!newSched.amount||!newSched.next){setStatus({type:'error',msg:'Fill all fields'});return;}
                setScheds(p=>[{id:Date.now(),...newSched},...p]);
                setNewSched({addr:'',amount:'',country:'Pakistan',freq:'weekly',next:''});
                setStatus({type:'success',msg:'Scheduled'});
              }}>Schedule Payment</button>
            </div>
            {scheds.length>0&&(
              <div style={S.card}>
                <div style={S.cTitle}>Active Schedules</div>
                {scheds.map(s=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:`1px solid ${bdr}`}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:txt}}>{FLAG[s.country]} {short(s.addr)}</div>
                      <div style={{fontSize:13,color:txt2,marginTop:2}}>${s.amount} USDC · {s.freq} · Next: {s.next}</div>
                    </div>
                    <button style={{...S.btnS,fontSize:12}} onClick={()=>{setSendTo(s.addr);setSendAmt(s.amount);setSendCtry(s.country);setTab('send');setStatus({type:'info',msg:'Pre-filled. Review and click Send USDC.'});}}>Execute →</button>
                    <button style={S.btnD} onClick={()=>setScheds(p=>p.filter(x=>x.id!==s.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ HISTORY ═══════════════════════════════════════════════════════ */}
        {tab==='history'&&(
          <div>
            {allTxns.length>0&&(
              <div style={S.card}>
                <div style={S.cTitle}>Transfer Volume</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{top:8,right:8,left:-20,bottom:0}}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={acc} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={acc} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={bdr}/>
                    <XAxis dataKey="label" tick={{fontSize:11,fill:txt2}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:txt2}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:bg2,border:`1px solid ${bdr}`,borderRadius:10,fontSize:13,color:txt}}/>
                    <Area type="monotone" dataKey="sent" stroke={acc} fill="url(#cg)" strokeWidth={2} name="Sent (USDC)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div style={S.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={S.cTitle}>Transactions ({allTxns.length})</div>
                <button style={S.btnS} onClick={loadContractHistory}>Refresh</button>
              </div>
              {allTxns.length===0
                ? <div style={{textAlign:'center',color:txt2,padding:'32px 0'}}>No transactions yet.</div>
                : allTxns.map((t,i)=>(
                  <div key={i} style={S.hRow}>
                    <div style={S.hIcon}>↑</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:txt,fontSize:14}}>{FLAG[t.country]||''} {t.country||'Transfer'}</div>
                      <div style={{fontSize:12,color:txt2,fontFamily:'monospace',marginTop:2}}>{short(t.recipient)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:800,color:txt,fontSize:15}}>
                        -{typeof t.amount==='string'||typeof t.amount==='number' ? parseFloat(t.amount).toFixed(2) : fmtUsdc(t.amount)} USDC
                      </div>
                      <div style={{fontSize:12,color:txt2,marginTop:2}}>{fmtDate(t.timestamp)}</div>
                    </div>
                    {t.hash&&<a href={`https://testnet.arcscan.app/tx/${t.hash}`} target="_blank" rel="noreferrer" style={{fontSize:13,color:acc,textDecoration:'none',padding:'4px 8px'}}>↗</a>}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ══ RATES ═════════════════════════════════════════════════════════ */}
        {tab==='rates'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Live Exchange Rates</div>
            <div style={S.cSub}>1 USDC = 1 USD · Rates via exchangerate-api.com</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
              {COUNTRIES.map(c=>{
                const cur=CURRENCY[c], rate=rates[cur];
                return(
                  <div key={c} style={{background:bg3,border:`1px solid ${bdr}`,borderRadius:12,padding:'13px 15px'}}>
                    <div style={{fontSize:20,marginBottom:4}}>{FLAG[c]}</div>
                    <div style={{fontSize:11,fontWeight:700,color:txt2,letterSpacing:'0.08em'}}>{cur}</div>
                    <div style={{fontSize:17,fontWeight:900,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt,marginTop:2}}>{rate?rate.toLocaleString('en',{maximumFractionDigits:1}):'—'}</div>
                    <div style={{fontSize:11,color:txt2,marginTop:2}}>{c}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ FEES ══════════════════════════════════════════════════════════ */}
        {tab==='fees'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Fee Comparison</div>
            <div style={S.cSub}>Sending $100 internationally. See what you actually pay.</div>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Service</th><th style={S.th}>Fee on $100</th><th style={S.th}>Speed</th><th style={S.th}>Save</th></tr></thead>
              <tbody>
                {[
                  {name:'ArcPay',fee:'~$0.007',speed:'< 1 sec',save:'$44.99',best:true},
                  {name:'SWIFT / Bank',fee:'$25–45',speed:'3–5 days',save:'—'},
                  {name:'Western Union',fee:'$4.99 + 3%',speed:'1–5 days',save:'—'},
                  {name:'PayPal',fee:'5% (max $4.99)',speed:'1–3 days',save:'—'},
                  {name:'Wise',fee:'0.5–2%',speed:'1–2 days',save:'—'},
                  {name:'MoneyGram',fee:'$3.99 + spread',speed:'1–3 days',save:'—'},
                ].map((r,i)=>(
                  <tr key={i} style={r.best?{background:dm?'#1a1f35':'#faf5ff'}:{}}>
                    <td style={{...S.td,fontWeight:r.best?800:400,color:r.best?acc:txt}}>{r.best&&'⭐ '}{r.name}</td>
                    <td style={{...S.td,color:r.best?'#166534':txt,fontWeight:r.best?700:400}}>{r.fee}</td>
                    <td style={{...S.td,color:txt}}>{r.speed}</td>
                    <td style={{...S.td,fontWeight:700,color:r.save!=='—'?'#166534':txt2}}>{r.save}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:20,background:dm?'#1a1f35':'#faf5ff',border:`1px solid ${dm?'#3d2c8d':'#e9d5ff'}`,borderRadius:12,padding:20,textAlign:'center'}}>
              <div style={{fontSize:12,color:acc,fontWeight:700,marginBottom:4}}>ANNUAL SAVINGS · $500/month vs bank wire</div>
              <div style={{fontSize:34,fontWeight:900,fontFamily:'"Bricolage Grotesque",sans-serif',color:txt,letterSpacing:'-1px'}}>$2,699</div>
            </div>
          </div>
        )}

        {/* ══ SETTINGS ══════════════════════════════════════════════════════ */}
        {tab==='settings'&&(
          <div style={S.card}>
            <div style={S.cTitle}>Settings</div>
            {[
              {
                label:'Dark Mode',
                sub:'Switch to dark theme',
                el:<button style={S.tog} onClick={()=>setDm(d=>!d)}><div style={S.togKnob}/></button>
              },
              {
                label:'Default Send Country',
                sub:'Pre-selected when you open the Send tab',
                el:<select style={{...S.sel,marginBottom:0,width:'auto',minWidth:160}} value={defCtry} onChange={e=>{setDefCtry(e.target.value);setSendCtry(e.target.value);}}>
                  <option value="">None</option>
                  {COUNTRIES.map(c=><option key={c} value={c}>{FLAG[c]} {c}</option>)}
                </select>
              },
            ].map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 0',borderBottom:`1px solid ${bdr}`}}>
                <div>
                  <div style={{fontWeight:600,color:txt,fontSize:15}}>{item.label}</div>
                  <div style={{fontSize:13,color:txt2,marginTop:2}}>{item.sub}</div>
                </div>
                {item.el}
              </div>
            ))}
            <div style={{padding:'18px 0',borderBottom:`1px solid ${bdr}`}}>
              <div style={{fontWeight:600,color:txt,fontSize:15,marginBottom:8}}>Network Info</div>
              <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:'6px 16px',fontSize:13}}>
                {[['Chain ID','5042002'],['RPC','rpc.testnet.arc.network'],['USDC',`${USDC_ADDR.slice(0,10)}…`],['Contract',`${REMIT_ADDR.slice(0,10)}…`]].map(([k,v])=>(
                  <React.Fragment key={k}><span style={{color:txt2}}>{k}</span><span style={{fontFamily:'monospace',color:txt}}>{v}</span></React.Fragment>
                ))}
              </div>
            </div>
            <div style={{padding:'18px 0'}}>
              <div style={{fontWeight:600,color:txt,fontSize:15,marginBottom:4}}>Privacy</div>
              <div style={{fontSize:13,color:txt2,marginBottom:12}}>All data stored locally on your device. Nothing sent to any server.</div>
              <button style={S.btnD} onClick={()=>{if(window.confirm('Clear all local data?')){setContacts([]);setScheds([]);setTxns([]);setStatus({type:'success',msg:'Data cleared'});}}}>Clear Local Data</button>
            </div>
          </div>
        )}

        <div style={{textAlign:'center',marginTop:24,fontSize:12,color:txt2}}>
          ArcPay · Arc Testnet · Chain ID {ARC_CHAIN_ID} · <a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{color:acc}}>Explorer ↗</a>
        </div>
      </div>
    </div>
  );
}
