import { AIProvider, ParseResumeResult, CandidateSummaryResult, RequirementMatchResult, EmailDraftResult } from "./types";
import { OpenAIProvider } from "./providers/OpenAIProvider";
import { GeminiProvider } from "./providers/GeminiProvider";
import { HeuristicProvider } from "./providers/HeuristicProvider";

export class AIProviderManager {
  private providers: AIProvider[] = [];

  constructor() {
    this.providers = [
      new OpenAIProvider(),
      new GeminiProvider(),
      new HeuristicProvider()
    ];
  }

  private getOrderedProviders(): AIProvider[] {
    const orderStr = process.env.AI_PROVIDER_ORDER || "openai,ollama,gemini,heuristic";
    const order = orderStr.split(',').map(s => s.trim().toLowerCase());
    
    const sorted = [...this.providers].sort((a, b) => {
      const idxA = order.indexOf(a.name.toLowerCase());
      const idxB = order.indexOf(b.name.toLowerCase());
      
      const posA = idxA === -1 ? 999 : idxA;
      const posB = idxB === -1 ? 999 : idxB;
      
      return posA - posB;
    });
    
    return sorted;
  }

  async executeWithFailover<T>(operation: (provider: AIProvider) => Promise<T>): Promise<T> {
    const providers = this.getOrderedProviders();
    let lastError: Error | null = null;
    
    for (const provider of providers) {
      if (provider.isAvailable()) {
        try {
          // TODO: emit telemetry here (start)
          const result = await operation(provider);
          // TODO: emit telemetry here (success)
          return result;
        } catch (error: any) {
          console.warn(`[AIProviderManager] Provider ${provider.name} failed:`, error.message);
          lastError = error;
          // TODO: emit telemetry here (failure)
        }
      }
    }
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }
}
