const fs = require('fs');

let code = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

// Remove the fileLog hack
code = code.replace(/const fileLog = \(\.\.\.args\) => \{[\s\S]*?\};\n/, '');
code = code.replace(/fileLog\(/g, 'console.log(');

// Replace pdf2json with pdf-parse
const oldPdfCode = `      // pdf2json for text extraction
      const PDFParser = (await import("pdf2json")).default;
      console.log("[IngestService] Upload & Import OK. Starting OCR");
      const resumeText = await new Promise<string>((resolve, reject) => {
          const pdfParser = new PDFParser(this as any, 1);
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
              resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(fileBuffer);
      });`;

const newPdfCode = `      console.log("[IngestService] STEP 1: Upload OK. Buffer size:", fileBuffer?.length);
      
      const pdfParse = (await import("pdf-parse")).default;
      console.log("[IngestService] STEP 2: OCR Starting...");
      const pdfData = await pdfParse(fileBuffer);
      const resumeText = pdfData.text;
      console.log("[IngestService] STEP 2: OCR OK. Text length:", resumeText?.length);`;

code = code.replace(oldPdfCode, newPdfCode);

// Add STEP logs
code = code.replace(`      // 2. Parse using AI
      console.log("[IngestService] Starting AI Parse");`, 
`      // 2. Parse using AI
      console.log("[IngestService] STEP 3: Starting AI Parse");`);

code = code.replace(`      console.log("[IngestService] AI Parse OK", !!identityData);`,
`      console.log("[IngestService] STEP 3: AI Parse OK. Identity:", identityData?.name);`);

code = code.replace(`      // 3. Delegate to existing logic
      console.log("[IngestService] Starting Identity/Candidate Logic");`,
`      // 3. Delegate to existing logic
      console.log("[IngestService] STEP 4: Identity & Candidate Save");`);

code = code.replace(`      console.log("[IngestService] Identity/Candidate Logic OK", result?.status);`,
`      console.log("[IngestService] STEP 7: Response ready", result?.status);`);

fs.writeFileSync('src/server/services/CandidateIngestionService.ts', code);

// Now fix the router logs to use console.log
let routerCode = fs.readFileSync('src/server/routers/candidates.ts', 'utf8');
routerCode = routerCode.replace(/const fileLog = \(\.\.\.args\) => \{[\s\S]*?\};\n/, '');
routerCode = routerCode.replace(/fileLog\(/g, 'console.log(');
routerCode = routerCode.replace(`import fs from 'fs';\n`, '');
fs.writeFileSync('src/server/routers/candidates.ts', routerCode);

