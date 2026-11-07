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

async function setupPostgres() {
  console.log('--- 1. Creating Postgres Service "webchat-db" in project "meus" ---');
  const createRes = await fetch(`${EASYPANEL_URL}/api/trpc/services.postgres.createService`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json: {
        projectName: 'meus',
        serviceName: 'webchat-db'
      }
    })
  });

  console.log('Create Postgres status:', createRes.status);
  const createData = await createRes.json();
  console.log('Create Postgres response:', JSON.stringify(createData, null, 2));

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  console.log('--- 2. Inspecting "webchat-db" ---');
  const inspectRes = await fetch(`${EASYPANEL_URL}/api/trpc/services.postgres.inspectService`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json: {
        projectName: 'meus',
        serviceName: 'webchat-db'
      }
    })
  });

  const inspectData = await inspectRes.json();
  console.log('Inspect Postgres data:', JSON.stringify(inspectData, null, 2));

  // Expose port so local machine can connect
  console.log('--- 3. Exposing port 5435 on host ---');
  const exposeRes = await fetch(`${EASYPANEL_URL}/api/trpc/services.postgres.exposeService`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      json: {
        projectName: 'meus',
        serviceName: 'webchat-db',
        exposedPort: 5435
      }
    })
  });
  console.log('Expose status:', exposeRes.status);
  const exposeData = await exposeRes.json();
  console.log('Expose data:', JSON.stringify(exposeData, null, 2));
}

setupPostgres();
