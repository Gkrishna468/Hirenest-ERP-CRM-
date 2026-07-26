import { Agent } from '../AgentRuntime';

export interface AgentManifest {
  name: string;
  capabilities: string[];
  requiredPermissions: string[];
  supportedTools: string[];
  subscribedEvents: string[];
  publishedEvents: string[];
  healthStatus: 'healthy' | 'degraded' | 'offline';
  version: string;
}

export class AgentRegistry {
  private agents: Map<string, { agent: Agent; manifest: AgentManifest }> = new Map();

  register(agent: Agent, manifest: AgentManifest) {
    this.agents.set(agent.name, { agent, manifest });
    console.log(`[AgentRegistry] Registered agent: ${agent.name} (v${manifest.version})`);
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name)?.agent;
  }

  findAgentsByCapability(capability: string): Agent[] {
    const matches: Agent[] = [];
    for (const [_, entry] of this.agents.entries()) {
      if (entry.manifest.capabilities.includes(capability)) {
        matches.push(entry.agent);
      }
    }
    return matches;
  }

  getAllAgents(): { agent: Agent; manifest: AgentManifest }[] {
    return Array.from(this.agents.values());
  }
}

export const agentRegistry = new AgentRegistry();
