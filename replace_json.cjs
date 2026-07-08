const fs = require('fs');
const glob = require('glob'); // Not available? We can just use child_process or simple script

const { execSync } = require('child_process');

const files = execSync('grep -rn "\\.json()" src/ | cut -d: -f1 | sort | uniq').toString().trim().split('\n');

for (const file of files) {
  if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('safeJson')) continue;
  
  // Need to import safeJson at the top
  content = `import { safeJson } from '@/utils/safeJson';\n` + content;
  
  // Replace .json() with safeJson(...)
  // E.g. await response.json() -> await safeJson(response)
  // E.g. await res.json() -> await safeJson(res)
  
  content = content.replace(/await ([a-zA-Z0-9_]+)\.json\(\)/g, 'await safeJson($1)');
  
  fs.writeFileSync(file, content);
}
