import { ethers } from 'ethers';
const RPC = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const txHash = '0xc08dfc79ecd0fab092206ff227425395b7ac421a8df3e538b67d36b708983743'; // paste FULL hash here, not truncated
const receipt = await provider.getTransactionReceipt(txHash);
console.log('Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
console.log('Logs:', JSON.stringify(receipt.logs, null, 2));
