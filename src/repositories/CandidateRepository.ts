import { apiFetch } from '@/lib/api';
import type { Candidate } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const CandidateRepository = {
  async getById(id: string): Promise<Candidate | null> {
    try {
      const res = await apiFetch(`/api/candidates/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data || data.error) return null;
      return {
        ...data,
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      console.warn(`[CandidateRepository.getById] Could not fetch candidate ${id}:`, error);
      return null;
    }
  },

  async list(): Promise<Candidate[]> {
    try {
      const res = await apiFetch(`/api/candidates`);
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      return docs.map((d: any) => ({
        ...d,
        name: d.name ? d.name.replace(/\.(pdf|docx?|txt)$/i, '').replace(/_/g, ' ') : d.name,
        email: d.email === 'pending@extraction.io' ? 'N/A' : d.email,
        createdAt: safeISOString(d.createdAt || d.created_at),
        updatedAt: safeISOString(d.updatedAt || d.updated_at),
      }));
    } catch (error) {
      console.warn("[CandidateRepository.list] Unable to list candidates:", error);
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
