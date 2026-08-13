import { apiFetch } from '@/lib/api';
import type { Vendor } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const VendorRepository = {
  async getById(id: string): Promise<Vendor | null> {
    try {
      const res = await apiFetch(`/api/vendors/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data || data.error) return null;
      return {
        ...data,
        createdAt: safeISOString(data.createdAt || data.created_at),
        updatedAt: safeISOString(data.updatedAt || data.updated_at),
      };
    } catch (error) {
      console.warn(`[VendorRepository.getById] Could not fetch vendor ${id}:`, error);
      return null;
    }
  },

  async list(): Promise<Vendor[]> {
    try {
      const res = await apiFetch(`/api/vendors`);
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      return docs.map((d: any) => ({
        ...d,
        createdAt: safeISOString(d.createdAt || d.created_at),
        updatedAt: safeISOString(d.updatedAt || d.updated_at),
      }));
    } catch (error) {
      console.warn("[VendorRepository.list] Unable to list vendors:", error);
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
