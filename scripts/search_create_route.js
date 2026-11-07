const fs = require('fs');

async function searchCreateRoute() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const idx = js.indexOf('/projects/$project/create');
  console.log('Position of /projects/$project/create:', idx);

  // Let's find routes defined near this or route component
  let pos = 0;
  while ((pos = js.indexOf('projects/$project/create', pos)) !== -1) {
    console.log('Match at', pos);
    console.log(js.slice(pos - 100, pos + 500));
    console.log('================');
    pos += 24;
  }
}

searchCreateRoute();
