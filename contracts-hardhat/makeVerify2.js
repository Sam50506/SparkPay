const fs = require('fs');
const input = JSON.parse(fs.readFileSync('remittance-input-fixed.json'));
input.settings.optimizer = { enabled: false };
input.settings.outputSelection = { "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode"] } };
const str = JSON.stringify(input).replace(/\^0\.8\.\d+/g, '^0.8.35');
fs.writeFileSync('remittance-verify2.json', str);
console.log('Done');
