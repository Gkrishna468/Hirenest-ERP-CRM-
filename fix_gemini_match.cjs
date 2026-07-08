const fs = require('fs');
let code = fs.readFileSync('src/server/ai/providers/GeminiProvider.ts', 'utf8');

const replacement = `async matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    if (!this.ai) throw new Error("Gemini not initialized");

    const prompt = \`Act as an expert technical recruiter matching a Candidate to a Job Requirement.
Analyze the following and provide a match score from 0 to 100, and a concise reasoning.

REQUIREMENT:
Title: \${requirement.title || "Not Specified"}
Target Skills: \${JSON.stringify(requirement.skills || requirement.targetCompetencies || [])}
Description: \${requirement.description || "None"}
Min Experience: \${requirement.minExperience || 0} Years

CANDIDATE:
Name: \${candidate.name || "Unknown"}
Current Title: \${candidate.currentTitle || "None"}
Skills: \${JSON.stringify(candidate.skills || [])}
Experience: \${candidate.experience || 0}
Summary: \${candidate.summary || "None"}

RETURN ONLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "score": 85,
  "reasoning": "Strong match based on React experience."
}
\`;

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const responseText = response.text || "{}";
    const jsonStr = responseText.replace(/^\\s*\`\`\`(?:json)?|\\s*\`\`\`\\s*$/gm, "").trim();
    return JSON.parse(jsonStr) as RequirementMatchResult;
  }`;

code = code.replace(/async matchRequirement[^}]+}/, replacement);
fs.writeFileSync('src/server/ai/providers/GeminiProvider.ts', code);
