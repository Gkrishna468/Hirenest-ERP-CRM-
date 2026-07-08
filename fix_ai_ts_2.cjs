const fs = require('fs');
let code = fs.readFileSync('src/server/controllers/ai.ts', 'utf8');

const startStr = "case 'parse-resume':";
const endStr = "          });\n        } catch (error: any) {";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `case 'parse-resume':
      return (async () => {
        try {
          const { resumeText } = req.body;
          if (!resumeText) {
            return res.status(400).json({ error: "No resumeText provided." });
          }
          
          const data = await resumeParser.parse(resumeText);
          
          return res.status(200).json(data);`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex);
}

fs.writeFileSync('src/server/controllers/ai.ts', code);
