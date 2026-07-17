const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');
code = `import { ErrorBoundary } from './ErrorBoundary';\n` + code;
code = code.replace('<StrictMode>', '<StrictMode>\n    <ErrorBoundary>');
code = code.replace('</StrictMode>', '    </ErrorBoundary>\n  </StrictMode>');
fs.writeFileSync('src/main.tsx', code);
