import { CommunicationProvider } from './adapter';
import { UniversalMessage } from './schema';
import { conversationEngine } from './ConversationEngine';

export class CommunicationGateway {
  private providers: Map<string, CommunicationProvider> = new Map();

  registerProvider(channel: string, provider: CommunicationProvider) {
    this.providers.set(channel, provider);
  }

  async initializeAll() {
    for (const [channel, provider] of this.providers.entries()) {
      try {
        await provider.initialize();
        // Start watching for incoming messages
        await provider.watch(async (message: any) => {
          await this.handleIncomingMessage(message);
        });
        console.log(`Initialized provider for channel: ${channel}`);
      } catch (err) {
        console.error(`Failed to initialize provider for ${channel}:`, err);
      }
    }
  }

  async send(channel: string, messageData: Partial<UniversalMessage>): Promise<UniversalMessage> {
    const provider = this.providers.get(channel);
    if (!provider) {
      throw new Error(`No provider registered for channel: ${channel}`);
    }

    const sentMessage = await provider.send(messageData as any);
    
    // Store message in the unified conversation model via ConversationEngine
    await conversationEngine.processMessage(sentMessage as any);

    return sentMessage as any;
  }

  private async handleIncomingMessage(message: UniversalMessage) {
    // Persist the message in unified storage, which also triggers domain events
    await conversationEngine.processMessage(message);
  }
}

export const communicationGateway = new CommunicationGateway();
