const fs = require('fs');

async function searchServiceCreation() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  // Search for how service creation mutations are defined
  const regex = /\.([a-zA-Z0-9_$]+Service)\.(useMutation|mutationOptions)/g;
  for (const m of js.matchAll(regex)) {
    console.log('Mutation:', m[1]);
  }

  // Search for "createService" or "createApp" or "createDatabase"
  const regex2 = /create[a-zA-Z0-9_$]*Service[a-zA-Z0-9_$]*/g;
  for (const m of js.matchAll(regex2)) {
    console.log('Regex2 match:', m[0]);
  }

  // Search for words ending with Service
  const regex3 = /([a-zA-Z0-9_$]+)\.(create[a-zA-Z0-9_$]+)/g;
  for (const m of js.matchAll(regex3)) {
    if (m[2].toLowerCase().includes('service') || m[2].toLowerCase().includes('app') || m[2].toLowerCase().includes('db')) {
      console.log('Regex3 match:', m[1], m[2]);
    }
  }
}

searchServiceCreation();
