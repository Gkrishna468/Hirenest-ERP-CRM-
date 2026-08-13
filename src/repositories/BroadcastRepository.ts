import type { VendorBroadcast } from '@/types';
import { dbProxy } from '@/services/firebase/dbProxy';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';
import { safeISOString } from '@/utils/safe';

export const BroadcastRepository = {
  async getById(id: string): Promise<VendorBroadcast | null> {
    try {
      const data = await dbProxy.getDoc('broadcasts', id);
      if (!data) return null;
      return {
        id: id,
        broadcastId: data.broadcastId || data.broadcast_id || '',
        requirementId: data.requirementId || data.requirement_id || '',
        requirementTitle: data.requirementTitle || data.requirement_title || '',
        channel: data.channel || '',
        vendorId: data.vendorId || data.vendor_id || '',
        vendorName: data.vendorName || data.vendor_name || '',
        sentAt: safeISOString(data.sentAt || data.sent_at),
        status: data.status || 'sent',
        source: data.source || '',
      };
    } catch (error) {
      console.warn(`[BroadcastRepository.getById] Could not fetch broadcast ${id}:`, error);
      return null;
    }
  },

  async list(): Promise<VendorBroadcast[]> {
    try {
      const docs = await dbProxy.getDocs('broadcasts');
      if (!Array.isArray(docs)) return [];
      return docs.map((data: any) => {
        return {
          id: data.id,
          broadcastId: data.broadcastId || data.broadcast_id || '',
          requirementId: data.requirementId || data.requirement_id || '',
          requirementTitle: data.requirementTitle || data.requirement_title || '',
          channel: data.channel || '',
          vendorId: data.vendorId || data.vendor_id || '',
          vendorName: data.vendorName || data.vendor_name || '',
          sentAt: safeISOString(data.sentAt || data.sent_at),
          status: data.status || 'sent',
          source: data.source || '',
        };
      }).sort((a: any, b: any) => b.sentAt.localeCompare(a.sentAt));
    } catch (error) {
      console.warn("[BroadcastRepository.list] Unable to list broadcasts:", error);
      return [];
    }
  },

  async create(data: Partial<VendorBroadcast>): Promise<VendorBroadcast> {
    const id = data.id || crypto.randomUUID();
    const broadcast: VendorBroadcast = {
      id,
      broadcastId: data.broadcastId || crypto.randomUUID(),
      requirementId: data.requirementId || '',
      requirementTitle: data.requirementTitle || '',
      channel: data.channel || '',
      vendorId: data.vendorId || '',
      vendorName: data.vendorName || '',
      sentAt: new Date().toISOString(),
      status: data.status || 'sent',
      source: data.source || '',
    };
    try {
      await dbProxy.setDoc('broadcasts', id, broadcast);
      return broadcast;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `broadcasts/${id}`);
      throw error;
    }
  },

  async update(id: string, updates: Partial<VendorBroadcast>): Promise<void> {
    try {
      await dbProxy.updateDoc('broadcasts', id, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `broadcasts/${id}`);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await dbProxy.deleteDoc('broadcasts', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `broadcasts/${id}`);
    }
  }
};
