/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core Unified Type Definitions
 * Single Source of Truth for RBAC, ABAC, Business Core, Intelligence, and Workspaces
 */

export type UserRole = 
  | 'founder'
  | 'admin'
  | 'bdm'
  | 'recruiter'
  | 'vendor_admin'
  | 'vendor_recruiter'
  | 'client_admin'
  | 'client_member'
  | 'ai_agent'
  | 'viewer';

export type WorkspaceDomain = 'OS' | 'CRM' | 'CORE' | 'VENDOR_PORTAL' | 'CLIENT_PORTAL';

export interface AuthUserContext {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  vendorId?: string;
  clientId?: string;
  permissions: string[];
  isAiAgent?: boolean;
  active: boolean;
}

export type PermissionAction =
  | 'client:create' | 'client:read' | 'client:update' | 'client:delete' | 'client:export'
  | 'requirement:create' | 'requirement:read' | 'requirement:update' | 'requirement:close' | 'requirement:publish' | 'requirement:assign'
  | 'vendor:create' | 'vendor:read' | 'vendor:update' | 'vendor:authorize' | 'vendor:bench_upload'
  | 'recruiter:create' | 'recruiter:read' | 'recruiter:assign' | 'recruiter:performance'
  | 'candidate:create' | 'candidate:read' | 'candidate:update' | 'candidate:ingest' | 'candidate:redepoly'
  | 'submission:create' | 'submission:read' | 'submission:review' | 'submission:accept' | 'submission:reject'
  | 'interview:schedule' | 'interview:read' | 'interview:feedback' | 'interview:reschedule'
  | 'offer:create' | 'offer:read' | 'offer:approve' | 'offer:accept' | 'offer:decline'
  | 'placement:create' | 'placement:read' | 'placement:invoice'
  | 'revenue:read' | 'revenue:modify' | 'revenue:forecast'
  | 'ai:analyze' | 'ai:score' | 'ai:recommend' | 'ai:draft' | 'ai:execute_with_human_approval'
  | 'settings:manage' | 'audit:read' | 'users:manage';

export interface ABACContext {
  user: AuthUserContext;
  resource: {
    type: 'client' | 'requirement' | 'vendor' | 'candidate' | 'submission' | 'interview' | 'offer' | 'placement' | 'account' | 'opportunity';
    id: string;
    organizationId: string;
    assignedBdmId?: string;
    assignedRecruiterId?: string;
    ownerVendorId?: string;
    targetClientId?: string;
    authorizedVendorIds?: string[];
  };
  environment?: {
    domain: WorkspaceDomain;
    ipAddress?: string;
    timestamp?: string;
  };
}

