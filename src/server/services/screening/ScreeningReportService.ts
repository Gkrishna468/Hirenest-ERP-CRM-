import { DeterministicParsedResume } from "./PureResumeParser.js";
import { SkillEvidenceEvaluation } from "./SkillEvidenceEngine.js";
import { ExperienceBreakdown } from "./ExperienceCalculator.js";
import { ConsistencyEvaluation } from "./TimelineConsistencyEngine.js";
import { PureMatchResult } from "./PureMatchingEngine.js";
import { CandidateScreeningDecision } from "./ScreeningDecisionEngine.js";
import { DocumentExtractionResult } from "../document/DocumentIntelligenceService.js";
import { LinkedInVerificationData } from "./LinkedInVerification.js";

export interface CandidateScreeningReport {
  screeningId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  requirementId?: string;
  requirementTitle?: string;
  overallScore: number;
  decision: CandidateScreeningDecision;
  totalExperience: {
    months: number;
    formatted: string;
  };
  relevantExperience: {
    months: number;
    formatted: string;
  };
  skillExperienceMap: Record<string, { months: number; formatted: string }>;
  evidenceEvaluation: SkillEvidenceEvaluation;
  consistencyEvaluation: ConsistencyEvaluation;
  matchResult: PureMatchResult;
  linkedinData: LinkedInVerificationData;
  documentQuality: {
    fileName: string;
    fileHash: string;
    mimeType: string;
    extractionQuality: string;
    ocrUsed: boolean;
    ocrConfidence: number;
  };
  screenedAt: string;
  screeningVersion: string;
}

export class ScreeningReportService {
  static createReport(
    parsed: DeterministicParsedResume,
    docResult: DocumentExtractionResult,
    evidence: SkillEvidenceEvaluation,
    experience: ExperienceBreakdown,
    consistency: ConsistencyEvaluation,
    match: PureMatchResult,
    decision: CandidateScreeningDecision,
    linkedin: LinkedInVerificationData,
    requirement?: any
  ): CandidateScreeningReport {
    const screenedAt = new Date().toISOString();
    const screeningId = `SCR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return {
      screeningId,
      candidateName: parsed.name,
      candidateEmail: parsed.email,
      candidatePhone: parsed.phone,
      requirementId: requirement?.id || requirement?.requirementId,
      requirementTitle: requirement?.title || requirement?.roleTitle,
      overallScore: match.overallScore,
      decision,
      totalExperience: {
        months: experience.totalExperienceMonths,
        formatted: experience.totalExperienceFormatted
      },
      relevantExperience: {
        months: experience.relevantExperienceMonths,
        formatted: experience.relevantExperienceFormatted
      },
      skillExperienceMap: experience.skillExperienceMap,
      evidenceEvaluation: evidence,
      consistencyEvaluation: consistency,
      matchResult: match,
      linkedinData: linkedin,
      documentQuality: {
        fileName: docResult.fileName,
        fileHash: docResult.fileHash,
        mimeType: docResult.mimeType,
        extractionQuality: docResult.extractionQuality,
        ocrUsed: docResult.ocrInfo.ocrUsed,
        ocrConfidence: docResult.ocrInfo.ocrConfidence
      },
      screenedAt,
      screeningVersion: "v1.0.0-pure-deterministic"
    };
  }
}
