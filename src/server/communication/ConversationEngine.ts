import { getAdminDb } from '../utils/firebaseAdmin';
import { UniversalMessage, Conversation, Participant } from './schema';
import * as crypto from 'crypto';
import { DomainEventPublisher } from '../events/DomainEventPublisher';

export class ConversationEngine {
  private db = getAdminDb();

  /**
   * Process an incoming or outgoing message and append to a Conversation.
   * Creates a new conversation if one doesn't exist for this thread.
   */
  async processMessage(message: UniversalMessage): Promise<Conversation> {
    const threadId = message.threadId || crypto.randomUUID();
    let conversationId = message.conversationId;

    if (!conversationId) {
      // Attempt to find existing conversation by threadId
      const convos = await this.db.collection('conversations')
        .where('metadata.threadId', '==', threadId)
        .limit(1)
        .get();

      if (!convos.empty) {
        conversationId = convos.docs[0].id;
      } else {
        conversationId = crypto.randomUUID();
      }
      message.conversationId = conversationId;
    }

    const conversationRef = this.db.collection('conversations').doc(conversationId);
    const messageRef = this.db.collection('messages').doc(message.id || crypto.randomUUID());

    if (!message.id) message.id = messageRef.id;

    await this.db.runTransaction(async (t) => {
      const convDoc = await t.get(conversationRef);
      let participants = [...message.recipients];
      if (!participants.find(p => p.address === message.sender.address)) {
        participants.push(message.sender);
      }

      let updateData: any = {
        lastMessageAt: message.timestamp,
        status: message.direction === 'incoming' ? 'active' : 'waiting',
        updatedAt: new Date().toISOString()
      };

      if (!convDoc.exists) {
        const newConversation: Partial<Conversation> = {
          id: conversationId,
          title: message.subject || `Conversation with ${message.sender.name}`,
          participants: participants,
          lastMessageAt: message.timestamp,
          status: 'active',
          organizationId: 'default',
          metadata: { threadId }
        };
        t.set(conversationRef, newConversation);
      } else {
        // Merge participants
        const existingData = convDoc.data() as Conversation;
        const existingParticipants = existingData.participants || [];
        
        for (const p of participants) {
          if (!existingParticipants.find(ep => ep.address === p.address)) {
            existingParticipants.push(p);
          }
        }
        updateData.participants = existingParticipants;
        t.update(conversationRef, updateData);
      }

      t.set(messageRef, message);
    });

    // Publish event for AI Memory Service and Agent Runtime
    const eventType = message.direction === 'incoming' ? 'MESSAGE_RECEIVED' : 'MESSAGE_SENT';
    await DomainEventPublisher.publishDomainEvent({
      type: eventType,
      aggregateType: 'Conversation',
      aggregateId: conversationId,
      organizationId: 'default',
      actorId: message.sender.id || 'unknown',
      actorRole: message.sender.role || 'unknown',
      sourceApp: 'OS',
      sourceWorkspace: message.provider,
      payload: message
    });

    const updatedConvo = await conversationRef.get();
    return { ...updatedConvo.data(), id: conversationId } as Conversation;
  }
}

export const conversationEngine = new ConversationEngine();
