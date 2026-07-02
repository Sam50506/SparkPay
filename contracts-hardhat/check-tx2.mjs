import { ethers } from 'ethers';
const RPC = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const txHash = '0xc08dfc79ecd0fab092206ff227425395b7ac421a8df3e538b67d36b708983743';

const tx = await provider.getTransaction(txHash);
console.log('To (contract called):', tx.to);
console.log('Value (native):', tx.value.toString());
console.log('Data (function call):', tx.data);
console.log('Data length:', tx.data.length);

// Try decoding as ERC20 transfer(address,uint256)
const iface = new ethers.Interface(['function transfer(address to, uint256 amount) returns (bool)']);
try {
  const decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
  console.log('Decoded call:', decoded.name, decoded.args.toString());
} catch (e) {
  console.log('Could not decode as transfer():', e.message);
}
