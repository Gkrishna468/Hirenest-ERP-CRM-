const fs = require('fs');

for (const file of ['src/server/services/CandidateIngestionService.ts', 'src/server/routers/candidates.ts']) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/require\('fs'\)/g, 'fs');
  code = `import fs from 'fs';\n` + code;
  fs.writeFileSync(file, code);
}
