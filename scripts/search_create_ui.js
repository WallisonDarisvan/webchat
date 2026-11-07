const fs = require('fs');

async function searchCreateServiceUI() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Look for text like "Create Service" or "create service" or "New Service"
  const idxs = [];
  let pos = 0;
  while ((pos = js.indexOf('createService', pos)) !== -1) {
    idxs.push(pos);
    pos += 13;
  }
  console.log('Found createService at:', idxs);

  if (idxs.length === 0) {
    // Look for serviceType
    let pos2 = 0;
    while ((pos2 = js.indexOf('serviceType', pos2)) !== -1) {
      idxs.push(pos2);
      pos2 += 11;
      if (idxs.length > 5) break;
    }
    console.log('Found serviceType at:', idxs);
  }

  for (const idx of idxs.slice(0, 5)) {
    console.log('Snippet at', idx, ':\n', js.slice(Math.max(0, idx - 150), idx + 250));
    console.log('-------------------');
  }
}

searchCreateServiceUI();
