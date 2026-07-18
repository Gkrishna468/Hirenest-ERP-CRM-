const fs = require('fs');
let content = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const targetStr = `const pdfParse = (await import("pdf-parse")).default;
            const pdfData = await pdfParse(fileBuffer);`;

const replaceStr = `let pdfParseMod = await import("pdf-parse");
            const pdfParseFn = pdfParseMod.default || pdfParseMod;
            const pdfData = await pdfParseFn(fileBuffer);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', content);
  console.log('Patched CandidateIngestionService.ts');
} else {
  console.log('Target string not found');
}
