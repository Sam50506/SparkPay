const solc = require('/data/data/com.termux/files/usr/lib/node_modules/solc');
const fs = require('fs');
const onchain = fs.readFileSync('onchain-bytecode.txt', 'utf8');

const runs = [1, 100, 200, 500, 1000, 10000];
for (const r of runs) {
  const input = JSON.parse(fs.readFileSync('remittance-input-fixed.json', 'utf8'));
  input.settings.optimizer = { enabled: true, runs: r };
  const fixed = JSON.stringify(input).replace(/\^0\.8\.\d+/g, '^0.8.35');
  const output = solc.compile(fixed);
  const d = JSON.parse(output);
  if (!d.contracts) continue;
  const bc = d.contracts['contracts/Remittance.sol']['Remittance'].evm.bytecode.object;
  const match = bc.slice(0, 40) === onchain.slice(0, 40);
  console.log(`runs=${r}: ${bc.slice(0,40)} match=${match}`);
}

// Also try viaIR
const input2 = JSON.parse(fs.readFileSync('remittance-input-fixed.json', 'utf8'));
input2.settings.optimizer = { enabled: true, runs: 200 };
input2.settings.viaIR = true;
const fixed2 = JSON.stringify(input2).replace(/\^0\.8\.\d+/g, '^0.8.35');
const out2 = JSON.parse(solc.compile(fixed2));
if (out2.contracts) {
  const bc2 = out2.contracts['contracts/Remittance.sol']['Remittance'].evm.bytecode.object;
  console.log(`viaIR:   ${bc2.slice(0,40)} match=${bc2.slice(0,40)===onchain.slice(0,40)}`);
}
console.log(`onchain: ${onchain.slice(0,40)}`);
