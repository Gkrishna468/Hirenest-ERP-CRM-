import { UniversalMessage } from './schema';
import { DomainEventPublisher } from '../events/DomainEventPublisher';

export class IntentEngine {
  
  /**
   * Evaluates an incoming message to determine intent, entities, and required actions.
   */
  async evaluateMessage(message: UniversalMessage) {
    // In production, this would call the Gemini API with structured output
    
    // Stub implementation
    const text = message.body.toLowerCase();
    let intent = "Unknown";
    let entities: any = {};
    let confidence = 0.5;
    let priority = "Normal";
    
    if (text.includes("need") && (text.includes("developer") || text.includes("engineer"))) {
      intent = "Need Candidates";
      confidence = 0.95;
      priority = "High";
      entities = { role: "Developer" };
    } else if (text.includes("not interested") || text.includes("remove me")) {
      intent = "Not Interested";
      confidence = 0.98;
    }

    const analysis = {
      intent,
      confidence,
      entities,
      priority,
      sentiment: text.includes("urgent") ? "Urgent" : "Neutral"
    };

    // Emit INTENT_DETECTED event so agents can take action
    await DomainEventPublisher.publishDomainEvent({
      type: 'INTENT_DETECTED',
      aggregateType: 'Conversation',
      aggregateId: message.conversationId,
      organizationId: 'default',
      actorId: 'system',
      actorRole: 'System',
      sourceApp: 'IntentEngine',
      sourceWorkspace: 'System',
      payload: {
        messageId: message.id,
        analysis
      }
    });

    return analysis;
  }
}

export const intentEngine = new IntentEngine();
