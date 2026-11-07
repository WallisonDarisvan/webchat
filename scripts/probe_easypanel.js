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

const candidates = [
  'projects.listProjects',
  'projects.get',
  'projects.inspect',
  'services.list',
  'services.getAll',
  'services.listServices',
  'postgres.create',
  'postgres.createPostgres',
  'postgres.get',
  'postgres.list',
  'app.create',
  'app.createApp',
  'apps.createApp',
  'apps.list',
  'database.create',
  'databases.create',
  'database.list'
];

async function probe() {
  for (const c of candidates) {
    try {
      const res = await fetch(`${EASYPANEL_URL}/api/trpc/${c}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ json: {} })
      });
      console.log(`${c} -> ${res.status}`);
      if (res.status !== 404) {
        const txt = await res.text();
        console.log(`   Response: ${txt.slice(0, 300)}`);
      }
    } catch (e) {
      console.log(`${c} -> error: ${e.message}`);
    }
  }
}

probe();
