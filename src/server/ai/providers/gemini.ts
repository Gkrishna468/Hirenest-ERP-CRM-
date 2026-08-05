import { BaseProvider } from "./baseProvider.js";
import { ProviderConfig, AIResponse } from "../core/types.js";
import { GoogleGenAI } from "@google/genai";

export class GeminiProvider extends BaseProvider {
  private client: GoogleGenAI | null = null;

  constructor(config: ProviderConfig) {
    super(config);
    const keyName = this.config.apiKeyEnvName || "GEMINI_API_KEY";
    const apiKey = process.env[keyName];
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async generate(systemPrompt: string, userPrompt: string, options?: any): Promise<AIResponse> {
    if (!this.client) throw new Error(`Provider ${this.id} missing API key.`);
    
    const startTime = Date.now();
    const model = options?.model || this.config.defaultModel;
    
    const response = await this.client.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: options?.responseFormatJson ? "application/json" : "text/plain",
      }
    });

    const latencyMs = Date.now() - startTime;
    const tokens = response.usageMetadata?.totalTokenCount || 0;
    
    // Simplistic cost calc for example purposes
    const cost = tokens * 0.000001; 

    return {
      result: response.text || "",
      provider: this.id,
      model,
      tokens,
      latencyMs,
      cost
    };
  }

  async health(): Promise<boolean> {
    return this.client !== null;
  }
}
