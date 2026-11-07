const fs = require('fs');

async function searchComponent() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('/_layout/projects/$project/create');
  console.log('Snippet:\n', js.slice(idx, idx + 2000));
}

searchComponent();
