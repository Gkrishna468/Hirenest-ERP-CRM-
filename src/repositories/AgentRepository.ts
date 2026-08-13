import { dbProxy } from '@/services/firebase/dbProxy';
import { handleFirestoreError, OperationType } from '@/services/firebase/error';

export const AgentRepository = {
  subscribeToTasks(callback: (tasks: any[]) => void, onError?: (err: any) => void) {
    this.listTasks().then(callback).catch(onError);
    return () => {}; // No-op unsubscribe
  },

  async listTasks(): Promise<any[]> {
    try {
      const docs = await dbProxy.getDocs('agent_tasks');
      return Array.isArray(docs) ? docs : [];
    } catch (error) {
      console.warn("[AgentRepository.listTasks] Unable to list tasks:", error);
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
      return Array.isArray(execs) ? execs : [];
    } catch (error) {
      console.warn("[AgentRepository.listExecutions] Unable to list executions:", error);
      return [];
    }
  },

  async getExecutionLogs(taskId: string): Promise<any[]> {
    try {
      const logs = await dbProxy.getDocs('agent_logs', {
        where: [{ field: 'taskId', op: '==', value: taskId }],
        orderBy: [{ field: 'timestamp', direction: 'asc' }]
      });
      return Array.isArray(logs) ? logs : [];
    } catch (error) {
      console.warn(`[AgentRepository.getExecutionLogs] Unable to list logs for ${taskId}:`, error);
      return [];
    }
  },

  async listLogs(): Promise<any[]> {
    try {
      const docs = await dbProxy.getDocs('agent_logs');
      return Array.isArray(docs) ? docs : [];
    } catch (error) {
      console.warn("[AgentRepository.listLogs] Unable to list logs:", error);
      return [];
    }
  }
};
