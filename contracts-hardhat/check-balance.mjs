import { ethers } from 'ethers';
const RPC = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const USDC_ADDR = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const PAYOUT_WALLET = '0xeE8BFA4ad53bE3e52B6e293136eebbc49244e146'; // the "From" address in the tx

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
const usdc = new ethers.Contract(USDC_ADDR, ERC20_ABI, provider);

const decimals = await usdc.decimals();
const balance = await usdc.balanceOf(PAYOUT_WALLET);
console.log('Payout wallet USDC balance:', ethers.formatUnits(balance, decimals));
console.log('Decimals:', decimals);
