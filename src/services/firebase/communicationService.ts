import { handleFirestoreError, OperationType } from './error';
import { eventService } from './eventService';

export interface Communication {
  id: string;
  entityId: string;
  entityType: 'client' | 'vendor' | 'contact';
  channel: 'email' | 'whatsapp' | 'call' | 'meeting';
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: string;
}

export const communicationService = {
  logCommunication: async (data: Omit<Communication, 'id' | 'timestamp'>) => {
    try {
      const id = crypto.randomUUID();
      const communication: Communication = {
        ...data,
        id,
        timestamp: new Date().toISOString()
      };
      await dbProxy.setDoc('communications', id, communication);
      
      await eventService.logEvent({
        eventType: 'COMMUNICATION_LOGGED',
        entityType: 'communication',
        entityId: id,
        metadata: { channel: data.channel, direction: data.direction, target: data.entityId }
      });
      return communication;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'communications');
    }
  },

  getCommunications: async (entityId?: string) => {
    try {
      if (entityId) {
        const docs = await dbProxy.getDocs('communications', {
          where: [{ field: 'entityId', op: '==', value: entityId }]
        });
        return docs as Communication[];
      }
      const docs = await dbProxy.getDocs('communications');
      return docs as Communication[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'communications');
      return [];
    }
  }
};
