import { dbProxy } from './db-proxy';
import { auth } from './config';
import { eventService } from './eventService';

export const syncService = {
  // Appends to immutable Company Ledger
  logEvent: async (eventType: string, entityType: string, entityId: string, metadata?: any) => {
    try {
      await eventService.logEvent({
        eventType,
        entityType,
        entityId,
        metadata: {
          ...metadata,
          userId: auth.currentUser?.uid || 'system',
          userEmail: auth.currentUser?.email || 'system@hirenest.com'
        }
      });
      console.log(`[Ledger] Logged ${eventType} for ${entityType} ${entityId}`);
    } catch (err) {
      console.error('[Ledger] Failed to append to Company Ledger:', err);
    }
  },

  // Write Client to Unified SSOT
  syncClient: async (id: string, data: any) => {
    try {
      await dbProxy.setDoc('clients', id, {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });

      // Log event
      await syncService.logEvent('CLIENT_CREATED_OR_UPDATED', 'client', id, { company: data.company });
    } catch (err) {
      console.error('[Platform] Client write failed:', err);
    }
  },

  // Write Vendor to Unified SSOT
  syncVendor: async (id: string, data: any) => {
    try {
      await dbProxy.setDoc('vendors', id, {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });

      // Log event
      await syncService.logEvent('VENDOR_CREATED_OR_UPDATED', 'vendor', id, { name: data.name, company: data.company });
    } catch (err) {
      console.error('[Platform] Vendor write failed:', err);
    }
  },

  // Write Requirement to Unified SSOT
  syncRequirement: async (id: string, data: any) => {
    try {
      await dbProxy.setDoc('requirements', id, {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });

      // Log event
      await syncService.logEvent('REQUIREMENT_SYNCED', 'requirement', id, { 
        title: data.title, 
        status: data.status,
        approvalStatus: data.approvalStatus
      });
    } catch (err) {
      console.error('[Platform] Requirement write failed:', err);
    }
  },

  // Write Candidate to Unified SSOT
  syncCandidate: async (id: string, data: any) => {
    try {
      await dbProxy.setDoc('candidates', id, {
        ...data,
        id,
        updatedAt: new Date().toISOString()
      });

      // Log event
      await syncService.logEvent('CANDIDATE_SYNCED', 'candidate', id, { 
        name: data.name, 
        stage: data.stage,
        status: data.status
      });
    } catch (err) {
      console.error('[Platform] Candidate write failed:', err);
    }
  }
};
