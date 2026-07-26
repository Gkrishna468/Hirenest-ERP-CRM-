export interface Participant {
  id?: string; // Contact ID, Vendor ID, Client ID, User ID
  name: string;
  address: string; // Email, phone number, LinkedIn handle
  role?: 'client' | 'vendor' | 'recruiter' | 'candidate' | 'system' | 'unknown';
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface UniversalMessage {
  id: string;
  provider: "gmail" | "outlook" | "whatsapp" | "linkedin" | "system" | "voice";
  conversationId: string;
  direction: "incoming" | "outgoing" | "internal";
  sender: Participant;
  recipients: Participant[];
  subject?: string;
  body: string;
  attachments: Attachment[];
  timestamp: string;
  threadId: string; // Provider-specific thread ID
  metadata: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title?: string;
  participants: Participant[];
  messages: UniversalMessage[];
  lastMessageAt: string;
  status: 'active' | 'waiting' | 'snoozed' | 'archived' | 'closed';
  nextAction?: string;
  nextActionAt?: string;
  organizationId: string;
  metadata: Record<string, unknown>;
}

export interface AIMemory {
  id: string; // Typically same as the Client/Vendor/Contact ID
  entityType: 'company' | 'person' | 'vendor';
  entityId: string;
  decisionMakers: string[];
  hiringPattern: string;
  preferredSkills: string[];
  rateCards: string;
  vendorMargin?: string;
  paymentTerms?: string;
  communicationStyle: string;
  lastOpportunity?: string;
  currentHiring?: string;
  riskScore: number;
  relationshipScore: number;
  lastUpdated: string;
}
