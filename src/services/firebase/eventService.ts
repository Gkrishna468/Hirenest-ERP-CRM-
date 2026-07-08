import { dbProxy } from './db-proxy';
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
      await dbProxy.setDoc('system_events', id, eventDoc);
      return eventDoc;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'system_events');
    }
  },

  getEventsByEntity: async (entityType: string, entityId: string) => {
    try {
      const docs = await dbProxy.getDocs('system_events', {
        where: [
          { field: 'entityType', op: '==', value: entityType },
          { field: 'entityId', op: '==', value: entityId }
        ]
      });
      return docs
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'system_events');
      return [];
    }
  }
};
