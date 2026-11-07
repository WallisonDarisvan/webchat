const fs = require('fs');

async function searchXServices() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const regex = /X\.services\.([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)/g;
  const set = new Set();
  for (const m of js.matchAll(regex)) {
    set.add(`${m[1]}.${m[2]}`);
  }
  console.log('X.services procedures:', [...set]);

  // Also check X.projects or other X.
  const regex2 = /X\.([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)/g;
  const set2 = new Set();
  for (const m of js.matchAll(regex2)) {
    set2.add(`${m[1]}.${m[2]}`);
  }
  console.log('X.* procedures:', [...set2].filter(p => !p.startsWith('services.')));
}

searchXServices();