export interface CoreClient {
  id: string;
  organizationId: string;
  companyName: string;
  code?: string;
  industry: string;
  location: string;
  website?: string;
  status: 'lead' | 'active' | 'inactive' | 'key_account';
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  assignedBdmId?: string;
  assignedBdmName?: string;
  contactPersons: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    designation: string;
    isPrimary?: boolean;
  }>;
  commercialTerms?: {
    rateCardType: 'percentage' | 'fixed' | 'hourly';
    placementFeePercentage: number;
    replacementGuaranteeDays: number;
    paymentTermsDays: number;
    currency: 'INR' | 'USD';
  };
  healthScore: number;
  hiringProgress: {
    activeRequirementsCount: number;
    totalPositions: number;
    openPositions: number;
    inInterviewCount: number;
    offeredCount: number;
    placedCount: number;
    fillRate: number;
    averageTimeToFillDays: number;
    pipelineValue: number;
    realizedRevenue: number;
  };
  hiringSignals?: Array<{
    signal: string;
    source: string;
    intentScore: number;
    detectedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CoreRequirement {
  id: string;
  canonicalRequirementId: string; // e.g. HN-REQ-2026-001
  organizationId: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  skills: string[];
  mandatorySkills?: string[];
  goodToHaveSkills?: string[];
  experience: {
    min: number;
    max: number;
    display: string;
  };
  location: string;
  workMode: 'Onsite' | 'Hybrid' | 'Remote';
  openings: number;
  status: 'draft' | 'open' | 'active' | 'in_progress' | 'hold' | 'fulfilled' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedRecruiterIds: string[];
  authorizedVendorIds: string[];
  financials: {
    currency: 'INR' | 'USD';
    budgetMin: number;
    budgetMax: number;
    displayBudget: string;
    clientBilling: number;
    vendorCost: number;
    platformMargin: number;
    projectedRevenue: number;
  };
  sla: {
    targetFirstSubmissionDays: number;
    submissionDeadline: string;
    escalationLevel: 'normal' | 'reminder' | 'escalation' | 'founder_alert';
  };
  score?: {
    requisitionClarityScore: number;
    marketHardnessScore: number;
    recommendedRateCard: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoreVendor {
  id: string;
  organizationId: string;
  vendorCode: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  status: 'active' | 'probation' | 'inactive';
  tier: 'Elite' | 'Preferred' | 'General';
  specialization: string[];
  performance: {
    profilesShared: number;
    validSubmissions: number;
    shortlistedCount: number;
    interviewsScheduled: number;
    offersCount: number;
    joiningsCount: number;
    responseRatePercent: number;
    retentionRatePercent: number;
    slaCompliancePercent: number;
    overallScore: number;
  };
  benchCount: number;
  authorizedRequirementIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CoreCandidate {
  id: string;
  canonicalCandidateId: string; // e.g. HN-CAN-2026-001
  organizationId: string;
  vendorId?: string;
  vendorName?: string;
  fullName: string;
  primaryEmail: string;
  primaryPhone?: string;
  location: string;
  currentDesignation?: string;
  currentCompany?: string;
  experienceYears: number;
  skills: string[];
  primarySkills?: string[];
  ctc: {
    currency: 'INR' | 'USD';
    current: number;
    expected: number;
    displayCurrent: string;
    displayExpected: string;
  };
  noticePeriodDays: number;
  status: 'available' | 'submitted' | 'screening' | 'interviewing' | 'offered' | 'joined' | 'redeployed' | 'inactive';
  resumeUrl?: string;
  resumeStoragePath?: string;
  distillationStatus: 'PARSED' | 'EXTRACTED' | 'PROCESSING' | 'MANUAL_REVIEW';
  aiDistillation?: {
    matchHighlights: string[];
    riskFlags: string[];
    technicalScore: number;
    cultureScore: number;
    stabilityScore: number;
    overallConfidenceScore: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CoreSubmission {
  id: string;
  organizationId: string;
  requirementId: string;
  canonicalRequirementId: string;
  candidateId: string;
  canonicalCandidateId: string;
  vendorId: string;
  vendorName: string;
  clientId: string;
  clientName: string;
  status: 'submitted' | 'internal_review' | 'client_review' | 'shortlisted' | 'interview' | 'offer' | 'joined' | 'rejected' | 'withdrawn';
  matchScore: number;
  clientFeedback?: {
    rating?: number;
    comments?: string;
    receivedAt?: string;
    slaDelayed?: boolean;
  };
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
}

export interface CorePlacement {
  id: string;
  organizationId: string;
  requirementId: string;
  candidateId: string;
  clientId: string;
  vendorId?: string;
  submissionId: string;
  joiningDate: string;
  annualCompensation: number;
  currency: 'INR' | 'USD';
  placementFee: number;
  vendorPayout?: number;
  grossMargin: number;
  invoiceStatus: 'pending' | 'issued' | 'paid' | 'overdue';
  createdAt: string;
}

export interface AiRecommendation {
  id: string;
  type: 'candidate_match' | 'sla_escalation' | 'redeployment_opportunity' | 'outreach_draft' | 'pricing_optimization';
  title: string;
  summary: string;
  confidenceScore: number;
  proposedAction: {
    actionType: string;
    payload: any;
  };
  approvalStatus: 'pending_human_review' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}
