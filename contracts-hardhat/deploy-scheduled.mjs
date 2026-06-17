import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const PRIVATE_KEY = process.env.DEPLOYER_KEY;
const RPC = 'https://rpc.testnet.arc.network';

const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const abi = JSON.parse(readFileSync('./artifacts/contracts_ScheduledPayment_sol_ScheduledPayment.abi', 'utf8'));
const bytecode = readFileSync('./artifacts/contracts_ScheduledPayment_sol_ScheduledPayment.bin', 'utf8');

const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();

const address = await contract.getAddress();
console.log('Deployed at:', address);
