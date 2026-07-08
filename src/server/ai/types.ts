export interface ParseResumeResult {
  name?: string;
  email?: string;
  phone?: string;
  currentTitle?: string;
  skills: string[];
  experience: string | number;
  currentCompany?: string;
  noticePeriod?: string;
  expectedSalary?: string;
  location?: string;
}

export interface CandidateSummaryResult {
  summary: string;
  strengths: string[];
  recommendation: string;
  reason: string;
}

export interface RequirementMatchResult {
  score: number;
  reasoning: string;
}

export interface EmailDraftResult {
  subject: string;
  body: string;
}

export interface AIProvider {
  name: string;
  isAvailable(): boolean;
  parseResume(text: string): Promise<ParseResumeResult>;
  summarizeCandidate(data: any): Promise<CandidateSummaryResult>;
  matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult>;
  draftEmail(prompt: string, context: any): Promise<EmailDraftResult>;
}
