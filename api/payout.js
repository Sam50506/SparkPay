import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { rateLimit } from '../src/lib/rateLimit.js';

const RPC = 'https://rpc.testnet.arc.network';
const CHAIN_ID = 5042002;
const ADMIN_KEY = process.env.PAYOUT_ADMIN_KEY;
const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;
const ADMIN_ADDRESS = '0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const allowed = await rateLimit(req, res, 'strict');
  if (!allowed) return;

  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  let authorized = false;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.address === ADMIN_ADDRESS) authorized = true;
    } catch (e) {}
  }
  if (!authorized && req.headers['x-admin-key'] === ADMIN_KEY) authorized = true;
  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized - please re-verify with passkey' });
  }

  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { claim_id } = req.body || {};
    let query = supabase.from('cashback_claims').select('*').eq('status', 'pending');
    if (claim_id) query = query.eq('id', claim_id);
    const { data: claims, error } = await query;

    if (error) throw error;
    if (!claims || claims.length === 0) {
      return res.status(200).json({ message: 'No pending claims', paid: 0 });
    }

    const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: CHAIN_ID });
    const wallet = new ethers.Wallet(process.env.PAYOUT_PRIVATE_KEY, provider);

    const USDC_ADDR = process.env.REACT_APP_USDC_ADDR || '0x3600000000000000000000000000000000000000'; // Arc-native USDC ERC20 interface
    const ERC20_ABI = ['function transfer(address to, uint256 amount) returns (bool)', 'function decimals() view returns (uint8)'];
    const usdc = new ethers.Contract(USDC_ADDR, ERC20_ABI, wallet);
    let decimals;
    try {
      decimals = await usdc.decimals();
    } catch (e) {
      return res.status(500).json({ error: 'Could not read USDC decimals() - refusing to guess. Check USDC_ADDR. ' + e.message });
    }

    const results = [];
    for (const claim of claims) {
      try {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData?.gasPrice || ethers.parseUnits('21', 'gwei');
        const amount = ethers.parseUnits(claim.amount.toString(), decimals);
        const tx = await usdc.transfer(claim.wallet_address, amount, {
          gasLimit: 100000,
          gasPrice
        });
        const receipt = await tx.wait();
        const transferEvent = receipt.logs.some(log => log.address.toLowerCase() === USDC_ADDR.toLowerCase());
        if (receipt.status !== 1 || !transferEvent) {
          await supabase.from('cashback_claims').update({ status: 'failed', tx_hash: tx.hash }).eq('id', claim.id);
          results.push({ wallet: claim.wallet_address, amount: claim.amount, tx: tx.hash, status: 'failed', error: 'No transfer event emitted - funds likely not moved' });
          continue;
        }
        await supabase.from('cashback_claims').update({ status: 'paid', tx_hash: tx.hash }).eq('id', claim.id);
        results.push({ wallet: claim.wallet_address, amount: claim.amount, tx: tx.hash, status: 'paid' });
      } catch (e) {
        results.push({ wallet: claim.wallet_address, amount: claim.amount, error: e.message, status: 'failed' });
      }
    }

    return res.status(200).json({ message: 'Payouts processed', paid: results.filter(r => r.status === 'paid').length, results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
