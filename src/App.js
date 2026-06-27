/* eslint-disable no-undef */
import './App.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { useInvoices } from './hooks/useInvoices';
import { useSend } from './hooks/useSend';
import { useMulti } from './hooks/useMulti';
import { useSchedule, SCHED_ABI } from './hooks/useSchedule';
import { useContractHistory } from './hooks/useContractHistory';
import Faucet from './components/Faucet';
import MultiSend from './components/MultiSend';
import TimePicker from './components/TimePicker';
import SplashScreen from './components/SplashScreen';
import CountrySelect from './components/CountrySelect';
import ConfirmModal from './components/ConfirmModal';
import QRModal from './components/QRModal';
import OnboardingModal, { SparkPayLogo } from './components/OnboardingModal';
import { IC } from './icons';
import { NavTooltip, CashbackToast, ResumeModal, WalletPicker } from './components/Modals';

import { AdminPanel } from './components/AdminPanel';
import QRScanner from './components/QRScanner';
import RatesPage from './components/RatesPage';
import RewardsPage from './components/RewardsPage';
import InvoicePage from './components/InvoicePage';
import PayPage from './components/PayPage';
import SchedulePage from './components/SchedulePage';
import SendPage from './components/SendPage';
import HistoryPage from './components/HistoryPage';
import ContactsPage from './components/ContactsPage';
import FeesPage from './components/FeesPage';
import ReceivePage from './components/ReceivePage';
import AboutPage from './components/AboutPage';
import FaqPage from './components/FaqPage';
import SettingsPage from './components/SettingsPage';

import Lottie from 'lottie-react';
import arcpayAnimation from './arcpay-animation.json';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { ARC_CHAIN_ID, ARC_CHAIN_HEX, DEFAULT_MAINTENANCE, ADMIN_ADDRESS, ARC_RPC, ARC_RPC_FALLBACK, ARC_RPC_FALLBACK2, ARC_RPC_FALLBACK3, SCHED_ADDR, REMIT_ADDR, USDC_ADDR, WC_ID, SB_URL, SB_KEY, APP_URL } from './config';
import { COUNTRIES, ALL_COUNTRIES, ALL_CURRENCY, ALL_CC, CC, flagEmoji, CURRENCY } from './config';
import { REMIT_ABI, ERC20_ABI } from './config';
import { short, sendNotif, requestNotifPermission, fmtUsdc, fmtDate, fmtTime, ls, lsSave, awaitReceipt } from './config';
import { buildChart } from './config';
import { addrColor, isValidAddr } from './config';
import { getProvider, sbFetch, sbInsert, sbSelect, sbUpdate } from './config';

