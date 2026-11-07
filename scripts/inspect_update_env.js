const fs = require('fs');

async function inspectUpdateEnv() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('services.app.updateEnv');
  console.log('Snippet around services.app.updateEnv:\n', js.slice(idx - 100, idx + 500));
}

inspectUpdateEnv();
