const fs = require('fs');

const replaceInFile = (file, search, replace) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(new RegExp(search, 'g'), replace);
  fs.writeFileSync(file, content);
};

const replaceInFileExact = (file, search, replace) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(file, content);
};

replaceInFileExact('src/pages/Dashboard.tsx', '"/api/candidates?action=reprocessAiQueue"', '"/api/candidates/reprocess"');
replaceInFileExact('src/pages/PublicApply.tsx', "'/api/candidates?action=submitVendorCandidate'", "'/api/candidates/requirement'");
replaceInFileExact('src/pages/VendorSubmit.tsx', "'/api/candidates?action=submitVendorCandidate'", "'/api/candidates/requirement'");
replaceInFileExact('src/pages/VendorSubmit.tsx', "'/api/candidates?action=submitVendorCandidatePool'", "'/api/candidates/pool'");
replaceInFileExact('src/pages/VendorSubmit.tsx', "'/api/candidates?action=triggerAiRotation'", "'/api/candidates/rotation'");
replaceInFileExact('src/pages/VendorSubmit.tsx', "'/api/candidates?action=validateCandidates'", "'/api/candidates/validate'");
replaceInFileExact('src/pages/Vendors.tsx', "'/api/candidates?action=submitVendorCandidate'", "'/api/candidates/requirement'");
replaceInFileExact('src/pages/Vendors.tsx', "'/api/candidates?action=submitVendorCandidatePool'", "'/api/candidates/pool'");

