import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ID_HEX = '0x4CEF52';
const ARC_RPC = 'https://rpc.testnet.arc.network';
const REMITTANCE_ADDRESS = '0x71ec1d33f56a9f72a05c507647e1455b238cb7da';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const USDC_DECIMALS = 6;
const GAS_LIMIT = 300000;
const WC_PROJECT_ID = '8bb24a433758c9a403057e2e3f2c371b';

const CURRENCY_RATES = {
  Mexico: { code: 'MXN', rate: 17.2, symbol: '$', flag: '🇲🇽' },
  Brazil: { code: 'BRL', rate: 5.1, symbol: 'R$', flag: '🇧🇷' },
  India: { code: 'INR', rate: 83.5, symbol: '₹', flag: '🇮🇳' },
  Philippines: { code: 'PHP', rate: 56.8, symbol: '₱', flag: '🇵🇭' },
  Nigeria: { code: 'NGN', rate: 1580, symbol: '₦', flag: '🇳🇬' },
  Indonesia: { code: 'IDR', rate: 15800, symbol: 'Rp', flag: '🇮🇩' },
  Pakistan: { code: 'PKR', rate: 278, symbol: '₨', flag: '🇵🇰' },
  Bangladesh: { code: 'BDT', rate: 110, symbol: '৳', flag: '🇧🇩' },
  Vietnam: { code: 'VND', rate: 24800, symbol: '₫', flag: '🇻🇳' },
  Ghana: { code: 'GHS', rate: 12.5, symbol: 'GH₵', flag: '🇬🇭' },
  Kenya: { code: 'KES', rate: 129, symbol: 'KSh', flag: '🇰🇪' },
  Egypt: { code: 'EGP', rate: 48.5, symbol: 'E£', flag: '🇪🇬' },
  Turkey: { code: 'TRY', rate: 32.1, symbol: '₺', flag: '🇹🇷' },
  Argentina: { code: 'ARS', rate: 880, symbol: '$', flag: '🇦🇷' },
  Colombia: { code: 'COP', rate: 3950, symbol: '$', flag: '🇨🇴' },
  Ukraine: { code: 'UAH', rate: 38.5, symbol: '₴', flag: '🇺🇦' },
  Ethiopia: { code: 'ETB', rate: 56.5, symbol: 'Br', flag: '🇪🇹' },
  Tanzania: { code: 'TZS', rate: 2520, symbol: 'TSh', flag: '🇹🇿' },
  Uganda: { code: 'UGX', rate: 3780, symbol: 'USh', flag: '🇺🇬' },
  Nepal: { code: 'NPR', rate: 133, symbol: 'Rs', flag: '🇳🇵' },
};

const COUNTRIES = Object.keys(CURRENCY_RATES);

