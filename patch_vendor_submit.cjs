const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');
content = content.replace(
  'temporaryPassword: partnerForm.temporaryPassword',
  'temporaryPassword: Math.random().toString(36).slice(-10) + "A1!"'
);
fs.writeFileSync('src/pages/Vendors.tsx', content);
