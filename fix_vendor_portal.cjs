const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/pages/VendorPortal.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace('import { apiFetch } from "../lib/api";', 'import { useAuth } from "../contexts/AuthContext";');
c = c.replace('const { jobs, deals, candidates, refreshAll } = useData();', 'const { jobs, deals, candidates, refreshAll } = useData();\n  const { apiFetch } = useAuth();');

fs.writeFileSync(p, c);
