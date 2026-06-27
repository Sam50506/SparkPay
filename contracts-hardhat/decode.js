const fs = require('fs');
const onchain = fs.readFileSync('onchain-bytecode.txt', 'utf8');

// CBOR metadata is at the end - find it
// Format: ...a2 6970 7366 7358 22 <34 bytes IPFS hash> 64 736f 6c63 <3 bytes version>
const hex = onchain;
const end = hex.slice(-80);
console.log('Last 40 bytes:', end);

// Extract solc version
const versionHex = end.slice(-8, -4);
const v1 = parseInt(versionHex.slice(0,2), 16);
const v2 = parseInt(versionHex.slice(2,4), 16);
const v3 = parseInt(versionHex.slice(4,6), 16);
console.log(`Solc version from metadata: ${v1}.${v2}.${v3}`);

// Try to find IPFS hash
const ipfsIdx = hex.lastIndexOf('a264697066735822');
if (ipfsIdx >= 0) {
  const ipfsHex = hex.slice(ipfsIdx + 16, ipfsIdx + 16 + 68);
  console.log('IPFS hash hex:', ipfsHex);
}
