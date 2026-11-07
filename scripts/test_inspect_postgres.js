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

async function testInspect() {
  const url = `${EASYPANEL_URL}/api/trpc/services.postgres.inspectService`;
  console.log('Testing inspect:', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json: {
        projectName: 'meus',
        serviceName: 'evolution-api-db'
      }
    })
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

testInspect();
