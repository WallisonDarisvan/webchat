const fs = require('fs');

async function inspectArgs() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/create.lazy-eB8kzbCw.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('postgres.createService');
  console.log('Snippet around postgres.createService:\n', js.slice(Math.max(0, idx - 200), idx + 400));

  const idx2 = js.indexOf('app.createService');
  console.log('\nSnippet around app.createService:\n', js.slice(Math.max(0, idx2 - 200), idx2 + 400));
}

inspectArgs();
