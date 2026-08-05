import { BaseProvider } from "./baseProvider.js";
import { ProviderConfig, AIResponse } from "../core/types.js";

export class OpenAiCompatibleProvider extends BaseProvider {
  private apiKey: string | undefined;

  constructor(config: ProviderConfig) {
    super(config);
    const keyName = this.config.apiKeyEnvName || "OPENAI_API_KEY";
    this.apiKey = process.env[keyName];
  }

  async generate(systemPrompt: string, userPrompt: string, options?: any): Promise<AIResponse> {
    if (!this.apiKey) throw new Error(`Provider ${this.id} missing API key.`);
    if (!this.config.baseUrl) throw new Error(`Provider ${this.id} missing baseUrl.`);
    
    const startTime = Date.now();
    const model = options?.model || this.config.defaultModel;
    
    const payload = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: options?.responseFormatJson ? { type: "json_object" } : undefined
    };

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Provider ${this.id} error: ${err}`);
    }

    const data = await res.json();
    const resultText = data.choices?.[0]?.message?.content || "";
    
    const latencyMs = Date.now() - startTime;
    const tokens = data.usage?.total_tokens || 0;
    const cost = tokens * 0.0000005; // Dummy logic

    return {
      result: resultText,
      provider: this.id,
      model,
      tokens,
      latencyMs,
      cost
    };
  }

  async health(): Promise<boolean> {
    return this.apiKey !== undefined && this.config.baseUrl !== undefined;
  }
}
