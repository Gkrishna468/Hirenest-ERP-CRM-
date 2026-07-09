import { auth } from '@/services/firebase/config';
import type { Client } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

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

export const ClientRepository = {
  async getById(id: string): Promise<Client | null> {
    try {
      const res = await apiFetch(`/api/clients/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      return {
        id: id,
        company: data.company || '',
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        industry: data.industry || '',
        budget: safeBudget(data.budget),
        contactPerson: data.contactPerson || data.contact_person || '',
        website: data.website || '',
        clientCode: data.clientCode || data.client_code || '',
        notes: data.notes || '',
        userId: data.userId || data.user_id || '',
        companyId: data.companyId || data.company_id || '',
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `clients/${id}`);
      return null;
    }
  },

  async list(): Promise<Client[]> {
    try {
      const res = await apiFetch('/api/clients');
      const docs = await res.json();
      return docs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'clients');
      return [];
    }
  },

  async create(data: Partial<Client>, performedBy: string = 'System'): Promise<Client> {
    try {
      const res = await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ payload: data, performedBy })
      });
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clients`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Client>, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload: updates, performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  },

  async delete(id: string, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/clients/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  }
};
