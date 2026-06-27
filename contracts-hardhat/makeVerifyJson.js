const fs = require('fs');
const solc = require('/data/data/com.termux/files/usr/lib/node_modules/solc');
const input = JSON.parse(fs.readFileSync('remittance-input-fixed.json'));
input.settings.optimizer = { enabled: false };
const fixed = JSON.stringify(input).replace(/\^0\.8\.\d+/g, '^0.8.35');
fs.writeFileSync('remittance-verify.json', fixed);
console.log('Done, size:', fs.statSync('remittance-verify.json').size);
