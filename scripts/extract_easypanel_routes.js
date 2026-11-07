const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const EASYPANEL_URL = env.EASYPANEL_URL || 'https://easypanel.siteflash.pro';

async function findTrpcRoutes() {
  const htmlRes = await fetch(EASYPANEL_URL);
  const html = await htmlRes.text();
  console.log('HTML length:', html.length);

  // find script tags
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  console.log('Scripts:', scripts);

  for (const scriptUrl of scripts) {
    const fullUrl = scriptUrl.startsWith('http') ? scriptUrl : `${EASYPANEL_URL}${scriptUrl}`;
    console.log('Fetching bundle:', fullUrl);
    const jsRes = await fetch(fullUrl);
    const js = await jsRes.text();
    
    // search for listProjects
    const idx = js.indexOf('listProjects');
    if (idx !== -1) {
      console.log('Found listProjects in bundle!');
      // Extract nearby text
      const snippet = js.slice(Math.max(0, idx - 400), idx + 600);
      console.log('Snippet:', snippet);
    }
  }
}

findTrpcRoutes();
