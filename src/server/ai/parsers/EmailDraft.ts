import { aiService } from "../AIService";
import { EmailDraftResult } from "../types";

export class EmailDraftParser {
  async draft(prompt: string, context: any): Promise<EmailDraftResult> {
    if (!prompt) {
      throw new Error("Prompt is required for email drafting");
    }
    
    return aiService.draftEmail(prompt, context);
  }
}

export const emailDraftParser = new EmailDraftParser();
