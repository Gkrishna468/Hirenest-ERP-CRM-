import { apiFetch } from '@/lib/api';
import type { Client } from '@/types';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString, safeBudget } from '@/utils/safe';

export const ClientRepository = {
  async getById(id: string): Promise<Client | null> {
    try {
      const res = await apiFetch(`/api/clients/${id}`);
      if (res.status === 404) return null;
      const data = await res.json();
      if (!data || data.error) return null;
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
      console.warn(`[ClientRepository.getById] Could not fetch client ${id}:`, error);
      return null;
    }
  },

  async list(): Promise<Client[]> {
    try {
      const res = await apiFetch('/api/clients');
      if (res.status === 404) return [];
      const docs = await res.json();
      if (!Array.isArray(docs)) return [];
      return docs;
    } catch (error) {
      console.warn("[ClientRepository.list] Unable to list clients:", error);
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
