const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

// Remove Health Score table header
content = content.replace(
  '<th className="pb-3 text-center">Health Score</th>',
  ''
);

// Remove Health Score table cell
content = content.replace(
  /<td className="py-3 text-center">\s*<span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-\[10px\] font-bold font-mono">\s*91%\s*<\/span>\s*<\/td>/g,
  ''
);

// Modify grid cols
content = content.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">',
  '<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">'
);

// Remove Column 1: Circular Health Scores
content = content.replace(
  /\{\/\* Column 1: Circular Health Scores \*\/\}[\s\S]*?\{\/\* Column 2: Resume versioning \(V1, V2, V3\) \*\/\}/,
  '{/* Column 1: Resume versioning (V1, V2, V3) */}'
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
