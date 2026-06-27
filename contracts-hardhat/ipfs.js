const ipfsHex = '1220475f8fd9cbf3832fc8427383fca4604498b5664f0afbbc3f7375db0c725cbebc';
const bytes = Buffer.from(ipfsHex, 'hex');
const bs58 = require('bs58');
const hash = bs58.encode(bytes);
console.log('IPFS hash:', hash);
