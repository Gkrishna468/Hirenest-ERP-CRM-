const fs = require('fs');
const content = `import { Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export interface DomainEventPayload {
  eventType: string;
  entityCollection: string;
  entityId: string;
  metadata: Record<string, any>;
  performedBy?: string;
  role?: string;
  message?: string;
}

export class DomainEventPublisher {
  publish(event: DomainEventPayload, transaction?: Transaction): void {
    const db = getAdminDb();
    const eventRef = db.collection("system_events").doc();
    
    const payload = {
      type: event.eventType,
      eventType: event.eventType,
      entityCollection: event.entityCollection,
      entityType: event.entityCollection,
      entityId: event.entityId,
      metadata: event.metadata,
      data: event.metadata,
      actor: event.performedBy || 'System',
      role: event.role || 'system',
      message: event.message || \`\${event.eventType} on \${event.entityCollection}/\${event.entityId}\`,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };

    if (transaction) {
      transaction.set(eventRef, payload);
    } else {
      eventRef.set(payload).catch(err => console.error("Event publish failed", err));
    }
  }
}

export const domainEventPublisher = new DomainEventPublisher();
`;
fs.writeFileSync('src/server/events/DomainEventPublisher.ts', content);