function AppInner() {
  const isAdminRoute = window.location.hash === '#admin';
  const[maintenanceMode,setMaintenanceMode]=useState(DEFAULT_MAINTENANCE);
  const[maintenanceLoaded,setMaintenanceLoaded]=useState(false);
  useEffect(()=>{
    fetch(SB_URL+'/rest/v1/settings?key=eq.maintenance_mode&select=value',{
      headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY}
    }).then(r=>r.json()).then(d=>{
      if(d&&d[0])setMaintenanceMode(d[0].value==='true');
      setMaintenanceLoaded(true);
    }).catch(()=>setMaintenanceLoaded(true));
  },[]);
  const [provider,setProvider]=useState(null);const[signer,setSigner]=useState(null);const[address,setAddress]=useState('');const[balance,setBalance]=useState('0.00');const[walletName,setWalletName]=useState('');
  const wcProvRef=useRef(null);const wcInitRef=useRef(null);const[showPicker,setShowPicker]=useState(false);const isPWA=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;const[splash,setSplash]=useState(!isPWA);const[isResumed,setIsResumed]=useState(false);const[showOnboarding,setShowOnboarding]=useState(()=>!ls('arc_onboarded',false));const[faucetLoading,setFaucetLoading]=useState(false);const[showWalletPrompt,setShowWalletPrompt]=useState(false);const[faucetMsg,setFaucetMsg]=useState(null);const[lastClaim,setLastClaim]=useState(0);const[showFaucetFrame,setShowFaucetFrame]=useState(false);useEffect(()=>{if(address)setLastClaim(ls('arc_faucet_last_'+address,0));},[address]);
  const[tab,setTab]=useState('send');const[status,setStatus]=useState(null);const[loading,setLoading]=useState(false);const[mobOpen,setMobOpen]=useState(false);const[dm,setDm]=useState(false);
  const[showResumeModal,setShowResumeModal]=useState(false);const[savedSession,setSavedSession]=useState(null);
  const[showConfirm,setShowConfirm]=useState(false);const[confirmData,setConfirmData]=useState(null);const[confirmAction,setConfirmAction]=useState(null);
  const[showQR,setShowQR]=useState(false);const[rates,setRates]=useState({});
  
  const[payId,setPayId]=useState('');
  const[txns,setTxns]=useState([]);
  const[contractTxns,setContractTxns]=useState([]);
  const[contacts,setContacts]=useState([]);const[contactsLoaded,setContactsLoaded]=useState(false);const[cName,setCName]=useState('');const[cAddr,setCAddr]=useState('');const[cCtry,setCCtry]=useState('');const[editId,setEditId]=useState(null);
  const[scheds,setScheds]=useState(()=>ls('arc_scheds',[]));const[newSched,setNewSched]=useState({addr:'',amount:'',country:'',freq:'weekly',next:'',time:'09:00'});const[editSchedId,setEditSchedId]=useState(null);const[editSchedData,setEditSchedData]=useState(null);
  const[defCtry,setDefCtry]=useState(()=>ls('arc_ctry',''));
  const[cashbackPending,setCashbackPending]=useState(0);const[cashbackHistory,setCashbackHistory]=useState(()=>ls('arc_cashback_history',[]));
  useEffect(()=>{
    if(!address)return;
    const fetchCashback=()=>{
      sbSelect('cashback_balances','wallet_address=eq.'+address+'&select=pending_amount').then(rows=>{
        setCashbackPending(rows?.[0]?.pending_amount?parseFloat(rows[0].pending_amount):0);
      }).catch(()=>{});
    };
    fetchCashback();
    const t=setInterval(fetchCashback,15000);
    return()=>clearInterval(t);
  },[address]);
  const[showCashbackToast,setShowCashbackToast]=useState(false);const[cashbackToastData,setCashbackToastData]=useState(null);const[claimLoading,setClaimLoading]=useState(false);const[claimSubmitted,setClaimSubmitted]=useState(false);const[claimAmt,setClaimAmt]=useState('');const[myClaimsHistory,setMyClaimsHistory]=useState([]);const[claimsLoading,setClaimsLoading]=useState(false);const[manageTxns,setManageTxns]=useState(false);const[rateSearch,setRateSearch]=useState('');const[manageContacts,setManageContacts]=useState(false);const[selectedContacts,setSelectedContacts]=useState([]);const[cSearch,setCSearch]=useState('');const[showAdd,setShowAdd]=useState(false);const[selectedTxns,setSelectedTxns]=useState([]);const[deletedHashes,setDeletedHashes]=useState(()=>new Set([]));const[txSearch,setTxSearch]=useState('');const[txFilter,setTxFilter]=useState('all');const[txPage,setTxPage]=useState(1);const[expandedTx,setExpandedTx]=useState(null);const[showTxns,setShowTxns]=useState(true);const[pendingClaimsCount,setPendingClaimsCount]=useState(0);

  useEffect(()=>{if(address&&contactsLoaded)lsSave('arc_contacts_'+address,contacts);},[contacts,address,contactsLoaded]);
  useEffect(()=>lsSave('arc_scheds',scheds),[scheds]);
  useEffect(()=>{if(address){const cutoff=Math.floor(Date.now()/1000)-(30*24*60*60);const all=ls('arc_txhistory_'+address,[]);const recent=all.filter(t=>!t.timestamp||t.timestamp>cutoff);if(recent.length<all.length){lsSave('arc_txhistory_'+address,recent);setStatus({type:'info',msg:'Transactions older than 30 days have been removed to keep your app running smoothly.'});}setTxns(recent);}},[address]);
  useEffect(()=>{if(address)lsSave('arc_txhistory_'+address,txns);},[txns,address]);
  useEffect(()=>lsSave('arc_dm',dm),[dm]);
  useEffect(()=>lsSave('arc_ctry',defCtry),[defCtry]);
  
  useEffect(()=>lsSave('arc_cashback_history',cashbackHistory),[cashbackHistory]);
  useEffect(()=>{if(address)lsSave('arc_session',{address,walletType:walletName,ts:Date.now()});},[address,walletName]);
  useEffect(()=>{if(!splash){const s=ls('arc_session',null);if(s&&s.address&&!address&&Date.now()-s.ts<86400000){setSavedSession(s);setShowResumeModal(true);}}},[splash]);// eslint-disable-line
  useEffect(()=>{const p=new URLSearchParams(window.location.search);const pa=p.get('pay');const pamt=p.get('amount');if(pa){setSendTo(pa);if(pamt)setSendAmt(pamt);setTab('send');}const inv=p.get('inv');if(inv){try{const i=JSON.parse(atob(inv));const s=ls('arc_invoices',[]);if(!s.find(x=>x.id===i.id))lsSave('arc_invoices',[i,...s]);setPayId(i.id);setTab('pay');}catch{}}},[]);
  useEffect(()=>{fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json()).then(d=>setRates(d.rates||{})).catch(()=>setRates({PKR:279,NGN:1371,INR:96.7,PHP:61.8,BDT:122.8,MXN:17.4,BRL:5.03,IDR:17713,VND:26222,GHS:11.5,KES:129,EGP:53.1,TRY:45.6,ARS:1399,COP:3795,UAH:44.2,ETB:155.9,TZS:2572,UGX:3734,NPR:154.6}));},[]);

  const doDisconnect=useCallback(()=>{if(wcProvRef.current){wcProvRef.current.disconnect();wcProvRef.current=null;}try{if(window.ethereum)window.ethereum.request({method:'wallet_revokePermissions',params:[{eth_accounts:{}}]});}catch{}setProvider(null);setSigner(null);setAddress('');setWalletName('');setStatus(null);setBalance('0.00');setIsResumed(false);lsSave('arc_session',null);},[]);

  useEffect(()=>{if(!window.ethereum)return;const onAcc=a=>{if(!a.length){setTimeout(()=>{if(window.ethereum)window.ethereum.request({method:'eth_accounts'}).then(accounts=>{if(!accounts.length)doDisconnect();})},1000);}else setAddress(a[0]);};const onChain=(chainId)=>{};window.ethereum.on('accountsChanged',onAcc);window.ethereum.on('chainChanged',onChain);return()=>{window.ethereum.removeListener('accountsChanged',onAcc);window.ethereum.removeListener('chainChanged',onChain);};},[doDisconnect]);

  const refreshBal=useCallback(async()=>{if(!address)return;try{const rp=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});const b=await rp.getBalance(address);setBalance(parseFloat(ethers.formatUnits(b,18)).toFixed(2));}catch{}},[address]);
  useEffect(()=>{if(signer&&address){refreshBal();setContacts(ls('arc_contacts_'+address,[]));setContactsLoaded(true);setDeletedHashes(new Set(ls('arc_deleted_hashes_'+address,[])));}},[signer,address,refreshBal]);
  useEffect(()=>{if(!signer||!address)return;const t=setInterval(refreshBal,15000);return()=>clearInterval(t);},[signer,address,refreshBal]);

  const getC=()=>({remit:new ethers.Contract(REMIT_ADDR,REMIT_ABI,signer),usdc:new ethers.Contract(USDC_ADDR,ERC20_ABI,signer)});
  const { loadContractHistory } = useContractHistory({ address, provider, setContractTxns });
  const loadDeletedHashes=useCallback(async()=>{
  try{
    const rows=await sbSelect('deleted_txns','wallet_address=eq.'+address+'&select=tx_hash');
    const remote=new Set((rows||[]).map(r=>r.tx_hash));
    const local=new Set(ls('arc_deleted_hashes_'+address,[]));
    const merged=new Set([...remote,...local]);
    lsSave('arc_deleted_hashes_'+address,[...merged]);
    setDeletedHashes(merged);
    return merged;
  }catch(e){return new Set(ls('arc_deleted_hashes_'+address,[]));}
},[address]);

  const awardCashback=useCallback(async(txHash,txAmount)=>{if(!txAmount||parseFloat(txAmount)<5)return;const amt=parseFloat((parseFloat(txAmount)*0.01).toFixed(3));if(amt<=0)return;
    try{
      const r=await fetch('/api/cashback-award',{method:'POST',headers:{'Content-Type':'application/json','x-internal-secret':process.env.REACT_APP_INTERNAL_SECRET||''},body:JSON.stringify({wallet_address:address,amount:amt,tx_hash:txHash})});
      const d=await r.json();
      if(d.success){setCashbackPending(d.newBalance);}
    }catch(e){console.error('Cashback award failed:',e);}
    setCashbackHistory(prev=>[{amount:amt,txHash,ts:Date.now()},...prev.slice(0,49)]);setCashbackToastData({amount:amt.toFixed(3)});setShowCashbackToast(true);
  },[address]);
  const refreshPendingTxns=useCallback(async()=>{
    try{
      const rp=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});
      const stored=ls('arc_txhistory_'+address,[]);
      const pending=stored.filter(t=>t.status==='pending'||t.status==='submitted');
      if(!pending.length)return;
      const updated=[...stored];
      for(const tx of pending){
        try{
          const r=await rp.getTransactionReceipt(tx.hash);
          if(r&&r.blockNumber){
            const confirmed=r.status===1?'confirmed':'failed';
            const idx=updated.findIndex(t=>t.hash===tx.hash);
            if(idx>=0){updated[idx]={...updated[idx],status:confirmed};if(confirmed==='confirmed')awardCashback(tx.hash,updated[idx].amount);}
          }
        }catch(_){}
      }
      lsSave('arc_txhistory_'+address,updated);
      setTxns(updated);
    }catch(_){}
  },[address]);
  useEffect(()=>{if(tab==='history'&&signer){loadDeletedHashes().then(()=>loadContractHistory());setTxPage(1);setTxSearch('');setTxFilter('all');setExpandedTx(null);}if(signer&&address){(async()=>{try{const sched=new ethers.Contract(SCHED_ADDR,SCHED_ABI,signer.provider||provider);const scheduledTxns=txns.filter(t=>t.type==='scheduled'&&t.status==='scheduled');for(const st of scheduledTxns){const idMatch=st.id&&st.id.includes('_sched')?null:null;}const count=Number(await sched.paymentCount());const onChainMap={};for(let i=0;i<count;i++){const p=await sched.getPayment(i);if(p.sender.toLowerCase()===address.toLowerCase()){onChainMap[i]=p;}}setTxns(prev=>{let changed=false;const updated=prev.map(t=>{if(t.type==='scheduled'&&t.status==='scheduled'){const match=Object.entries(onChainMap).find(([id,p])=>p.recipient.toLowerCase()===t.recipient.toLowerCase()&&Math.abs(parseFloat(ethers.formatUnits(p.amount,18))-parseFloat(t.amount))<0.001&&Number(p.releaseTime)===Number(t.releaseTime||t.timestamp));if(match){const[,p]=match;if(p.executed){changed=true;return{...t,status:'confirmed'};}if(p.cancelled){changed=true;return{...t,status:'cancelled'};}}}return t;});if(changed)lsSave('arc_txhistory_'+address,updated);return changed?updated:prev;});}catch(e){console.log('sync error',e);}})();}},[tab,signer,address]);useEffect(()=>{setStatus(null);},[tab]);useEffect(()=>{if(tab==='rewards'&&address){fetchMyClaims();}},[tab,address]);useEffect(()=>{if(tab==='settings'&&address&&address.toLowerCase()==='0x9e086e6c07d5108ce40d84e9df1ce43caedd2306'){sbSelect('cashback_claims','status=eq.pending&select=id').then(rows=>setPendingClaimsCount(rows?.length||0)).catch(()=>{});}},[tab,address]);

  const fetchMyClaims=async()=>{if(!address)return;setClaimsLoading(true);try{const rows=await sbSelect('cashback_claims','wallet_address=eq.'+address+'&order=timestamp.desc&limit=10');setMyClaimsHistory(rows||[]);if(rows&&rows.length>0&&rows[0].status==='paid'&&claimSubmitted===true){setClaimSubmitted('paid');setTimeout(()=>setClaimSubmitted(false),5000);}}catch(e){console.error(e);}setClaimsLoading(false);};
  const claimCashback=async()=>{const amt=parseFloat(claimAmt)||cashbackPending;if(cashbackPending<5||claimLoading||amt<5||amt>cashbackPending)return;setClaimLoading(true);try{
    await sbInsert('cashback_claims',{wallet_address:address,amount:amt,timestamp:new Date().toISOString(),status:'pending'});
    const newBalance=parseFloat((cashbackPending-amt).toFixed(3));
    await sbUpdate('cashback_balances','wallet_address=eq.'+address,{pending_amount:newBalance,updated_at:new Date().toISOString()});
    setClaimSubmitted(true);setCashbackPending(newBalance);setStatus({type:'success',msg:'Cashback claim submitted. Your USDC will be sent to your wallet shortly.'});
  }catch(e){setStatus({type:'error',msg:'Claim failed: '+e.message});}setClaimLoading(false);};

  const addArc=p=>({chainId:ARC_CHAIN_HEX,chainName:'Arc Testnet',nativeCurrency:{name:'USDC',symbol:'USDC',decimals:18},rpcUrls:[ARC_RPC||ARC_RPC_FALLBACK],blockExplorerUrls:['https://testnet.arcscan.app'],...p});
  const ensureArc=async eth=>{try{await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]});}catch(e){if(e.code===4902||e.code===-32603){setStatus({type:'info',msg:'Adding Arc Testnet to your wallet...'});try{await eth.request({method:'wallet_addEthereumChain',params:[addArc({})]});}catch(ae){setStatus({type:'error',msg:'Please add Arc Testnet manually in your wallet settings. Chain ID: 5042002, RPC: https://rpc.testnet.arc.network'});throw ae;}}else throw e;}};
  const finaliseConnect=async bp=>{bp.pollingInterval=800;const s=await bp.getSigner();const addr=await s.getAddress();setProvider(bp);setSigner(s);setAddress(addr);setIsResumed(false);setStatus({type:'success',msg:'Connected: '+short(addr)});requestNotifPermission();};

  const connectBrowser=async(type,provObj)=>{try{const eth=provObj||(window.okxwallet&&(type==='OKX Wallet'||provObj?.isOkxWallet||provObj?.isOKExWallet)?window.okxwallet:null)||await getProvider();if(!eth){setStatus({type:'error',msg:'No wallet found. Install MetaMask.'});return;}await eth.request({method:'eth_requestAccounts'});const bp=new ethers.BrowserProvider(eth,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});await ensureArc(eth);let name='Browser Wallet';if(eth.isMises||(window.mises?.ethereum===eth))name='Mises';else if(eth.isMetaMask&&!eth.isBraveWallet)name='MetaMask';else if(eth.isBraveWallet)name='Brave';else if(eth.isCoinbaseWallet)name='Coinbase';else if(eth.isOkxWallet||eth.isOKExWallet)name='OKX';setWalletName(name);await finaliseConnect(bp);}catch(e){setStatus({type:'error',msg:e.message||'Connection failed'});}};

  const connectWC=async()=>{try{const wcp=await EthereumProvider.init({projectId:WC_ID,chains:[1],optionalChains:[ARC_CHAIN_ID],showQrModal:true,qrModalOptions:{themeMode:'light',themeVariables:{'--wcm-font-family':'inherit'}},methods:['eth_sendTransaction','personal_sign','wallet_addEthereumChain','wallet_switchEthereumChain'],events:['chainChanged','accountsChanged']});await wcp.enable();wcp.on('accountsChanged',a=>{if(!a.length)doDisconnect();else setAddress(a[0]);});wcp.on('disconnect',doDisconnect);try{await wcp.request({method:'wallet_switchEthereumChain',params:[{chainId:ARC_CHAIN_HEX}]});}catch(e){if(e.code===4902)await wcp.request({method:'wallet_addEthereumChain',params:[addArc({})]});}const bp=new ethers.BrowserProvider(wcp,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});wcProvRef.current=wcp;setWalletName('WalletConnect');await finaliseConnect(bp);}catch(e){setStatus({type:'error',msg:e.message||'WalletConnect failed'});}};

  const exportCSV=()=>{const rows=[['Type','Hash','Recipient','Amount (USDC)','Country','Date','Status'],...txns.map(t=>['Send',t.hash||'',t.recipient||'',t.amount||'',t.country||'',fmtDate(t.timestamp),t.status||'']),...ls('arc_invoices',[]).map(i=>['Invoice',i.id||'',i.payer||'',i.amount||'',i.country||'',fmtDate(i.ts),i.paid?'Paid':'Unpaid']),...scheds.map(s=>['Scheduled','',s.addr||'',s.amount||'',s.country||'',s.next||'',s.freq||''])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sparkpay-history.csv';a.click();URL.revokeObjectURL(url);};

  const schedHashes=new Set(contractTxns.filter(r=>r.type==='scheduled'||r.type==='refund'||r.type==='scheduled_received').map(r=>r.hash));const allTxns=[...txns.filter(t=>!(t.type==='scheduled'&&contractTxns.some(c=>c.type==='scheduled'&&c.recipient.toLowerCase()===(t.recipient||'').toLowerCase()&&Math.abs(parseFloat(c.amount)-parseFloat(t.amount))<0.01))),...contractTxns.filter(r=>!txns.find(l=>l.hash===r.hash))].filter(t=>!deletedHashes.has(t.hash)).sort((a,b)=>Number(b.sortTime||b.timestamp||0)-Number(a.sortTime||a.timestamp||0));
  const chartData=buildChart(allTxns);const totalSent=allTxns.filter(t=>!t.received&&t.type!=='refund'&&t.status!=='scheduled').reduce((s,t)=>{const n=typeof t.amount==='bigint'||typeof t.amount==='object'?parseFloat(ethers.formatUnits(BigInt(t.amount.toString()),18)):parseFloat(t.amount);const v=isNaN(n)?0:n;return s+(v<0?0:v);},0);
  const hasPendingTx=txns.some(t=>t.status==='pending'||t.status==='submitted');
  const recentRecipients=[...new Set(txns.filter(t=>t.recipient&&!t.hash?.startsWith('0xdemo')).map(t=>t.recipient))].slice(0,5);
  const statusCls=s=>!s?null:({success:'ap-status ap-status-success',error:'ap-status ap-status-error',warning:'ap-status ap-status-warning',info:'ap-status ap-status-info'}[s.type]||'ap-status ap-status-info');
  const cleanErr=e=>{if(!e)return'Something went wrong. Please try again.';if(e?.code===4001||e?.code==='ACTION_REJECTED')return'Transaction cancelled.';if(e?.reason)return e.reason;if(e?.message){const m=e.message;if(m.includes('insufficient'))return'Insufficient balance.';if(m.includes('reverted'))return'Transaction reverted: '+(e?.data?.message||e?.error?.message||'Check balance and release time must be at least 10 mins in future.');if(m.includes('Too early'))return'Release time must be in the future.';if(m.includes('user rejected'))return'Transaction cancelled.';if(m.includes('network'))return'Network error. Please check your connection.';if(m.length<100)return m;}return'Transaction failed. Please try again.';};
  const { invPayer, setInvPayer, invAmt, setInvAmt, invDesc, setInvDesc, invCtry, setInvCtry, invId, setInvId, payDet, setPayDet, handleCreateInv, handlePayInv, handlePayInvReview } = useInvoices({ address, signer, provider, setStatus, setLoading, setTxns, awardCashback, refreshBal, payId, setPayId, cleanErr, setShowConfirm });
  const { sendTo, setSendTo, sendAmt, setSendAmt, showScanner, setShowScanner, sendCtry, setSendCtry, handleSend, handleSendReview } = useSend({ signer, provider, address, walletName, rates, setStatus, setLoading, setTxns, awardCashback, refreshBal, cleanErr, setConfirmData, setConfirmAction, setShowConfirm });
  const convertedVal=(()=>{if(!sendAmt||!sendCtry)return null;const r=rates[CURRENCY[sendCtry]];if(!r)return null;return(parseFloat(sendAmt)*r).toLocaleString('en',{maximumFractionDigits:0});})();
  const { multi, setMulti, handleMulti, handleMultiReview } = useMulti({ signer, address, walletName, setStatus, setLoading, setTxns, awardCashback, refreshBal, cleanErr, setConfirmData, setConfirmAction, setShowConfirm, setShowWalletPrompt, getC });
  const txBadge=st=>({confirmed:'ap-tx-badge ap-tx-confirmed',pending:'ap-tx-badge ap-tx-pending',failed:'ap-tx-badge ap-tx-failed',submitted:'ap-tx-badge ap-tx-submitted'}[st]||'ap-tx-badge ap-tx-pending');

  const isDesktop=window.innerWidth>=769;
  const SIDEBAR_SECTIONS=[
    {title:'Transfers',items:[{id:'send',label:'Send',ICN:IC.SendFab,info:'Transfer USDC to any wallet instantly on Arc Testnet'},{id:'multi',label:'Multi Send',ICN:IC.Multi,info:'Send USDC to multiple recipients in one session'},{id:'invoice',label:'Invoice',ICN:IC.Invoice,info:'Create USDC payment requests stored on Supabase'},{id:'pay',label:'Pay Invoice',ICN:IC.Pay,info:'Look up and pay an invoice using its unique ID'}]},
    ...(isDesktop?[{title:'My Account',items:[{id:'history',label:'History',ICN:IC.History,info:'View all your transactions',dot:hasPendingTx},{id:'receive',label:'Receive',ICN:IC.Receive,info:'Generate QR code or payment link'},{id:'contacts',label:'Contacts',ICN:IC.Contacts,info:'Save wallet addresses for quick access'},{id:'rewards',label:'Rewards',ICN:IC.Rewards,info:'Earn cashback on every confirmed transaction'}]}]:[]),
    {title:'Analytics',items:[{id:'rates',label:'Exchange Rates',ICN:IC.Rates,info:'Live USDC to local currency conversion rates for 150+ countries'},{id:'fees',label:'Fee Compare',ICN:IC.Compare,info:'See how SparkPay compares to banks and other transfer services'}]},
    {title:'Tools',items:[{id:'schedule',label:'Scheduled',ICN:IC.Schedule,info:'Set up recurring payment reminders and pre-fill the Send form'},{id:'faucet',label:'Faucet',ICN:IC.Receive,info:'Claim 20 free testnet USDC every 2 hours via Circle Faucet'}]},
    {title:'More',items:[{id:'settings',label:'Settings',ICN:IC.Settings,info:'Customize your SparkPay experience'},{id:'about',label:'About SparkPay',ICN:IC.About,info:'Learn more about SparkPay and how it works'},{id:'faq',label:'FAQ',ICN:IC.About,info:'Frequently asked questions about SparkPay'}]},
  ];
  const BOTTOM_TABS=[{id:'history',label:'History',ICN:IC.History},{id:'receive',label:'Receive',ICN:IC.Receive},{id:'send',label:'Send',ICN:IC.SendFab,fab:true},{id:'contacts',label:'Contacts',ICN:IC.Contacts},{id:'rewards',label:'Rewards',ICN:IC.Rewards}];
  const PAGE_TITLES={send:'Send USDC',multi:'Multi Send',invoice:'Invoice',pay:'Pay Invoice',contacts:'Contacts',schedule:'Scheduled',history:'History',rates:'Exchange Rates',fees:'Fee Comparison',rewards:'Rewards',settings:'Settings',about:'About SparkPay',faq:'FAQ',receive:'Receive',faucet:'Faucet'};

const { handleSchedule, handleExecute, handleCancelSched } = useSchedule({ signer, address, newSched, setNewSched, setLoading, setStatus, setTxns, refreshBal });
const batchGroups={};
allTxns.forEach(t=>{if(!t.hash)return;if(!batchGroups[t.hash])batchGroups[t.hash]=[];batchGroups[t.hash].push(t);});
const dedupedTxns=Object.entries(batchGroups).map(([hash,txs])=>txs.length>1?{...txs[0],isBatch:true,batchTxns:txs,amount:txs.reduce((s,t)=>s+parseFloat(t.amount||0),0)}:txs[0]);
const PAGE_SIZE=10;
const filtered=dedupedTxns.filter(t=>{const ms=!txSearch||(t.recipient||'').toLowerCase().includes(txSearch.toLowerCase())||(t.hash||'').toLowerCase().includes(txSearch.toLowerCase());const mf=txFilter==='all'||(txFilter==='confirmed'&&(t.status==='confirmed'||t.status==='scheduled'))||(txFilter==='pending'&&(t.status==='pending'||t.status==='submitted'))||(txFilter==='failed'&&t.status==='failed');return ms&&mf;});
const totalPages=Math.ceil(filtered.length/PAGE_SIZE)||1;

  if(!isAdminRoute&&maintenanceLoaded&&maintenanceMode&&address&&address.toLowerCase()!==ADMIN_ADDRESS){
    return(<div style={{position:'fixed',inset:0,background:'#0a0a0a',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center'}}>
      <div style={{fontSize:48,marginBottom:16}}>🛠️</div>
      <div style={{fontSize:20,fontWeight:800,color:'#fff',marginBottom:8}}>Under Maintenance</div>
      <div style={{fontSize:14,color:'#999',maxWidth:320,lineHeight:1.6}}>SparkPay is currently undergoing maintenance. Please check back shortly.</div>
    </div>);
  }
  if(isAdminRoute){
    return(<div className={'ap-root'+(dm?'':' light')}><AdminPanel address={address} signer={signer} maintenanceMode={maintenanceMode} setMaintenanceMode={setMaintenanceMode}/>{!address&&<div style={{position:'fixed',bottom:24,left:0,right:0,display:'flex',justifyContent:'center'}}><div className="ap-connect-card" style={{maxWidth:360,width:'calc(100% - 48px)'}}><div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:16,color:'var(--tx1)',marginBottom:12}}>Connect Wallet</div><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowPicker(true)}>Connect Wallet</button>{showPicker&&<WalletPicker onPick={(type,p,name)=>{setShowPicker(false);if(name)setWalletName(name);connectBrowser(type,p);}} onClose={()=>setShowPicker(false)}/>}</div></div>}</div>);
  }
  return(
    <div className={'ap-root'+(dm?'':' light')}>
      {splash&&<SplashScreen onDone={()=>setSplash(false)}/>}{!splash&&showOnboarding&&<OnboardingModal onDone={()=>{lsSave('arc_onboarded',true);setShowOnboarding(false);}}/>}
      {showWalletPrompt&&<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0 16px 32px'}}><div style={{background:'var(--card)',borderRadius:24,padding:'28px 24px',width:'100%',maxWidth:480,textAlign:'center'}}><div style={{width:56,height:56,borderRadius:16,background:'var(--acd)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='var(--ac)' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='7' width='20' height='14' rx='2'/><path d='M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2'/><line x1='12' y1='12' x2='12' y2='16'/><line x1='10' y1='14' x2='14' y2='14'/></svg></div><div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:18,color:'var(--tx1)',marginBottom:8}}>Confirm in Your Wallet</div><div style={{fontSize:14,color:'var(--tx2)',lineHeight:1.6,marginBottom:20}}>Open your wallet extension and confirm the transaction to complete the batch send to all recipients.</div><div style={{fontSize:12,color:'var(--tx3)'}}>Waiting for your confirmation...</div><button onClick={()=>setShowWalletPrompt(false)} style={{marginTop:20,background:'none',border:'1px solid var(--b1)',borderRadius:10,padding:'8px 24px',color:'var(--tx2)',fontSize:13,cursor:'pointer'}}>Cancel</button></div></div>}
        {showFaucetFrame&&<div style={{position:'fixed',inset:0,zIndex:999,background:'#000',display:'flex',flexDirection:'column'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',background:'#111'}}><span style={{color:'#fff',fontWeight:700}}>Circle Faucet</span><button onClick={()=>setShowFaucetFrame(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>×</button></div><iframe src={'https://faucet.circle.com/?address='+address+'&blockchain=ARC&token=USDC'} style={{flex:1,border:'none',width:'100%'}} title="Circle Faucet"/></div>}
      {showResumeModal&&savedSession&&<ResumeModal session={savedSession} onResume={()=>{setShowResumeModal(false);const wt=savedSession.walletType||'';if(wt&&wt!=='WalletConnect'){connectBrowser(wt);}else{setShowPicker(true);}}} onNew={()=>setShowResumeModal(false)}/>}
      {showConfirm&&confirmData&&<ConfirmModal data={confirmData} walletName={walletName} onConfirm={()=>{if(confirmAction)confirmAction()();}} onCancel={()=>{setShowConfirm(false);setConfirmData(null);setConfirmAction(null);}}/>}
      {showQR&&address&&<QRModal address={address} onClose={()=>setShowQR(false)}/>}
      {showCashbackToast&&cashbackToastData&&<CashbackToast amount={cashbackToastData.amount} rarity={cashbackToastData.rarity} onClose={()=>setShowCashbackToast(false)}/>}

      {!splash&&!address&&(
        <div style={{minHeight:'100vh',background:'var(--bg)',overflowY:'auto'}}>
          {/* Hero Section */}
          <div style={{maxWidth:480,margin:'0 auto',padding:'16px 24px 0'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:40}}>
              <SparkPayLogo size={48}/>
              <span style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:18,color:'var(--tx1)'}}>SparkPay</span>
            </div>
            <div style={{textAlign:'center',marginBottom:40}}>
              <div style={{fontFamily:'var(--fd)',fontSize:40,fontWeight:900,color:'var(--tx1)',lineHeight:1.1,letterSpacing:'-0.5px',marginBottom:12}}>Send USDC<br/><span style={{color:'var(--ac)'}}>Globally.</span></div>
              <div style={{fontSize:14,color:'var(--tx2)',lineHeight:1.6}}>Send money across borders instantly.<br/>Zero fees. Instant settlement. Powered by Arc.</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:32}}>
              {[['150+','Countries'],['~0','Fees'],['Instant','Settlement']].map(([v,l])=>(
                <div key={l} style={{background:'var(--card)',border:'1px solid var(--b0)',borderRadius:14,padding:'14px 8px',textAlign:'center'}}>
                  <div style={{fontFamily:'var(--fd)',fontSize:18,fontWeight:900,color:'var(--ac)'}}>{v}</div>
                  <div style={{fontSize:10,color:'var(--tx3)',marginTop:3,fontWeight:600}}>{l}</div>
                </div>
              ))}
            </div>
            {/* Connect Card */}
            <div className="ap-connect-card" style={{marginBottom:48}}>
              <div style={{fontFamily:'var(--fd)',fontWeight:800,fontSize:18,color:'var(--tx1)',marginBottom:4}}>Get Started</div>
              <div style={{fontSize:13,color:'var(--tx2)',marginBottom:20}}>Connect your wallet to start sending USDC</div>
              <div className="ap-connect-btns">
                {showPicker?<WalletPicker onPick={(type,p,name)=>{setShowPicker(false);if(name)setWalletName(name);connectBrowser(type,p);}} onClose={()=>setShowPicker(false)}/>:<><button className="ap-btn ap-btn-primary" style={{marginTop:0}} onClick={()=>setShowPicker(true)}>Connect Wallet</button><div className="ap-cdivider">or</div><button className="ap-btn ap-btn-outline-full" onClick={connectWC}><IC.WC/> Connect via WalletConnect</button><ConnectTroubleshoot/></>}
              </div>
            </div>
          </div>
        </div>
      )}
      {address&&(
        <div className="ap-layout">
          <aside className={'ap-sidebar'+(mobOpen?' mob-open':'')}>
            <div className="ap-logo-area"><img src="/sparkpay-logo.jpg" width="50" height="50" style={{borderRadius:0,objectFit:"contain",background:"none"}}/><div><div className="ap-logo-name">SparkPay</div><div className="ap-logo-tag">Remittance</div></div></div>
            <nav className="ap-nav">
              {SIDEBAR_SECTIONS.map(sec=>(<div key={sec.title}><div className="ap-nav-sec">{sec.title}</div>{sec.items.map(({id,label,ICN,info,dot})=>(<div key={id} className={'ap-nav-item'+(tab===id?' active':'')} onClick={()=>{setTab(id);setMobOpen(false);setStatus(null);}}><ICN/>{label}{dot&&<span style={{width:7,height:7,borderRadius:'50%',background:'var(--re)',display:'inline-block',marginLeft:2,flexShrink:0}}/>}<NavTooltip text={info}/></div>))}</div>))}
            </nav>
            <div className="ap-sidebar-foot">
              <div className="ap-net-badge"><span className="ap-net-dot"/>Arc Testnet<span style={{color:'var(--tx3)',marginLeft:4,fontWeight:500}}>#5042002</span></div>
              <div className="ap-wallet-pill"><div className="ap-wallet-icon"><IC.Wallet/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:10,color:'var(--tx3)',fontWeight:600,letterSpacing:'.06em',textTransform:'uppercase'}}>{walletName||'Wallet'}</div><div style={{fontSize:12,fontWeight:600,fontFamily:'var(--fd)',color:'var(--tx1)'}}>{short(address)}</div></div><div style={{fontSize:13,fontWeight:700,color:'var(--ac2)',fontFamily:'var(--fd)'}}>${balance}</div></div>
            </div>
          </aside>
          {mobOpen&&<div onClick={()=>setMobOpen(false)} style={{position:'fixed',inset:0,zIndex:99,background:'transparent'}}/>}
          <div className="ap-topbar">
            <div style={{display:'flex',alignItems:'center',gap:12}}><button className="ap-btn-icon mob-show" onClick={()=>setMobOpen(true)} style={{border:'none',background:'var(--elev)'}}><IC.Menu/></button><span style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:16,letterSpacing:'-.2px',color:'var(--tx1)'}}>{PAGE_TITLES[tab]||'SparkPay'}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{fontFamily:'var(--fd)',fontWeight:700,fontSize:13,color:'var(--ac2)',background:'var(--acd)',padding:'6px 12px',borderRadius:8,border:'1px solid var(--acs)'}}>${balance}</div><div className="ap-badge ap-badge-blue mob-hide" style={{padding:'6px 12px',fontSize:12,fontFamily:'monospace'}}>{short(address)}</div><button className="ap-btn ap-btn-icon" onClick={refreshBal} style={{fontSize:24,lineHeight:1,padding:"6px 10px"}} title="Refresh Balance">↻</button><button className="ap-btn ap-btn-danger" onClick={doDisconnect}>Disconnect</button></div>
          </div>
          <div className="ap-page"><div className="ap-page-enter">{status&&<div className={statusCls(status)} style={{marginBottom:20}}>{status.msg}</div>}{(()=>{switch(tab){case 'send':return <SendPage contacts={contacts} sendAmt={sendAmt} setSendAmt={setSendAmt} sendTo={sendTo} setSendTo={setSendTo} sendCtry={sendCtry} setSendCtry={setSendCtry} convertedVal={convertedVal} showScanner={showScanner} setShowScanner={setShowScanner} handleSendReview={handleSendReview} loading={loading}/>;case 'multi':return <MultiSend multi={multi} setMulti={setMulti} loading={loading} handleMultiReview={handleMultiReview}/>;case 'invoice':return <InvoicePage invPayer={invPayer} setInvPayer={setInvPayer} invAmt={invAmt} setInvAmt={setInvAmt} invDesc={invDesc} setInvDesc={setInvDesc} invCtry={invCtry} setInvCtry={setInvCtry} invId={invId} handleCreateInv={handleCreateInv} loading={loading} setPayId={setPayId} setTab={setTab}/>;case 'pay':return <PayPage payId={payId} setPayId={setPayId} payDet={payDet} setPayDet={setPayDet} handlePayInvReview={handlePayInvReview} loading={loading} setConfirmData={setConfirmData} setConfirmAction={setConfirmAction} setShowConfirm={setShowConfirm}/>;case 'contacts':return <ContactsPage contacts={contacts} setContacts={setContacts} txns={allTxns} setTab={setTab} setSendTo={setSendTo} setSendCtry={setSendCtry} setStatus={setStatus} cName={cName} setCName={setCName} cAddr={cAddr} setCAddr={setCAddr} cCtry={cCtry} setCCtry={setCCtry} cSearch={cSearch} setCSearch={setCSearch} editId={editId} setEditId={setEditId} showAdd={showAdd} setShowAdd={setShowAdd} manageContacts={manageContacts} setManageContacts={setManageContacts} selectedContacts={selectedContacts} setSelectedContacts={setSelectedContacts}/>;case 'schedule':return <SchedulePage newSched={newSched} setNewSched={setNewSched} handleSchedule={handleSchedule} handleExecute={handleExecute} handleCancelSched={handleCancelSched} loading={loading} address={address} provider={provider} signer={signer}/>;case 'history':return <HistoryPage allTxns={allTxns} txns={txns} chartData={chartData} totalSent={totalSent} dedupedTxns={dedupedTxns} filtered={filtered} totalPages={totalPages} txSearch={txSearch} setTxSearch={setTxSearch} txFilter={txFilter} setTxFilter={setTxFilter} txPage={txPage} setTxPage={setTxPage} manageTxns={manageTxns} setManageTxns={setManageTxns} selectedTxns={selectedTxns} setSelectedTxns={setSelectedTxns} expandedTx={expandedTx} setExpandedTx={setExpandedTx} exportCSV={exportCSV} refreshPendingTxns={refreshPendingTxns} loadContractHistory={loadContractHistory} address={address} deletedHashes={deletedHashes} setDeletedHashes={setDeletedHashes} setTxns={setTxns}/>;case 'rates':return <RatesPage rates={rates} rateSearch={rateSearch} setRateSearch={setRateSearch}/>;case 'fees':return <FeesPage/>;case 'rewards':return <RewardsPage cashbackPending={cashbackPending} claimAmt={claimAmt} setClaimAmt={setClaimAmt} claimCashback={claimCashback} claimLoading={claimLoading} claimSubmitted={claimSubmitted} myClaimsHistory={myClaimsHistory} claimsLoading={claimsLoading} fetchMyClaims={fetchMyClaims} cashbackHistory={cashbackHistory}/>;case 'receive':return <ReceivePage address={address} setShowQR={setShowQR}/>;case 'settings':return <SettingsPage dm={dm} setDm={setDm} defCtry={defCtry} setDefCtry={setDefCtry} setSendCtry={setSendCtry} address={address} pendingClaimsCount={pendingClaimsCount} setPendingClaimsCount={setPendingClaimsCount} setContacts={setContacts} setScheds={setScheds} setTxns={setTxns} setCashbackPending={setCashbackPending} setCashbackHistory={setCashbackHistory} setStatus={setStatus}/>;case 'about':return <AboutPage/>;case 'faq':return <FaqPage/>;case 'faucet':return <Faucet address={address} balance={balance} setBalance={setBalance} faucetLoading={faucetLoading} setFaucetLoading={setFaucetLoading} faucetMsg={faucetMsg} setFaucetMsg={setFaucetMsg} lastClaim={lastClaim} setLastClaim={setLastClaim}/>;default:return <SendPage contacts={contacts} sendAmt={sendAmt} setSendAmt={setSendAmt} sendTo={sendTo} setSendTo={setSendTo} sendCtry={sendCtry} setSendCtry={setSendCtry} convertedVal={convertedVal} showScanner={showScanner} setShowScanner={setShowScanner} handleSendReview={handleSendReview} loading={loading}/>;}})()} <div style={{textAlign:'center',marginTop:28,fontSize:11,color:'var(--tx3)'}}>SparkPay on Arc Testnet, Chain {ARC_CHAIN_ID} &nbsp;<a href="https://testnet.arcscan.app" target="_blank" rel="noreferrer" style={{color:'var(--ac)',textDecoration:'none'}}>Block Explorer</a></div></div></div>
          <nav className="ap-botnav">
            {BOTTOM_TABS.map(({id,label,ICN,fab})=>fab?(<div key={id} className={'ap-bot-fab-wrap'+(tab===id?' active':'')} onClick={()=>setTab(id)}><div className="ap-fab"><ICN/></div><span>{label}</span></div>):(<div key={id} className={'ap-bot-item'+(tab===id?' active':'')} onClick={()=>setTab(id)}><div style={{position:'relative',display:'inline-flex'}}><ICN/>{id==='rewards'&&cashbackPending>0&&<span className="ap-ndot"/>}</div>{label}</div>))}
          </nav>
        </div>
      )}
    </div>
  );
}

