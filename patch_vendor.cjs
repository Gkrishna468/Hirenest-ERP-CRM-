const fs = require('fs');
let content = fs.readFileSync('src/pages/VendorSubmit.tsx', 'utf8');

// 1. Add import
content = content.replace(
  "import { CandidateRepository } from '@/repositories/CandidateRepository';",
  "import { CandidateRepository } from '@/repositories/CandidateRepository';\nimport { VendorAuth } from '@/components/VendorAuth';"
);

// 2. Remove states
content = content.replace(
  /\/\/ Authentication State[\s\S]*?const \[authChecking, setAuthChecking\] = useState\(false\);/,
  "// Authentication State\n  const [authenticatedVendor, setAuthenticatedVendor] = useState<any>(null);"
);

// 3. Remove sessionStorage logic
content = content.replace(
  /\/\/ Check if vendor code is already stored in sessionStorage[\s\S]*?setAuthenticatedVendor\(match\);\n          }\n        }/,
  "// Auth is now handled by VendorAuth and Firebase"
);

// 4. Replace handleLogout and delete handleVendorLoginChallenge / handleVerifyOtp
content = content.replace(
  /\/\/ Handle Vendor ID \+ Secret Key Challenge Handshake[\s\S]*?sessionStorage\.removeItem\('hn_vendor_code'\);\n  };/,
  "const handleLogout = () => {\n    setAuthenticatedVendor(null);\n    import('firebase/auth').then(({ signOut }) => {\n      import('@/services/firebase/config').then(({ auth }) => {\n        signOut(auth).catch(console.error);\n      });\n    });\n  };"
);

// 5. Replace the UI block
content = content.replace(
  /\/\/ 1\. NOT LOGGED IN STATE\n  if \(\!authenticatedVendor\) \{[\s\S]*?\n  \}\n\n  \/\/ 2\. CHECK IF THERE IS A REQUISITION/,
  "// 1. NOT LOGGED IN STATE\n  if (!authenticatedVendor) {\n    return <VendorAuth onAuthSuccess={setAuthenticatedVendor} />;\n  }\n\n  // 2. CHECK IF THERE IS A REQUISITION"
);

fs.writeFileSync('src/pages/VendorSubmit.tsx', content);
