const fs = require('fs');

let vendors = fs.readFileSync('src/server/routers/vendors.ts', 'utf8');
vendors = vendors.replace(
  "import { getAdminDb, getAdminAuth } from '../controllers/firebase-token';",
  "import { getAdminDb, getAdminAuthClient } from '../utils/firebaseAdmin';"
);
vendors = vendors.replace(
  "let adminApp = getApps()[0];\n    const adminAuth = getAdminAuth(adminApp);",
  "const adminAuth = getAdminAuthClient();"
);
fs.writeFileSync('src/server/routers/vendors.ts', vendors);

let health = fs.readFileSync('src/server/routers/health.ts', 'utf8');
health = health.replace(
  "import { getAdminDb } from '../controllers/firebase-token';",
  "import { getAdminDb } from '../utils/firebaseAdmin';"
);
fs.writeFileSync('src/server/routers/health.ts', health);

