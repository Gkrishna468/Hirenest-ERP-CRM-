import { aiService } from "../AIService";
import { RequirementMatchResult } from "../types";

export class RequirementMatchParser {
  async match(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    if (!candidate || !requirement) {
      throw new Error("Candidate and requirement are required for matching");
    }
    
    const result = await aiService.matchRequirement(candidate, requirement);
    
    return {
      score: Math.min(Math.max(result.score || 0, 0), 100),
      reasoning: result.reasoning || "Match complete"
    };
  }
}

export const requirementMatchParser = new RequirementMatchParser();
