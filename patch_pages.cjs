const fs = require('fs');

let vs = fs.readFileSync('src/pages/VendorSubmit.tsx', 'utf8');
vs = vs.replace(/import \{ dbProxy \} from '@\/services\/firebase\/db-proxy';/, "import { VendorRepository } from '@/repositories/VendorRepository';\nimport { CandidateRepository } from '@/repositories/CandidateRepository';");
vs = vs.replace(/await dbProxy\.getDoc\('vendors', authenticatedVendor\.id\)/g, "await VendorRepository.getById(authenticatedVendor.id)");
vs = vs.replace(/await dbProxy\.getDocs\('candidates', \{[^}]+\}\)/g, "((await CandidateRepository.list()) || []).filter(c => c.vendorCompanyId === authenticatedVendor.companyId)");
fs.writeFileSync('src/pages/VendorSubmit.tsx', vs);

let v = fs.readFileSync('src/pages/Vendors.tsx', 'utf8');
v = v.replace(/import \{ dbProxy \} from '@\/services\/firebase\/db-proxy';/, "import { VendorRepository } from '@/repositories/VendorRepository';\nimport { CandidateRepository } from '@/repositories/CandidateRepository';\nimport { dbProxy } from '@/services/firebase/db-proxy';");
v = v.replace(/await dbProxy\.updateDoc\('candidates', id, /g, "await CandidateRepository.update(id, ");
v = v.replace(/await dbProxy\.addDoc\('candidates', payload\)/g, "await CandidateRepository.create(payload)");
v = v.replace(/await dbProxy\.setDoc\('vendors', vendorId, payload\)/g, "await VendorRepository.create({ id: vendorId, ...payload })");
fs.writeFileSync('src/pages/Vendors.tsx', v);
