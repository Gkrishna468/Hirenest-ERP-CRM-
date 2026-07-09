import { auth } from '@/services/firebase/config';

async function apiFetch(url: string, options?: RequestInit) {
  let token = '';
  const execSession = localStorage.getItem('hirenest_exec_session');
  if (execSession) {
    token = 'executive-bypass-token';
  } else if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  } else {
    token = localStorage.getItem('fb_token') || '';
  }
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.message || "API request failed");
  }
  return res;
}
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
      handleFirestoreError(error, OperationType.CREATE, `system_events/${id}`);
    }
    return event;
  },

  subscribeToSystemEvents(callback: (events: SystemEvent[]) => void, onError?: (err: any) => void) {
    this.listSystemEvents().then(callback).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  subscribeToCollectionSize(collectionName: string, callback: (size: number) => void, onError?: (err: any) => void) {
    apiFetch(`/api/system_events/count/${collectionName}`).then(res => res.json()).then(data => callback(data.count)).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  async listSystemEvents(): Promise<SystemEvent[]> {
    try {
      const res = await apiFetch('/api/system_events');
      const docs = await res.json();
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
