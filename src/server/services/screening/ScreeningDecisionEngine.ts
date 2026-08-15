import { PureMatchResult } from "./PureMatchingEngine.js";
import { SkillEvidenceEvaluation } from "./SkillEvidenceEngine.js";
import { ConsistencyEvaluation } from "./TimelineConsistencyEngine.js";
import { ExperienceBreakdown } from "./ExperienceCalculator.js";
import { ScreeningProfile } from "./ScreeningProfileService.js";

export type ScreeningDecisionStatus = "PASS" | "REVIEW" | "REJECT" | "LEGACY_UNSCREENED";

export interface CandidateScreeningDecision {
  status: ScreeningDecisionStatus;
  primaryReason: string;
  rejectionReasons: string[];
  reviewFlags: string[];
  hardRejectTriggered: boolean;
  score: number;
}

export class ScreeningDecisionEngine {
  static evaluate(
    matchResult: PureMatchResult,
    evidence: SkillEvidenceEvaluation,
    consistency: ConsistencyEvaluation,
    experience: ExperienceBreakdown,
    profile: ScreeningProfile,
    extractionQuality: string
  ): CandidateScreeningDecision {
    const rejectionReasons: string[] = [];
    const reviewFlags: string[] = [];

    // 1. Document Quality Hard Rejection
    if (extractionQuality === "DOCUMENT_QUALITY_REVIEW") {
      rejectionReasons.push("Document is unreadable or corrupted. Clear PDF or DOCX resume required.");
    }

    // 2. Missing Critical Skills Hard Rejection
    if (profile.hardRejectRules.rejectIfCriticalSkillMissing && matchResult.missingCriticalSkills.length > 0) {
      rejectionReasons.push(
        `Critical required skills absent from resume: ${matchResult.missingCriticalSkills.join(", ")}.`
      );
    }

    // 3. Keyword-Only Critical Skill Hard Rejection / Review
    if (profile.hardRejectRules.rejectIfKeywordOnlyCritical && evidence.criticalSkillEvidenceMissing) {
      rejectionReasons.push(
        `Critical required skills appear only in keyword sections without project or employment implementation evidence.`
      );
    }

    // 4. Relevant Experience Gap
    if (profile.minimumRelevantExperienceMonths > 0) {
      const diffMonths = profile.minimumRelevantExperienceMonths - experience.relevantExperienceMonths;
      if (diffMonths >= 24) {
        // Deficit of 2+ years
        rejectionReasons.push(
          `Required relevant domain experience is ${Math.round(profile.minimumRelevantExperienceMonths / 12)}y+, but resume provides evidence for only ${experience.relevantExperienceFormatted} of hands-on experience.`
        );
      } else if (diffMonths > 0) {
        reviewFlags.push(
          `Relevant domain experience (${experience.relevantExperienceFormatted}) is slightly below target (${Math.round(profile.minimumRelevantExperienceMonths / 12)}y). Recruiter verification recommended.`
        );
      }
    }

    // 5. Timeline Inconsistency Risks
    if (consistency.hasCriticalInconsistencies) {
      reviewFlags.push(
        `Timeline inconsistency detected in employment chronology. Verification required.`
      );
    }

    // 6. Score Thresholds
    let status: ScreeningDecisionStatus = "PASS";
    let primaryReason = "Candidate passed all deterministic quality thresholds and technical criteria.";

    if (rejectionReasons.length > 0 || matchResult.overallScore < 50) {
      status = "REJECT";
      primaryReason = rejectionReasons[0] || "Profile did not meet minimum qualification benchmark score (Score < 50%).";
    } else if (reviewFlags.length > 0 || matchResult.overallScore < profile.minimumScoreToPass || evidence.isKeywordOnlyProfile) {
      status = "REVIEW";
      primaryReason = reviewFlags[0] || `Match score (${matchResult.overallScore}%) requires technical lead or recruiter review before client submission.`;
    }

    return {
      status,
      primaryReason,
      rejectionReasons,
      reviewFlags,
      hardRejectTriggered: rejectionReasons.length > 0,
      score: matchResult.overallScore
    };
  }
}
