import { aiService } from "../AIService";
import { ParseResumeResult } from "../types";

export class ResumeParser {
  async parse(text: string): Promise<ParseResumeResult> {
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot parse empty resume text");
    }
    
    // Attempt parsing through the AI Provider Manager
    const result = await aiService.parseResume(text);
    
    // Add validation/normalization logic here if needed
    if (!result.skills) result.skills = [];
    
    return result;
  }
}

export const resumeParser = new ResumeParser();
