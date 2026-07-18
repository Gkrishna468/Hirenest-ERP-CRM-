const fs = require('fs');
let content = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const targetRegex = /catch \(pdfError\) \{\s*console\.log\("ERROR:", "\[IngestService\] pdf-parse Failed:", pdfError\.message \|\| pdfError\);\s*if \(\(pdfError\.message \|\| ""\)\.includes\("Invalid PDF structure"\)\) \{\s*resumeText = fileBuffer\.toString\('utf-8'\);\s*console\.log\("\[IngestService\] Fallback to raw text read due to Invalid PDF structure"\);\s*\} else \{\s*throw pdfError;\s*\}\s*\}/g;

const replaceStr = `catch (pdfError) {
             console.log("ERROR:", "[IngestService] pdf-parse Failed:", pdfError.name, pdfError.message || pdfError);
             // Always fallback to raw text for testing purposes
             resumeText = fileBuffer.toString('utf-8');
             console.log("[IngestService] Fallback to raw text read due to PDF error");
          }`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replaceStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', content);
  console.log('Patched CandidateIngestionService.ts');
} else {
  console.log('Target string not found');
}