const ConnectTroubleshoot=()=>{const[open,setOpen]=React.useState(false);const[item,setItem]=React.useState(null);const issues=[['My wallet is not showing up in the list.','Make sure your wallet app is installed on this device and you are using a browser that supports wallet connections. On mobile, try opening SparkPay directly inside your wallet app browser.'],['I approved the connection but nothing happened.','Close the wallet popup and try connecting again. Sometimes the connection request times out. If it keeps happening, refresh the page and try once more.'],['It says wrong network or chain.','SparkPay runs on Arc Testnet. Open your wallet, go to network settings, and switch to Arc Testnet. If Arc Testnet is not listed, SparkPay will add it automatically when you connect.'],['WalletConnect QR code is not appearing.','Make sure you are not blocking popups in your browser. Try switching to a different browser or use the direct Connect Wallet button instead.'],['I clicked WalletConnect but nothing happened.','WalletConnect takes a few seconds to load all supported wallets. Wait 6 to 7 seconds and the popup will appear on its own. Do not tap the button again.'],['Nothing is working.','Reach out on Telegram and describe what is happening. We will help you get connected.']];return(<div style={{marginTop:16}}><button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',color:'var(--tx3)',fontSize:12,fontWeight:600,cursor:'pointer',padding:'4px 0',display:'flex',alignItems:'center',gap:6,width:'100%',justifyContent:'center'}}><span>{open?'Hide':'Having trouble connecting?'}</span><span style={{fontSize:14}}>{open?'−':'+'}</span></button>{open&&<div style={{marginTop:12,borderRadius:12,border:'1px solid var(--b1)',overflow:'hidden'}}>{issues.map(([q,a],i)=>(<div key={i} style={{borderBottom:i<issues.length-1?'1px solid var(--b0)':'none'}}><div onClick={()=>setItem(item===i?null:i)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',cursor:'pointer'}}><div style={{fontSize:12,fontWeight:600,color:'var(--tx1)',paddingRight:8,textAlign:'left'}}>{q}</div><div style={{fontSize:16,color:'var(--tx3)',flexShrink:0}}>{item===i?'−':'+'}</div></div>{item===i&&<div style={{fontSize:12,color:'var(--tx2)',lineHeight:1.8,padding:'0 14px 12px'}}>{a}{i===issues.length-1&&<a href='https://t.me/Sam50506' target='_blank' rel='noreferrer' style={{display:'block',marginTop:10,color:'var(--ac)',fontWeight:700,textDecoration:'none'}}>Open Telegram</a>}</div>}</div>))}</div>}</div>);};

function App(){return <AppInner/>;}
export default App;