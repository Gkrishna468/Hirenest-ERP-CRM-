const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src/server/services');
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('Service.ts'));

for (const file of files) {
    const p = path.join(servicesDir, file);
    let c = fs.readFileSync(p, 'utf8');
    
    // Remove orphaned `    });` and `    return ...;  }` after `return await ...create(...)`
    c = c.replace(/return await (\w+)\.create\([^)]+\);\s*\}\);\s*return \w+;/g, match => match.split(';')[0] + ';');
    c = c.replace(/await (\w+)\.update\([^)]+\);\s*\}\);/g, match => match.split(';')[0] + ';');
    c = c.replace(/await (\w+)\.archive\([^)]+\);\s*\}\);/g, match => match.split(';')[0] + ';');

    fs.writeFileSync(p, c);
}
