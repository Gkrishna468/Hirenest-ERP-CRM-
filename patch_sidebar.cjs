const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
content = content.replace(
  "{ icon: ShieldCheck, label: 'Governance', path: '/migration' },",
  "// { icon: ShieldCheck, label: 'Governance', path: '/migration' },"
);
fs.writeFileSync('src/components/Sidebar.tsx', content);
