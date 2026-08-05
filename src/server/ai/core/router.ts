import { providerRegistry } from "../providers/registry.js";
import { AIRequest, AIResponse, AIProvider } from "./types.js";
import { getAdminDb } from "../../utils/firebaseAdmin.js"; // Ensure ledger logging
import { FieldValue } from "firebase-admin/firestore";

// Simple routing rules based on tasks
const ROUTING_RULES: Record<string, string[]> = {
  "resume_parser": ["groq", "deepseek", "gemini"], // Try groq first for speed
  "candidate_match": ["gemini", "deepseek"],       // Needs good reasoning
  "email": ["groq", "ollama", "gemini"],          // simple text gen
  "vendor_summary": ["deepseek", "gemini"],
  "founder_dashboard": ["gemini"],                // Needs high IQ
};

export class SmartTaskRouter {
  
  async execute(request: AIRequest, systemPrompt: string, userPrompt: string, options?: any): Promise<AIResponse> {
    const task = request.task;
    
    // Determine target providers based on task or default to all sorted by priority
    let targetProviderIds = ROUTING_RULES[task];
    let targetProviders: AIProvider[] = [];

    if (targetProviderIds) {
      targetProviders = targetProviderIds
        .map(id => providerRegistry.getProvider(id))
        .filter((p): p is AIProvider => p !== undefined);
    } 
    
    // Fallback if rules don't specify or providers not found
    if (targetProviders.length === 0) {
      targetProviders = providerRegistry.getAllProviders();
    }

    if (targetProviders.length === 0) {
      throw new Error("No AI providers available to handle the request.");
    }

    // Failover loop
    const errors: any[] = [];
    for (const provider of targetProviders) {
      try {
        const response = await provider.generate(systemPrompt, userPrompt, options);
        
        // Log to ledger asynchronously
        this.logToLedger(request, response).catch(console.error);
        
        return response;
      } catch (error: any) {
        console.warn(`Provider ${provider.id} failed for task ${task}:`, error.message);
        errors.push({ provider: provider.id, error: error.message });
      }
    }

    throw new Error(`All providers failed for task ${task}. Details: ${JSON.stringify(errors)}`);
  }

  private async logToLedger(request: AIRequest, response: AIResponse) {
    try {
      const db = getAdminDb();
      await db.collection("agent_logs").add({
        task: request.task,
        provider: response.provider,
        model: response.model,
        tokens: response.tokens,
        latencyMs: response.latencyMs,
        cost: response.cost,
        timestamp: FieldValue.serverTimestamp(),
        metadata: request.metadata || {}
      });
    } catch (e) {
      console.error("Failed to log AI execution to ledger", e);
    }
  }
}

export const smartTaskRouter = new SmartTaskRouter();
