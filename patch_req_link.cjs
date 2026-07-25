const fs = require('fs');
let content = fs.readFileSync('src/pages/Requirements.tsx', 'utf8');

content = content.replace(
  '<div className="w-full md:w-auto flex flex-col items-center bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg relative overflow-hidden group hover:border-emerald-300 transition-colors">',
  `<div className="w-full md:w-auto flex flex-col items-center bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg relative overflow-hidden group hover:border-emerald-300 transition-colors cursor-pointer"
    onClick={() => {
      const inviteUrl = \`\${window.location.origin}/vendor-submit/\${selectedRequirement.id}\`;
      navigator.clipboard.writeText(inviteUrl);
      toast.success("Network Invite Link copied to clipboard!");
    }}>`
);

fs.writeFileSync('src/pages/Requirements.tsx', content);
