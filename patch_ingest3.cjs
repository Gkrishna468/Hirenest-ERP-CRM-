const fs = require('fs');
let content = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const targetStr = `const pdfParseFn = pdfParseMod.default || pdfParseMod;`;

const replaceStr = `const pdfParseFn = pdfParseMod.PDFParse || pdfParseMod.default || pdfParseMod;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', content);
  console.log('Patched CandidateIngestionService.ts');
} else {
  console.log('Target string not found');
}
