const fs = require('fs');

let authContextContent = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
authContextContent = authContextContent.replace(/gopalkrishna0046@gmail\.com/g, 'gopal@hirenestworkforce.com');
fs.writeFileSync('src/contexts/AuthContext.tsx', authContextContent);

let authRouterContent = fs.readFileSync('src/server/routers/auth.ts', 'utf8');
authRouterContent = authRouterContent.replace(/gopalkrishna0046@gmail\.com/g, 'gopal@hirenestworkforce.com');
fs.writeFileSync('src/server/routers/auth.ts', authRouterContent);

