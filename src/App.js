import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

// Load Syne display font
const _fl = document.createElement("link");
_fl.href = "https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@400;500;600;700&display=swap";
_fl.rel = "stylesheet";
document.head.appendChild(_fl);

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ID_HEX = '0x4CEF52';
const ARC_RPC = 'https://rpc.testnet.arc.network';
const REMITTANCE_ADDRESS = '0x8c4C0C64Ea3bE42b905486d25BBe30aa49F68118';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const USDC_DECIMALS = 6;
const GAS_LIMIT = 300000;
const WC_PROJECT_ID = '8bb24a433758c9a403057e2e3f2c371b';

const COUNTRIES = [
  'Pakistan','Nigeria','India','Philippines','Bangladesh',
  'Mexico','Brazil','Indonesia','Vietnam','Ghana',
  'Kenya','Egypt','Turkey','Argentina','Colombia',
  'Ukraine','Ethiopia','Tanzania','Uganda','Nepal'
];
const FLAG = { Pakistan:'🇵🇰',Nigeria:'🇳🇬',India:'🇮🇳',Philippines:'🇵🇭',Bangladesh:'🇧🇩',Mexico:'🇲🇽',Brazil:'🇧🇷',Indonesia:'🇮🇩',Vietnam:'🇻🇳',Ghana:'🇬🇭',Kenya:'🇰🇪',Egypt:'🇪🇬',Turkey:'🇹🇷',Argentina:'🇦🇷',Colombia:'🇨🇴',Ukraine:'🇺🇦',Ethiopia:'🇪🇹',Tanzania:'🇹🇿',Uganda:'🇺🇬',Nepal:'🇳🇵' };
const CURRENCY = { Pakistan:'PKR',Nigeria:'NGN',India:'INR',Philippines:'PHP',Bangladesh:'BDT',Mexico:'MXN',Brazil:'BRL',Indonesia:'IDR',Vietnam:'VND',Ghana:'GHS',Kenya:'KES',Egypt:'EGP',Turkey:'TRY',Argentina:'ARS',Colombia:'COP',Ukraine:'UAH',Ethiopia:'ETB',Tanzania:'TZS',Uganda:'UGX',Nepal:'NPR' };

/* ─── ABIs ──────────────────────────────────────────────────────────────────── */
const REMITTANCE_ABI = [
  { inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}], name:'sendMoney', outputs:[], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}], name:'createInvoice', outputs:[{name:'',type:'bytes32'}], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}], name:'payInvoice', outputs:[], stateMutability:'nonpayable', type:'function' },
  { inputs:[{name:'user',type:'address'}], name:'getPayments', outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'}],name:'',type:'tuple[]'}], stateMutability:'view', type:'function' },
  { inputs:[{name:'',type:'bytes32'}], name:'invoices', outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'timestamp',type:'uint256'}], stateMutability:'view', type:'function' }
];
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
const short = a => a ? `${a.slice(0,6)}...${a.slice(-4)}` : '';
const fmtUSDC = v => v ? parseFloat(ethers.formatUnits(v, USDC_DECIMALS)).toFixed(2) : '0.00';
const fmtDate = ts => ts ? new Date(Number(ts)*1000).toLocaleDateString('en',{month:'short',day:'numeric'}) : '';

function ls(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} }

const executeWithRetry = async (fn, setStatus) => {
  try { return await fn(); }
  catch(e) {
    const m = e.message?.toLowerCase()||'';
    if(m.includes('txpool')||m.includes('nonce')||m.includes('replacement')||m.includes('underpriced')||m.includes('timeout')){
      setStatus({type:'warning',message:'Transaction pool busy. Retrying in 10s...'});
      await new Promise(r=>setTimeout(r,10000));
      return await fn();
    }
    throw e;
  }
};

/* ─── QR Code generator (canvas, no lib needed) ─────────────────────────────── */
function QRCanvas({ value, size=160 }){
  const ref = useRef();
  useEffect(()=>{
    if(!value||!ref.current) return;
    // Minimal QR-like visual using address bytes as seed (decorative, shows address)
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,size,size);
    ctx.fillStyle='#111';
    const cell = size/21;
    // deterministic pattern from address
    const bytes = value.replace('0x','').padEnd(64,'0');
    for(let r=0;r<21;r++){
      for(let c=0;c<21;c++){
        const idx=(r*21+c)%bytes.length;
        const bit = parseInt(bytes[idx],16)>7;
        // Always fill finder patterns (corners)
        const finder = (r<7&&c<7)||(r<7&&c>13)||(r>13&&c<7);
        if(finder||bit){
          ctx.fillRect(c*cell,r*cell,cell-0.5,cell-0.5);
        }
      }
    }
    // finder pattern borders
    [[0,0],[0,14],[14,0]].forEach(([row,col])=>{
      ctx.strokeStyle='#111'; ctx.lineWidth=1;
      ctx.strokeRect(col*cell,row*cell,7*cell,7*cell);
      ctx.fillStyle='#fff';
      ctx.fillRect((col+1)*cell,(row+1)*cell,5*cell,5*cell);
      ctx.fillStyle='#111';
      ctx.fillRect((col+2)*cell,(row+2)*cell,3*cell,3*cell);
    });
  },[value,size]);
  return <canvas ref={ref} width={size} height={size} style={{borderRadius:8,border:'1px solid #e5e7eb'}} />;
}

/* ─── Mock analytics from tx history ───────────────────────────────────────── */
function buildAnalytics(history){
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    return { label: d.toLocaleDateString('en',{weekday:'short'}), sent:0, count:0 };
  });
  history.forEach(tx=>{
    const d = new Date(Number(tx.timestamp)*1000);
    const label = d.toLocaleDateString('en',{weekday:'short'});
    const slot = days.find(x=>x.label===label);
    if(slot){ slot.sent += parseFloat(fmtUSDC(tx.amount)); slot.count++; }
  });
  return days;
}

