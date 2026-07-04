import { ethers } from 'ethers';
const RPC = 'https://rpc.testnet.arc.network';
const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const CONTRACT = '0xfb319b6BFf115bDFc6B4b76e0155E9d224f37771';
const abi = ['function paymentCount() external view returns (uint256)'];
const contract = new ethers.Contract(CONTRACT, abi, provider);
const count = await contract.paymentCount();
console.log('On-chain paymentCount:', count.toString());
