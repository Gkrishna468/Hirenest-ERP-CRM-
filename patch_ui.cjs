const fs = require('fs');
let code = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

code = code.replace(
  `            stages: {
              ...updated[i].stages!,
              upload: 'success',
              parse: 'success',
              dupCheck: dupCheckStatus as any
            }`,
  `            stages: {
              ...updated[i].stages!,
              upload: response.status === 409 ? 'success' : 'failed',
              parse: response.status === 409 ? 'success' : 'failed',
              dupCheck: dupCheckStatus as any
            }`
);

fs.writeFileSync('src/pages/Vendors.tsx', code);
