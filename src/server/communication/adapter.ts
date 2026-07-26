export interface CommunicationMessage {
  id: string;
  threadId: string;
  sender: string;
  recipient: string;
  subject?: string;
  body: string;
  channel: 'email' | 'whatsapp' | 'linkedin' | 'sms' | 'voice' | 'telegram' | 'web';
  timestamp: string;
  metadata?: any;
  attachments?: any[];
}

export interface CommunicationProvider {
  /**
   * Initializes the provider with necessary credentials or connections.
   */
  initialize(): Promise<void>;

  /**
   * Sends a message through the provider's channel.
   */
  send(message: Partial<CommunicationMessage>): Promise<CommunicationMessage>;

  /**
   * Receives a specific message by ID.
   */
  receive(messageId: string): Promise<CommunicationMessage | null>;

  /**
   * Starts watching or polling the provider for new messages.
   * Emits events to the Communication Gateway or Event Bus.
   */
  watch(callback: (message: CommunicationMessage) => Promise<void>): Promise<void>;

  /**
   * Downloads an attachment for a given message.
   */
  downloadAttachments(messageId: string, attachmentId: string): Promise<Buffer | null>;

  /**
   * Fetches an entire thread of messages.
   */
  getThreads(threadId: string): Promise<CommunicationMessage[]>;

  /**
   * Marks a message as read.
   */
  markRead(messageId: string): Promise<boolean>;
}
