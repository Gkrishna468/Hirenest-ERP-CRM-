const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/pages/VendorPortal.tsx');
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  'const { jobs, deals, candidates, refreshAll } = useData();',
  'const { jobs, deals, candidates, refreshAll, addCandidate } = useData();'
);

const addCandidateFn = `
  const handleAddCandidate = async () => {
    const name = prompt("Enter candidate name:");
    if (!name) return;
    const skills = prompt("Enter skills (comma separated):");
    const exp = prompt("Enter years of experience:");
    
    await addCandidate({
      name,
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      experience: exp ? parseInt(exp, 10) : 0,
      vendorId: vendorId,
      vendorName: currentVendor?.name || "Vendor",
      source: "vendor",
      stage: "new"
    });
    toast.success("Candidate added successfully!");
  };
`;

c = c.replace('const handleValidateBench', addCandidateFn + '\n  const handleValidateBench');
c = c.replace(
  '<button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">',
  '<button onClick={handleAddCandidate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors">'
);

fs.writeFileSync(p, c);
