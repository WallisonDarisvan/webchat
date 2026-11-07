const fs = require('fs');

async function searchPostgres() {
  const bundleUrl = 'https://easypanel.siteflash.pro/assets/index-B1DW4-_v.js';
  const res = await fetch(bundleUrl);
  const js = await res.text();

  const regex = /postgres\.([a-zA-Z0-9_$]+)/g;
  const matches = new Set();
  for (const m of js.matchAll(regex)) {
    matches.add(m[1]);
  }
  console.log('postgres methods:', [...matches]);

  const regex2 = /app\.([a-zA-Z0-9_$]+)/g;
  const matches2 = new Set();
  for (const m of js.matchAll(regex2)) {
    matches2.add(m[1]);
  }
  console.log('app methods:', [...matches2]);

  const regex3 = /templates\.([a-zA-Z0-9_$]+)/g;
  const matches3 = new Set();
  for (const m of js.matchAll(regex3)) {
    matches3.add(m[1]);
  }
  console.log('templates methods:', [...matches3]);

  const regex4 = /services\.([a-zA-Z0-9_$]+)/g;
  const matches4 = new Set();
  for (const m of js.matchAll(regex4)) {
    matches4.add(m[1]);
  }
  console.log('services methods:', [...matches4]);
}

searchPostgres();
