export interface DomainEvent {
  eventId: string;
  eventType: string; // e.g., 'RequirementCreated', 'CandidateSubmitted'
  tenantId: string;
  correlationId: string;
  userId: string;
  timestamp: string;
  entityId: string;
  entityVersion: number;
  metadata: Record<string, any>;
  payload: Record<string, any>;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

class EventBusImpl {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler) {
    const existing = this.handlers.get(eventType) || [];
    this.handlers.set(eventType, [...existing, handler]);
    console.log(`[EventBus] Subscribed to ${eventType}`);
  }

  async publish(event: DomainEvent) {
    console.log(`[EventBus] Publishing ${event.eventType} (ID: ${event.eventId})`);
    
    // In a real enterprise system, this would write to Google Cloud Pub/Sub,
    // Kafka, or an EventStore. For now, it routes in-memory.
    const handlers = this.handlers.get(event.eventType) || [];
    
    // Process asynchronously so we don't block the caller
    setTimeout(() => {
      handlers.forEach(handler => {
        handler(event).catch(err => {
          console.error(`[EventBus] Error handling ${event.eventType}:`, err);
          // In a real system: Send to Dead Letter Queue (DLQ)
        });
      });
    }, 0);
  }
}

export const EventBus = new EventBusImpl();
