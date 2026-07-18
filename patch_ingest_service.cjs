const fs = require('fs');
let code = fs.readFileSync('src/server/services/CandidateIngestionService.ts', 'utf8');

code = code.replace(
  `async ingestCandidateFile(vendorId: string, requirementId: string, fileBuffer: Buffer, fileName: string, mimeType: string, isPool: boolean = false) {
    try {
      // 1. Extract text from PDF
      // pdf2json for text extraction
      const PDFParser = (await import("pdf2json")).default;`,
  `async ingestCandidateFile(vendorId: string, requirementId: string, fileBuffer: Buffer, fileName: string, mimeType: string, isPool: boolean = false) {
    console.log("[IngestService] Starting ingestion for", fileName, "Size:", fileBuffer?.length);
    try {
      // 1. Extract text from PDF
      // pdf2json for text extraction
      const PDFParser = (await import("pdf2json")).default;
      console.log("[IngestService] Upload & Import OK. Starting OCR");`
);

code = code.replace(
  `      if (!resumeText || resumeText.trim().length === 0) {
        return { status: 400, data: { success: false, error: "Could not extract text from file" } };
      }`,
  `      console.log("[IngestService] OCR OK. Extracted text length:", resumeText?.length);
      if (!resumeText || resumeText.trim().length === 0) {
        return { status: 400, data: { success: false, error: "Could not extract text from file" } };
      }`
);

code = code.replace(
  `      // 2. Parse using AI
      const identityData = await resumeParser.parse(resumeText);
      const candidateName = identityData.name && identityData.name !== "Unknown Candidate" ? identityData.name : fileName;`,
  `      // 2. Parse using AI
      console.log("[IngestService] Starting AI Parse");
      const identityData = await resumeParser.parse(resumeText);
      console.log("[IngestService] AI Parse OK", !!identityData);
      const candidateName = identityData.name && identityData.name !== "Unknown Candidate" ? identityData.name : fileName;`
);

code = code.replace(
  `      // 3. Delegate to existing logic
      if (isPool) {
        return await this.submitToPool(vendorId, candidateName, identityData);
      } else {
        return await this.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData);
      }`,
  `      // 3. Delegate to existing logic
      console.log("[IngestService] Starting Identity/Candidate Logic");
      let result;
      if (isPool) {
        result = await this.submitToPool(vendorId, candidateName, identityData);
      } else {
        result = await this.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData);
      }
      console.log("[IngestService] Identity/Candidate Logic OK", result?.status);
      return result;`
);

fs.writeFileSync('src/server/services/CandidateIngestionService.ts', code);
