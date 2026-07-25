const fs = require('fs');
let content = fs.readFileSync('src/server/services/VendorOnboardingService.ts', 'utf8');

content = content.replace(
  '// Set Custom Claims for organization mapping and role mapping',
  'let resetLink = "";\n    try {\n      resetLink = await adminAuth.generatePasswordResetLink(email);\n    } catch(e) { console.warn("Failed to generate password reset link", e); }\n\n    // Set Custom Claims for organization mapping and role mapping'
);

content = content.replace(
  "userId: userRecord.uid,",
  "userId: userRecord.uid,\n      resetLink,"
);

fs.writeFileSync('src/server/services/VendorOnboardingService.ts', content);
