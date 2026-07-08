import { AIProvider, ParseResumeResult, CandidateSummaryResult, RequirementMatchResult, EmailDraftResult } from "../types";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async parseResume(text: string): Promise<ParseResumeResult> {
    // This will be implemented in the specific migration task
    throw new Error("Method not implemented.");
  }

  async summarizeCandidate(data: any): Promise<CandidateSummaryResult> {
    throw new Error("Method not implemented.");
  }

  async matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    throw new Error("Method not implemented.");
  }

  async draftEmail(prompt: string, context: any): Promise<EmailDraftResult> {
    throw new Error("Method not implemented.");
  }
}
