const fs = require('fs');

async function inspectExpose() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('postgres.exposeService');
  console.log('Snippet:\n', js.slice(Math.max(0, idx - 100), idx + 300));
}

inspectExpose();
