import { AIProvider, ProviderConfig, AIResponse } from "../core/types.js";

export abstract class BaseProvider implements AIProvider {
  id: string;
  config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.config = config;
  }

  abstract generate(systemPrompt: string, userPrompt: string, options?: any): Promise<AIResponse>;
  
  abstract health(): Promise<boolean>;
}
