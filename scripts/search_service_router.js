const fs = require('fs');

async function searchServiceRouter() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Find where "inspectService" is used with mutation or query
  const idx = js.indexOf('inspectService');
  console.log('inspectService position:', idx);
  console.log('Snippet around inspectService:\n', js.slice(Math.max(0, idx - 200), idx + 400));
}

searchServiceRouter();
