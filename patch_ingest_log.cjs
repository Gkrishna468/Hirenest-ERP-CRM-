const fs = require('fs');
let code = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

// revert the previous naive replace
code = code.replace(/require\('fs'\)\.appendFileSync\('\/tmp\/ingest\.log', /g, 'console.log(');

// Add custom logger
const customLogger = `
const fileLog = (...args) => {
  require('fs').appendFileSync('/tmp/ingest.log', args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') + '\\n');
};
`;

code = code.replace(`export class CandidateIngestionService {`, customLogger + `\nexport class CandidateIngestionService {`);
code = code.replace(/console\.log\(/g, 'fileLog(');
code = code.replace(/console\.error\(/g, 'fileLog("ERROR:", ');

fs.writeFileSync('src/server/services/CandidateIngestionService.ts', code);
