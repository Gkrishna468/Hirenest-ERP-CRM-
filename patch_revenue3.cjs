const fs = require('fs');
let content = fs.readFileSync('src/pages/Revenue.tsx', 'utf8');

content = content.replace(
  /<span\s*className=\{cn\(\s*"text-xs font-bold px-2 py-1 rounded-lg",\s*stat.trend.startsWith\("\+"\)\s*\?\s*"bg-green-50 text-green-600"\s*:\s*"bg-red-50 text-red-600",\s*\)\}\s*>\s*\{stat.trend\}\s*<\/span>/,
  '{stat.trend && <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", stat.trend.startsWith("+") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{stat.trend}</span>}'
);

fs.writeFileSync('src/pages/Revenue.tsx', content);
