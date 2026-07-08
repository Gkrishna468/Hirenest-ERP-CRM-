const fs = require('fs');
let vs = fs.readFileSync('src/pages/VendorSubmit.tsx', 'utf8');
vs = vs.replace(/performanceScore: Number\(\(vData as any\)\.performanceScore \|\| 85\),/g, "performanceScore: Number((vData as any).performanceScore) || 85,");
vs = vs.replace(/lastRotationTime: \(\(vData as any\)\?.lastRotationTime \|\| \(vData as any\)\?.last_rotation_time \|\| ''\) as string,/g, "lastRotationTime: ((vData as any)?.lastRotationTime || (vData as any)?.last_rotation_time || '') as string,");
vs = vs.replace(/lastValidationTime: \(\(vData as any\)\?.lastValidationTime \|\| \(vData as any\)\?.last_validation_time \|\| ''\) as string,/g, "lastValidationTime: ((vData as any)?.lastValidationTime || (vData as any)?.last_validation_time || '') as string,");
fs.writeFileSync('src/pages/VendorSubmit.tsx', vs);
