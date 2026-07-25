const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

content = content.replace(
  '<span className="font-bold text-amber-400">{createdCredentials.password}</span>',
  '<span className="font-bold text-amber-400 break-all">{createdCredentials.resetLink ? "Invite Link Generated (Click to Copy)" : "No reset link"}</span>'
);

content = content.replace(
  'Password:',
  'Invite Link:'
);

content = content.replace(
  'Password:' // just in case it replaces the first occurrence, I should be careful.
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
