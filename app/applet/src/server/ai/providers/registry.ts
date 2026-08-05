import { ProviderConfig, AIProvider } from "../core/types.js";
import { GeminiProvider } from "./gemini.js";
import { OpenAiCompatibleProvider } from "./openAiCompatible.js";

// AI Mesh Configuration integrating FreeLLM.net endpoints
export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    priority: 1,
    enabled: true,
    type: "gemini",
    defaultModel: "gemini-2.5-flash",
    apiKeyEnvName: "GEMINI_API_KEY"
  },
  {
    id: "deepseek",
    name: "DeepSeek (FreeLLM)",
    priority: 2,
    enabled: true,
    type: "openai-compatible",
    baseUrl: "https://api.freellm.net/v1", // FreeLLM endpoint
    defaultModel: "deepseek-chat",
    apiKeyEnvName: "DEEPSEEK_API_KEY"
  },
  {
    id: "qwen",
    name: "Qwen (FreeLLM)",
    priority: 3,
    enabled: true,
    type: "openai-compatible",
    baseUrl: "https://api.freellm.net/v1", // FreeLLM endpoint
    defaultModel: "qwen-max",
    apiKeyEnvName: "OPENAI_API_KEY"
  },
  {
    id: "groq",
    name: "Groq (Fast OSS via FreeLLM/OpenAI Compatible)",
    priority: 4,
    enabled: true,
    type: "openai-compatible",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama3-70b-8192",
    apiKeyEnvName: "GROQ_API_KEY"
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    priority: 5,
    enabled: true,
    type: "openai-compatible",
    baseUrl: "http://localhost:11434/v1", 
    defaultModel: "llama3",
  }
];

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();

  constructor(configs: ProviderConfig[] = DEFAULT_PROVIDERS) {
    for (const config of configs) {
      if (!config.enabled) continue;
      
      let provider: AIProvider | null = null;
      if (config.type === "gemini") {
        provider = new GeminiProvider(config);
      } else if (config.type === "openai-compatible") {
        provider = new OpenAiCompatibleProvider(config);
      }
      
      if (provider) {
        this.providers.set(config.id, provider);
      }
    }
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => a.config.priority - b.config.priority);
  }
}

export const providerRegistry = new ProviderRegistry();
