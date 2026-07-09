const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/pages/VendorPortal.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  'const vendorId = "vendor-1";',
  'const { user } = useAuth();\n  const { vendors } = useData();\n  const currentVendor = vendors.find(v => v.userId === user?.id) || vendors[0];\n  const vendorId = currentVendor?.id || "vendor-1";'
);

fs.writeFileSync(p, c);
