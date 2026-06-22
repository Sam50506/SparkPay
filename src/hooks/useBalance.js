import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { ARC_RPC_FALLBACK, ARC_CHAIN_ID } from '../config';

export function useBalance(address, signer) {
  const [balance, setBalance] = useState('0.00');

  const refreshBal = useCallback(async () => {
    if (!address) return;
    try {
      const rp = new ethers.JsonRpcProvider(ARC_RPC_FALLBACK, { name: 'Arc Testnet', chainId: ARC_CHAIN_ID });
      const b = await rp.getBalance(address);
      setBalance(parseFloat(ethers.formatUnits(b, 18)).toFixed(2));
    } catch {}
  }, [address]);

  useEffect(() => {
    if (signer && address) refreshBal();
  }, [signer, address, refreshBal]);

  useEffect(() => {
    if (!signer || !address) return;
    const t = setInterval(refreshBal, 15000);
    return () => clearInterval(t);
  }, [signer, address, refreshBal]);

  return { balance, setBalance, refreshBal };
}
