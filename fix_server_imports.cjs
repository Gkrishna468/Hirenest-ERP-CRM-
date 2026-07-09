const fs = require('fs');
const path = require('path');

const routers = ['requirements', 'clients', 'submissions', 'candidates', 'deals', 'vendors', 'users'];

for (const r of routers) {
    const p = path.join(__dirname, `src/server/routers/${r}.ts`);
    if (fs.existsSync(p)) {
        let c = fs.readFileSync(p, 'utf8');
        c = c.replace(/export default router;\n?/g, '');
        fs.writeFileSync(p, c);
    }
}

let s = fs.readFileSync(path.join(__dirname, 'server.ts'), 'utf8');
s = s.replace(/import requirementsRouter from "\.\/src\/server\/routers\/requirements";/, 'import { requirementsRouter } from "./src/server/routers/requirements";');
s = s.replace(/import clientsRouter from "\.\/src\/server\/routers\/clients";/, 'import { clientsRouter } from "./src/server/routers/clients";');
s = s.replace(/import submissionsRouter from "\.\/src\/server\/routers\/submissions";/, 'import { submissionsRouter } from "./src/server/routers/submissions";');
// The others (vendors, deals, users) were already imported with {}, or let me check server.ts...
// Let's just sed it.
fs.writeFileSync(path.join(__dirname, 'server.ts'), s);
