const fs = require('fs');
let code = fs.readFileSync('src/server/ai/providers/GeminiProvider.ts', 'utf8');

const replacement = `async draftEmail(prompt: string, context: any): Promise<EmailDraftResult> {
    if (!this.ai) throw new Error("Gemini not initialized");

    const systemPrompt = \`Act as an expert technical staffing AI.
Generate a professional email based on the following instructions.
RETURN EXACTLY A JSON OBJECT MATCHING THIS SCHEMA:
{
  "subject": "The proposed subject line",
  "body": "The complete email body."
}

INSTRUCTIONS:
\${prompt}

CONTEXT (if any):
\${JSON.stringify(context || {})}
\`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });
    
    const responseText = response.text || "{}";
    let result;
    try {
      const jsonStr = responseText.replace(/^\\s*\`\`\`(?:json)?|\\s*\`\`\`\\s*$/gm, "").trim();
      result = JSON.parse(jsonStr);
    } catch (e) {
      result = { subject: "Generated Email", body: responseText };
    }
    
    return {
      subject: result.subject || "Generated Email",
      body: result.body || responseText
    } as EmailDraftResult;
  }`;

code = code.replace(/async draftEmail[^}]+}/, replacement);
fs.writeFileSync('src/server/ai/providers/GeminiProvider.ts', code);
