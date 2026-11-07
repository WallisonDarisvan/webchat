const fs = require('fs');

async function searchCreate() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Search for "createService" or "createApp" or how an app or postgres is created
  const matches = [...js.matchAll(/([a-zA-Z0-9_$]+)\.(create[a-zA-Z0-9_$]+)/g)];
  const set = new Set();
  for (const m of matches) {
    set.add(`${m[1]}.${m[2]}`);
  }
  console.log('Create methods:', [...set]);
}

searchCreate();
