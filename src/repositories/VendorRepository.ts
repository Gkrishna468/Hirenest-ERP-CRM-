import { auth } from '@/services/firebase/config';
import type { Vendor } from '@/types';
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

export const VendorRepository = {
  async getById(id: string): Promise<Vendor | null> {
    try {
      const res = await apiFetch(`/api/vendors/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      return {
        ...data,
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `vendors/${id}`);
      return null;
    }
  },

  async list(): Promise<Vendor[]> {
    try {
      const res = await apiFetch(`/api/vendors`);
      const docs = await res.json();
      return docs.map((d: any) => ({
        ...d,
        createdAt: safeISOString(d.createdAt || d.created_at),
        updatedAt: safeISOString(d.updatedAt || d.updated_at),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'vendors');
      return [];
    }
  },

  async create(data: Partial<Vendor>, performedBy: string = 'System'): Promise<Vendor> {
    try {
      const res = await apiFetch(`/api/vendors`, {
        method: 'POST',
        body: JSON.stringify({ payload: data, performedBy })
      });
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `vendors`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Vendor>, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/vendors/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload: updates, performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vendors/${id}`);
    }
  },

  async delete(id: string, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `vendors/${id}`);
    }
  }
};
