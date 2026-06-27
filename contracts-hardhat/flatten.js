const fs = require('fs');
const input = JSON.parse(fs.readFileSync('remittance-verify2.json'));
let flat = '';
// Add all sources in order
const order = [
  '@openzeppelin/contracts/utils/Context.sol',
  '@openzeppelin/contracts/access/Ownable.sol', 
  '@openzeppelin/contracts/utils/ReentrancyGuard.sol',
  '@openzeppelin/contracts/token/ERC20/IERC20.sol',
  '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol',
  'contracts/Remittance.sol'
];
for (const f of order) {
  if (input.sources[f]) {
    let content = input.sources[f].content;
    content = content.replace(/\/\/ SPDX-License.*\n/g, '');
    content = content.replace(/pragma solidity.*\n/g, '');
    content = content.replace(/import ".*"\n/g, '');
    flat += content + '\n';
  }
}
flat = '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.35;\n' + flat;
fs.writeFileSync('Remittance-flat.sol', flat);
console.log('Done, lines:', flat.split('\n').length);
