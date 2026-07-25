const fs = require('fs');
let content = fs.readFileSync('src/pages/Revenue.tsx', 'utf8');

content = content.replace(
  'icon: Target, Trash2,',
  'icon: Target,'
);

fs.writeFileSync('src/pages/Revenue.tsx', content);
