import { DomainEventPublisher, DomainEvent } from '../events/DomainEventPublisher';

export interface WorkflowDefinition {
  id: string;
  name: string;
  triggerEvent: string; // e.g. "REQUIREMENT_CREATED"
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  actionType: string; // e.g. "search_candidates", "generate_email"
  parameters: Record<string, any>;
  onSuccess?: string; // next step name
  onFailure?: string;
}

export class WorkflowEngine {
  private workflows: WorkflowDefinition[] = [];

  registerWorkflow(workflow: WorkflowDefinition) {
    this.workflows.push(workflow);
    console.log(`[WorkflowEngine] Registered workflow: ${workflow.name}`);
  }

  async handleEvent(event: DomainEvent) {
    // 1. Find matching workflows
    const matches = this.workflows.filter(w => w.triggerEvent === event.type);
    
    // 2. Instantiate workflow execution (State machine)
    for (const workflow of matches) {
      console.log(`[WorkflowEngine] Triggering workflow ${workflow.name} due to event ${event.type}`);
      // In production, we would persist execution state to DB and advance through steps
      this.executeWorkflowStep(workflow, workflow.steps[0], event.payload);
    }
  }

  private async executeWorkflowStep(workflow: WorkflowDefinition, step: WorkflowStep, payload: any) {
    console.log(`[WorkflowEngine] Executing step ${step.name} in workflow ${workflow.name}`);
    
    // Publish a command event for an agent or service to pick up
    await DomainEventPublisher.publishDomainEvent({
      type: `COMMAND_${step.actionType.toUpperCase()}`,
      aggregateType: 'WorkflowExecution',
      aggregateId: 'internal', // Would be unique execution ID
      organizationId: 'default',
      actorId: 'system',
      actorRole: 'System',
      sourceApp: 'OS',
      sourceWorkspace: 'System',
      payload: { ...payload, parameters: step.parameters }
    });
  }
}

export const workflowEngine = new WorkflowEngine();
