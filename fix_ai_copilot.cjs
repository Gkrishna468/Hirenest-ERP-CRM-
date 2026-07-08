const fs = require('fs');
let code = fs.readFileSync('src/server/controllers/ai.ts', 'utf8');

if (!code.includes('import { emailDraftParser }')) {
  code = 'import { emailDraftParser } from "../ai/parsers/EmailDraft.js";\n' + code;
}

const oldCopilotStr = `    const gatewayResult = await executeServerAITask({
      action: "copilot",
      prompt: optimization.finalPrompt,
      responseFormatJson: false,
      complexity: "complex"
    });

    const draft = gatewayResult.text || "";`;

const newCopilotStr = `    const emailDraft = await emailDraftParser.draft(optimization.finalPrompt, {});
    const draft = (emailDraft.subject ? "Subject: " + emailDraft.subject + "\\n\\n" : "") + emailDraft.body;`;

code = code.replace(oldCopilotStr, newCopilotStr);
fs.writeFileSync('src/server/controllers/ai.ts', code);
