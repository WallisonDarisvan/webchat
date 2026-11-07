const fs = require('fs');

async function analyze() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Find occurrences of .queryOptions or .mutationOptions or router patterns
  const matches = [...js.matchAll(/([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)\.(useQuery|useMutation|queryOptions|mutationOptions)/g)];
  const procedures = new Set();
  matches.forEach(m => procedures.add(`${m[1]}.${m[2]}`));

  console.log('Found procedures:', [...procedures]);
}

analyze();
