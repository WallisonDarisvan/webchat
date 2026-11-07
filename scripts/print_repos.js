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
const API_KEY = env.EASYPANEL_API_KEY;

async function printRepos() {
  const res2 = await fetch(`${EASYPANEL_URL}/api/trpc/github.searchRepos?input=${encodeURIComponent(JSON.stringify({ json: { query: 'webchat' } }))}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data2 = await res2.json();
  console.log('Repos:', JSON.stringify(data2, null, 2));
}

printRepos();
