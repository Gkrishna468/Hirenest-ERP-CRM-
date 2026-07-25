const fs = require('fs');

let content = fs.readFileSync('src/pages/Requirements.tsx', 'utf8');

// Replace destructuring
content = content.replace(
  "const { jobs, loading, approveJobWithBudget, addJob, updateJob, candidates, deals, clients } =",
  "const { jobs, loading, approveJobWithBudget, addJob, updateJob, candidates, deals, clients, refreshAll } ="
);

// Replace refreshData() with refreshAll()
content = content.replace(/refreshData\(\)/g, "refreshAll()");

fs.writeFileSync('src/pages/Requirements.tsx', content);

