const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'import webhooksHandler from "./src/server/controllers/webhooks";',
  'import webhooksHandler from "./src/server/controllers/webhooks";\nimport docusignWebhookHandler from "./src/server/controllers/docusign";'
);

content = content.replace(
  '// 2. Webhooks\napp.all("/api/webhooks", async (req, res) => {',
  '// 2. Webhooks\napp.post("/api/webhooks/docusign", docusignWebhookHandler);\napp.all("/api/webhooks", async (req, res) => {'
);

fs.writeFileSync('server.ts', content);
