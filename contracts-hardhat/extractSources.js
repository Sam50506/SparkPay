const fs = require('fs');
const input = JSON.parse(fs.readFileSync('remittance-verify2.json'));
for (const [filepath, {content}] of Object.entries(input.sources)) {
  const dir = '/data/data/com.termux/files/home/storage/downloads/remittance-sources/' + filepath.split('/').slice(0,-1).join('/');
  fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync('/data/data/com.termux/files/home/storage/downloads/remittance-sources/' + filepath, content);
  console.log('Written:', filepath);
}
