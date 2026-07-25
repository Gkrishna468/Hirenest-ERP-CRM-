const fs = require('fs');
let content = fs.readFileSync('src/pages/Revenue.tsx', 'utf8');

content = content.replace(
  'const timeToClose = wonDeals.length > 0 ? "18 Days" : "N/A";',
  'const timeToClose = "N/A";'
);

content = content.replace(
  /trend: "\+12\.5%"/g,
  'trend: ""'
);
content = content.replace(
  /trend: "\+4\.2%"/g,
  'trend: ""'
);
content = content.replace(
  /trend: "-2\.1%"/g,
  'trend: ""'
);
content = content.replace(
  /trend: "\+18\.1%"/g,
  'trend: ""'
);

content = content.replace(
  /value: formatCurrency\(totalPipeline \* 0\.4\)/,
  'value: formatCurrency(0)'
);

fs.writeFileSync('src/pages/Revenue.tsx', content);
