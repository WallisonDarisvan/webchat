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

const GITHUB_TOKEN = env.GITHUB_API_KEY;

async function checkUser() {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'node.js'
    }
  });
  console.log('GitHub User status:', res.status);
  const user = await res.json();
  console.log('Login:', user.login);

  // Check user repos
  const reposRes = await fetch('https://api.github.com/user/repos?per_page=100', {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'User-Agent': 'node.js'
    }
  });
  const repos = await reposRes.json();
  console.log('Repos count:', repos.length);
  const found = repos.find(r => r.name.toLowerCase().includes('webchat'));
  console.log('webchat repo found:', found ? found.full_name : 'No repo with webchat name');
}

checkUser();
