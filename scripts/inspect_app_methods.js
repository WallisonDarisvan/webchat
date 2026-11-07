const fs = require('fs');

async function inspectAppProcedures() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const methods = ['updateSourceGit', 'updateSourceGithub', 'updateBuild', 'updateEnv', 'deployService'];
  for (const m of methods) {
    const idx = js.indexOf(m);
    console.log(`=== ${m} ===`);
    console.log(js.slice(Math.max(0, idx - 100), idx + 300));
  }
}

inspectAppProcedures();
