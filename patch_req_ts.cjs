const fs = require('fs');
let content = fs.readFileSync('src/pages/Requirements.tsx', 'utf8');

content = content.replace(
  /} catch\(err\) {/,
  '} catch(err: any) {'
);

fs.writeFileSync('src/pages/Requirements.tsx', content);
