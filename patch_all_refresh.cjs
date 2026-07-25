const fs = require('fs');

const filesToPatch = [
  {
    path: 'src/pages/Accounts.tsx',
    destructure: 'const { clients, loading, addClient, jobs, candidates } = useData();',
    destructureNew: 'const { clients, loading, addClient, jobs, candidates, refreshAll } = useData();'
  },
  {
    path: 'src/pages/Vendors.tsx',
    destructure: 'const { vendors, loading, addVendor, jobs, candidates } = useData();',
    destructureNew: 'const { vendors, loading, addVendor, jobs, candidates, refreshAll } = useData();'
  },
  {
    path: 'src/pages/Revenue.tsx',
    destructure: 'const { deals, loading } = useData();',
    destructureNew: 'const { deals, loading, refreshAll } = useData();'
  }
];

for (const file of filesToPatch) {
  let content = fs.readFileSync(file.path, 'utf8');
  content = content.replace(file.destructure, file.destructureNew);
  content = content.replace(/refreshData\(\)/g, "refreshAll()");
  fs.writeFileSync(file.path, content);
}
