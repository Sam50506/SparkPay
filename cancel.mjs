import { ethers } from './node_modules/ethers/lib.esm/index.js';

const PRIVATE_KEY = '0x720be3ef167aacc79006a8314244e00063cd9e5f38ac8dfbe23b30950ebe4c4c';
const p = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network', {name:'Arc Testnet',chainId:5042002});
const w = new ethers.Wallet(PRIVATE_KEY, p);
const c = new ethers.Contract('0x1Eb2088f3FE2bD64Dde3c770f87a5047f99b8946', [
  'function cancel(uint256 id) external'
], w);

const tx = await c.cancel(4, {gasPrice: ethers.parseUnits('100','gwei'), gasLimit: 100000});
await tx.wait();
console.log('Cancelled! Hash:', tx.hash);
