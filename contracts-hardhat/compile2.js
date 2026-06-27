const solc = require('/data/data/com.termux/files/usr/lib/node_modules/solc');
const fs = require('fs');
const input = JSON.parse(fs.readFileSync('remittance-input-fixed.json', 'utf8'));
input.settings.optimizer = { enabled: true, runs: 200 };
// fix pragma
const fixed = JSON.stringify(input).replace(/\^0\.8\.\d+/g, '^0.8.35');
const output = solc.compile(fixed);
const d = JSON.parse(output);
if (!d.contracts) { console.log('Error:', d.errors[0].message); process.exit(1); }
const bc = d.contracts['contracts/Remittance.sol']['Remittance'].evm.bytecode.object;
console.log('Optimized start:', bc.slice(0, 40));
const onchain = fs.readFileSync('onchain-bytecode.txt', 'utf8');
console.log('Onchain start:  ', onchain.slice(0, 40));
console.log('Match:', bc.slice(0, 40) === onchain.slice(0, 40));
fs.writeFileSync('compiled-0835-opt.txt', bc);
