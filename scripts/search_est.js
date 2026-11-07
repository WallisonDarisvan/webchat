const fs = require('fs');

async function searchLazy() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Find where eSt is referenced
  let pos = 0;
  while ((pos = js.indexOf('eSt', pos)) !== -1) {
    console.log('eSt at', pos, ':', js.slice(pos - 30, pos + 100));
    pos += 4;
  }
}

searchLazy();
