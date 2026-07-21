import { useState, useRef, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ARC_CHAIN_ID, ARC_CHAIN_HEX, ARC_RPC, ARC_RPC_FALLBACK, WC_ID } from '../config';
import { short, requestNotifPermission, lsSave, getProvider } from '../config';

// Everything related to connecting/disconnecting a wallet lives here.
// Moved out of App.js so wallet logic can be read, tested, and changed
// on its own without touching the rest of the app.
export function useWallet({ setStatus }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0.00');
  const [walletName, setWalletName] = useState('');
  const [isResumed, setIsResumed] = useState(false);
  const wcProvRef = useRef(null);

  const doDisconnect = useCallback(() => {
    if (wcProvRef.current) { wcProvRef.current.disconnect(); wcProvRef.current = null; }
    try { if (window.ethereum) window.ethereum.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }); } catch {}
    setProvider(null);
    setSigner(null);
    setAddress('');
    setWalletName('');
    setStatus(null);
    setBalance('0.00');
    setIsResumed(false);
    lsSave('arc_session', null);
  }, [setStatus]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAcc = a => {
      if (!a.length) {
        setTimeout(() => {
          if (window.ethereum) window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
            if (!accounts.length) doDisconnect();
          });
        }, 1000);
      } else setAddress(a[0]);
    };
    const onChain = (chainId) => {};
    window.ethereum.on('accountsChanged', onAcc);
    window.ethereum.on('chainChanged', onChain);
    return () => {
      window.ethereum.removeListener('accountsChanged', onAcc);
      window.ethereum.removeListener('chainChanged', onChain);
    };
  }, [doDisconnect]);

  const refreshBal = useCallback(async () => {
    if (!address) return;
    try {
      const rp = new ethers.JsonRpcProvider(ARC_RPC_FALLBACK, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      const b = await rp.getBalance(address);
      setBalance(parseFloat(ethers.formatUnits(b, 18)).toFixed(2));
    } catch {}
  }, [address]);

  const addArc = p => ({
    chainId: ARC_CHAIN_HEX,
    chainName: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: [ARC_RPC || ARC_RPC_FALLBACK],
    blockExplorerUrls: ['https://testnet.arcscan.app'],
    ...p
  });

  const ensureArc = async eth => {
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_HEX }] });
    } catch (e) {
      if (e.code === 4902 || e.code === -32603) {
        setStatus({ type: 'info', msg: 'Adding Arc Testnet to your wallet...' });
        try {
          await eth.request({ method: 'wallet_addEthereumChain', params: [addArc({})] });
        } catch (ae) {
          setStatus({ type: 'error', msg: 'Please add Arc Testnet manually in your wallet settings. Chain ID: 5042002, RPC: https://rpc.testnet.arc.network' });
          throw ae;
        }
      } else throw e;
    }
  };

  const finaliseConnect = async bp => {
    bp.pollingInterval = 800;
    const s = await bp.getSigner();
    const addr = await s.getAddress();
    setProvider(bp);
    setSigner(s);
    setAddress(addr);
    setIsResumed(false);
    setStatus({ type: 'success', msg: 'Connected: ' + short(addr) });
    setTimeout(() => setStatus(null), 5000);
    requestNotifPermission();
  };

  const connectBrowser = async (type, provObj) => {
    try {
      const eth = provObj || (window.okxwallet && (type === 'OKX Wallet' || provObj?.isOkxWallet || provObj?.isOKExWallet) ? window.okxwallet : null) || await getProvider();
      if (!eth) { setStatus({ type: 'error', msg: 'No wallet found. Install MetaMask.' }); return; }
      await eth.request({ method: 'eth_requestAccounts' });
      const bp = new ethers.BrowserProvider(eth, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      await ensureArc(eth);
      let name = 'Browser Wallet';
      if (eth.isMises || (window.mises?.ethereum === eth)) name = 'Mises';
      else if (eth.isMetaMask && !eth.isBraveWallet) name = 'MetaMask';
      else if (eth.isBraveWallet) name = 'Brave';
      else if (eth.isCoinbaseWallet) name = 'Coinbase';
      else if (eth.isOkxWallet || eth.isOKExWallet) name = 'OKX';
      setWalletName(name);
      await finaliseConnect(bp);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'Connection failed' });
    }
  };

  // Resume must reconnect to the EXACT same wallet the user used before, not just
  // any wallet matching loose flag heuristics (which is what getProvider() does).
  // EIP-6963 gives each wallet a stable, unambiguous name via announceProvider —
  // use that to find the right one first, falling back to legacy flag matching,
  // and only as a last resort falling back to the generic auto-detect.
  const findProviderByName = (walletType) => new Promise(resolve => {
    if (!walletType || walletType === 'WalletConnect' || walletType === 'Browser Wallet') { resolve(null); return; }
    const found = [];
    const handler = (e) => { const { info, provider } = e.detail; if (!found.find(w => w.info.uuid === info.uuid)) found.push({ info, provider }); };
    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handler);
      const match = found.find(w => w.info.name.toLowerCase().includes(walletType.toLowerCase()) || walletType.toLowerCase().includes(w.info.name.toLowerCase()));
      if (match) { resolve(match.provider); return; }
      const eth = window.ethereum;
      if (eth) {
        const providers = eth.providers?.length ? eth.providers : [eth];
        const byFlag = providers.find(p => {
          const wt = walletType.toLowerCase();
          if (wt.includes('metamask')) return p.isMetaMask && !p.isBraveWallet;
          if (wt.includes('brave')) return p.isBraveWallet;
          if (wt.includes('coinbase')) return p.isCoinbaseWallet;
          if (wt.includes('rabby')) return p.isRabby;
          if (wt.includes('okx')) return p.isOkxWallet || p.isOKExWallet;
          if (wt.includes('trust')) return p.isTrust;
          if (wt.includes('mises')) return p.isMises || window.mises?.ethereum === p;
          return false;
        });
        if (byFlag) { resolve(byFlag); return; }
      }
      resolve(null);
    }, 250);
  });

  const connectWC = async () => {
    try {
      const wcp = await EthereumProvider.init({
        projectId: WC_ID,
        chains: [1],
        optionalChains: [ARC_CHAIN_ID],
        showQrModal: true,
        qrModalOptions: { themeMode: 'light', themeVariables: { '--wcm-font-family': 'inherit' } },
        methods: ['eth_sendTransaction', 'personal_sign', 'wallet_addEthereumChain', 'wallet_switchEthereumChain'],
        events: ['chainChanged', 'accountsChanged']
      });
      await wcp.enable();
      wcp.on('accountsChanged', a => { if (!a.length) doDisconnect(); else setAddress(a[0]); });
      wcp.on('disconnect', doDisconnect);
      try {
        await wcp.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_CHAIN_HEX }] });
      } catch (e) {
        if (e.code === 4902) await wcp.request({ method: 'wallet_addEthereumChain', params: [addArc({})] });
      }
      const bp = new ethers.BrowserProvider(wcp, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      wcProvRef.current = wcp;
      setWalletName('WalletConnect');
      await finaliseConnect(bp);
    } catch (e) {
      setStatus({ type: 'error', msg: e.message || 'WalletConnect failed' });
    }
  };

  return {
    provider, signer, address, setAddress,
    balance, setBalance,
    walletName, setWalletName,
    isResumed, setIsResumed,
    wcProvRef,
    doDisconnect, refreshBal,
    connectBrowser, connectWC, findProviderByName
  };
}
