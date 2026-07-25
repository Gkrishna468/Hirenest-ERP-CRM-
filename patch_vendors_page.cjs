const fs = require('fs');
let content = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');

content = content.replace(
  'const authErr = await safeJson(authRes);\n            throw new Error(authErr.error || \'Failed to provision credentials\');\n          }\n          toast.success(\'Secure Firebase Auth account & Custom Claims successfully provisioned.\');',
  'const authErr = await safeJson(authRes);\n            throw new Error(authErr.error || \'Failed to provision credentials\');\n          }\n          const authData = await safeJson(authRes);\n          setCreatedCredentials({\n            companyName: partnerForm.companyName,\n            vendorCode,\n            email: emailLower,\n            resetLink: authData.resetLink,\n            createLogin: partnerForm.createLogin\n          });\n          toast.success(\'Secure Firebase Auth account & Custom Claims successfully provisioned.\');'
);

content = content.replace(
  'setCreatedCredentials({\n        companyName: partnerForm.companyName,\n        vendorCode,\n        email: emailLower,\n        password: partnerForm.temporaryPassword,\n        createLogin: partnerForm.createLogin\n      });',
  ''
);

fs.writeFileSync('src/pages/Vendors.tsx', content);