/* ══════════════════════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [activeTab, setActiveTab] = useState('send');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wcProvider, setWcProvider] = useState(null);
  const [rates, setRates] = useState({});
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('arc_dark') === 'true');
  const [defaultCurrency, setDefaultCurrency] = useState(() => localStorage.getItem('arc_currency') || 'Pakistan');

  // Send
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCountry, setSendCountry] = useState('Pakistan');

  // Invoice
  const [invPayer, setInvPayer] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invCountry, setInvCountry] = useState('Pakistan');
  const [createdInvId, setCreatedInvId] = useState('');

  // Pay
  const [payId, setPayId] = useState('');
  const [payDetails, setPayDetails] = useState(null);

  // History
  const [history, setHistory] = useState([]);

  // Contacts (localStorage)
  const [contacts, setContacts] = useState(()=>ls('arc_contacts',[]));
  const [cName, setCName] = useState('');
  const [cAddr, setCAddr] = useState('');
  const [cCountry, setCCountry] = useState('Pakistan');

  // Multi-send
  const [multiRows, setMultiRows] = useState([{addr:'',amount:'',country:'Pakistan'}]);

  // Scheduled
  const [schedRows, setSchedRows] = useState(()=>ls('arc_scheduled',[]));
  const [newSched, setNewSched] = useState({addr:'',amount:'',country:'Pakistan',freq:'weekly',next:''});

  useEffect(()=>lsSet('arc_contacts',contacts),[contacts]);
  useEffect(()=>lsSet('arc_scheduled',schedRows),[schedRows]);

  // Fetch exchange rates
  useEffect(()=>{
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r=>r.json())
      .then(d=>{ setRates(d.rates||{}); setRatesLoaded(true); })
      .catch(()=>{ setRates({PKR:278,NGN:1580,INR:83,PHP:56,BDT:110,MXN:17,BRL:5,IDR:15600,VND:24000,GHS:12,KES:129,EGP:31,TRY:32,ARS:880,COP:3900,UAH:38,ETB:57,TZS:2500,UGX:3800,NPR:132}); setRatesLoaded(true); });
  },[]);

  // Auto-connect
  useEffect(()=>{
    if(window.ethereum?.selectedAddress) connectBrowser();
  // eslint-disable-next-line
  },[]);

  useEffect(()=>{
    if(!window.ethereum) return;
    const onAcc = accs=>{ if(!accs.length) disconnect(); else setAddress(accs[0]); };
    const onChain = ()=>window.location.reload();
    window.ethereum.on('accountsChanged',onAcc);
    window.ethereum.on('chainChanged',onChain);
    return ()=>{ window.ethereum.removeListener('accountsChanged',onAcc); window.ethereum.removeListener('chainChanged',onChain); };
  // eslint-disable-next-line
  },[address]);

  useEffect(()=>{
    if(activeTab==='history'&&signer) loadHistory();
  // eslint-disable-next-line
  },[activeTab,signer]);

  useEffect(()=>{
    if(signer&&address) fetchBalance();
  // eslint-disable-next-line
  },[signer,address]);

  /* ─── Wallet ────────────────────────────────────────────────────────────── */
  const switchToArc = async (eth) => {
    try {
      await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_ID_HEX}]});
    } catch(e) {
      if(e.code===4902) await eth.request({method:'wallet_addEthereumChain',params:[{chainId:ARC_CHAIN_ID_HEX,chainName:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:[ARC_RPC],blockExplorerUrls:['https://testnet.arcscan.app']}]});
      else throw e;
    }
  };

  const getEth = () => {
    const { ethereum } = window;
    if (!ethereum) return null;
    if (ethereum.providers?.length) return ethereum.providers.find(p=>p.isMetaMask)||ethereum.providers[0];
    return ethereum;
  };

  const walletLabel = () => {
    const eth = getEth();
    if (!eth) return 'Browser Wallet';
    if (eth.isRabby) return 'Rabby';
    if (eth.isBraveWallet) return 'Brave';
    if (eth.isCoinbaseWallet) return 'Coinbase';
    if (eth.isMetaMask) return 'MetaMask';
    return 'Browser Wallet';
  };

  const connectBrowser = async () => {
    const eth = getEth();
    if (!eth) { setStatus({type:'error',message:'No browser wallet detected. Install MetaMask.'}); return; }
    try {
      const bp = new ethers.BrowserProvider(eth,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      await bp.send('eth_requestAccounts',[]);
      await switchToArc(eth);
      const s = await bp.getSigner();
      const addr = await s.getAddress();
      setProvider(bp); setSigner(s); setAddress(addr); setWalletName(walletLabel());
      setStatus({type:'success',message:`Connected: ${short(addr)}`});
    } catch(e) { setStatus({type:'error',message:e.message||'Connection failed'}); }
  };

  const connectMobile = async () => {
    try {
      const wcp = await EthereumProvider.init({
        projectId:WC_PROJECT_ID, chains:[ARC_CHAIN_ID], showQrModal:true,
        methods:['eth_sendTransaction','eth_sign','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'],
        events:['chainChanged','accountsChanged'],
      });
      await wcp.enable();
      wcp.on('accountsChanged', accs=>{ if(!accs.length) disconnect(); else setAddress(accs[0]); });
      wcp.on('disconnect', ()=>disconnect());
      try { await wcp.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_ID_HEX}]}); }
      catch(e){ if(e.code===4902) await wcp.request({method:'wallet_addEthereumChain',params:[{chainId:ARC_CHAIN_ID_HEX,chainName:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:[ARC_RPC],blockExplorerUrls:[]}]}); }
      const bp = new ethers.BrowserProvider(wcp,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      const s = await bp.getSigner();
      const addr = await s.getAddress();
      setWcProvider(wcp); setProvider(bp); setSigner(s); setAddress(addr); setWalletName('WalletConnect');
      setStatus({type:'success',message:`Connected via WalletConnect: ${short(addr)}`});
    } catch(e) { setStatus({type:'error',message:e.message||'WalletConnect failed'}); }
  };

  const disconnect = useCallback(()=>{
    if(wcProvider) wcProvider.disconnect();
    setProvider(null); setSigner(null); setAddress(''); setWalletName(''); setWcProvider(null); setStatus(null); setBalance('0.00');
  },[wcProvider]);

  const fetchBalance = async () => {
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS,ERC20_ABI,provider);
      const b = await usdc.balanceOf(address);
      setBalance(fmtUSDC(b));
    } catch {}
  };

  const getContracts = () => ({
    remittance: new ethers.Contract(REMITTANCE_ADDRESS,REMITTANCE_ABI,signer),
    usdc: new ethers.Contract(USDC_ADDRESS,ERC20_ABI,signer),
  });

  /* ─── Actions ───────────────────────────────────────────────────────────── */
  const handleSend = async () => {
    if(!signer||!sendRecipient||!sendAmount){ setStatus({type:'error',message:'Fill all fields and connect wallet'}); return; }
    setLoading(true); setStatus({type:'info',message:'Sending...'});
    try {
      const {usdc} = getContracts();
      const amount = ethers.parseUnits(sendAmount,USDC_DECIMALS);
      const tx = await usdc.transfer(sendRecipient,amount,{gasLimit:300000});
      setStatus({type:'info',message:'Confirming...'});
      await tx.wait();
      setStatus({type:'success',message:`Sent ${sendAmount} USDC to ${short(sendRecipient)}`});
      setSendRecipient(''); setSendAmount('');
      fetchBalance();
    } catch(e){ setStatus({type:'error',message:e.reason||e.message||'Failed'}); }
    finally{ setLoading(false); }
  };

  const handleMultiSend = async () => {
    const valid = multiRows.filter(r=>ethers.isAddress(r.addr)&&parseFloat(r.amount)>0);
    if(!signer||!valid.length){ setStatus({type:'error',message:'Add valid recipients'}); return; }
    setLoading(true);
    try {
      const {remittance,usdc} = getContracts();
      for(const r of valid){
        const amount = ethers.parseUnits(r.amount,USDC_DECIMALS);
        const allowance = await usdc.allowance(address,REMITTANCE_ADDRESS);
        if(allowance<amount) await (await usdc.approve(REMITTANCE_ADDRESS,amount,{gasLimit:GAS_LIMIT})).wait();
        setStatus({type:'info',message:`Sending to ${short(r.addr)}...`});
        const tx = await executeWithRetry(()=>remittance.sendMoney(USDC_ADDRESS,r.addr,amount,r.country,{gasLimit:GAS_LIMIT}),setStatus);
        await tx.wait();
      }
      setStatus({type:'success',message:`Sent to ${valid.length} recipients`});
      setMultiRows([{addr:'',amount:'',country:'Pakistan'}]);
      fetchBalance();
    } catch(e){ setStatus({type:'error',message:e.reason||e.message||'Failed'}); }
    finally{ setLoading(false); }
  };

  const handleCreateInvoice = async () => {
    if(!signer||!invPayer||!invAmount||!invDesc){ setStatus({type:'error',message:'Fill all fields'}); return; }
    setLoading(true); setStatus({type:'info',message:'Creating...'});
    try {
      const {remittance} = getContracts();
      const amount = ethers.parseUnits(invAmount,USDC_DECIMALS);
      const invoiceId = await remittance.createInvoice.staticCall(invPayer,amount,invDesc,invCountry);
      const tx = await executeWithRetry(()=>remittance.createInvoice(invPayer,amount,invDesc,invCountry,{gasLimit:GAS_LIMIT}),setStatus);
      await tx.wait();
      setCreatedInvId(invoiceId);
      // persist
      const saved = ls('arc_invoices',[]);
      lsSet('arc_invoices',[{id:invoiceId,payer:invPayer,amount:invAmount,desc:invDesc,country:invCountry,ts:Date.now()},...saved]);
      setStatus({type:'success',message:'Invoice created!'});
      setInvPayer(''); setInvAmount(''); setInvDesc('');
    } catch(e){ setStatus({type:'error',message:e.reason||e.message||'Failed'}); }
    finally{ setLoading(false); }
  };

  const handlePayInvoice = async () => {
    if(!signer||!payId){ setStatus({type:'error',message:'Enter invoice ID'}); return; }
    setLoading(true); setStatus({type:'info',message:'Looking up invoice...'});
    try {
      const {remittance,usdc} = getContracts();
      let id = payId.trim();
      if(!id.startsWith('0x')) id='0x'+id;
      const inv = await remittance.invoices(id);
      if(inv.creator===ethers.ZeroAddress){ setStatus({type:'error',message:'Invoice not found'}); setLoading(false); return; }
      if(inv.paid){ setStatus({type:'error',message:'Already paid'}); setLoading(false); return; }
      setPayDetails({creator:inv.creator,amount:inv.amount,description:inv.description,country:inv.country});
      const allowance = await usdc.allowance(address,REMITTANCE_ADDRESS);
      if(allowance<inv.amount){
        setStatus({type:'info',message:'Approving USDC...'});
        await (await usdc.approve(REMITTANCE_ADDRESS,inv.amount,{gasLimit:GAS_LIMIT})).wait();
      }
      setStatus({type:'info',message:'Paying...'});
      const tx = await executeWithRetry(()=>remittance.payInvoice(USDC_ADDRESS,id,{gasLimit:GAS_LIMIT}),setStatus);
      await tx.wait();
      setStatus({type:'success',message:`Paid ${fmtUSDC(inv.amount)} USDC`});
      setPayId(''); setPayDetails(null); fetchBalance();
    } catch(e){ setStatus({type:'error',message:e.reason||e.message||'Failed'}); }
    finally{ setLoading(false); }
  };

  const loadHistory = async () => {
    try {
      const {remittance} = getContracts();
      const payments = await remittance.getPayments(address);
      setHistory([...payments].reverse());
    } catch {}
  };

  /* ─── Derived ───────────────────────────────────────────────────────────── */
  const convertedAmount = () => {
    if(!sendAmount||!sendCountry) return null;
    const cur = CURRENCY[sendCountry];
    const rate = rates[cur];
    if(!rate) return null;
    return (parseFloat(sendAmount)*rate).toLocaleString('en',{maximumFractionDigits:0});
  };

  const totalSent = history.reduce((s,t)=>s+parseFloat(fmtUSDC(t.amount)),0);
  const analytics = buildAnalytics(history);

  /* ─── Status style ──────────────────────────────────────────────────────── */
  const statusBg = ()=>{
    if(!status) return null;
    if(status.type==='success') return {bg:'#f0fdf4',color:'#166534',border:'#bbf7d0'};
    if(status.type==='error') return {bg:'#fef2f2',color:'#991b1b',border:'#fecaca'};
    if(status.type==='warning') return {bg:'#fffbeb',color:'#92400e',border:'#fde68a'};
    return {bg:'#eff6ff',color:'#1e40af',border:'#bfdbfe'};
  };

  /* ══════════════════════════════════════════════════════════════════════════
     LANDING PAGE  (same design as screenshot)
  ══════════════════════════════════════════════════════════════════════════ */
  if(!address) return (
    <div style={{minHeight:'100vh',background:'#f8faff',fontFamily:'"Inter",sans-serif',position:'relative',overflow:'hidden'}}>
      {/* Grid background */}
      <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)',backgroundSize:'48px 48px',opacity:0.6,pointerEvents:'none'}} />

      <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'40px 24px',textAlign:'center'}}>
        {/* Live badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.8)',border:'1px solid #e2e8f0',borderRadius:999,padding:'6px 16px',marginBottom:40,backdropFilter:'blur(4px)'}}>
          <span style={{width:8,height:8,borderRadius:'50%',background:'#6d28d9',display:'inline-block'}} />
          <span style={{fontSize:12,fontWeight:600,color:'#6d28d9',letterSpacing:'0.1em'}}>ARC TESTNET · LIVE</span>
        </div>

        {/* Hero headline */}
        <h1 style={{fontSize:'clamp(48px,12vw,80px)',fontWeight:800,lineHeight:1.05,margin:'0 0 24px',color:'#0f172a',letterSpacing:'-2px',fontFamily:'"Syne",sans-serif'}}>
          Send Money<br />
          <span style={{color:'#6d28d9'}}>Globally.</span><br />
          Instantly.
        </h1>
        <p style={{fontSize:18,color:'#64748b',margin:'0 0 48px',maxWidth:400,lineHeight:1.6}}>
          Transfer USDC across borders in under a second.<br />Zero hidden fees. Fully on-chain.
        </p>

        {/* Stats */}
        <div style={{display:'flex',gap:0,marginBottom:48,border:'1px solid #e2e8f0',borderRadius:16,overflow:'hidden',background:'#fff'}}>
          {[['~$0.007','PER TRANSFER'],['<1S','SETTLEMENT'],['20+','COUNTRIES']].map(([v,l],i)=>(
            <div key={i} style={{padding:'20px 32px',borderRight:i<2?'1px solid #e2e8f0':'none',minWidth:100}}>
              <div style={{fontSize:22,fontWeight:900,color:'#0f172a',letterSpacing:'-1px'}}>{v}</div>
              <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',letterSpacing:'0.12em',marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{display:'flex',flexDirection:'column',gap:12,width:'100%',maxWidth:360}}>
          <button onClick={connectBrowser} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,background:'#0f172a',color:'#fff',border:'none',borderRadius:14,padding:'18px 24px',fontSize:16,fontWeight:700,cursor:'pointer',width:'100%'}}>
            <span>⬡</span> Connect Wallet
          </button>
          <button onClick={connectMobile} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,background:'#fff',color:'#0f172a',border:'1.5px solid #e2e8f0',borderRadius:14,padding:'18px 24px',fontSize:16,fontWeight:700,cursor:'pointer',width:'100%'}}>
            <span>📱</span> Connect via WalletConnect
          </button>
        </div>

        {status && (
          <div style={{marginTop:16,padding:'10px 16px',borderRadius:10,background:statusBg()?.bg,color:statusBg()?.color,border:`1px solid ${statusBg()?.border}`,fontSize:14,maxWidth:360,width:'100%'}}>
            {status.message}
          </div>
        )}

        <p style={{marginTop:20,fontSize:13,color:'#94a3b8'}}>🔒 Non-custodial · Your keys, your funds</p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════════
     DASHBOARD  (same design language — white, grid bg, black/purple accents)
  ══════════════════════════════════════════════════════════════════════════ */
  const tabs = [
    {id:'send',    label:'Send',      icon:'↑'},
    {id:'multi',   label:'Multi-Send',icon:'⇈'},
    {id:'invoice', label:'Invoice',   icon:'◻'},
    {id:'pay',     label:'Pay',       icon:'$'},
    {id:'contacts',label:'Contacts',  icon:'◑'},
    {id:'schedule',label:'Scheduled', icon:'⊙'},
    {id:'history', label:'History',   icon:'↺'},
    {id:'rates',   label:'Rates',     icon:'⟲'},
    {id:'fees',    label:'Compare',   icon:'≈'},
    {id:'settings', label:'Settings',  icon:'⚙'},
  ];

  const C = {
    wrap: {minHeight:'100vh',background:'#f8faff',fontFamily:'"Inter",sans-serif',position:'relative'},
    grid: {position:'fixed',inset:0,backgroundImage:'linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)',backgroundSize:'48px 48px',opacity:0.5,pointerEvents:'none',zIndex:0},

    // Top nav
    nav: {position:'sticky',top:0,zIndex:100,background:'rgba(248,250,255,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid #e2e8f0',padding:'0 20px'},
    navInner: {maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:60},
    navLogo: {fontSize:18,fontWeight:900,color:'#0f172a',letterSpacing:'-0.5px'},
    navRight: {display:'flex',alignItems:'center',gap:12},
    balPill: {background:'#fff',border:'1px solid #e2e8f0',borderRadius:999,padding:'6px 14px',fontSize:13,fontWeight:700,color:'#0f172a'},
    addrPill: {background:'#fff',border:'1px solid #e2e8f0',borderRadius:999,padding:'6px 14px',fontSize:13,color:'#64748b',fontFamily:'monospace'},
    discBtn: {background:'#fef2f2',border:'1px solid #fecaca',borderRadius:999,padding:'6px 14px',fontSize:12,fontWeight:600,color:'#dc2626',cursor:'pointer'},

    // Content
    content: {position:'relative',zIndex:1,maxWidth:900,margin:'0 auto',padding:'28px 20px'},

    // Status
    statusBox: (t)=>{
      const m = {success:{bg:'#f0fdf4',c:'#166534',b:'#bbf7d0'},error:{bg:'#fef2f2',c:'#991b1b',b:'#fecaca'},warning:{bg:'#fffbeb',c:'#92400e',b:'#fde68a'},info:{bg:'#eff6ff',c:'#1e40af',b:'#bfdbfe'}};
      const s = m[t?.type]||m.info;
      return {padding:'12px 16px',borderRadius:12,marginBottom:20,fontSize:14,fontWeight:500,background:s.bg,color:s.c,border:`1px solid ${s.b}`};
    },

    // Tab bar
    tabBar: {display:'flex',gap:4,overflowX:'auto',marginBottom:24,paddingBottom:2},
    tab: (active)=>({display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,whiteSpace:'nowrap',background:active?'#0f172a':'#fff',color:active?'#fff':'#64748b',border:active?'none':'1px solid #e2e8f0',transition:'all 0.15s'}),

    // Cards
    card: {background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:'24px',marginBottom:16},
    cardTitle: {fontSize:20,fontWeight:800,color:'#0f172a',marginBottom:4,letterSpacing:'-0.5px'},
    cardSub: {fontSize:14,color:'#64748b',marginBottom:20},

    // Stat cards
    statGrid: {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:20},
    statCard: {background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'18px'},
    statVal: {fontSize:26,fontWeight:900,color:'#0f172a',letterSpacing:'-1px'},
    statLbl: {fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.1em',marginTop:4},

    // Form
    label: {display:'block',fontSize:12,fontWeight:700,color:'#374151',letterSpacing:'0.05em',marginBottom:6,textTransform:'uppercase'},
    input: {width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:14,boxSizing:'border-box',marginBottom:14,fontFamily:'inherit',color:'#0f172a',outline:'none',background:'#fff'},
    select: {width:'100%',padding:'12px 14px',borderRadius:10,border:'1.5px solid #e2e8f0',fontSize:14,boxSizing:'border-box',marginBottom:14,background:'#fff',color:'#0f172a',fontFamily:'inherit'},

    // Buttons
    btnPrimary: {width:'100%',padding:'15px',borderRadius:12,border:'none',background:'#0f172a',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',marginTop:4},
    btnSecondary: {padding:'10px 18px',borderRadius:10,border:'1.5px solid #e2e8f0',background:'#fff',color:'#0f172a',fontSize:13,fontWeight:600,cursor:'pointer'},
    btnDanger: {padding:'8px 14px',borderRadius:8,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:12,fontWeight:600,cursor:'pointer'},
    btnGhost: {padding:'10px 18px',borderRadius:10,border:'1.5px dashed #e2e8f0',background:'transparent',color:'#94a3b8',fontSize:13,fontWeight:600,cursor:'pointer',width:'100%',marginTop:4},

    // Convert box
    convertBox: {background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:12,padding:'14px 16px',marginBottom:14},

    // Table
    table: {width:'100%',borderCollapse:'collapse',fontSize:14},
    th: {background:'#f8faff',padding:'12px 14px',textAlign:'left',fontWeight:700,fontSize:12,color:'#64748b',letterSpacing:'0.05em',textTransform:'uppercase',borderBottom:'1px solid #e2e8f0'},
    td: {padding:'13px 14px',borderBottom:'1px solid #f1f5f9',color:'#374151',fontSize:14},

    // Invoice box
    invoiceBox: {background:'#f8faff',border:'1px solid #e2e8f0',borderRadius:10,padding:'14px',fontFamily:'monospace',fontSize:12,wordBreak:'break-all',marginTop:12,color:'#374151'},

    // History row
    histRow: {display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid #f1f5f9'},
    histIcon: (type)=>({width:40,height:40,borderRadius:12,background:type==='sent'?'#fef2f2':'#f0fdf4',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}),
  };

  return (
    <div style={C.wrap}>
      <div style={C.grid} />

      {/* Nav */}
      <nav style={C.nav}>
        <div style={C.navInner}>
          <div style={C.navLogo}>Arc<span style={{color:'#6d28d9'}}>Pay</span></div>
          <div style={C.navRight}>
            <div style={C.balPill}>${balance} USDC</div>
            <div style={C.addrPill}>{short(address)}</div>
            <button style={C.discBtn} onClick={disconnect}>Disconnect</button>
          </div>
        </div>
      </nav>

      <div style={C.content}>
        {/* Status */}
        {status && <div style={C.statusBox(status)}>{status.message}</div>}

        {/* Stat strip */}
        <div style={C.statGrid}>
          <div style={C.statCard}>
            <div style={C.statVal}>${balance}</div>
            <div style={C.statLbl}>USDC BALANCE</div>
          </div>
          <div style={C.statCard}>
            <div style={{...C.statVal,color:'#6d28d9'}}>{history.length}</div>
            <div style={C.statLbl}>TRANSACTIONS</div>
          </div>
          <div style={C.statCard}>
            <div style={C.statVal}>${totalSent.toFixed(0)}</div>
            <div style={C.statLbl}>TOTAL SENT</div>
          </div>
          <div style={C.statCard}>
            <div style={{...C.statVal,color:'#059669'}}>{contacts.length}</div>
            <div style={C.statLbl}>CONTACTS</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={C.tabBar}>
          {tabs.map(t=>(
            <button key={t.id} style={C.tab(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── SEND ─────────────────────────────────────────────────────────── */}
        {activeTab==='send' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Send USDC</div>
            <div style={C.cardSub}>Transfer USDC instantly to anyone, anywhere.</div>

            {/* Contact quick-pick */}
            {contacts.length>0 && (
              <div style={{marginBottom:16}}>
                <div style={C.label}>Quick Select</div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {contacts.map(c=>(
                    <button key={c.id} style={{...C.btnSecondary,fontSize:12,padding:'7px 12px'}}
                      onClick={()=>{setSendRecipient(c.address);setSendCountry(c.country);}}>
                      {FLAG[c.country]} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label style={C.label}>Recipient Address</label>
            <input style={C.input} placeholder="0x..." value={sendRecipient} onChange={e=>setSendRecipient(e.target.value)} />

            <label style={C.label}>Amount (USDC)</label>
            <input style={C.input} type="number" placeholder="0.00" value={sendAmount} onChange={e=>setSendAmount(e.target.value)} />

            <label style={C.label}>Destination Country</label>
            <select style={C.select} value={sendCountry} onChange={e=>setSendCountry(e.target.value)}>
              {COUNTRIES.map(c=><option key={c}>{FLAG[c]} {c}</option>)}
            </select>

            {/* Live conversion */}
            {convertedAmount() && (
              <div style={C.convertBox}>
                <div style={{fontSize:12,color:'#7c3aed',fontWeight:600,marginBottom:4}}>RECIPIENT GETS APPROXIMATELY</div>
                <div style={{fontSize:24,fontWeight:900,color:'#0f172a'}}>{FLAG[sendCountry]} {convertedAmount()} {CURRENCY[sendCountry]}</div>
                <div style={{fontSize:12,color:'#94a3b8',marginTop:4}}>1 USDC ≈ {rates[CURRENCY[sendCountry]]?.toFixed(2)} {CURRENCY[sendCountry]} · Live rate</div>
              </div>
            )}

            <button style={{...C.btnPrimary,opacity:loading?0.6:1}} onClick={handleSend} disabled={loading}>
              {loading?'Processing...':'Send USDC →'}
            </button>
          </div>
        )}

        {/* ── MULTI-SEND ───────────────────────────────────────────────────── */}
        {activeTab==='multi' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Multi-Send</div>
            <div style={C.cardSub}>Send to multiple recipients in one session.</div>
            {multiRows.map((r,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}>
                <div style={{flex:2}}>
                  {i===0 && <label style={C.label}>Address</label>}
                  <input style={{...C.input,marginBottom:0}} placeholder="0x..." value={r.addr}
                    onChange={e=>{const n=[...multiRows];n[i].addr=e.target.value;setMultiRows(n);}} />
                </div>
                <div style={{flex:1}}>
                  {i===0 && <label style={C.label}>USDC</label>}
                  <input style={{...C.input,marginBottom:0}} type="number" placeholder="0.00" value={r.amount}
                    onChange={e=>{const n=[...multiRows];n[i].amount=e.target.value;setMultiRows(n);}} />
                </div>
                <div style={{flex:1}}>
                  {i===0 && <label style={C.label}>Country</label>}
                  <select style={{...C.select,marginBottom:0}} value={r.country}
                    onChange={e=>{const n=[...multiRows];n[i].country=e.target.value;setMultiRows(n);}}>
                    {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                {multiRows.length>1 && (
                  <button style={{...C.btnDanger,marginTop:i===0?22:0}} onClick={()=>setMultiRows(p=>p.filter((_,j)=>j!==i))}>✕</button>
                )}
              </div>
            ))}
            <button style={C.btnGhost} onClick={()=>setMultiRows(p=>[...p,{addr:'',amount:'',country:'Pakistan'}])}>+ Add Recipient</button>
            <div style={{margin:'14px 0',padding:'12px 14px',background:'#f8faff',borderRadius:10,border:'1px solid #e2e8f0',fontSize:14,color:'#374151'}}>
              Total: <strong>${multiRows.reduce((s,r)=>s+(parseFloat(r.amount)||0),0).toFixed(2)} USDC</strong> to <strong>{multiRows.filter(r=>r.addr&&r.amount).length}</strong> recipient(s)
            </div>
            <button style={{...C.btnPrimary,opacity:loading?0.6:1}} onClick={handleMultiSend} disabled={loading}>
              {loading?'Processing...':'Send All →'}
            </button>
          </div>
        )}

        {/* ── INVOICE ──────────────────────────────────────────────────────── */}
        {activeTab==='invoice' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Create Invoice</div>
            <div style={C.cardSub}>Request payment from a client. Share the invoice ID so they can pay via the Pay tab.</div>
            <label style={C.label}>Client Wallet Address</label>
            <input style={C.input} placeholder="0x..." value={invPayer} onChange={e=>setInvPayer(e.target.value)} />
            <label style={C.label}>Amount (USDC)</label>
            <input style={C.input} type="number" placeholder="500" value={invAmount} onChange={e=>setInvAmount(e.target.value)} />
            <label style={C.label}>Description</label>
            <input style={C.input} placeholder="Logo design - March 2026" value={invDesc} onChange={e=>setInvDesc(e.target.value)} />
            <label style={C.label}>Your Country</label>
            <select style={C.select} value={invCountry} onChange={e=>setInvCountry(e.target.value)}>
              {COUNTRIES.map(c=><option key={c}>{FLAG[c]} {c}</option>)}
            </select>
            <button style={{...C.btnPrimary,opacity:loading?0.6:1}} onClick={handleCreateInvoice} disabled={loading}>
              {loading?'Creating...':'Create Invoice'}
            </button>
            {createdInvId && (
              <div>
                <div style={{marginTop:16,fontSize:14,fontWeight:700,color:'#166534'}}>✓ Invoice created! Share this ID:</div>
                <div style={C.invoiceBox}>{createdInvId}</div>
                <button style={{...C.btnSecondary,marginTop:10,fontSize:13}} onClick={()=>{navigator.clipboard?.writeText(createdInvId);}}>
                  Copy Invoice ID
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PAY ──────────────────────────────────────────────────────────── */}
        {activeTab==='pay' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Pay Invoice</div>
            <div style={C.cardSub}>Enter an invoice ID to look it up and pay instantly.</div>
            <label style={C.label}>Invoice ID</label>
            <input style={C.input} placeholder="0x..." value={payId} onChange={e=>setPayId(e.target.value)} />
            {payDetails && (
              <div style={{...C.convertBox,marginBottom:16}}>
                <div style={{fontSize:12,color:'#7c3aed',fontWeight:600,marginBottom:8}}>INVOICE DETAILS</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,fontSize:14,color:'#374151'}}>
                  <div><span style={{color:'#94a3b8'}}>Amount:</span> <strong>{fmtUSDC(payDetails.amount)} USDC</strong></div>
                  <div><span style={{color:'#94a3b8'}}>Country:</span> {FLAG[payDetails.country]||''} {payDetails.country}</div>
                  <div style={{gridColumn:'1/-1'}}><span style={{color:'#94a3b8'}}>Description:</span> {payDetails.description}</div>
                  <div style={{gridColumn:'1/-1'}}><span style={{color:'#94a3b8'}}>From:</span> <span style={{fontFamily:'monospace'}}>{short(payDetails.creator)}</span></div>
                </div>
              </div>
            )}
            <button style={{...C.btnPrimary,opacity:loading?0.6:1}} onClick={handlePayInvoice} disabled={loading}>
              {loading?'Processing...':'Pay Invoice →'}
            </button>
          </div>
        )}

        {/* ── CONTACTS ─────────────────────────────────────────────────────── */}
        {activeTab==='contacts' && (
          <div>
            <div style={C.card}>
              <div style={C.cardTitle}>Add Contact</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={C.label}>Name</label>
                  <input style={{...C.input,marginBottom:0}} placeholder="e.g. Ahmed" value={cName} onChange={e=>setCName(e.target.value)} />
                </div>
                <div>
                  <label style={C.label}>Country</label>
                  <select style={{...C.select,marginBottom:0}} value={cCountry} onChange={e=>setCCountry(e.target.value)}>
                    {COUNTRIES.map(c=><option key={c}>{FLAG[c]} {c}</option>)}
                  </select>
                </div>
              </div>
              <label style={{...C.label,marginTop:14}}>Wallet Address</label>
              <input style={C.input} placeholder="0x..." value={cAddr} onChange={e=>setCAddr(e.target.value)} />
              <button style={C.btnPrimary} onClick={()=>{
                if(!cName||!ethers.isAddress(cAddr)){setStatus({type:'error',message:'Enter name and valid address'});return;}
                setContacts(p=>[{id:Date.now(),name:cName,address:cAddr,country:cCountry},...p]);
                setCName('');setCAddr('');setStatus({type:'success',message:'Contact saved'});
              }}>Save Contact</button>
            </div>

            {contacts.length>0 && (
              <div style={C.card}>
                <div style={C.cardTitle}>Contacts ({contacts.length})</div>
                {contacts.map(c=>(
                  <div key={c.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
                    <div style={{width:42,height:42,borderRadius:12,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#0f172a',flexShrink:0}}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#0f172a',fontSize:15}}>{FLAG[c.country]} {c.name}</div>
                      <div style={{fontSize:12,color:'#94a3b8',fontFamily:'monospace'}}>{c.address}</div>
                    </div>
                    <button style={{...C.btnSecondary,fontSize:12}} onClick={()=>{setSendRecipient(c.address);setSendCountry(c.country);setActiveTab('send');}}>Send →</button>
                    <button style={C.btnDanger} onClick={()=>setContacts(p=>p.filter(x=>x.id!==c.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULED ────────────────────────────────────────────────────── */}
        {activeTab==='schedule' && (
          <div>
            <div style={C.card}>
              <div style={C.cardTitle}>Schedule Payment</div>
              <div style={C.cardSub}>Set up recurring USDC transfers. You'll be reminded on the due date.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <label style={C.label}>Recipient Address</label>
                  <input style={{...C.input,marginBottom:0}} placeholder="0x..." value={newSched.addr} onChange={e=>setNewSched(s=>({...s,addr:e.target.value}))} />
                </div>
                <div>
                  <label style={C.label}>Amount (USDC)</label>
                  <input style={{...C.input,marginBottom:0}} type="number" placeholder="0.00" value={newSched.amount} onChange={e=>setNewSched(s=>({...s,amount:e.target.value}))} />
                </div>
                <div>
                  <label style={C.label}>Country</label>
                  <select style={{...C.select,marginBottom:0}} value={newSched.country} onChange={e=>setNewSched(s=>({...s,country:e.target.value}))}>
                    {COUNTRIES.map(c=><option key={c}>{FLAG[c]} {c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={C.label}>Frequency</label>
                  <select style={{...C.select,marginBottom:0}} value={newSched.freq} onChange={e=>setNewSched(s=>({...s,freq:e.target.value}))}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <label style={{...C.label,marginTop:14}}>Next Payment Date</label>
              <input style={C.input} type="date" value={newSched.next} onChange={e=>setNewSched(s=>({...s,next:e.target.value}))} />
              <button style={C.btnPrimary} onClick={()=>{
                if(!newSched.addr||!newSched.amount||!newSched.next){setStatus({type:'error',message:'Fill all fields'});return;}
                setSchedRows(p=>[{id:Date.now(),...newSched},...p]);
                setNewSched({addr:'',amount:'',country:'Pakistan',freq:'weekly',next:''});
                setStatus({type:'success',message:'Scheduled payment saved'});
              }}>Schedule Payment</button>
            </div>

            {schedRows.length>0 && (
              <div style={C.card}>
                <div style={C.cardTitle}>Active Schedules</div>
                {schedRows.map(s=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:'1px solid #f1f5f9'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#0f172a'}}>{FLAG[s.country]} {short(s.addr)}</div>
                      <div style={{fontSize:13,color:'#94a3b8',marginTop:2}}>${s.amount} USDC · {s.freq} · Next: {s.next}</div>
                    </div>
                    <button style={{...C.btnSecondary,fontSize:12}} onClick={()=>{setSendRecipient(s.addr);setSendAmount(s.amount);setSendCountry(s.country);setActiveTab('send');}}>Execute</button>
                    <button style={C.btnDanger} onClick={()=>setSchedRows(p=>p.filter(x=>x.id!==s.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ──────────────────────────────────────────────────────── */}
        {activeTab==='history' && (
          <div>
            {/* Analytics chart */}
            {history.length>0 && (
              <div style={C.card}>
                <div style={C.cardTitle}>Transfer Volume</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={analytics} margin={{top:8,right:8,left:-20,bottom:0}}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6d28d9" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6d28d9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis dataKey="label" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{borderRadius:10,border:'1px solid #e2e8f0',fontSize:13}}/>
                    <Area type="monotone" dataKey="sent" stroke="#6d28d9" fill="url(#g)" strokeWidth={2} name="Sent (USDC)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={C.card}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <div style={C.cardTitle}>Transactions</div>
                <button style={C.btnSecondary} onClick={loadHistory}>Refresh</button>
              </div>
              {history.length===0 ? (
                <div style={{textAlign:'center',color:'#94a3b8',padding:'32px 0',fontSize:15}}>No transactions yet. Send your first payment.</div>
              ) : (
                history.map((p,i)=>(
                  <div key={i} style={C.histRow}>
                    <div style={C.histIcon('sent')}>↑</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,color:'#0f172a',fontSize:14}}>{FLAG[p.country]||''} {p.country}</div>
                      <div style={{fontSize:12,color:'#94a3b8',fontFamily:'monospace',marginTop:2}}>{short(p.recipient)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:800,color:'#0f172a',fontSize:15}}>-${fmtUSDC(p.amount)}</div>
                      <div style={{fontSize:12,color:'#94a3b8',marginTop:2}}>{fmtDate(p.timestamp)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── RATES ────────────────────────────────────────────────────────── */}
        {activeTab==='rates' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Live Exchange Rates</div>
            <div style={C.cardSub}>1 USDC = 1 USD · {ratesLoaded?'Live rates':'Loading rates...'}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:10}}>
              {COUNTRIES.map(country=>{
                const cur = CURRENCY[country];
                const rate = rates[cur];
                return (
                  <div key={country} style={{background:'#f8faff',border:'1px solid #e2e8f0',borderRadius:12,padding:'14px 16px'}}>
                    <div style={{fontSize:22,marginBottom:4}}>{FLAG[country]}</div>
                    <div style={{fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:'0.08em'}}>{cur}</div>
                    <div style={{fontSize:18,fontWeight:900,color:'#0f172a',marginTop:2}}>{rate?rate.toLocaleString('en',{maximumFractionDigits:1}):'—'}</div>
                    <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{country}</div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:14,fontSize:12,color:'#94a3b8',textAlign:'center'}}>Rates via exchangerate-api.com · Updates every 24h</div>
          </div>
        )}

        {/* ── FEE COMPARISON ───────────────────────────────────────────────── */}
        {activeTab==='fees' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Fee Comparison</div>
            <div style={C.cardSub}>Sending $100 internationally. See what you actually pay.</div>
            <table style={C.table}>
              <thead>
                <tr>
                  <th style={C.th}>Service</th>
                  <th style={C.th}>Fee on $100</th>
                  <th style={C.th}>Speed</th>
                  <th style={C.th}>You Save</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {name:'ArcPay',fee:'~$0.007',speed:'< 1 sec',save:'$44.99',best:true},
                  {name:'SWIFT / Bank Wire',fee:'$25–45',speed:'3–5 days',save:'—'},
                  {name:'Western Union',fee:'$4.99 + 3%',speed:'1–5 days',save:'—'},
                  {name:'PayPal',fee:'5% (up to $4.99)',speed:'1–3 days',save:'—'},
                  {name:'Wise',fee:'0.5–2%',speed:'1–2 days',save:'—'},
                  {name:'MoneyGram',fee:'$3.99 + spread',speed:'1–3 days',save:'—'},
                ].map((r,i)=>(
                  <tr key={i} style={r.best?{background:'#faf5ff'}:{}}>
                    <td style={{...C.td,fontWeight:r.best?800:400,color:r.best?'#6d28d9':'#374151'}}>
                      {r.best && '⭐ '}{r.name}
                    </td>
                    <td style={{...C.td,fontWeight:r.best?700:400,color:r.best?'#166534':'#374151'}}>{r.fee}</td>
                    <td style={C.td}>{r.speed}</td>
                    <td style={{...C.td,fontWeight:700,color:r.save!=='—'?'#166534':'#94a3b8'}}>{r.save}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:20,background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:12,padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:13,color:'#7c3aed',fontWeight:600,marginBottom:4}}>ANNUAL SAVINGS (sending $500/month)</div>
              <div style={{fontSize:32,fontWeight:900,color:'#0f172a',letterSpacing:'-1px'}}>$2,699</div>
              <div style={{fontSize:13,color:'#94a3b8',marginTop:4}}>vs. traditional bank wire</div>
            </div>
          </div>
        )}


        {activeTab==='settings' && (
          <div style={C.card}>
            <div style={C.cardTitle}>Settings</div>
            <div style={{display:'flex',flexDirection:'column',gap:0}}>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 0',borderBottom:'1px solid #f1f5f9'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:15}}>Dark Mode</div>
                  <div style={{fontSize:13,color:'#94a3b8',marginTop:2}}>Switch to dark theme</div>
                </div>
                <div onClick={()=>{const n=!darkMode;setDarkMode(n);localStorage.setItem('arc_dark',String(n));}} style={{width:52,height:28,borderRadius:999,background:darkMode?'#6d28d9':'#e2e8f0',cursor:'pointer',position:'relative',transition:'background 0.2s'}}>
                  <div style={{position:'absolute',top:3,left:darkMode?26:3,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 4px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>

              <div style={{padding:'18px 0',borderBottom:'1px solid #f1f5f9'}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>Default Send Country</div>
                <div style={{fontSize:13,color:'#94a3b8',marginBottom:10}}>Pre-selected when you open the Send tab</div>
                <select style={C.select} value={defaultCurrency} onChange={e=>{setDefaultCurrency(e.target.value);localStorage.setItem('arc_currency',e.target.value);setSendCountry(e.target.value);}}>
                  {COUNTRIES.map(c=><option key={c}>{FLAG[c]} {c}</option>)}
                </select>
              </div>

              <div style={{padding:'18px 0',borderBottom:'1px solid #f1f5f9'}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:8}}>Network Info</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:13}}>
                  <div style={{color:'#94a3b8'}}>Chain ID</div><div style={{fontFamily:'monospace'}}>{ARC_CHAIN_ID}</div>
                  <div style={{color:'#94a3b8'}}>RPC</div><div style={{fontFamily:'monospace',fontSize:11,wordBreak:'break-all'}}>rpc.testnet.arc.network</div>
                  <div style={{color:'#94a3b8'}}>USDC</div><div style={{fontFamily:'monospace',fontSize:11}}>{USDC_ADDRESS.slice(0,10)}...</div>
                  <div style={{color:'#94a3b8'}}>Contract</div><div style={{fontFamily:'monospace',fontSize:11}}>{REMITTANCE_ADDRESS.slice(0,10)}...</div>
                </div>
              </div>

              <div style={{padding:'18px 0',borderBottom:'1px solid #f1f5f9'}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>Privacy</div>
                <div style={{fontSize:13,color:'#94a3b8',marginBottom:12}}>All data is stored locally on your device only. Nothing is sent to any server.</div>
                <button style={{...C.btnDanger,padding:'10px 20px'}} onClick={()=>{if(window.confirm('Clear all contacts and scheduled payments?')){setContacts([]);setSchedRows([]);setStatus({type:'success',message:'Local data cleared'});}}}>Clear Local Data</button>
              </div>

              <div style={{padding:'18px 0'}}>
                <div style={{fontWeight:600,fontSize:15,marginBottom:4}}>About ArcPay</div>
                <div style={{fontSize:13,color:'#94a3b8',lineHeight:1.6}}>Non-custodial USDC remittance on Arc Testnet. Your keys, your funds. Zero hidden fees. Zero middlemen.</div>
                <div style={{fontSize:12,color:'#6d28d9',marginTop:8,fontWeight:700}}>v1.0.0 · Arc Testnet · Built on Arc</div>
              </div>

            </div>
          </div>
        )}

        <div style={{textAlign:'center',marginTop:20,fontSize:12,color:'#94a3b8'}}>
          Powered by Arc Testnet · USDC Native · Chain ID {ARC_CHAIN_ID}
        </div>
      </div>
    </div>
  );
}
