import { EventBus, DomainEvent } from '../events/EventBus';
import { v4 as uuidv4 } from 'uuid';

export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowInstance {
  instanceId: string;
  workflowId: string;
  tenantId: string;
  correlationId: string;
  status: WorkflowStatus;
  currentStepId: string | null;
  state: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  history: WorkflowAuditEntry[];
}

export interface WorkflowAuditEntry {
  stepId: string;
  action: string;
  timestamp: string;
  result: string;
  metadata?: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  type: 'human' | 'ai' | 'system' | 'wait_for_event' | 'delay';
  action: string; // e.g., 'extract_skills', 'assign_recruiter'
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
  timeoutMs?: number;
  onSuccess: string | null; // Next step ID, or null to complete
  onFailure: string | 'fail_workflow' | 'compensate'; 
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  triggerEvent: string;
  initialStepId: string;
  steps: Record<string, WorkflowStep>;
}

class WorkflowEngineImpl {
  private activeInstances: Map<string, WorkflowInstance> = new Map();
  private definitions: Map<string, WorkflowDefinition> = new Map();

  registerWorkflow(def: WorkflowDefinition) {
    this.definitions.set(def.triggerEvent, def);
    
    // Auto-subscribe to the trigger event
    EventBus.subscribe(def.triggerEvent, async (event) => {
      await this.startWorkflow(def.triggerEvent, event);
    });
    
    console.log(`[WorkflowEngine] Registered workflow for ${def.triggerEvent}`);
  }

  async startWorkflow(triggerEvent: string, event: DomainEvent): Promise<string> {
    const def = this.definitions.get(triggerEvent);
    if (!def) {
      throw new Error(`No workflow registered for trigger ${triggerEvent}`);
    }

    const instanceId = uuidv4();
    const instance: WorkflowInstance = {
      instanceId,
      workflowId: def.id,
      tenantId: event.tenantId,
      correlationId: event.correlationId,
      status: 'running',
      currentStepId: def.initialStepId,
      state: { triggerPayload: event.payload },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };

    this.activeInstances.set(instanceId, instance);
    console.log(`[WorkflowEngine] Started workflow ${def.id} (Instance: ${instanceId})`);

    // In a real system, we'd persist the instance to Firestore here.
    // Then queue a task to process the first step.
    this.processStep(instanceId);

    return instanceId;
  }

  private async processStep(instanceId: string) {
    const instance = this.activeInstances.get(instanceId);
    if (!instance || instance.status !== 'running' || !instance.currentStepId) return;

    // Find the workflow definition based on the instance workflowId.
    // (Assuming triggerEvent == workflowId for simplicity in this stub)
    const def = Array.from(this.definitions.values()).find(d => d.id === instance.workflowId);
    if (!def) return;

    const step = def.steps[instance.currentStepId];
    if (!step) {
      instance.status = 'failed';
      return;
    }

    console.log(`[WorkflowEngine] Executing step ${step.id} (${step.action}) for instance ${instanceId}`);

    try {
      // Stub execution logic
      // In reality, this would dispatch to a worker queue or agent orchestrator
      if (step.type === 'ai') {
        // e.g., AgentRuntime.executeTask(...)
      }

      // Record audit
      instance.history.push({
        stepId: step.id,
        action: step.action,
        timestamp: new Date().toISOString(),
        result: 'success'
      });

      // Move to next step
      if (step.onSuccess) {
        instance.currentStepId = step.onSuccess;
        // Recursive call to process next step (use setImmediate to prevent stack overflow in real system)
        setTimeout(() => this.processStep(instanceId), 0);
      } else {
        instance.status = 'completed';
        instance.currentStepId = null;
        console.log(`[WorkflowEngine] Workflow ${instanceId} completed successfully.`);
      }
    } catch (error) {
      console.error(`[WorkflowEngine] Step failed:`, error);
      
      instance.history.push({
        stepId: step.id,
        action: step.action,
        timestamp: new Date().toISOString(),
        result: 'error',
        metadata: { error: String(error) }
      });

      if (step.onFailure === 'fail_workflow') {
        instance.status = 'failed';
      } else {
        // Retry logic or jump to failure handler
        instance.currentStepId = step.onFailure;
        setTimeout(() => this.processStep(instanceId), 0);
      }
    }
  }

  // API to retrieve state
  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.activeInstances.get(instanceId);
  }
}

export const WorkflowEngine = new WorkflowEngineImpl();
