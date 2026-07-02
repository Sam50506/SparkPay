import { ethers } from 'ethers';
const RPC = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const USDC_ADDR = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

const code = await provider.getCode(USDC_ADDR);
console.log('Bytecode length:', code.length);
console.log('Has contract code:', code !== '0x');
console.log('First 100 chars:', code.slice(0, 100));
