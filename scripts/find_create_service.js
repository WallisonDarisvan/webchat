const fs = require('fs');

async function findCreateService() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const regex = /([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+Service|[a-zA-Z0-9_$]+App|[a-zA-Z0-9_$]+Postgres|[a-zA-Z0-9_$]+Database)/g;
  const matches = new Set();
  for (const m of js.matchAll(regex)) {
    matches.add(`${m[1]}.${m[2]}`);
  }
  console.log('Matches:', [...matches]);
}

findCreateService();
