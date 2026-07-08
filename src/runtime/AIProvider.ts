import { executeAITask, executeAITaskWithSchema, DEFAULT_AI_MODEL } from "@/utils/aiGateway";

export interface AIProviderConfig {
  provider: "cloud-ai" | "openai" | "claude";
  model: string;
}

export class AIProvider {
  static async generate(prompt: string, config: AIProviderConfig = { provider: "cloud-ai", model: DEFAULT_AI_MODEL }): Promise<string> {
    if (config.provider === "cloud-ai") {
      return await executeAITask({
        agentName: "AIProvider-generate",
        prompt,
        modelUsed: config.model || DEFAULT_AI_MODEL,
      });
    }

    throw new Error(`Provider ${config.provider} not supported yet.`);
  }

  static async generateWithSchema(prompt: string, schema: any, config: AIProviderConfig = { provider: "cloud-ai", model: DEFAULT_AI_MODEL }): Promise<string> {
    if (config.provider === "cloud-ai") {
      return await executeAITaskWithSchema({
        agentName: "AIProvider-generateWithSchema",
        prompt,
        modelUsed: config.model || DEFAULT_AI_MODEL,
        responseSchema: schema,
      });
    }

    throw new Error(`Provider ${config.provider} not supported yet.`);
  }
}

