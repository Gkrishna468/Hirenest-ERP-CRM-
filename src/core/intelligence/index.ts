/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HireNest Core Intelligence Layer
 * Shared Intelligence Engine for OS and CRM
 * 
 * Capabilities:
 * - Account Intelligence & Hiring Signals
 * - Requirement & Candidate Intelligence
 * - Unified Matchmaking Engine (Candidate, Vendor, Recruiter)
 * - Multi-Factor Scoring (Client, Requirement, Candidate, Vendor, Recruiter)
 * - Next Best Action & SLA Escalations
 * - Learning Engine (Placement Feedback Loops)
 * - AI Governance (Human-in-the-loop Guardrails)
 */

import {
  CoreClient,
  CoreRequirement,
  CoreCandidate,
  CoreVendor,
  AiRecommendation
} from '../types';

export class MatchingEngine {
  /**
   * Evaluates compatibility between Candidate and Requirement
   */
  static matchCandidateToRequirement(
    candidate: CoreCandidate,
    requirement: CoreRequirement
  ): {
    matchScore: number;
    skillsMatched: string[];
    missingSkills: string[];
    experienceFit: 'exact' | 'overqualified' | 'underqualified' | 'acceptable';
    budgetFit: 'within_budget' | 'stretch' | 'exceeds_budget';
    confidence: number;
  } {
    const reqSkills = (requirement.skills || []).map(s => s.toLowerCase().trim());
    const candSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());

    const skillsMatched = candSkills.filter(cs => 
      reqSkills.some(rs => rs.includes(cs) || cs.includes(rs))
    );

    const missingSkills = reqSkills.filter(rs => 
      !candSkills.some(cs => cs.includes(rs) || rs.includes(cs))
    );

    const skillScore = reqSkills.length > 0 
      ? Math.min(100, Math.round((skillsMatched.length / reqSkills.length) * 100))
      : 70;

    // Experience Check
    const expMin = requirement.experience?.min || 0;
    const expMax = requirement.experience?.max || 20;
    const candExp = candidate.experienceYears || 0;

    let expScore = 70;
    let experienceFit: 'exact' | 'overqualified' | 'underqualified' | 'acceptable' = 'acceptable';

    if (candExp >= expMin && candExp <= expMax) {
      expScore = 100;
      experienceFit = 'exact';
    } else if (candExp > expMax + 4) {
      expScore = 65;
      experienceFit = 'overqualified';
    } else if (candExp < expMin - 1) {
      expScore = 50;
      experienceFit = 'underqualified';
    }

    // Budget Check
    const reqBudgetMax = requirement.financials?.budgetMax || 0;
    const candExpectedCtc = candidate.ctc?.expected || 0;
    let budgetFit: 'within_budget' | 'stretch' | 'exceeds_budget' = 'within_budget';

    let budgetScore = 90;
    if (reqBudgetMax > 0 && candExpectedCtc > 0) {
      if (candExpectedCtc <= reqBudgetMax) {
        budgetFit = 'within_budget';
        budgetScore = 100;
      } else if (candExpectedCtc <= reqBudgetMax * 1.15) {
        budgetFit = 'stretch';
        budgetScore = 75;
      } else {
        budgetFit = 'exceeds_budget';
        budgetScore = 40;
      }
    }

    const matchScore = Math.round((skillScore * 0.55) + (expScore * 0.25) + (budgetScore * 0.20));

