const fs = require('fs');
let code = fs.readFileSync('src/server/controllers/ai.ts', 'utf8');

if (!code.includes('import { candidateSummaryParser }')) {
  code = code.replace('import { resumeParser }', 'import { resumeParser } from "../ai/parsers/ResumeParser.js";\nimport { candidateSummaryParser } from "../ai/parsers/CandidateSummary.js";');
}

// Find the block for 'candidate-summary' and replace it.
const startStr = "case 'candidate-summary':";
const endStr = "          return res.status(200).json({";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `case 'candidate-summary':
      return (async () => {
        try {
          const { name, skills, experience, currentCompany, currentTitle, notes } = req.body;
          const data = await candidateSummaryParser.summarize({ name, skills, experience, currentCompany, currentTitle, notes });
          
`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
}

fs.writeFileSync('src/server/controllers/ai.ts', code);
