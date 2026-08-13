import { AIProvider, ParseResumeResult, CandidateSummaryResult, RequirementMatchResult, EmailDraftResult } from "../types";
import OpenAI from "openai";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI-Compatible";
  private client: OpenAI | null = null;
  private model: string = process.env.OPENAI_MODEL || "deepseek-chat-v3-2";

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || "https://api.deepseek.com/v1", // Default to DeepSeek from freellm
      });
    }
  }

  isAvailable(): boolean {
    return !!this.client;
  }

  async parseResume(text: string): Promise<ParseResumeResult> {
    if (!this.client) throw new Error("OpenAI client not initialized");
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Extract candidate details from the following resume text as JSON. Include fields: name, email, phone, location, skills (array of strings), experienceYears (number), education, summary." },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Failed to parse resume");
    const result = JSON.parse(content);
    return {
      name: result.name || "Unknown",
      email: result.email || "",
      phone: result.phone || "",
      location: result.location || "",
      skills: result.skills || [],
      experience: result.experienceYears || result.experience || 0,
      currentTitle: result.currentTitle || "",
      currentCompany: result.currentCompany || "",
    };
  }

  async summarizeCandidate(data: any): Promise<CandidateSummaryResult> {
    if (!this.client) throw new Error("OpenAI client not initialized");
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Summarize the candidate's profile based on the provided JSON data. Return a JSON object with 'summary', 'strengths' array, 'recommendation', and 'reason'." },
        { role: "user", content: JSON.stringify(data) }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Failed to summarize candidate");
    const result = JSON.parse(content);
    return { 
      summary: result.summary || "",
      strengths: result.strengths || [],
      recommendation: result.recommendation || "Consider",
      reason: result.reason || result.summary || ""
    };
  }

  async matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    if (!this.client) throw new Error("OpenAI client not initialized");
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Match the candidate to the job requirement. Return JSON with 'score' (0-100) and 'reasoning' (brief text)." },
        { role: "user", content: JSON.stringify({ candidate, requirement }) }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Failed to match requirement");
    const result = JSON.parse(content);
    return {
      score: result.score || 0,
      reasoning: result.reasoning || ""
    };
  }

  async draftEmail(prompt: string, context: any): Promise<EmailDraftResult> {
    if (!this.client) throw new Error("OpenAI client not initialized");
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: "Draft an email based on the context and prompt. Return JSON with 'subject' and 'body'." },
        { role: "user", content: JSON.stringify({ prompt, context }) }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Failed to draft email");
    const result = JSON.parse(content);
    return {
      subject: result.subject || "",
      body: result.body || ""
    };
  }
}
