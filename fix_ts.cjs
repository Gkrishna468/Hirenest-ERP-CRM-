const fs = require('fs');

let vs = fs.readFileSync('src/pages/VendorSubmit.tsx', 'utf8');
vs = vs.replace("import { VendorRepository } from '@/repositories/VendorRepository';\nimport { VendorRepository } from '@/repositories/VendorRepository';", "import { VendorRepository } from '@/repositories/VendorRepository';");
vs = vs.replace(/const docs = await dbProxy\.getDocs\('candidates', \{\s*where: \[\{ field: 'vendorId', op: '==', value: authenticatedVendor\.id \}\]\s*\}\);/g, "const docs = (await CandidateRepository.list()).filter(c => c.vendorId === authenticatedVendor.id);");

vs = vs.replace("performanceScore: vData.performanceScore || 85,", "performanceScore: (vData as any).performanceScore || 85,");
vs = vs.replace("lastRotationTime: vData.lastRotationTime || vData.last_rotation_time || '',", "lastRotationTime: (vData as any).lastRotationTime || (vData as any).last_rotation_time || '',");
vs = vs.replace("lastValidationTime: vData.lastValidationTime || vData.last_validation_time || '',", "lastValidationTime: (vData as any).lastValidationTime || (vData as any).last_validation_time || '',");
fs.writeFileSync('src/pages/VendorSubmit.tsx', vs);

let v = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');
v = v.replace(/feedbackNotes: newFeedback/g, "notes: newFeedback");
v = v.replace(/source: 'vendor'/g, "source: 'vendor' as any");
v = v.replace(/source: payload\.source/g, "source: payload.source as any");
fs.writeFileSync('src/pages/Vendors.tsx', v);
