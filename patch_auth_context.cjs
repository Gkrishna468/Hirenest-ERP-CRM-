const fs = require('fs');
let content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

content = content.replace(
  /firebaseUser.uid === 'me995j91dmNkwfXXfaCyrDo8oa03' \|\| firebaseUser.email === 'admin@hirenestworkforce.com'/g,
  "firebaseUser.uid === 'me995j91dmNkwfXXfaCyrDo8oa03' || firebaseUser.email === 'admin@hirenestworkforce.com' || firebaseUser.email === 'gopalkrishna0046@gmail.com'"
);

fs.writeFileSync('src/contexts/AuthContext.tsx', content);
