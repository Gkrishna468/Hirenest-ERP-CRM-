const fs = require('fs');
let code = fs.readFileSync('src/server/routers/candidates.ts', 'utf8');

const customLogger = `
const fileLog = (...args) => {
  require('fs').appendFileSync('/tmp/ingest.log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\\n');
};
`;

code = code.replace(`const router = Router();`, customLogger + `\nconst router = Router();`);
code = code.replace(/console\.log\(/g, 'fileLog(');
code = code.replace(/console\.error\(/g, 'fileLog("ERROR:", ');

fs.writeFileSync('src/server/routers/candidates.ts', code);
