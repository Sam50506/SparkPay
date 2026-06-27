const fs = require('fs');
const onchain = fs.readFileSync('onchain-bytecode.txt', 'utf8');
const compiled = fs.readFileSync('compiled-0835.txt', 'utf8');
console.log('Onchain length:', onchain.length);
console.log('Compiled length:', compiled.length);
console.log('Onchain bytes 0-20:', onchain.slice(0, 40));
console.log('Compiled bytes 0-20:', compiled.slice(0, 40));
console.log('Onchain end:', onchain.slice(-80));
console.log('Compiled end:', compiled.slice(-80));
