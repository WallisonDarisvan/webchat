const fs = require('fs');

async function searchButton() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Case-insensitive search for "create service" or "new service"
  const regex = /(create|add|new)\s+(service|app|database|postgres)/gi;
  let m;
  while ((m = regex.exec(js)) !== null) {
    console.log('Match:', m[0], 'at', m.index);
    console.log(js.slice(Math.max(0, m.index - 100), m.index + 200));
    console.log('---');
  }
}

searchButton();
