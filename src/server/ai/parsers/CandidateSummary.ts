import { aiService } from "../AIService";
import { CandidateSummaryResult } from "../types";

export class CandidateSummaryParser {
  async summarize(data: any): Promise<CandidateSummaryResult> {
    if (!data || !data.name) {
      throw new Error("Cannot summarize candidate without data");
    }
    
    // Attempt parsing through the AI Provider Manager
    const result = await aiService.summarizeCandidate(data);
    
    // Add validation/normalization logic here if needed
    if (!result.strengths) result.strengths = [];
    
    return result;
  }
}

export const candidateSummaryParser = new CandidateSummaryParser();
