import { handleFirestoreError, OperationType } from '@/services/firebase/error';

export const AgentRepository = {
  subscribeToTasks(callback: (tasks: any[]) => void, onError?: (err: any) => void) {
    this.listTasks().then(callback).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  async listTasks(): Promise<any[]> {
    try {
      const docs = await dbProxy.getDocs('agent_tasks');
      return docs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'agent_tasks');
      return [];
    }
  },

  subscribeToExecutions(callback: (executions: any[]) => void, onError?: (err: any) => void) {
    this.listExecutions().then(callback).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  async listExecutions(): Promise<any[]> {
    try {
      const execs = await dbProxy.getDocs('agent_executions', {
        orderBy: [{ field: 'startedAt', direction: 'desc' }]
      });
      return execs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'agent_executions');
      return [];
    }
  },

  async getExecutionLogs(taskId: string): Promise<any[]> {
    try {
      const logs = await dbProxy.getDocs('agent_logs', {
        where: [{ field: 'taskId', op: '==', value: taskId }],
        orderBy: [{ field: 'timestamp', direction: 'asc' }]
      });
      return logs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'agent_logs');
      return [];
    }
  },

  async listLogs(): Promise<any[]> {
    try {
      const docs = await dbProxy.getDocs('agent_logs');
      return docs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'agent_logs');
      return [];
    }
  }
};
