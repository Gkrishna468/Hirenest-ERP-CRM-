import { Task } from '../planner/AIPlanner';

export class TaskQueue {
  async enqueue(task: Task, priority: number = 0) {
    console.log(`[TaskQueue] Enqueued task: ${task.description} with priority ${priority}`);
    // In production, push to a durable queue (e.g., Cloud Tasks or Redis)
  }

  async processNext() {
    // Worker loop entry point
  }
}

export const taskQueue = new TaskQueue();
