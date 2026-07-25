const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');
content = content.replace(
  '<span className="text-slate-500">Temp Password:</span>',
  '<span className="text-slate-500">Invite Link:</span>'
);
content = content.replace(
  '<span className="font-bold text-amber-400 break-all">{createdCredentials.resetLink ? "Invite Link Generated (Click to Copy)" : "No reset link"}</span>',
  '<span className="font-bold text-amber-400 break-all cursor-pointer hover:text-amber-300" onClick={() => { if(createdCredentials.resetLink) { navigator.clipboard.writeText(createdCredentials.resetLink); toast.success("Copied to clipboard!"); } }}>{createdCredentials.resetLink ? "Copy Invite Link" : "No reset link"}</span>'
);
fs.writeFileSync('src/pages/Vendors.tsx', content);
