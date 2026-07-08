const fs = require('fs');

let vs = fs.readFileSync('src/pages/VendorSubmit.tsx', 'utf8');
vs = vs.replace(/performanceScore: Number\(\(vData as any\)\.performanceScore\) \|\| 85,/g, "performanceScore: Number((vData as any).performanceScore || 85),");
vs = vs.replace(/lastRotationTime: \(\(vData as any\)\.lastRotationTime \|\| \(vData as any\)\.last_rotation_time \|\| ''\) as string,/g, "lastRotationTime: ((vData as any)?.lastRotationTime || (vData as any)?.last_rotation_time || '') as string,");
vs = vs.replace(/lastValidationTime: \(\(vData as any\)\.lastValidationTime \|\| \(vData as any\)\.last_validation_time \|\| ''\) as string,/g, "lastValidationTime: ((vData as any)?.lastValidationTime || (vData as any)?.last_validation_time || '') as string,");
fs.writeFileSync('src/pages/VendorSubmit.tsx', vs);

let v = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');
v = v.replace(/feedbackNotes:/g, "notes:");
v = v.replace(/source: payload\.source/g, "source: payload.source as any");
v = v.replace(/source: 'vendor'/g, "source: 'vendor' as any");
fs.writeFileSync('src/pages/Vendors.tsx', v);
