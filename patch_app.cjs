const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  'return <Navigate to="/vendor-portal" />;',
  'return <Navigate to="/vendor" />;'
);

fs.writeFileSync('src/App.tsx', content);
