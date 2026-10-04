import { Signal } from "./SignalEngine";
import { opportunityScoringEngine, OpportunityScore } from "./OpportunityScoringEngine";

export interface NextBestAction {
  id: string;
  entityType: "client" | "requirement" | "candidate" | "submission" | "deal";
  entityId: string;
  entityName: string;
  signal: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  recommendedAction: string;
  recommendedActionLabel: string;
  reasonCodes: string[];
  explanation: string;
  opportunityScore: OpportunityScore;
  confidence: number;
  channel: "CALL" | "EMAIL" | "WHATSAPP" | "SOURCING" | "REVIEW";
  requiresApproval: boolean;
  createdAt: string;
}

export class NextBestActionEngine {
  generateActions(signals: Signal[]): NextBestAction[] {
    return signals.map(sig => {
      let recommendedAction = "REVIEW";
      let recommendedActionLabel = "Review Account";
      let channel: "CALL" | "EMAIL" | "WHATSAPP" | "SOURCING" | "REVIEW" = "REVIEW";
      let requiresApproval = false;
      let explanation = "";

      const scoreResult = opportunityScoringEngine.calculateScore(sig.entityType, sig.metadata || {}, [sig.signalType]);

      if (sig.signalType === "CLIENT_DORMANT") {
        recommendedAction = "REACTIVATION_CALL";
        recommendedActionLabel = "Reactivation Call / Outreach";
        channel = "CALL";
        requiresApproval = false;
        explanation = `${sig.entityName} has been inactive for over 30 days. Historical placement records and past engagement suggest high reactivation potential (Opportunity Score: ${scoreResult.score}/100).`;
      } else if (sig.signalType === "REQUIREMENT_NO_SUBMISSION") {
        recommendedAction = "SOURCE_CANDIDATES";
        recommendedActionLabel = "Source & Match Candidates";
        channel = "SOURCING";
        requiresApproval = false;
        explanation = `Requirement created recently with zero candidate submissions blocking conversion. Immediate sourcing and AI matching recommended (Opportunity Score: ${scoreResult.score}/100).`;
      } else if (sig.signalType === "CANDIDATE_FEEDBACK_PENDING") {
        recommendedAction = "REQUEST_FEEDBACK";
        recommendedActionLabel = "Request Client Feedback";
        channel = "EMAIL";
        requiresApproval = true;
        explanation = `Candidate submission awaiting client feedback for multiple days. Follow-up is critical to maintain pipeline velocity (Opportunity Score: ${scoreResult.score}/100).`;
      } else {
        explanation = `Account signal detected requiring operational review (Opportunity Score: ${scoreResult.score}/100).`;
      }

      return {
        id: `action-${sig.id}`,
        entityType: sig.entityType,
        entityId: sig.entityId,
        entityName: sig.entityName,
        signal: sig.signalType,
        priority: sig.priority,
        recommendedAction,
        recommendedActionLabel,
        reasonCodes: sig.reasonCodes,
        explanation,
        opportunityScore: scoreResult,
        confidence: sig.priority === "CRITICAL" ? 0.96 : 0.91,
        channel,
        requiresApproval,
        createdAt: sig.createdAt
      };
    });
  }
}

export const nextBestActionEngine = new NextBestActionEngine();
