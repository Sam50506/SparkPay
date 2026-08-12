const https = require('https');

const url = `${process.env.SUPABASE_URL}/rest/v1/keeper_status?id=eq.1&select=last_run`;
const options = {
  headers: {
    'apikey': process.env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
  }
};

https.get(url, options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const rows = JSON.parse(data);
    if (!rows[0]) {
      console.log('No keeper status found, running...');
      require('child_process').execSync('node keeper.js', { stdio: 'inherit' });
      return;
    }
    const lastRun = new Date(rows[0].last_run).getTime();
    const minutesSince = (Date.now() - lastRun) / 60000;
    console.log('Railway last ran ' + minutesSince.toFixed(1) + ' mins ago');
    if (minutesSince > 20) {
      console.log('Railway seems down, running fallback...');
      require('child_process').execSync('node keeper.js', { stdio: 'inherit' });
    } else {
      console.log('Railway is healthy, skipping.');
    }
  });
});
