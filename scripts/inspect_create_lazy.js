const fs = require('fs');

async function inspectCreateLazy() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/create.lazy-C3bK6Q5I.js';
  const res = await fetch(bundleUrl);
  console.log('Status of create.lazy:', res.status);
  const js = await res.text();
  console.log('Length:', js.length);

  // Look for mutations in create.lazy
  const matches = [...js.matchAll(/([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]+)\.(useMutation|mutationOptions)/g)];
  console.log('Mutations in create.lazy:', matches.map(m => `${m[1]}.${m[2]}`));

  // Look for any string with create
  const createMatches = [...js.matchAll(/[a-zA-Z0-9_$]*create[a-zA-Z0-9_$]*/gi)].map(m => m[0]);
  console.log('Create matches count:', createMatches.length);
  console.log('Unique create words:', [...new Set(createMatches)].slice(0, 30));
}

inspectCreateLazy();
