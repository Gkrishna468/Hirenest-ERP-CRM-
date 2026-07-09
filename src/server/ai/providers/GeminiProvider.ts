import { AIProvider, ParseResumeResult, CandidateSummaryResult, RequirementMatchResult, EmailDraftResult } from "../types";
import { GoogleGenAI } from "@google/genai";

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  isAvailable(): boolean {
    return process.env.ENABLE_GEMINI === 'true' && !!this.ai;
  }

  async parseResume(text: string): Promise<ParseResumeResult> {
    if (!this.ai) throw new Error("Gemini not initialized");
    
    const prompt = `Extract the following details from this resume text:
RETURN ONLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "name": "full name (Capitalized)",
  "email": "extracted email address",
  "phone": "extracted phone number",
  "currentTitle": "current job title",
  "skills": ["extracted skill 1", "extracted skill 2"],
  "experience": "years of experience as string, e.g. '5 Years'",
  "currentCompany": "current company name",
  "noticePeriod": "notice period, e.g. '15 Days'",
  "expectedSalary": "expected salary CTC",
  "location": "location/city"
}

Resume Text:
${text.substring(0, 15000)}
`;

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: prompt,
    });
    
    const responseText = response.text || "{}";
    const jsonStr = responseText.replace(/^```(?:json)?|```$/gm, "").trim();
    return JSON.parse(jsonStr) as ParseResumeResult;
  }

  async summarizeCandidate(data: any): Promise<CandidateSummaryResult> {
    if (!this.ai) throw new Error("Gemini not initialized");

    const prompt = `Act as the "Unified Intelligence Brain" for HireNest Enterprise IT Staffing OS.
Analyze the candidate details provided and generate a complete Candidate 360 Workspace analysis.

CANDIDATE DETAILS:
Name: ${data.name || "Unknown Candidate"}
Skills: ${JSON.stringify(data.skills || [])}
Experience: ${data.experience || "0"} Years
Current Company: ${data.currentCompany || "Not Specified"}
Current Title/Designation: ${data.currentTitle || "Not Specified"}
Notes: ${data.notes || "None"}

TASKS:
1. Generate an elegant, professional narrative AI Summary (2-3 sentences) describing the candidate's core strengths, experience level, domain specialization, and suitability.
2. List exactly 5 key AI Strengths.
3. Determine an Overall Match recommendation rating (e.g. Strongly Recommend, Recommend, or Reserve).
4. Write a concise recommendation Reason.

RETURN ONLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "summary": "narrative summary here",
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4", "strength 5"],
  "recommendation": "Strongly Recommend" | "Recommend" | "Reserve",
  "reason": "concise recommendation reason here"
}
`;

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: prompt,
    });
    
    const responseText = response.text || "{}";
    const jsonStr = responseText.replace(/^```(?:json)?|```$/gm, "").trim();
    return JSON.parse(jsonStr) as CandidateSummaryResult;
  }

  async matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    if (!this.ai) throw new Error("Gemini not initialized");

    const prompt = `Act as an expert technical recruiter matching a Candidate to a Job Requirement.
Analyze the following and provide a match score from 0 to 100, and a concise reasoning.

REQUIREMENT:
Title: ${requirement.title || "Not Specified"}
Target Skills: ${JSON.stringify(requirement.skills || requirement.targetCompetencies || [])}
Description: ${requirement.description || "None"}
Min Experience: ${requirement.minExperience || 0} Years

CANDIDATE:
Name: ${candidate.name || "Unknown"}
Current Title: ${candidate.currentTitle || "None"}
Skills: ${JSON.stringify(candidate.skills || [])}
Experience: ${candidate.experience || 0}
Summary: ${candidate.summary || "None"}

RETURN ONLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "score": 85,
  "reasoning": "Strong match based on React experience."
}
`;

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: prompt,
    });
    
    const responseText = response.text || "{}";
    const jsonStr = responseText.replace(/^\s*```(?:json)?|\s*```\s*$/gm, "").trim();
    return JSON.parse(jsonStr) as RequirementMatchResult;
  }

  async draftEmail(prompt: string, context: any): Promise<EmailDraftResult> {
    if (!this.ai) throw new Error("Gemini not initialized");

    const systemPrompt = `Act as an expert technical staffing AI.
Generate a professional email based on the following instructions.
RETURN EXACTLY A JSON OBJECT MATCHING THIS SCHEMA:
{
  "subject": "The proposed subject line",
  "body": "The complete email body."
}

INSTRUCTIONS:
${prompt}

CONTEXT (if any):
${JSON.stringify(context || {})}
`;

    const response = await this.ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.5-flash",
      contents: systemPrompt,
    });
    
    const responseText = response.text || "{}";
    let result;
    try {
      const jsonStr = responseText.replace(/^\s*```(?:json)?|\s*```\s*$/gm, "").trim();
      result = JSON.parse(jsonStr);
    } catch (e) {
      result = { subject: "Generated Email", body: responseText };
    }
    
    return {
      subject: result.subject || "Generated Email",
      body: result.body || responseText
    } as EmailDraftResult;
  }
}
