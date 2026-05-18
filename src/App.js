import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

/* ─── Constants ─── */
const ARC_CHAIN_ID = 5042002;
const ARC_CHAIN_ID_HEX = '0x4CE752'; // ✅ FIXED: was 0x4CEF52
const ARC_RPC = 'https://rpc.testnet.arc.network';
const REMITTANCE_ADDRESS = '0x71ec1d33f56a9f72a05c507647e1455b238cb7da';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const USDC_DECIMALS = 6;
const GAS_LIMIT = 300000;
const WC_PROJECT_ID = '8bb24a433758c9a403057e2e3f2c371b';

const COUNTRIES = [
  'Mexico', 'Brazil', 'India', 'Philippines', 'Nigeria',
  'Indonesia', 'Pakistan', 'Bangladesh', 'Vietnam', 'Ghana',
  'Kenya', 'Egypt', 'Turkey', 'Argentina', 'Colombia',
  'Ukraine', 'Ethiopia', 'Tanzania', 'Uganda', 'Nepal'
];

/* ─── ABIs ─── */
const REMITTANCE_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'country', type: 'string' }
    ],
    name: 'sendMoney',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'payer', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'country', type: 'string' }
    ],
    name: 'createInvoice',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'invoiceId', type: 'bytes32' }
    ],
    name: 'payInvoice',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getPayments',
    outputs: [{
      components: [
        { name: 'sender', type: 'address' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'country', type: 'string' },
        { name: 'timestamp', type: 'uint256' }
      ],
      name: '',
      type: 'tuple[]'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '', type: 'bytes32' }],
    name: 'invoices',
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'payer', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'country', type: 'string' },
      { name: 'paid', type: 'bool' },
      { name: 'timestamp', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

/* ─── Helpers ─── */
const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');
const formatUSDC = (amount) => {
  if (!amount) return '0';
  return parseFloat(ethers.formatUnits(amount, USDC_DECIMALS)).toFixed(2);
};
const formatDate = (ts) => (ts ? new Date(Number(ts) * 1000).toLocaleDateString() : '');

const executeWithRetry = async (txFunc, setStatus) => {
  try {
    return await txFunc();
  } catch (error) {
    const msg = error.message?.toLowerCase() || '';
    if (
      msg.includes('txpool') ||
      msg.includes('nonce') ||
      msg.includes('replacement') ||
      msg.includes('underpriced') ||
      msg.includes('timeout')
    ) {
      setStatus({ type: 'warning', message: 'Transaction pool full. Retrying in 10 seconds...' });
      await new Promise((r) => setTimeout(r, 10000));
      return await txFunc();
    }
    throw error;
  }
};

/* ─── Main App ─── */
export default function App() {
  // eslint-disable-next-line no-unused-vars
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [walletName, setWalletName] = useState('');
  const [activeTab, setActiveTab] = useState('send');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [wcProvider, setWcProvider] = useState(null);

  /* Send tab */
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendCountry, setSendCountry] = useState(COUNTRIES[0]);

  /* Invoice tab */
  const [invoicePayer, setInvoicePayer] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [invoiceCountry, setInvoiceCountry] = useState(COUNTRIES[0]);
  const [createdInvoiceId, setCreatedInvoiceId] = useState('');

  /* Pay tab */
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payInvoiceDetails, setPayInvoiceDetails] = useState(null);

  /* History tab */
  const [history, setHistory] = useState([]);

  /* ─── Effects ─── */
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum?.selectedAddress) {
        await connectBrowserWallet();
      }
    };
    autoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccounts = (accounts) => {
      if (accounts.length === 0) disconnect();
      else if (accounts[0] !== address) setAddress(accounts[0]);
    };
    const handleChain = () => {};
    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChain);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  useEffect(() => {
    if (activeTab === 'history' && signer) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, signer, address]);

  /* ─── Wallet Logic ─── */
  const switchToArc = async (ethereumProvider) => {
    try {
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await ethereumProvider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ARC_CHAIN_ID_HEX,
              chainName: 'Arc Testnet',
              nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
              rpcUrls: [ARC_RPC],
              blockExplorerUrls: [],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  };

  const getBrowserWalletName = () => {
    if (!window.ethereum) return 'Browser Wallet';
    if (window.ethereum.isRabby) return 'Rabby';
    if (window.ethereum.isBraveWallet) return 'Brave Wallet';
    if (window.ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
    if (window.ethereum.isMetaMask) return 'MetaMask';
    return 'Browser Wallet';
  };

  const connectBrowserWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus({ type: 'error', message: 'No browser wallet detected. Please install MetaMask or another wallet.' });
        return;
      }
      const browserProvider = new ethers.BrowserProvider(window.ethereum, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      await browserProvider.send('eth_requestAccounts', []);
      await switchToArc(window.ethereum);
      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setProvider(browserProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletName(getBrowserWalletName());
      setStatus({ type: 'success', message: `Connected to ${getBrowserWalletName()}: ${shortenAddress(newAddress)}` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to connect wallet' });
    }
  };

  const connectMobileWallet = async () => {
    try {
      const ethereumProvider = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [ARC_CHAIN_ID],
        showQrModal: true,
        methods: ['eth_sendTransaction', 'eth_sign', 'personal_sign', 'wallet_addEthereumChain', 'wallet_switchEthereumChain'],
        events: ['chainChanged', 'accountsChanged'],
      });
      await ethereumProvider.enable();

      ethereumProvider.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) disconnect();
        else setAddress(accounts[0]);
      });
      ethereumProvider.on('disconnect', () => disconnect());

      try {
        await ethereumProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ARC_CHAIN_ID_HEX }],
        });
      } catch (e) {
        if (e.code === 4902) {
          await ethereumProvider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ARC_CHAIN_ID_HEX,
                chainName: 'Arc Testnet',
                nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
                rpcUrls: [ARC_RPC],
                blockExplorerUrls: [],
              },
            ],
          });
        }
      }

      const browserProvider = new ethers.BrowserProvider(ethereumProvider, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      const newSigner = await browserProvider.getSigner();
      const newAddress = await newSigner.getAddress();
      setWcProvider(ethereumProvider);
      setProvider(browserProvider);
      setSigner(newSigner);
      setAddress(newAddress);
      setWalletName('WalletConnect');
      setStatus({ type: 'success', message: `Connected via WalletConnect: ${shortenAddress(newAddress)}` });
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Failed to connect mobile wallet' });
    }
  };

  const disconnect = useCallback(() => {
    if (wcProvider) wcProvider.disconnect();
    setProvider(null);
    setSigner(null);
    setAddress('');
    setWalletName('');
    setWcProvider(null);
    setStatus(null);
  }, [wcProvider]);

  const getContracts = () => {
    if (!signer) return null;
    return {
      remittance: new ethers.Contract(REMITTANCE_ADDRESS, REMITTANCE_ABI, signer),
      usdc: new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer),
    };
  };

  /* ─── Actions ─── */
  const handleSend = async () => {
    if (!signer || !sendRecipient || !sendAmount) {
      setStatus({ type: 'error', message: 'Please fill all fields and connect wallet' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'info', message: 'Processing...' });
    try {
      const { remittance, usdc } = getContracts();
      const amount = ethers.parseUnits(sendAmount, USDC_DECIMALS);

      const allowance = await usdc.allowance(address, REMITTANCE_ADDRESS);
      if (allowance < amount) {
        setStatus({ type: 'info', message: 'Approving USDC...' });
        const approveTx = await usdc.approve(REMITTANCE_ADDRESS, amount, { gasLimit: GAS_LIMIT });
        await approveTx.wait();
      }

      setStatus({ type: 'info', message: 'Sending USDC...' });
      const tx = await executeWithRetry(
        () => remittance.sendMoney(USDC_ADDRESS, sendRecipient, amount, sendCountry, { gasLimit: GAS_LIMIT }),
        setStatus
      );
      await tx.wait();

      setStatus({ type: 'success', message: `Successfully sent ${sendAmount} USDC to ${shortenAddress(sendRecipient)}` });
      setSendRecipient('');
      setSendAmount('');
    } catch (error) {
      setStatus({ type: 'error', message: error.reason || error.message || 'Transaction failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!signer || !invoicePayer || !invoiceAmount || !invoiceDescription) {
      setStatus({ type: 'error', message: 'Please fill all fields' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'info', message: 'Creating invoice...' });
    try {
      const { remittance } = getContracts();
      const amount = ethers.parseUnits(invoiceAmount, USDC_DECIMALS);
      const checksumAddress = ethers.getAddress(invoicePayer.trim());

      const invoiceId = await remittance.createInvoice.staticCall(checksumAddress, amount, invoiceDescription, invoiceCountry);

      const tx = await executeWithRetry(
        () => remittance.createInvoice(checksumAddress, amount, invoiceDescription, invoiceCountry, { gasLimit: GAS_LIMIT }),
        setStatus
      );
      await tx.wait();

      setCreatedInvoiceId(invoiceId);
      setStatus({ type: 'success', message: 'Invoice created successfully!' });
      setInvoicePayer('');
      setInvoiceAmount('');
      setInvoiceDescription('');
    } catch (error) {
      setStatus({ type: 'error', message: error.reason || error.message || 'Failed to create invoice' });
    } finally {
      setLoading(false);
    }
  };

  const handlePayInvoice = async () => {
    if (!signer || !payInvoiceId) {
      setStatus({ type: 'error', message: 'Please enter an invoice ID' });
      return;
    }
    setLoading(true);
    setStatus({ type: 'info', message: 'Processing...' });
    try {
      const { remittance, usdc } = getContracts();
      let invoiceId = payInvoiceId.trim();
      if (!invoiceId.startsWith('0x')) invoiceId = '0x' + invoiceId;

      const invoice = await remittance.invoices(invoiceId);
      if (invoice.creator === ethers.ZeroAddress) {
        setStatus({ type: 'error', message: 'Invoice not found' });
        setLoading(false);
        return;
      }
      if (invoice.paid) {
        setStatus({ type: 'error', message: 'Invoice already paid' });
        setLoading(false);
        return;
      }

      setPayInvoiceDetails({
        creator: invoice.creator,
        amount: invoice.amount,
        description: invoice.description,
        country: invoice.country,
      });

      const amount = invoice.amount;
      const allowance = await usdc.allowance(address, REMITTANCE_ADDRESS);
      if (allowance < amount) {
        setStatus({ type: 'info', message: 'Approving USDC...' });
        const approveTx = await usdc.approve(REMITTANCE_ADDRESS, amount, { gasLimit: GAS_LIMIT });
        await approveTx.wait();
      }

      setStatus({ type: 'info', message: 'Paying invoice...' });
      const tx = await executeWithRetry(
        () => remittance.payInvoice(USDC_ADDRESS, invoiceId, { gasLimit: GAS_LIMIT }),
        setStatus
      );
      await tx.wait();

      setStatus({ type: 'success', message: `Successfully paid invoice for ${formatUSDC(amount)} USDC` });
      setPayInvoiceId('');
      setPayInvoiceDetails(null);
    } catch (error) {
      setStatus({ type: 'error', message: error.reason || error.message || 'Payment failed' });
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const { remittance } = getContracts();
      const payments = await remittance.getPayments(address);
      setHistory(payments);
    } catch (error) {
      console.error('History load failed:', error);
    }
  };

  /* ─── Styles ─── */
  const statusStyle = () => {
    if (!status) return { display: 'none' };
    const base = { padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', fontWeight: 500 };
    const msg = status.message?.toLowerCase() || '';
    if (status.type === 'success' || msg.includes('successfully') || msg.includes('created')) {
      return { ...base, backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' };
    }
    if (status.type === 'error') {
      return { ...base, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
    }
    if (status.type === 'warning') {
      return { ...base, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
    }
    return { ...base, backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' };
  };

  const s = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    card: { maxWidth: '640px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '32px' },
    header: { textAlign: 'center', marginBottom: '24px' },
    title: { fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' },
    subtitle: { fontSize: '14px', color: '#6b7280' },
    walletSection: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' },
    walletInfo: { textAlign: 'center', marginBottom: '20px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '14px', color: '#374151' },
    btn: { padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' },
    btnPrimary: { backgroundColor: loading ? '#9ca3af' : '#667eea', color: 'white', width: '100%', padding: '12px', marginTop: '16px' },
    btnSecondary: { backgroundColor: '#764ba2', color: 'white' },
    btnOutline: { backgroundColor: 'transparent', border: '2px solid #667eea', color: '#667eea' },
    tabs: { display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', overflowX: 'auto' },
    tab: { padding: '12px 16px', cursor: 'pointer', borderBottom: '2px solid transparent', marginBottom: '-2px', fontSize: '14px', fontWeight: 500, color: '#6b7280', whiteSpace: 'nowrap' },
    tabActive: { color: '#667eea', borderBottomColor: '#667eea' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' },
    select: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', marginBottom: '12px', backgroundColor: 'white' },
    label: { display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' },
    sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' },
    explanation: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    th: { backgroundColor: '#f9fafb', textAlign: 'left', padding: '12px', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' },
    bestRow: { backgroundColor: '#ecfdf5', fontWeight: 600 },
    footer: { textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#9ca3af' },
    invoiceBox: { backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', marginTop: '12px' },
    historyItem: { padding: '12px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  };

/* ─── Render ─── */
  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.title}>Arc Remittance</div>
          <div style={s.subtitle}>Send USDC globally in seconds</div>
        </div>

        {!address ? (
          <div style={s.walletSection}>
            <button style={{ ...s.btn, ...s.btnSecondary }} onClick={connectBrowserWallet}>
              Connect Browser Wallet
            </button>
            <button style={{ ...s.btn, ...s.btnOutline }} onClick={connectMobileWallet}>
              Connect Mobile Wallet
            </button>
          </div>
        ) : (
          <>
            <div style={s.walletInfo}>
              <div style={{ fontWeight: 600, color: '#1f2937' }}>{walletName}</div>
              <div style={{ fontFamily: 'monospace', marginTop: '4px' }}>{shortenAddress(address)}</div>
              <button style={{ ...s.btn, marginTop: '8px', fontSize: '12px', padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={disconnect}>
                Disconnect
              </button>
            </div>

            <div style={s.tabs}>
              {['send', 'invoice', 'pay', 'history', 'fees'].map((t) => (
                <div
                  key={t}
                  style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </div>
              ))}
            </div>

            <div style={statusStyle()}>{status?.message}</div>

            {activeTab === 'send' && (
              <div>
                <div style={s.sectionTitle}>Send USDC</div>
                <div style={s.explanation}>Send USDC instantly to anyone, anywhere in the world.</div>
                <label style={s.label}>Recipient Address</label>
                <input style={s.input} placeholder="0x..." value={sendRecipient} onChange={(e) => setSendRecipient(e.target.value)} />
                <label style={s.label}>Amount (USDC)</label>
                <input style={s.input} placeholder="10" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
                <label style={s.label}>Destination Country</label>
                <select style={s.select} value={sendCountry} onChange={(e) => setSendCountry(e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handleSend} disabled={loading}>
                  {loading ? 'Processing...' : 'Send USDC'}
                </button>
              </div>
            )}

            {activeTab === 'invoice' && (
              <div>
                <div style={s.sectionTitle}>Create Invoice</div>
                <div style={s.explanation}>Create an on-chain invoice to request payment from a client.</div>
                <label style={s.label}>Client Wallet Address</label>
                <input style={s.input} placeholder="0x..." value={invoicePayer} onChange={(e) => setInvoicePayer(e.target.value)} />
                <label style={s.label}>Amount (USDC)</label>
                <input style={s.input} placeholder="500" type="number" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} />
                <label style={s.label}>Description</label>
                <input style={s.input} placeholder="Logo design - March 2026" value={invoiceDescription} onChange={(e) => setInvoiceDescription(e.target.value)} />
                <label style={s.label}>Your Country</label>
                <select style={s.select} value={invoiceCountry} onChange={(e) => setInvoiceCountry(e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handleCreateInvoice} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
                {createdInvoiceId && (
                  <div>
                    <div style={{ marginTop: '16px', fontSize: '14px', fontWeight: 600, color: '#065f46' }}>Invoice created successfully!</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Share this Invoice ID with your client so they can pay using the Pay tab:</div>
                    <div style={s.invoiceBox}>{createdInvoiceId}</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pay' && (
              <div>
                <div style={s.sectionTitle}>Pay Invoice</div>
                <div style={s.explanation}>Received an invoice ID? Pay it here instantly.</div>
                <label style={s.label}>Invoice ID</label>
                <input style={s.input} placeholder="0x..." value={payInvoiceId} onChange={(e) => setPayInvoiceId(e.target.value)} />
                {payInvoiceDetails && (
                  <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>
                    <div><strong>Amount:</strong> {formatUSDC(payInvoiceDetails.amount)} USDC</div>
                    <div><strong>Description:</strong> {payInvoiceDetails.description}</div>
                    <div><strong>From:</strong> {shortenAddress(payInvoiceDetails.creator)}</div>
                    <div><strong>Country:</strong> {payInvoiceDetails.country}</div>
                  </div>
                )}
                <button style={{ ...s.btn, ...s.btnPrimary }} onClick={handlePayInvoice} disabled={loading}>
                  {loading ? 'Processing...' : 'Pay Invoice'}
                </button>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div style={s.sectionTitle}>Transaction History</div>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>No transactions yet</div>
                ) : (
                  history.map((p, i) => (
                    <div key={i} style={s.historyItem}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1f2937' }}>{formatUSDC(p.amount)} USDC</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>To: {shortenAddress(p.recipient)}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.country}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(p.timestamp)}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'fees' && (
              <div>
                <div style={s.sectionTitle}>Fee Comparison</div>
                <div style={s.explanation}>See how Arc Remittance compares to traditional services when sending $100 internationally.</div>
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>Service</th>
                      <th style={s.th}>Fee</th>
                      <th style={s.th}>Speed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={s.bestRow}>
                      <td style={s.td}>Arc Remittance (Best)</td>
                      <td style={s.td}>~$0.007</td>
                      <td style={s.td}>{'< 1 sec'}</td>
                    </tr>
                    <tr>
                      <td style={s.td}>Western Union</td>
                      <td style={s.td}>$4.99 + 3%</td>
                      <td style={s.td}>1-5 days</td>
                    </tr>
                    <tr>
                      <td style={s.td}>SWIFT / Bank</td>
                      <td style={s.td}>$25-45</td>
                      <td style={s.td}>3-5 days</td>
                    </tr>
                    <tr>
                      <td style={s.td}>PayPal</td>
                      <td style={s.td}>5% up to $4.99</td>
                      <td style={s.td}>1-3 days</td>
                    </tr>
                    <tr>
                      <td style={s.td}>Wise</td>
                      <td style={s.td}>0.5-2%</td>
                      <td style={s.td}>1-2 days</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#667eea', fontWeight: 600 }}>
                  Arc saves you up to $44.99 per transaction
                </div>
              </div>
            )}
          </>
        )}

        <div style={s.footer}>Powered by Arc Testnet • USDC Native</div>
      </div>
    </div>
  );
              }
