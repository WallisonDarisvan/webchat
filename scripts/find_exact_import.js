const fs = require('fs');

async function findExactImport() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('/create`');
  console.log('Snippet around /create:\n', js.slice(idx, idx + 300));
}

findExactImport();
