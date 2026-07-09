import { handleFirestoreError, OperationType } from './error';
import { eventService } from './eventService';

export interface Requirement {
  id: string;
  accountId: string;
  title: string;
  status: string;
  priority: string;
}

export const requirementService = {
  createRequirement: async (data: Omit<Requirement, 'id'>) => {
    try {
      const id = crypto.randomUUID();
      const requirement: Requirement = { ...data, id };
      await dbProxy.setDoc('requirements', id, requirement);
      
      await eventService.logEvent({
        eventType: 'REQUIREMENT_CREATED',
        entityType: 'requirement',
        entityId: id,
        metadata: { title: data.title }
      });
      return requirement;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requirements');
    }
  },

  getRequirements: async () => {
    try {
      const docs = await dbProxy.getDocs('requirements');
      return docs as Requirement[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'requirements');
      return [];
    }
  }
};
