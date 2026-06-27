const fs = require('fs');
const https = require('https');
const source = fs.readFileSync('remittance-verify2.json', 'utf8');

const params = new URLSearchParams({
  module: 'contract',
  action: 'verifysourcecode',
  contractaddress: '0x09dE47d579Db8c93BB611b2384C4BfAF3aD52153',
  contractname: 'Remittance',
  compilerversion: 'v0.8.35+commit.47b9dedd',
  optimizationUsed: '0',
  codeformat: 'solidity-standard-json-input',
  sourceCode: source
});

const options = {
  hostname: 'testnet.arcscan.app',
  path: '/api',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(params.toString())
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.write(params.toString());
req.end();
