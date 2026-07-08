const fs = require('fs');
let code = fs.readFileSync('src/server/controllers/ai.ts', 'utf8');

if (!code.includes('import { resumeParser }')) {
  code = code.replace('import { executeServerAITask', 'import { resumeParser } from "../ai/parsers/ResumeParser.js";\nimport { executeServerAITask');
}

// Find the block for 'parse-resume' and replace it.
const startStr = "case 'parse-resume':";
const endStr = "          return res.status(200).json({";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `case 'parse-resume':
        try {
          const { resumeText } = req.body;
          if (!resumeText) {
            return res.status(400).json({ error: "No resumeText provided." });
          }
          
          const data = await resumeParser.parse(resumeText);
          
`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
}

fs.writeFileSync('src/server/controllers/ai.ts', code);
