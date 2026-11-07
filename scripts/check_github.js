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

async function checkGithub() {
  try {
    const res = await fetch(`${EASYPANEL_URL}/api/trpc/settings.getGithubToken`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('getGithubToken status:', res.status);
    const data = await res.json();
    console.log('getGithubToken data:', data);
  } catch (e) {
    console.error('Error:', e);
  }

  try {
    const res2 = await fetch(`${EASYPANEL_URL}/api/trpc/github.searchRepos?input=${encodeURIComponent(JSON.stringify({ json: { query: 'webchat' } }))}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('searchRepos status:', res2.status);
    const data2 = await res2.json();
    console.log('searchRepos data:', data2);
  } catch (e) {
    console.error('Error:', e);
  }
}

checkGithub();
