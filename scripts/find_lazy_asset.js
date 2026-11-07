const fs = require('fs');

async function findLazyAsset() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  console.log('Snippet at 3043106:\n', js.slice(3043050, 3043250));
}

findLazyAsset();
