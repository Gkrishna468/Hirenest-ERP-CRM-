import { apiFetch } from '@/lib/api';
import { auth } from './config';
import { handleFirestoreError, OperationType } from './error';

export interface SystemEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const eventService = {
  logEvent: async (event: Omit<SystemEvent, 'id' | 'actorId' | 'timestamp'>) => {
    try {
      const id = crypto.randomUUID();
      const eventDoc: SystemEvent = {
        ...event,
        id,
        actorId: auth.currentUser?.uid || 'system',
        timestamp: new Date().toISOString()
      };
      
      // we can reuse the system events REST API
      await apiFetch('/api/system_events', {
        method: 'POST',
        body: JSON.stringify(eventDoc)
      });
      return eventDoc;
    } catch (error) {
      console.warn("[eventService.logEvent] Failed to log event:", error);
    }
  },
  getEventsByEntity: async (entityType: string, entityId: string) => {
    try {
      const res = await apiFetch('/api/system_events');
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      return docs
        .filter((d: any) => d.entityType === entityType && d.entityId === entityId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.warn(`[eventService.getEventsByEntity] Unable to get events for ${entityType}/${entityId}:`, error);
      return [];
    }
  }
};
