const fs = require('fs');
let content = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const targetRegex = /try \{\s*const pdfParseMod = await import\("pdf-parse"\);\s*const pdfParseFn = pdfParseMod\.PDFParse \|\| pdfParseMod\.default \|\| pdfParseMod;\s*const pdfData = await pdfParseFn\(fileBuffer\);\s*resumeText = pdfData\.text;\s*\}/g;

const replaceStr = `try {
            const pdfParseMod = await import("pdf-parse");
            const PDFParse = pdfParseMod.PDFParse;
            const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
            const pdfData = await parser.getText();
            resumeText = pdfData; // or pdfData.text if getText returns an object? wait, README says result.text
          }`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replaceStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', content);
  console.log('Patched CandidateIngestionService.ts');
} else {
  console.log('Target string not found');
}
