import { ethers } from 'ethers';
const RPC = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const USDC_ADDR = '0x3600000000000000000000000000000000000000';
const PAYOUT_WALLET = '0xeE8BFA4ad53bE3e52B6e293136eebbc49244e146';

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
const usdc = new ethers.Contract(USDC_ADDR, ERC20_ABI, provider);

try {
  const decimals = await usdc.decimals();
  console.log('Decimals:', decimals);
} catch(e) { console.log('decimals() failed:', e.message); }

try {
  const balance = await usdc.balanceOf(PAYOUT_WALLET);
  console.log('Raw balance:', balance.toString());
} catch(e) { console.log('balanceOf() failed:', e.message); }

const nativeBalance = await provider.getBalance(PAYOUT_WALLET);
console.log('Native balance (18 decimals):', ethers.formatUnits(nativeBalance, 18));
