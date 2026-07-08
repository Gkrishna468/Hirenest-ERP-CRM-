const fs = require('fs');
let code = fs.readFileSync('src/server/controllers/ai.ts', 'utf8');

const startStr = "case 'candidate-summary':";
const endStr = "          });\n        } catch (error: any) {";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `case 'candidate-summary':
      return (async () => {
        try {
          const { name, skills, experience, currentCompany, currentTitle, notes } = req.body;
          const data = await candidateSummaryParser.summarize({ name, skills, experience, currentCompany, currentTitle, notes });
          
          return res.status(200).json(data);`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
}

fs.writeFileSync('src/server/controllers/ai.ts', code);
