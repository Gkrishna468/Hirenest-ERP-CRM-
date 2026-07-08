import { AIProviderManager } from "./AIProviderManager";
import { ParseResumeResult, CandidateSummaryResult, RequirementMatchResult, EmailDraftResult } from "./types";

export class AIService {
  private manager = new AIProviderManager();

  async parseResume(text: string): Promise<ParseResumeResult> {
    return this.manager.executeWithFailover(provider => provider.parseResume(text));
  }

  async summarizeCandidate(data: any): Promise<CandidateSummaryResult> {
    return this.manager.executeWithFailover(provider => provider.summarizeCandidate(data));
  }

  async matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    return this.manager.executeWithFailover(provider => provider.matchRequirement(candidate, requirement));
  }

  async draftEmail(prompt: string, context: any): Promise<EmailDraftResult> {
    return this.manager.executeWithFailover(provider => provider.draftEmail(prompt, context));
  }
}

export const aiService = new AIService();
