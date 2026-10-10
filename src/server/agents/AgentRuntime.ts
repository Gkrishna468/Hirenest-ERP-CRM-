import { DomainEventPublisher } from '../events/DomainEventPublisher';

export interface Agent {
  name: string;
  capabilities: string[];
  handleEvent(event: any): Promise<void>;
}

export class AgentRuntime {
  private agents: Agent[] = [];

  registerAgent(agent: Agent) {
    this.agents.push(agent);
    console.log(`Registered Agent: ${agent.name}`);
  }

  getRegisteredAgents(): string[] {
    return this.agents.map(a => a.name);
  }

  async processEvent(event: any) {
    console.log(`Agent Runtime processing event: ${event.type}`);
    
    // Fan out event to all registered agents
    const promises = this.agents.map(agent => {
      return agent.handleEvent(event).catch(err => {
        console.error(`Agent ${agent.name} failed to process event ${event.type}:`, err);
      });
    });

    await Promise.all(promises);
  }
}

export const agentRuntime = new AgentRuntime();
