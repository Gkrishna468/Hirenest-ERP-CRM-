import { apiFetch } from '@/lib/api';
import type { Submission } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const SubmissionRepository = {
  async getById(id: string): Promise<Submission | null> {
    try {
      const res = await apiFetch(`/api/submissions/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data || data.error) return null;
      return {
        ...data,
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      console.warn(`[SubmissionRepository.getById] Could not fetch submission ${id}:`, error);
      return null;
    }
  },

  async list(): Promise<Submission[]> {
    try {
      const res = await apiFetch(`/api/submissions`);
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      return docs.map((d: any) => ({
        ...d,
        createdAt: safeISOString(d.createdAt || d.created_at),
        updatedAt: safeISOString(d.updatedAt || d.updated_at),
      }));
    } catch (error) {
      console.warn("[SubmissionRepository.list] Unable to list submissions:", error);
      return [];
    }
  },

  async create(data: Partial<Submission>, performedBy: string = 'System'): Promise<Submission> {
    try {
      const res = await apiFetch(`/api/submissions`, {
        method: 'POST',
        body: JSON.stringify({ payload: data, performedBy })
      });
      return await res.json();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `submissions`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Submission>, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/submissions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ payload: updates, performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `submissions/${id}`);
    }
  },

  async delete(id: string, performedBy: string = 'System'): Promise<void> {
    try {
      await apiFetch(`/api/submissions/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ performedBy })
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `submissions/${id}`);
    }
  }
};
