import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const PRIVATE_KEY = '0x720be3ef167aacc79006a8314244e00063cd9e5f38ac8dfbe23b30950ebe4c4c';
const RPC = 'https://rpc.testnet.arc.network';

const bytecode = readFileSync('./contracts/artifacts/contracts_contracts_ScheduledPayment_sol_ScheduledPayment.bin', 'utf8').trim();
const abi = JSON.parse(readFileSync('./contracts/artifacts/contracts_contracts_ScheduledPayment_sol_ScheduledPayment.abi', 'utf8'));

const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

console.log('Deploying from:', wallet.address);
const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy({ gasPrice: ethers.parseUnits('21', 'gwei') });
await contract.waitForDeployment();
console.log('Deployed to:', await contract.getAddress());
