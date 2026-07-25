const fs = require('fs');
let content = fs.readFileSync('src/pages/VendorSlaDashboard.tsx', 'utf8');

// Replace the entire space-y-6 container content except the Bulk Feedback Center
content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?\{\/\* BULK FEEDBACK CENTER TERMINAL \*\/\}/,
  '{/* BULK FEEDBACK CENTER TERMINAL */}'
);

fs.writeFileSync('src/pages/VendorSlaDashboard.tsx', content);
