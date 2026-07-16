import re

with open('src/server/events/DomainEventPublisher.ts', 'r') as f:
    content = f.read()

if 'import { ProjectionEngine }' not in content:
    content = content.replace('import * as crypto from "crypto";', 'import * as crypto from "crypto";\nimport { ProjectionEngine } from "../engine/ProjectionEngine";')

# Inject into publishDomainEvent
content = content.replace(
'''    if (transaction) {
      transaction.set(ref, fullEvent);
    } else {
      await ref.set(fullEvent);
    }
    return fullEvent;''',
'''    if (transaction) {
      transaction.set(ref, fullEvent);
    } else {
      await ref.set(fullEvent);
    }
    
    // Trigger Projection Engine
    await ProjectionEngine.handleEvent(fullEvent, transaction);
    
    return fullEvent;'''
)

# Inject into publish
content = content.replace(
'''    if (transaction) {
      transaction.set(ref, event);
    } else {
      await ref.set(event);
    }
  }''',
'''    if (transaction) {
      transaction.set(ref, event);
    } else {
      await ref.set(event);
    }
    
    // Map to DomainEvent and Trigger Projection Engine
    await ProjectionEngine.handleEvent({
      id: event.id,
      type: event.type,
      aggregateType: entityType,
      aggregateId: entityId,
      organizationId: metadata?.organizationId || "bootstrap-org",
      actorId: performedBy,
      actorRole: "System",
      sourceApp: "CRM",
      sourceWorkspace: "System",
      payload: metadata || {},
      correlationId: event.id,
      timestamp: event.timestamp
    } as any, transaction);
  }''', 1)

with open('src/server/events/DomainEventPublisher.ts', 'w') as f:
    f.write(content)
