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

async function checkProjectDetails() {
  const testEndpoints = [
    `/api/trpc/projects.getProject?input=${encodeURIComponent(JSON.stringify({ json: { name: 'meus' } }))}`,
    `/api/trpc/projects.getProject?input=${encodeURIComponent(JSON.stringify({ json: { projectName: 'meus' } }))}`,
    `/api/trpc/services.listServices?input=${encodeURIComponent(JSON.stringify({ json: { projectName: 'meus' } }))}`,
    `/api/trpc/services.getServices?input=${encodeURIComponent(JSON.stringify({ json: { projectName: 'meus' } }))}`,
  ];

  for (const ep of testEndpoints) {
    try {
      const res = await fetch(`${EASYPANEL_URL}${ep}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Endpoint: ${ep.split('?')[0]} -> Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response: ${text.slice(0, 400)}\n`);
    } catch (e) {
      console.log(`Endpoint error:`, e.message);
    }
  }
}

checkProjectDetails();
