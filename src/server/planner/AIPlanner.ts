import { DomainEventPublisher } from '../events/DomainEventPublisher';

export interface Goal {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tasks: Task[];
}

export interface Task {
  id: string;
  description: string;
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export class AIPlanner {
  /**
   * Evaluates a complex message and decomposes it into a goal with actionable tasks.
   */
  async createPlan(intent: string, entities: any, context: any): Promise<Goal> {
    console.log(`[AIPlanner] Creating plan for intent: ${intent}`);
    
    // In production, call GPT-5.5/Gemini Pro to generate the task list
    
    const goal: Goal = {
      id: crypto.randomUUID(),
      description: `Fulfill ${intent}`,
      status: 'pending',
      tasks: [
        { id: crypto.randomUUID(), description: 'Search Internal Database', assignedAgent: 'RecruiterAgent', status: 'pending' },
        { id: crypto.randomUUID(), description: 'Search Vendors', assignedAgent: 'VendorAgent', status: 'pending' },
        { id: crypto.randomUUID(), description: 'Notify Recruiters', assignedAgent: 'CommunicationAgent', status: 'pending' }
      ]
    };

    // Emit event so orchestrator can assign these tasks
    await DomainEventPublisher.publishDomainEvent({
      type: 'PLAN_CREATED',
      aggregateType: 'Planner',
      aggregateId: goal.id,
      organizationId: 'default',
      actorId: 'system',
      actorRole: 'System',
      sourceApp: 'OS',
      sourceWorkspace: 'System',
      payload: goal
    });

    return goal;
  }
}

export const aiPlanner = new AIPlanner();
