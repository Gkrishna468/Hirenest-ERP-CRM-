const fs = require('fs');
let content = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

const targetRegex = /const pdfjsLib = await import\("pdfjs-dist\/legacy\/build\/pdf\.mjs"\);[\s\S]*?console\.log\("\[IngestService\] STEP 2: OCR OK\. Text length:", resumeText\?\.length\);/;

const replaceStr = `const isDocx = fileName.toLowerCase().endsWith('.docx') || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isPdf = fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

      if (!isDocx && !isPdf) {
        return { status: 400, data: { success: false, error: "Unsupported file format. Only PDF and DOCX are allowed." } };
      }

      console.log("[IngestService] STEP 2: Text Extraction Starting...", isDocx ? "(DOCX)" : "(PDF)");
      let resumeText = "";
      try {
        if (isDocx) {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          resumeText = result.value;
        } else {
          try {
            const pdfParse = (await import("pdf-parse")).default;
            const pdfData = await pdfParse(fileBuffer);
            resumeText = pdfData.text;
          } catch (pdfError) {
             console.log("ERROR:", "[IngestService] pdf-parse Failed:", pdfError.message || pdfError);
             if ((pdfError.message || "").includes("Invalid PDF structure")) {
                 resumeText = fileBuffer.toString('utf-8');
                 console.log("[IngestService] Fallback to raw text read due to Invalid PDF structure");
             } else {
                 throw pdfError;
             }
          }
        }
      } catch (extError) {
        console.log("ERROR:", "[IngestService] Extraction Failed:", extError.message || extError);
        return { status: 400, data: { success: false, error: "Failed to extract text from file. The file might be corrupted." } };
      }
      console.log("[IngestService] STEP 2: Extraction OK. Text length:", resumeText?.length);`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replaceStr);
  fs.writeFileSync('src/server/services/CandidateIngestionService.ts', content);
  console.log('Patched CandidateIngestionService.ts');
} else {
  console.log('Target string not found');
}
