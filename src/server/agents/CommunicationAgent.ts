import { Agent } from './AgentRuntime';
import { intentEngine } from '../communication/IntentEngine';
import { aiMemoryService } from '../communication/AIMemoryService';

export class CommunicationAgent implements Agent {
  name = "Communication Agent";
  capabilities = ["Classify Intent", "Update AI Memory"];

  async handleEvent(event: any): Promise<void> {
    if (event.type === 'MESSAGE_RECEIVED') {
      const message = event.payload;
      
      // 1. Extract Intent
      const analysis = await intentEngine.evaluateMessage(message);
      
      // 2. Update AI Memory
      await aiMemoryService.extractAndStoreMemoryFromMessage(message, analysis);
      
      console.log(`[${this.name}] Processed incoming message, intent: ${analysis.intent}`);
    }
  }
}

export const communicationAgent = new CommunicationAgent();
