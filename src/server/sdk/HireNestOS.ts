import { DomainEventPublisher } from '../events/DomainEventPublisher';
import { agentRegistry } from '../agents/registry/AgentRegistry';
import { aiPlanner } from '../planner/AIPlanner';
import { workflowEngine } from '../workflow/WorkflowEngine';
import { outreachEngine } from '../outreach/OutreachEngine';
import { manifestService } from '../manifest/PlatformManifest';
import { extensionRegistry } from '../extensions/ExtensionRegistry';
import { enterpriseSearch } from '../search/EnterpriseSearch';
import { metricsEngine } from '../metrics/MetricsEngine';
import { digitalTwinService } from '../twin/DigitalTwin';
import { auditService } from '../observability/AuditService';
import { taskQueue } from '../queue/TaskQueue';

/**
 * HireNest OS SDK v1.0 Kernel
 * A unified kernel interface for all internal services, agents, and UI gateways.
 * Abstracts direct database and pub/sub access.
 */
export class HireNestOS {
  public get events() { return DomainEventPublisher; }
  public get agents() { return agentRegistry; }
  public get planner() { return aiPlanner; }
  public get workflows() { return workflowEngine; }
  public get outreach() { return outreachEngine; }
  public get manifest() { return manifestService; }
  public get extensions() { return extensionRegistry; }
  public get search() { return enterpriseSearch; }
  public get metrics() { return metricsEngine; }
  public get twin() { return digitalTwinService; }
  public get audit() { return auditService; }
  public get tasks() { return taskQueue; }
  
  // Future: memory, auth, policy, knowledge graph, model router
}

export const os = new HireNestOS();
