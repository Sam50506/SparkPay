const { ethers } = require('ethers');

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ADDR = '0x79a1C363Afd912212B7581F735a9096fB453F8be';
const KEEPER_ADDR = '0xeE8BFA4ad53bE3e52B6e293136eebbc49244e146';
const ABI = ['function setExecutor(address _executor) external'];

async function main() {
  const pk = process.env.ADMIN_PK;
  if (!pk) { console.error('Set ADMIN_PK env var first.'); process.exit(1); }

  const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
  const wallet = new ethers.Wallet(pk, provider);
  console.log('Using wallet:', wallet.address);

  const contract = new ethers.Contract(SCHED_ADDR, ABI, wallet);
  const tx = await contract.setExecutor(KEEPER_ADDR, { gasPrice: ethers.parseUnits('100', 'gwei'), gasLimit: 100000 });
  console.log('Tx sent:', tx.hash);
  await tx.wait();
  console.log('Confirmed. Executor set to', KEEPER_ADDR);
}

main().catch(e => { console.error(e.message); process.exit(1); });
