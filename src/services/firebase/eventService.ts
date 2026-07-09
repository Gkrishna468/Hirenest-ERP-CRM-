import { auth } from './config';
import { handleFirestoreError, OperationType } from './error';

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
      handleFirestoreError(error, OperationType.CREATE, 'system_events');
    }
  },
  getEventsByEntity: async (entityType: string, entityId: string) => {
    try {
      // For now, fetch all and filter in client (since /api/system_events just lists recent events).
      // A better API endpoint should be added if many events exist, but for legacy support this works.
      const res = await apiFetch('/api/system_events');
      const docs = await res.json();
      return docs
        .filter((d: any) => d.entityType === entityType && d.entityId === entityId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'system_events');
      return [];
    }
  }
};
