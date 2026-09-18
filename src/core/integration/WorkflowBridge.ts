/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core Workflow Bridge (CRM ↔ OS)
 * The bidirectional nervous system connecting Revenue (CRM) and Operations (OS)
 * 
 * Flow 1: CRM Qualified Opportunity → Core → creates HN-REQ-xxxxx in OS
 * Flow 2: OS Recruitment Milestones → Core → Updates CRM Account metrics & Revenue
 * 
 * SSOT Rule: Firestore / HireNest Core is the sole operational SSOT.
 * External sheets/CSV are ingest/mirror integrations only and cannot override Core state.
 */

import {
  CoreClient,
  CoreRequirement,
  CoreCandidate,
  CoreSubmission,
  CorePlacement
} from '../types';
import { RequirementService, BudgetService, ClientService } from '../business';
import { MatchingEngine } from '../intelligence';

export interface OpportunityToRequirementPayload {
  opportunityId: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  skills: string[];
  budgetMin: number;
  budgetMax: number;
  currency: 'INR' | 'USD';
  openings: number;
  location: string;
  workMode: 'Onsite' | 'Hybrid' | 'Remote';
  experienceMin: number;
  experienceMax: number;
  assignedRecruiterIds?: string[];
  authorizedVendorIds?: string[];
  createdBy: string;
}

export interface OsToCrmSyncEvent {
  eventType: 'SUBMISSION_CREATED' | 'INTERVIEW_SCHEDULED' | 'OFFER_ISSUED' | 'PLACEMENT_CONFIRMED';
  requirementId: string;
  clientId: string;
  candidateId: string;
  grossMargin?: number;
  annualCompensation?: number;
}

export class WorkflowBridge {
  /**
   * Flow 1: Transforms a CRM Won/Qualified Opportunity into an Operational OS Requirement
   */
  static convertOpportunityToRequirement(payload: OpportunityToRequirementPayload): CoreRequirement {
    const canonicalRequirementId = RequirementService.generateCanonicalId();
    const financials = RequirementService.calculateFinancials(
      payload.budgetMin,
      payload.budgetMax,
      payload.currency
    );

    const now = new Date().toISOString();

    const requirement: CoreRequirement = {
      id: crypto.randomUUID(),
      canonicalRequirementId,
      organizationId: 'bootstrap-org',
      clientId: payload.clientId,
      clientName: payload.clientName,
      title: payload.title,
      description: payload.description,
      skills: payload.skills,
      experience: {
        min: payload.experienceMin,
        max: payload.experienceMax,
        display: `${payload.experienceMin} – ${payload.experienceMax} Years`
      },
      location: payload.location,
      workMode: payload.workMode,
      openings: payload.openings || 1,
      status: 'open',
      priority: 'high',
      assignedRecruiterIds: payload.assignedRecruiterIds || [],
      authorizedVendorIds: payload.authorizedVendorIds || [],
      financials,
      sla: {
        targetFirstSubmissionDays: 3,
        submissionDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        escalationLevel: 'normal'
      },
      createdAt: now,
      updatedAt: now
    };

    return requirement;
  }

  /**
   * Flow 2: Reflects OS Recruitment Milestones back onto the CRM Client Account
   */
  static syncMilestoneToCrm(
    client: CoreClient,
    requirements: CoreRequirement[],
    placements: CorePlacement[]
  ): CoreClient {
    return ClientService.updateHiringMetrics(client, requirements, placements);
  }

  /**
   * SSOT Validation Check:
   * Asserts that external integrations cannot overwrite active Core transactions
   */
  static validateSsotAuthority(externalSource: string, hasConflictWithCore: boolean): boolean {
    if (hasConflictWithCore) {
      console.warn(
        `[SSOT Authority Law] External source '${externalSource}' attempted to override Core Firestore SSOT. Action blocked to preserve ledger integrity.`
      );
      return false; // Core authority wins
    }
    return true;
  }
}
