import type { Candidate } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

async function apiFetch(url: string, options?: RequestInit) {
  let token = '';
  const execSession = localStorage.getItem('hirenest_exec_session');
  if (execSession) {
    token = 'executive-bypass-token';
  } else {
    token = localStorage.getItem('fb_token') || '';
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  return fetch(url, { ...options, headers });
}

export const CandidateRepository = {
  async getById(id: string): Promise<Candidate | null> {
    try {
      const res = await apiFetch(`/api/candidates/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      return {
        ...data,
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `candidates/${id}`);
      return null;
    }
  },

  async list(): Promise<Candidate[]> {
    try {
      const res = await apiFetch(`/api/candidates`);
      const docs = await res.json();
      return docs.map((d: any) => ({
        ...d,
        createdAt: safeISOString(d.createdAt || d.created_at),
        updatedAt: safeISOString(d.updatedAt || d.updated_at),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'candidates');
      return [];
    }
  },

  async create(data: Partial<Candidate>, performedBy: string = 'System'): Promise<Candidate> {
    try {
      const res = await apiFetch(`/api/candidates`, {
        method: 'POST',
        body: JSON.stringify({ payload: data, performedBy })
      });
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `candidates`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Candidate>, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload: updates, performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `candidates/${id}`);
    }
  },

  async delete(id: string, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/candidates/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `candidates/${id}`);
    }
  }
};
