const fs = require('fs');
let content = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const targetStr = `let pdfParseMod = await import("pdf-parse");
            const pdfParseFn = pdfParseMod.PDFParse || pdfParseMod.default || pdfParseMod;
            const pdfData = await pdfParseFn(fileBuffer);
            resumeText = pdfData.text;`;

const replaceStr = `let pdfParseMod = await import("pdf-parse");
            const PDFParse = pdfParseMod.PDFParse;
            const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });
            const result = await parser.getText();
            resumeText = result.text || result;`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', content);
  console.log('Patched CandidateIngestionService.ts');
} else {
  console.log('Target string not found');
}
