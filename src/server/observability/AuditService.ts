import { DomainEvent } from '../events/DomainEventPublisher';

export interface AIAuditRecord {
  id: string;
  timestamp: string;
  agentId: string;
  taskId: string;
  modelUsed: string;
  tokenCount: number;
  costEstimate: number;
  latencyMs: number;
  success: boolean;
  humanOverride: boolean;
}

export class AuditService {
  async logAIAction(record: AIAuditRecord) {
    console.log(`[AuditService] AI Action logged - Agent: ${record.agentId} | Cost: $${record.costEstimate}`);
    // In production, persist to long-term storage for the AI Control Plane dashboard
  }

  async auditEvent(event: DomainEvent) {
    // Audit all domain events flowing through the system
  }
}

export const auditService = new AuditService();
