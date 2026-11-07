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

async function createRepo() {
  console.log('Creating GitHub repository "webchat"...');
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'node.js',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'webchat',
      description: 'Webchat de Vendas Humanizado com IA e Painel Administrativo',
      private: true,
      auto_init: false
    })
  });

  console.log('Status:', res.status);
  const data = await res.json();
  if (res.status === 201) {
    console.log('Repository created successfully:', data.html_url);
    console.log('Clone URL:', data.clone_url);
  } else {
    console.log('Response:', data);
  }
}

createRepo();