const REMITTANCE_ABI = [
  { inputs: [{ name: 'token', type: 'address' }, { name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'country', type: 'string' }], name: 'sendMoney', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'payer', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'description', type: 'string' }, { name: 'country', type: 'string' }], name: 'createInvoice', outputs: [{ name: '', type: 'bytes32' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'token', type: 'address' }, { name: 'invoiceId', type: 'bytes32' }], name: 'payInvoice', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'user', type: 'address' }], name: 'getPayments', outputs: [{ components: [{ name: 'sender', type: 'address' }, { name: 'recipient', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'country', type: 'string' }, { name: 'timestamp', type: 'uint256' }], name: '', type: 'tuple[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: '', type: 'bytes32' }], name: 'invoices', outputs: [{ name: 'creator', type: 'address' }, { name: 'payer', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'description', type: 'string' }, { name: 'country', type: 'string' }, { name: 'paid', type: 'bool' }, { name: 'timestamp', type: 'uint256' }], stateMutability: 'view', type: 'function' },
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

const shortenAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
const formatUSDC = (amount) => amount ? parseFloat(ethers.formatUnits(amount, USDC_DECIMALS)).toFixed(2) : '0';
const formatDate = (ts) => ts ? new Date(Number(ts) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const formatLocalAmount = (usdcAmount, country) => {
  const curr = CURRENCY_RATES[country];
  if (!curr || !usdcAmount) return '';
  const local = parseFloat(usdcAmount) * curr.rate;
  return `${curr.flag} ${curr.symbol}${local.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${curr.code}`;
};
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:#F0F2F5;min-height:100vh;}
  .arc-app{min-height:100vh;}
  .landing{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;position:relative;overflow:hidden;}
  .landing-bg{position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 0%,#E8F5FF 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 100%,#F0EAFF 0%,transparent 60%);}
  .landing-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px);background-size:40px 40px;}
  .landing-content{position:relative;z-index:1;text-align:center;padding:40px 20px;max-width:480px;width:100%;}
  .landing-badge{display:inline-flex;align-items:center;gap:6px;background:#EEF2FF;color:#4F46E5;padding:6px 14px;border-radius:100px;font-size:12px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:28px;}
  .landing-badge-dot{width:6px;height:6px;background:#4F46E5;border-radius:50%;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.8);}}
  .landing-title{font-family:'Syne',sans-serif;font-size:clamp(40px,8vw,68px);font-weight:800;color:#0A0A0A;line-height:1.0;letter-spacing:-0.03em;margin-bottom:16px;}
  .landing-title span{background:linear-gradient(135deg,#4F46E5,#7C3AED);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .landing-subtitle{font-size:16px;color:#6B7280;line-height:1.6;margin-bottom:40px;}
  .landing-stats{display:flex;justify-content:center;gap:32px;margin-bottom:40px;}
  .landing-stat{text-align:center;}
  .landing-stat-value{font-family:'Syne',sans-serif;font-size:24px;font-weight:700;color:#0A0A0A;}
  .landing-stat-label{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;margin-top:2px;}
  .landing-divider{width:1px;background:#E5E7EB;align-self:stretch;}
  .btn-connect-primary{width:100%;padding:16px;background:#0A0A0A;color:#fff;border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:10px;}
  .btn-connect-primary:hover{background:#1a1a1a;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.15);}
  .btn-connect-secondary{width:100%;padding:16px;background:transparent;color:#0A0A0A;border:1.5px solid #E5E7EB;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:10px;}
  .btn-connect-secondary:hover{border-color:#0A0A0A;transform:translateY(-1px);}
  .landing-trust{margin-top:24px;font-size:12px;color:#9CA3AF;display:flex;align-items:center;justify-content:center;gap:6px;}
  .dashboard{min-height:100vh;background:#F0F2F5;}
  .topbar{background:#fff;border-bottom:1px solid #F0F0F0;padding:0 24px;height:64px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;}
  .topbar-logo{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#0A0A0A;letter-spacing:-0.02em;}
  .topbar-logo span{color:#4F46E5;}
  .topbar-right{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .topbar-network{display:flex;align-items:center;gap:6px;background:#F0FDF4;color:#16A34A;padding:6px 12px;border-radius:100px;font-size:12px;font-weight:600;}
  .topbar-network-dot{width:6px;height:6px;background:#16A34A;border-radius:50%;animation:pulse 2s infinite;}
  .topbar-wallet{display:flex;align-items:center;gap:8px;background:#F9F9F9;border:1px solid #F0F0F0;padding:8px 14px;border-radius:100px;font-size:13px;font-weight:500;color:#374151;}
  .wallet-avatar{width:24px;height:24px;background:linear-gradient(135deg,#4F46E5,#7C3AED);border-radius:50%;}
  .dashboard-body{max-width:1100px;margin:0 auto;padding:32px 24px;}
  .dashboard-grid{display:grid;grid-template-columns:260px 1fr;gap:24px;align-items:start;}
  @media(max-width:768px){.dashboard-grid{grid-template-columns:1fr;}.sidebar{display:flex;flex-direction:row;overflow-x:auto;gap:8px;}.sidebar-nav{display:flex;flex-direction:row;gap:4px;width:100%;overflow-x:auto;}.nav-item{white-space:nowrap;flex-shrink:0;}.balance-card{display:none;}}
  .sidebar{display:flex;flex-direction:column;gap:16px;}
  .balance-card{background:linear-gradient(135deg,#0A0A0A 0%,#1a1a2e 100%);border-radius:20px;padding:24px;color:white;position:relative;overflow:hidden;}
  .balance-card::before{content:'';position:absolute;top:-40px;right:-40px;width:150px;height:150px;background:radial-gradient(circle,rgba(79,70,229,0.4) 0%,transparent 70%);border-radius:50%;}
  .balance-label{font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;position:relative;z-index:1;}
  .balance-amount{font-family:'Syne',sans-serif;font-size:36px;font-weight:700;color:#fff;position:relative;z-index:1;letter-spacing:-0.02em;}
  .balance-currency{font-size:14px;color:rgba(255,255,255,0.5);margin-top:4px;position:relative;z-index:1;}
  .balance-address{margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;color:rgba(255,255,255,0.4);font-family:monospace;position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;}
  .copy-btn{background:rgba(255,255,255,0.1);border:none;color:rgba(255,255,255,0.6);padding:4px 8px;border-radius:6px;font-size:11px;cursor:pointer;transition:all 0.2s;}
  .copy-btn:hover{background:rgba(255,255,255,0.2);color:#fff;}
  .sidebar-nav{background:#fff;border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:2px;}
  .nav-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;cursor:pointer;transition:all 0.15s;font-size:14px;font-weight:500;color:#6B7280;border:none;background:none;width:100%;text-align:left;}
  .nav-item:hover{background:#F9F9F9;color:#0A0A0A;}
  .nav-item.active{background:#EEF2FF;color:#4F46E5;}
  .nav-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;background:#F3F4F6;flex-shrink:0;}
  .nav-item.active .nav-icon{background:#EEF2FF;}
  .main-content{display:flex;flex-direction:column;gap:20px;}
  .card{background:#fff;border-radius:20px;padding:28px;}
  .card-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:#0A0A0A;margin-bottom:6px;letter-spacing:-0.02em;}
  .card-subtitle{font-size:13px;color:#9CA3AF;margin-bottom:24px;}
  .form-group{margin-bottom:16px;}
  .form-label{display:block;font-size:12px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;}
  .form-input{width:100%;padding:14px 16px;background:#F9F9F9;border:1.5px solid #F0F0F0;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0A0A0A;transition:all 0.2s;outline:none;}
  .form-input:focus{border-color:#4F46E5;background:#fff;box-shadow:0 0 0 3px rgba(79,70,229,0.08);}
  .form-select{width:100%;padding:14px 16px;background:#F9F9F9;border:1.5px solid #F0F0F0;border-radius:12px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0A0A0A;transition:all 0.2s;outline:none;cursor:pointer;}
  .form-select:focus{border-color:#4F46E5;background:#fff;}
  .currency-preview{background:linear-gradient(135deg,#EEF2FF,#F5F3FF);border:1.5px solid #E0E7FF;border-radius:12px;padding:16px;margin-top:8px;display:flex;align-items:center;justify-content:space-between;}
  .currency-preview-label{font-size:12px;color:#6B7280;}
  .currency-preview-amount{font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:#4F46E5;}
  .fee-info{display:flex;align-items:center;gap:6px;font-size:12px;color:#16A34A;font-weight:500;}
  .btn-primary{width:100%;padding:16px;background:#0A0A0A;color:#fff;border:none;border-radius:14px;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px;}
  .btn-primary:hover:not(:disabled){background:#1a1a1a;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,0.15);}
  .btn-primary:disabled{background:#D1D5DB;cursor:not-allowed;transform:none;}
  .btn-primary.loading{background:#4F46E5;}
  .status-box{padding:14px 16px;border-radius:12px;font-size:13px;font-weight:500;margin-bottom:16px;display:flex;align-items:center;gap:10px;}
  .status-success{background:#F0FDF4;color:#16A34A;border:1px solid #BBF7D0;}
  .status-error{background:#FEF2F2;color:#DC2626;border:1px solid #FECACA;}
  .status-info{background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;}
  .status-warning{background:#FFFBEB;color:#D97706;border:1px solid #FDE68A;}
  .tx-item{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid #F5F5F5;}
  .tx-item:last-child{border-bottom:none;}
  .tx-icon{width:44px;height:44px;border-radius:12px;background:#F0FDF4;display:flex;align-items:center;justify-content:center;font-size:20px;margin-right:14px;flex-shrink:0;}
  .tx-info{flex:1;}
  .tx-country{font-size:14px;font-weight:600;color:#0A0A0A;}
  .tx-address{font-size:12px;color:#9CA3AF;font-family:monospace;margin-top:2px;}
  .tx-amount{text-align:right;}
  .tx-usdc{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#0A0A0A;}
  .tx-date{font-size:11px;color:#9CA3AF;margin-top:2px;}
  .invoice-id-box{background:#F9F9F9;border:1.5px dashed #E5E7EB;border-radius:12px;padding:16px;margin-top:16px;font-family:monospace;font-size:12px;color:#374151;word-break:break-all;line-height:1.6;}
  .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;}
  @media(max-width:600px){.summary-grid{grid-template-columns:1fr;}}
  .summary-card{background:#fff;border-radius:14px;padding:16px;}
  .summary-card-label{font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;}
  .summary-card-value{font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:#0A0A0A;}
  .fees-table{width:100%;border-collapse:collapse;}
  .fees-table th{text-align:left;padding:12px 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;font-weight:600;border-bottom:1px solid #F0F0F0;}
  .fees-table td{padding:16px;font-size:14px;color:#374151;border-bottom:1px solid #F5F5F5;}
  .fees-table tr:last-child td{border-bottom:none;}
  .fees-table tr.best-row td{color:#16A34A;font-weight:700;background:#F0FDF4;}
  .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .btn-disconnect{background:none;border:1px solid #FEE2E2;color:#DC2626;padding:8px 16px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;}
  .btn-disconnect:hover{background:#FEF2F2;}
`;
export default function App() {
  const styleRef = useRef(null);

  useEffect(() => {
    if (!styleRef.current) {
      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
      styleRef.current = style;
    }
    return () => { if (styleRef.current) { styleRef.current.remove(); styleRef.current = null; } };
  }, []);

  // eslint-disable-next-line no-unused-vars
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wcProvider, setWcProvider] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState('0.00');
  const [copied, setCopied] = useState(false);
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCountry, setSendCountry] = useState(COUNTRIES[0]);
  const [invoicePayer, setInvoicePayer] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceCountry, setInvoiceCountry] = useState(COUNTRIES[0]);
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payInvoiceDetails, setPayInvoiceDetails] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchBalance = useCallback(async (signerInstance, addr) => {
    try {
      const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerInstance);
      const bal = await usdc.balanceOf(addr);
      setUsdcBalance(parseFloat(ethers.formatUnits(bal, USDC_DECIMALS)).toFixed(2));
    } catch (e) { setUsdcBalance('0.00'); }
  }, []);

  const switchToArc = async (ethProvider) => {
    try {
      await ethProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_ID_HEX }] });
    } catch (err) {
      if (err.code === 4902) {
        await ethProvider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: ARC_CHAIN_ID_HEX, chainName: 'Arc Testnet', nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 }, rpcUrls: [ARC_RPC], blockExplorerUrls: [] }] });
      } else throw err;
    }
  };

  const connectBrowserWallet = async () => {
    try {
      const ethProvider = window.ethereum;
      if (!ethProvider) { setStatus({ type: 'error', message: 'No wallet detected. Please install MetaMask.' }); return; }
      await ethProvider.request({ method: 'eth_requestAccounts' });
      await switchToArc(ethProvider);
      const browserProvider = new ethers.BrowserProvider(ethProvider);
      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setProvider(browserProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletName(ethProvider.isMetaMask ? 'MetaMask' : ethProvider.isCoinbaseWallet ? 'Coinbase' : 'Browser Wallet');
      fetchBalance(newSigner, newAddress);
      setStatus(null);
      ethProvider.on('accountsChanged', (accounts) => { if (accounts.length === 0) disconnect(); else setAddress(accounts[0]); });
    } catch (err) { setStatus({ type: 'error', message: err.message || 'Failed to connect' }); }
  };

  const connectMobileWallet = async () => {
    try {
      setStatus({ type: 'info', message: 'Opening WalletConnect...' });
      const ethProvider = await EthereumProvider.init({ projectId: WC_PROJECT_ID, chains: [ARC_CHAIN_ID], showQrModal: true, methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'wallet_addEthereumChain', 'wallet_switchEthereumChain'], events: ['chainChanged', 'accountsChanged'] });
      await ethProvider.enable();
      const browserProvider = new ethers.BrowserProvider(ethProvider);
      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setWcProvider(ethProvider);
      setProvider(browserProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletName('WalletConnect');
      fetchBalance(newSigner, newAddress);
      setStatus(null);
      ethProvider.on('disconnect', () => disconnect());
    } catch (err) { setStatus({ type: 'error', message: err.message || 'Failed to connect' }); }
  };

  const disconnect = useCallback(() => {
    if (wcProvider) wcProvider.disconnect();
    setProvider(null); setSigner(null); setAddress(''); setWalletName(''); setWcProvider(null); setStatus(null); setUsdcBalance('0.00');
  }, [wcProvider]);

  const getContracts = () => {
    if (!signer) return null;
    return { remittance: new ethers.Contract(REMITTANCE_ADDRESS, REMITTANCE_ABI, signer), usdc: new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer) };
  };

  const handleSend = async () => {
    if (!signer || !sendRecipient || !sendAmount) { setStatus({ type: 'error', message: 'Please fill all fields' }); return; }
    setLoading(true);
    try {
      const { remittance, usdc } = getContracts();
      const amount = ethers.parseUnits(sendAmount, USDC_DECIMALS);
      const recipient = ethers.getAddress(sendRecipient.trim());
      const allowance = await usdc.allowance(address, REMITTANCE_ADDRESS);
      if (allowance < amount) {
        setStatus({ type: 'info', message: 'Approving USDC spend...' });
        const approveTx = await usdc.approve(REMITTANCE_ADDRESS, amount, { gasLimit: GAS_LIMIT });
        await approveTx.wait();
      }
      setStatus({ type: 'info', message: 'Sending USDC...' });
      const tx = await remittance.sendMoney(USDC_ADDRESS, recipient, amount, sendCountry, { gasLimit: GAS_LIMIT });
      await tx.wait();
      setStatus({ type: 'success', message: `Sent ${sendAmount} USDC to ${shortenAddress(recipient)} in ${sendCountry}` });
      setSendRecipient(''); setSendAmount('');
      fetchBalance(signer, address);
    } catch (err) { setStatus({ type: 'error', message: err.reason || err.message || 'Transaction failed' }); }
    finally { setLoading(false); }
  };

  const handleCreateInvoice = async () => {
    if (!signer || !invoicePayer || !invoiceAmount || !invoiceDescription) { setStatus({ type: 'error', message: 'Please fill all fields' }); return; }
    setLoading(true);
    setStatus({ type: 'info', message: 'Creating invoice on-chain...' });
    try {
      const { remittance } = getContracts();
      const amount = ethers.parseUnits(invoiceAmount, USDC_DECIMALS);
      const payer = ethers.getAddress(invoicePayer.trim());
      const invoiceId = await remittance.createInvoice.staticCall(payer, amount, invoiceDescription, invoiceCountry);
      const tx = await remittance.createInvoice(payer, amount, invoiceDescription, invoiceCountry, { gasLimit: GAS_LIMIT });
      await tx.wait();
      setCreatedInvoiceId(invoiceId);
      setStatus({ type: 'success', message: 'Invoice created successfully!' });
      setInvoicePayer(''); setInvoiceAmount(''); setInvoiceDescription('');
    } catch (err) { setStatus({ type: 'error', message: err.reason || err.message || 'Failed to create invoice' }); }
    finally { setLoading(false); }
  };

  const handlePayInvoice = async () => {
    if (!signer || !payInvoiceId) { setStatus({ type: 'error', message: 'Please enter an invoice ID' }); return; }
    setLoading(true);
    setStatus({ type: 'info', message: 'Looking up invoice...' });
    try {
      const { remittance, usdc } = getContracts();
      let invoiceId = payInvoiceId.trim();
      if (!invoiceId.startsWith('0x')) invoiceId = '0x' + invoiceId;
      const invoice = await remittance.invoices(invoiceId);
      if (invoice.creator === ethers.ZeroAddress) { setStatus({ type: 'error', message: 'Invoice not found' }); setLoading(false); return; }
      if (invoice.paid) { setStatus({ type: 'error', message: 'Invoice already paid' }); setLoading(false); return; }
      setPayInvoiceDetails({ creator: invoice.creator, amount: invoice.amount, description: invoice.description, country: invoice.country });
      const amount = invoice.amount;
      const allowance = await usdc.allowance(address, REMITTANCE_ADDRESS);
      if (allowance < amount) {
        setStatus({ type: 'info', message: 'Approving USDC...' });
        const approveTx = await usdc.approve(REMITTANCE_ADDRESS, amount, { gasLimit: GAS_LIMIT });
        await approveTx.wait();
      }
      setStatus({ type: 'info', message: 'Paying invoice...' });
      const tx = await remittance.payInvoice(USDC_ADDRESS, invoiceId, { gasLimit: GAS_LIMIT });
      await tx.wait();
      setStatus({ type: 'success', message: `Paid ${formatUSDC(amount)} USDC successfully!` });
      setPayInvoiceId(''); setPayInvoiceDetails(null);
      fetchBalance(signer, address);
    } catch (err) { setStatus({ type: 'error', message: err.reason || err.message || 'Payment failed' }); }
    finally { setLoading(false); }
  };

  const loadHistory = useCallback(async () => {
    if (!signer) return;
    try {
      const { remittance } = getContracts();
      const payments = await remittance.getPayments(address);
      setHistory([...payments].reverse());
    } catch (err) { console.error('History load failed:', err); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, address]);

  useEffect(() => { if (activeTab === 'history' && signer) loadHistory(); }, [activeTab, signer, loadHistory]);

  const copyAddress = () => { navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const statusClass = () => {
    if (!status) return null;
    return { success: 'status-success', error: 'status-error', info: 'status-info', warning: 'status-warning' }[status.type] || 'status-info';
  };

  const totalSent = history.reduce((sum, p) => sum + parseFloat(formatUSDC(p.amount)), 0).toFixed(2);
  const uniqueCountries = [...new Set(history.map(p => p.country))].length;

  const navItems = [
    { id: 'send', icon: '↑', label: 'Send Money' },
    { id: 'invoice', icon: '📄', label: 'Create Invoice' },
    { id: 'pay', icon: '↓', label: 'Pay Invoice' },
    { id: 'history', icon: '📊', label: 'Analytics' },
    { id: 'fees', icon: '⚡', label: 'Fee Compare' },
  ];
if (!address) {
    return (
      <div className="arc-app">
        <div className="landing">
          <div className="landing-bg" />
          <div className="landing-grid" />
          <div className="landing-content">
            <div className="landing-badge"><div className="landing-badge-dot" />Arc Testnet · Live</div>
            <h1 className="landing-title">Send Money<br /><span>Globally.</span><br />Instantly.</h1>
            <p className="landing-subtitle">Transfer USDC across borders in under a second.<br />Zero hidden fees. Fully on-chain.</p>
            <div className="landing-stats">
              <div className="landing-stat"><div className="landing-stat-value">~$0.007</div><div className="landing-stat-label">Per Transfer</div></div>
              <div className="landing-divider" />
              <div className="landing-stat"><div className="landing-stat-value">&lt;1s</div><div className="landing-stat-label">Settlement</div></div>
              <div className="landing-divider" />
              <div className="landing-stat"><div className="landing-stat-value">20+</div><div className="landing-stat-label">Countries</div></div>
            </div>
            {status && <div className={`status-box ${statusClass()}`} style={{ marginBottom: 16, textAlign: 'left' }}>{status.message}</div>}
            <button className="btn-connect-primary" onClick={connectBrowserWallet}><span>⬡</span> Connect Wallet</button>
            <button className="btn-connect-secondary" onClick={connectMobileWallet}><span>📱</span> Connect via WalletConnect</button>
            <div className="landing-trust">🔒 Non-custodial · Your keys, your funds</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="arc-app">
      <div className="dashboard">
        <div className="topbar">
          <div className="topbar-logo">Arc<span>Pay</span></div>
          <div className="topbar-right">
            <div className="topbar-network"><div className="topbar-network-dot" />Arc Testnet</div>
            <div className="topbar-wallet"><div className="wallet-avatar" />{walletName} · {shortenAddress(address)}</div>
            <button className="btn-disconnect" onClick={disconnect}>Disconnect</button>
          </div>
        </div>

        <div className="dashboard-body">
          <div className="dashboard-grid">
            <div className="sidebar">
              <div className="balance-card">
                <div className="balance-label">USDC Balance</div>
                <div className="balance-amount">${usdcBalance}</div>
                <div className="balance-currency">USD Coin · Arc Testnet</div>
                <div className="balance-address">
                  <span>{shortenAddress(address)}</span>
                  <button className="copy-btn" onClick={copyAddress}>{copied ? '✓ Copied' : 'Copy'}</button>
                </div>
              </div>
              <nav className="sidebar-nav">
                {navItems.map(item => (
                  <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setStatus(null); }}>
                    <div className="nav-icon">{item.icon}</div>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="main-content">
              {status && <div className={`status-box ${statusClass()}`}>{status.message}</div>}

              {activeTab === 'send' && (
                <div className="card">
                  <div className="card-title">Send USDC</div>
                  <div className="card-subtitle">Transfer instantly to any wallet, anywhere in the world.</div>
                  <div className="form-group">
                    <label className="form-label">Recipient Wallet Address</label>
                    <input className="form-input" placeholder="0x..." value={sendRecipient} onChange={e => setSendRecipient(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (USDC)</label>
                    <input className="form-input" placeholder="0.00" type="number" value={sendAmount} onChange={e => setSendAmount(e.target.value)} />
                    {sendAmount && sendCountry && (
                      <div className="currency-preview">
                        <div>
                          <div className="currency-preview-label">Recipient gets approximately</div>
                          <div className="currency-preview-amount">{formatLocalAmount(sendAmount, sendCountry)}</div>
                        </div>
                        <div className="fee-info">⚡ ~$0.007 fee</div>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination Country</label>
                    <select className="form-select" value={sendCountry} onChange={e => setSendCountry(e.target.value)}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{CURRENCY_RATES[c].flag} {c} ({CURRENCY_RATES[c].code})</option>)}
                    </select>
                  </div>
                  <button className={`btn-primary ${loading ? 'loading' : ''}`} onClick={handleSend} disabled={loading}>
                    {loading ? <><span className="spinner" />Processing...</> : 'Send USDC →'}
                  </button>
                </div>
              )}

              {activeTab === 'invoice' && (
                <div className="card">
                  <div className="card-title">Create Invoice</div>
                  <div className="card-subtitle">Generate an on-chain payment request for your client.</div>
                  <div className="form-group">
                    <label className="form-label">Client Wallet Address</label>
                    <input className="form-input" placeholder="0x..." value={invoicePayer} onChange={e => setInvoicePayer(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (USDC)</label>
                    <input className="form-input" placeholder="0.00" type="number" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input className="form-input" placeholder="e.g. Logo design · March 2026" value={invoiceDescription} onChange={e => setInvoiceDescription(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Your Country</label>
                    <select className="form-select" value={invoiceCountry} onChange={e => setInvoiceCountry(e.target.value)}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{CURRENCY_RATES[c].flag} {c}</option>)}
                    </select>
                  </div>
                  <button className={`btn-primary ${loading ? 'loading' : ''}`} onClick={handleCreateInvoice} disabled={loading}>
                    {loading ? <><span className="spinner" />Creating...</> : 'Create Invoice →'}
                  </button>
                  {createdInvoiceId && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 32, height: 32, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✓</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#16A34A' }}>Invoice Created!</div>
                          <div style={{ fontSize: 12, color: '#9CA3AF' }}>Share this ID with your client</div>
                        </div>
                      </div>
                      <div className="invoice-id-box">{createdInvoiceId}</div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pay' && (
                <div className="card">
                  <div className="card-title">Pay Invoice</div>
                  <div className="card-subtitle">Enter an invoice ID to make an instant on-chain payment.</div>
                  <div className="form-group">
                    <label className="form-label">Invoice ID</label>
                    <input className="form-input" placeholder="0x..." value={payInvoiceId} onChange={e => setPayInvoiceId(e.target.value)} />
                  </div>
                  {payInvoiceDetails && (
                    <div style={{ background: '#F9F9F9', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Invoice Details</div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6B7280' }}>Amount</span><span style={{ fontWeight: 700 }}>{formatUSDC(payInvoiceDetails.amount)} USDC</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6B7280' }}>Description</span><span style={{ fontWeight: 500 }}>{payInvoiceDetails.description}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: '#6B7280' }}>From</span><span style={{ fontFamily: 'monospace' }}>{shortenAddress(payInvoiceDetails.creator)}</span></div>
                      </div>
                    </div>
                  )}
                  <button className={`btn-primary ${loading ? 'loading' : ''}`} onClick={handlePayInvoice} disabled={loading}>
                    {loading ? <><span className="spinner" />Processing...</> : 'Pay Invoice →'}
                  </button>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <div className="summary-grid">
                    <div className="summary-card"><div className="summary-card-label">Total Sent</div><div className="summary-card-value">${totalSent}</div></div>
                    <div className="summary-card"><div className="summary-card-label">Transactions</div><div className="summary-card-value">{history.length}</div></div>
                    <div className="summary-card"><div className="summary-card-label">Countries</div><div className="summary-card-value">{uniqueCountries}</div></div>
                  </div>
                  <div className="card">
                    <div className="card-title">Transaction History</div>
                    <div className="card-subtitle">All your on-chain transfers</div>
                    {history.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 600, color: '#374151' }}>No transactions yet</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Your transfers will appear here</div>
                      </div>
                    ) : history.map((p, i) => (
                      <div key={i} className="tx-item">
                        <div className="tx-icon">{CURRENCY_RATES[p.country]?.flag || '💸'}</div>
                        <div className="tx-info">
                          <div className="tx-country">{p.country}</div>
                          <div className="tx-address">To: {shortenAddress(p.recipient)}</div>
                        </div>
                        <div className="tx-amount">
                          <div className="tx-usdc">${formatUSDC(p.amount)}</div>
                          <div className="tx-date">{formatDate(p.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'fees' && (
                <div className="card">
                  <div className="card-title">Why Arc Remittance?</div>
                  <div className="card-subtitle">Sending $100 internationally — live fee comparison</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="fees-table">
                      <thead><tr><th>Service</th><th>Fee</th><th>Speed</th><th>You Save</th></tr></thead>
                      <tbody>
                        <tr className="best-row"><td>⚡ Arc Remittance</td><td>~$0.007</td><td>&lt;1 second</td><td>Best Deal</td></tr>
                        <tr><td>Wise</td><td>$0.50–2.00</td><td>1–2 days</td><td>$1.99</td></tr>
                        <tr><td>PayPal</td><td>$4.99</td><td>1–3 days</td><td>$4.98</td></tr>
                        <tr><td>Western Union</td><td>$4.99 + 3%</td><td>1–5 days</td><td>$7.98</td></tr>
                        <tr><td>SWIFT / Bank</td><td>$25–45</td><td>3–5 days</td><td>$44.99</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: 24, background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#4F46E5' }}>Save up to $44.99</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>per $100 transferred vs. traditional banks</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
