export interface OutreachSequence {
  id: string;
  name: string;
  targetAudience: string;
  steps: SequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  id: string;
  sequenceId: string;
  order: number;
  channel: 'email' | 'linkedin' | 'whatsapp' | 'voice';
  templateId?: string;
  promptTemplate?: string;
  delayHours: number; // Delay from previous step
  condition?: string; // e.g. "if no reply"
}

export interface OutreachCampaign {
  id: string;
  sequenceId: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  prospects: string[]; // IDs of Participant/Contact
  startDate: string;
  organizationId: string;
}