    return {
      matchScore: Math.min(99, Math.max(20, matchScore)),
      skillsMatched,
      missingSkills,
      experienceFit,
      budgetFit,
      confidence: Math.round((matchScore + 5) / 1.05)
    };
  }

  /**
   * Ranks Vendors best suited to fulfill an Open Requirement
   */
  static rankVendorsForRequirement(
    vendors: CoreVendor[],
    requirement: CoreRequirement
  ): Array<{ vendor: CoreVendor; compatibilityScore: number; reason: string }> {
    return vendors.map(vendor => {
      const specialization = vendor.specialization || [];
      const hasSkillOverlap = requirement.skills.some(reqSkill =>
        specialization.some(spec => spec.toLowerCase().includes(reqSkill.toLowerCase()))
      );

      let score = vendor.performance?.overallScore || 70;
      if (hasSkillOverlap) score += 15;
      if (vendor.tier === 'Elite') score += 10;

      return {
        vendor,
        compatibilityScore: Math.min(100, score),
        reason: hasSkillOverlap 
          ? `High niche domain overlap in [${specialization.slice(0, 2).join(', ')}] with proven ${vendor.performance?.joiningsCount || 0} historic joinings.`
          : `General pool capacity with tier ${vendor.tier} delivery compliance.`
      };
    }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}

export class NextBestActionEngine {
  static generateActions(
    clients: CoreClient[],
    requirements: CoreRequirement[],
    candidates: CoreCandidate[]
  ): AiRecommendation[] {
    const recommendations: AiRecommendation[] = [];

    // 1. Check for high-intent clients needing outbound BD follow-up
    clients.forEach(client => {
      const topSignal = client.hiringSignals?.[0];
      if (topSignal && topSignal.intentScore >= 85) {
        recommendations.push({
          id: `rec-bd-${client.id}`,
          type: 'outreach_draft',
          title: `High Hiring Intent at ${client.companyName} (${topSignal.intentScore}/100)`,
          summary: `Signal detected: "${topSignal.signal}". Recommend sending custom executive staffing proposal to TA Lead.`,
          confidenceScore: topSignal.intentScore,
          proposedAction: {
            actionType: 'SEND_OUTREACH_DRAFT',
            payload: {
              clientId: client.id,
              clientName: client.companyName,
              recipient: client.contactPersons?.[0]?.email || 'hr@client.com',
              subject: `Staffing Partnership Proposal for ${client.companyName}`
            }
          },
          approvalStatus: 'pending_human_review',
          createdAt: new Date().toISOString()
        });
      }
    });

    // 2. Check for idle candidates suitable for high-priority requirements (Redeployment)
    const availableCandidates = candidates.filter(c => c.status === 'available');
    const openReqs = requirements.filter(r => ['open', 'active'].includes(r.status));

    availableCandidates.slice(0, 5).forEach(candidate => {
      openReqs.forEach(req => {
        const match = MatchingEngine.matchCandidateToRequirement(candidate, req);
        if (match.matchScore >= 85) {
          recommendations.push({
            id: `rec-match-${candidate.id}-${req.id}`,
            type: 'candidate_match',
            title: `Instant AI Match: ${candidate.fullName} → ${req.title} (${match.matchScore}% Fit)`,
            summary: `Candidate with ${candidate.experienceYears}y exp matches ${match.skillsMatched.length} core skills for ${req.clientName}. Ready for immediate representation.`,
            confidenceScore: match.matchScore,
            proposedAction: {
              actionType: 'PROPOSE_SUBMISSION',
              payload: {
                candidateId: candidate.id,
                requirementId: req.id,
                matchScore: match.matchScore
              }
            },
            approvalStatus: 'pending_human_review',
            createdAt: new Date().toISOString()
          });
        }
      });
    });

    return recommendations.slice(0, 10);
  }
}

export class AiGovernanceEngine {
  /**
   * Law 3 & Phase 3 Mandate:
   * AI may Analyze, Score, Recommend, Draft, Predict.
   * AI MAY NOT automatically modify revenue, change stages, or dispatch emails without Founder/Admin approval.
   */
  static validateAiAction(actionType: string): { requiresApproval: boolean; policyStatement: string } {
    const automatedExceptions = ['ANALYZE_RESUME', 'CALCULATE_SCORES', 'INDEX_VECTORS', 'DETECT_SIGNALS'];
    
    if (automatedExceptions.includes(actionType)) {
      return {
        requiresApproval: false,
        policyStatement: 'Intelligence analysis permitted autonomously.'
      };
    }

    return {
      requiresApproval: true,
      policyStatement: 'Human-in-the-Loop Governance: Mutation requires explicit Founder or Admin approval.'
    };
  }
}
