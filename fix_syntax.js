const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src/server/services');
const files = fs.readdirSync(servicesDir).filter(f => f.endsWith('Service.ts'));

for (const file of files) {
    const p = path.join(servicesDir, file);
    let c = fs.readFileSync(p, 'utf8');
    
    // Remove orphaned `    });` and `    return ...;  }` after `return await ...create(...)`
    c = c.replace(/return await (\w+)\.create\(([^,]+), ([^)]+)\);\s*\}\);\s*return \2;/g, 'return await $1.create($2, $3);');
    c = c.replace(/await (\w+)\.update\([^)]+\);\s*\}\);/g, match => match.replace(/\s*\}\);/, ''));
    c = c.replace(/await (\w+)\.archive\([^)]+\);\s*\}\);/g, match => match.replace(/\s*\}\);/, ''));

    fs.writeFileSync(p, c);
}
