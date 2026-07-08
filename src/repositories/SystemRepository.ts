import { dbProxy } from '@/services/firebase/db-proxy';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString } from '@/utils/safe';

export interface SystemEvent {
  id: string;
  type: string;
  performedBy: string;
  timestamp: string;
  metadata?: any;
}

export const SystemRepository = {
  // Law 1: Company Ledger is append-only, immutable, timestamped, and auditable
  async logEvent(type: string, performedBy: string, metadata?: any): Promise<SystemEvent> {
    const id = crypto.randomUUID();
    const event: SystemEvent = {
      id,
      type,
      performedBy,
      timestamp: new Date().toISOString(),
      metadata: metadata || null,
    };
    
    try {
      await dbProxy.setDoc('system_events', id, event);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `system_events/${id}`);
    }
    return event;
  },

  subscribeToSystemEvents(callback: (events: SystemEvent[]) => void, onError?: (err: any) => void) {
    this.listSystemEvents().then(callback).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  subscribeToCollectionSize(collectionName: string, callback: (size: number) => void, onError?: (err: any) => void) {
    dbProxy.getDocs(collectionName).then(docs => callback(docs.length)).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  async listSystemEvents(): Promise<SystemEvent[]> {
    try {
      const docs = await dbProxy.getDocs('system_events', {
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: 20
      });
      const events = docs.map((data: any) => {
        return {
          id: data.id,
          type: data.type || '',
          performedBy: data.performedBy || '',
          timestamp: safeISOString(data.timestamp),
          metadata: data.metadata || null,
        } as SystemEvent;
      });
      return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'system_events');
      return [];
    }
  }
};
