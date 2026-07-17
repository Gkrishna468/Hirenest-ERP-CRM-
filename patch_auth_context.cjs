const fs = require('fs');
let code = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');
code = code.replace(
  'const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {',
  `if (!auth) {
      console.error("Auth is undefined. Probably blocked by iframe. Setting loading to false.");
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {`
);
fs.writeFileSync('src/contexts/AuthContext.tsx', code);
