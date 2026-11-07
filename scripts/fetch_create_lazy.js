const fs = require('fs');

async function fetchCreateLazy() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/create.lazy-eB8kzbCw.js';
  const res = await fetch(bundleUrl);
  console.log('Status:', res.status);
  const js = await res.text();
  console.log('Length:', js.length);

  // Search for mutations or procedure calls in this chunk
  const matches = [...js.matchAll(/([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)\.(useMutation|mutationOptions)/g)];
  console.log('Mutations:', matches.map(m => `${m[1]}.${m[2]}`));

  // Search for X. or trpc calls
  const matches2 = [...js.matchAll(/X\.([a-zA-Z0-9_$.]+)/g)];
  console.log('X.* in create.lazy:', [...new Set(matches2.map(m => m[1]))]);
}

fetchCreateLazy();
