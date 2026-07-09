const fs = require('fs');
const glob = require('glob');
// Wait, glob might not be installed, use child_process
const { execSync } = require('child_process');

const files = execSync('find src/server/controllers -type f -name "*.ts"').toString().split('\n').filter(Boolean);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Quick check if the file has getApps and initializeApp
  if (content.includes('initializeApp') && content.includes('getApps')) {
    // We will do a manual edit for auth.ts
    console.log(`Needs fixing: ${file}`);
  }
}
