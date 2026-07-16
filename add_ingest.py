import re

with open('src/server/services/CandidateIngestionService.ts', 'r') as f:
    content = f.read()

# I also need to import pdf-parse and resumeParser
if 'import pdfParse from "pdf-parse";' not in content:
    content = content.replace('import { executeServerAITask } from "../controllers/aiGateway.js";', 'import { executeServerAITask } from "../controllers/aiGateway.js";\nimport pdfParse from "pdf-parse";\nimport { resumeParser } from "../ai/parsers/ResumeParser";')

ingest_func = '''
  async ingestCandidateFile(vendorId: string, requirementId: string, fileBuffer: Buffer, fileName: string, mimeType: string, isPool: boolean = false) {
    try {
      // 1. Extract text from PDF
      const pdfData = await pdfParse(fileBuffer);
      const resumeText = pdfData.text;

      if (!resumeText || resumeText.trim().length === 0) {
        return { status: 400, data: { success: false, error: "Could not extract text from file" } };
      }

      // 2. Parse using AI
      const identityData = await resumeParser.parse(resumeText);
      const candidateName = identityData.name && identityData.name !== "Unknown Candidate" ? identityData.name : fileName;
      
      // 3. Delegate to existing logic
      if (isPool) {
        return await this.submitToPool(vendorId, candidateName, identityData);
      } else {
        return await this.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData);
      }
    } catch (e: any) {
      console.error("[CandidateIngestionService.ingestCandidateFile] Error:", e);
      return { status: 500, data: { success: false, error: e.message } };
    }
  }

  async submitCandidateToRequirement'''

content = content.replace('async submitCandidateToRequirement', ingest_func)

with open('src/server/services/CandidateIngestionService.ts', 'w') as f:
    f.write(content)
