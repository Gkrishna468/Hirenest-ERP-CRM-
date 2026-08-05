export interface AIRequest {
  task: string;
  payload: any;
  priority?: "low" | "normal" | "high";
  latency?: "low" | "medium" | "high";
  reasoning?: "low" | "medium" | "high";
  metadata?: any;
}

export interface AIResponse {
  result: string | any;
  provider: string;
  model: string;
  tokens: number;
  latencyMs: number;
  cost: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  priority: number;
  enabled: boolean;
  type: "gemini" | "openai-compatible" | "ollama";
  baseUrl?: string;
  apiKeyEnvName?: string;
  defaultModel: string;
}

export interface AIProvider {
  id: string;
  config: ProviderConfig;
  generate(systemPrompt: string, userPrompt: string, options?: any): Promise<AIResponse>;
  health(): Promise<boolean>;
}
