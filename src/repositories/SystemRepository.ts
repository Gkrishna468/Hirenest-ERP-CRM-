import { apiFetch } from '@/lib/api';
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
      await apiFetch('/api/system_events', { method: 'POST', body: JSON.stringify(event) });
    } catch (error) {
      console.warn(`[SystemRepository.logEvent] Failed to log event ${id}:`, error);
    }
    return event;
  },

  subscribeToSystemEvents(callback: (events: SystemEvent[]) => void, onError?: (err: any) => void) {
    this.listSystemEvents().then(callback).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  subscribeToCollectionSize(collectionName: string, callback: (size: number) => void, onError?: (err: any) => void) {
    apiFetch(`/api/system_events/count/${collectionName}`).then(res => res.json()).then(data => callback(data?.count || 0)).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  async listSystemEvents(): Promise<SystemEvent[]> {
    try {
      const res = await apiFetch('/api/system_events');
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
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
      console.warn("[SystemRepository.listSystemEvents] Unable to list system events:", error);
      return [];
    }
  }
};
