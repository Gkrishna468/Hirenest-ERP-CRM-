const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ 1\. Health check[\s\S]*?(?=\/\/ 2\. Webhooks)/;
code = code.replace(regex, '// 1. Health check\napp.use("/api/health", healthRouter);\n\n');

fs.writeFileSync('server.ts', code);
