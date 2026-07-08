import { dbProxy } from './db-proxy';
import { handleFirestoreError, OperationType } from './error';
import { eventService } from './eventService';

export interface RevenuePipeline {
  id: string;
  requirementId: string;
  accountId: string;
  stage: 'draft' | 'sourced' | 'submitted' | 'interviewing' | 'offered' | 'placed' | 'invoiced' | 'paid';
  expectedAmount: number;
  probability: number;
}

export const revenueService = {
  createRevenueEntry: async (data: Omit<RevenuePipeline, 'id'>) => {
    try {
      const id = crypto.randomUUID();
      const entry: RevenuePipeline = { ...data, id };
      await dbProxy.setDoc('revenue_pipeline', id, entry);
      
      await eventService.logEvent({
        eventType: 'REVENUE_PIPELINE_CREATED',
        entityType: 'revenue_pipeline',
        entityId: id,
        metadata: { stage: data.stage, expectedAmount: data.expectedAmount }
      });
      return entry;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'revenue_pipeline');
    }
  },

  getRevenuePipeline: async () => {
    try {
      const docs = await dbProxy.getDocs('revenue_pipeline');
      return docs as RevenuePipeline[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'revenue_pipeline');
      return [];
    }
  }
};
