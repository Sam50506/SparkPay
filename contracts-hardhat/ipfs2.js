const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(hexStr) {
  let num = BigInt('0x' + hexStr);
  let result = '';
  while (num > 0n) {
    result = BASE58[Number(num % 58n)] + result;
    num = num / 58n;
  }
  return result;
}
const hash = base58Encode('1220475f8fd9cbf3832fc8427383fca4604498b5664f0afbbc3f7375db0c725cbebc');
console.log('IPFS CID:', hash);
