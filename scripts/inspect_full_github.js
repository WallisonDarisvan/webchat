const fs = require('fs');

async function inspectFullUpdateGithub() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('updateSourceGithub.mutationOptions');
  console.log('Snippet around updateSourceGithub:\n', js.slice(idx - 100, idx + 800));
}

inspectFullUpdateGithub();
