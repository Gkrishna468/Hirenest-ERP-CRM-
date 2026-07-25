const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');
content = content.replace(
  'if (partnerForm.createLogin && partnerForm.temporaryPassword) {',
  'if (partnerForm.createLogin) {'
);
fs.writeFileSync('src/pages/Vendors.tsx', content);
