const solc = require('/data/data/com.termux/files/usr/lib/node_modules/solc');
const fs = require('fs');
const input = fs.readFileSync('remittance-input-fixed.json', 'utf8');
const fixed = input.replace(/\^0\.8\.\d+/g, '^0.8.35');
const output = solc.compile(fixed);
const d = JSON.parse(output);
if (!d.contracts) {
  console.log('Error:', d.errors[0].message);
  process.exit(1);
}
const bc = d.contracts['contracts/Remittance.sol']['Remittance'].evm.bytecode.object;
console.log('Compiled start:', bc.slice(0, 40));
console.log('Compiled end:', bc.slice(-40));
const onchain = fs.readFileSync('onchain-bytecode.txt', 'utf8');
console.log('Onchain start: ', onchain.slice(0, 40));
console.log('Match:', bc.slice(0, 40) === onchain.slice(0, 40));
fs.writeFileSync('compiled-0835.txt', bc);
