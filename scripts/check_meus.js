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

async function checkMeusServices() {
  const res = await fetch(`${EASYPANEL_URL}/api/trpc/projects.listProjectsAndServices`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await res.json();
  const services = data.json.services.filter(s => s.projectName === 'meus');
  console.log('Services in project "meus":', services.map(s => ({
    name: s.name,
    type: s.type,
    env: s.env ? s.env.slice(0, 80) : ''
  })));
}

checkMeusServices();
