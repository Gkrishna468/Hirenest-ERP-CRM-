const fs = require('fs');

let authContent = fs.readFileSync('src/server/routers/auth.ts', 'utf8');
authContent = authContent.replace(
  /if \(userProfile && userProfile\.email === 'gopal@hirenestworkforce\.com' && userProfile\.role !== 'admin'\) \{/g,
  `if (userProfile && (userProfile.email === 'gopal@hirenestworkforce.com' || userProfile.email === 'gopalkrishna0046@gmail.com' || userProfile.email === 'admin@hirenestworkforce.com') && userProfile.role !== 'admin') {`
);
fs.writeFileSync('src/server/routers/auth.ts', authContent);

