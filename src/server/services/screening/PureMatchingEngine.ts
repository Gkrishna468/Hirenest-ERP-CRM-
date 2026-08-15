import { DeterministicParsedResume } from "./PureResumeParser.js";
import { SkillEvidenceEvaluation } from "./SkillEvidenceEngine.js";
import { ExperienceBreakdown } from "./ExperienceCalculator.js";
import { ScreeningProfile } from "./ScreeningProfileService.js";

export interface ScoreBreakdown {
  skills: { earned: number; max: number; percentage: number };
  relevantExperience: { earned: number; max: number; percentage: number };
  projectEvidence: { earned: number; max: number; percentage: number };
  technicalDepth: { earned: number; max: number; percentage: number };
  titleAlignment: { earned: number; max: number; percentage: number };
  domainAlignment: { earned: number; max: number; percentage: number };
  location: { earned: number; max: number; percentage: number };
  noticePeriod: { earned: number; max: number; percentage: number };
}

export interface PureMatchResult {
  overallScore: number;
  breakdown: ScoreBreakdown;
  matchedSkills: string[];
  missingSkills: string[];
  missingCriticalSkills: string[];
  evidenceScore: number;
}

export class PureMatchingEngine {
  static evaluate(
    parsed: DeterministicParsedResume,
    evidence: SkillEvidenceEvaluation,
    exp: ExperienceBreakdown,
    profile: ScreeningProfile,
    targetLocation?: string,
    targetNoticeDays?: number
  ): PureMatchResult {
    const weights = profile.weights;

    // 1. Skills Matching (e.g. 35%)
    const required = profile.requiredSkills.map(s => s.toLowerCase());
    const critical = profile.criticalSkills.map(s => s.toLowerCase());
    const candidateSkillsLower = parsed.skills.map(s => s.toLowerCase());

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    const missingCriticalSkills: string[] = [];

    for (const reqSkill of profile.requiredSkills) {
      const isPresent = candidateSkillsLower.includes(reqSkill.toLowerCase());
      if (isPresent) {
        matchedSkills.push(reqSkill);
      } else {
        missingSkills.push(reqSkill);
        if (critical.includes(reqSkill.toLowerCase())) {
          missingCriticalSkills.push(reqSkill);
        }
      }
    }

    const skillRatio = profile.requiredSkills.length > 0
      ? matchedSkills.length / profile.requiredSkills.length
      : 1;
    const skillsEarned = Math.round(skillRatio * weights.skills);

    // 2. Relevant Experience Matching (e.g. 20%)
    const minRelMonths = profile.minimumRelevantExperienceMonths || 24;
    const relRatio = Math.min(1, exp.relevantExperienceMonths / Math.max(1, minRelMonths));
    const relExpEarned = Math.round(relRatio * weights.relevantExperience);

    // 3. Project Evidence Matching (e.g. 10%)
    const evidenceRatio = (evidence.overallEvidenceScore || 0) / 100;
    const projectEvidenceEarned = Math.round(evidenceRatio * weights.projectEvidence);

    // 4. Technical Depth (e.g. 10%)
    // Depth is scored higher when candidate has high-level evidence (Level 3-4)
    const highEvCount = evidence.highEvidenceSkills.length;
    const techDepthRatio = Math.min(1, highEvCount / Math.max(1, profile.requiredSkills.length * 0.5));
    const techDepthEarned = Math.round(techDepthRatio * weights.technicalDepth);

    // 5. Title / Role Alignment (e.g. 10%)
    let titleRatio = 0.5; // base
    const candTitle = (parsed.currentTitle || "").toLowerCase();
    const reqTitle = (profile.name || "").toLowerCase();
    if (candTitle.includes("senior") || candTitle.includes("lead") || candTitle.includes("architect")) {
      if (reqTitle.includes("senior") || reqTitle.includes("lead")) titleRatio = 1.0;
      else titleRatio = 0.9;
    } else if (candTitle.includes("engineer") || candTitle.includes("developer")) {
      titleRatio = 0.8;
    }
    const titleEarned = Math.round(titleRatio * weights.titleAlignment);

    // 6. Domain Alignment (e.g. 5%)
    const domainRatio = parsed.skills.length >= 5 ? 1 : 0.7;
    const domainEarned = Math.round(domainRatio * weights.domainAlignment);

    // 7. Location Alignment (e.g. 5%)
    let locationRatio = 0.8;
    if (targetLocation && parsed.location) {
      if (parsed.location.toLowerCase().includes(targetLocation.toLowerCase()) || targetLocation.toLowerCase().includes("remote")) {
        locationRatio = 1.0;
      }
    }
    const locationEarned = Math.round(locationRatio * weights.location);

    // 8. Notice Period (e.g. 5%)
    let noticeRatio = 0.8;
    if (parsed.noticePeriod.toLowerCase().includes("immediate")) {
      noticeRatio = 1.0;
    } else if (parsed.noticePeriod.includes("15")) {
      noticeRatio = 0.9;
    } else if (parsed.noticePeriod.includes("30")) {
      noticeRatio = 0.8;
    } else {
      noticeRatio = 0.6;
    }
    const noticeEarned = Math.round(noticeRatio * weights.noticePeriod);

    const overallScore = Math.min(
      100,
      skillsEarned + relExpEarned + projectEvidenceEarned + techDepthEarned + titleEarned + domainEarned + locationEarned + noticeEarned
    );

    return {
      overallScore,
      breakdown: {
        skills: { earned: skillsEarned, max: weights.skills, percentage: Math.round(skillRatio * 100) },
        relevantExperience: { earned: relExpEarned, max: weights.relevantExperience, percentage: Math.round(relRatio * 100) },
        projectEvidence: { earned: projectEvidenceEarned, max: weights.projectEvidence, percentage: Math.round(evidenceRatio * 100) },
        technicalDepth: { earned: techDepthEarned, max: weights.technicalDepth, percentage: Math.round(techDepthRatio * 100) },
        titleAlignment: { earned: titleEarned, max: weights.titleAlignment, percentage: Math.round(titleRatio * 100) },
        domainAlignment: { earned: domainEarned, max: weights.domainAlignment, percentage: Math.round(domainRatio * 100) },
        location: { earned: locationEarned, max: weights.location, percentage: Math.round(locationRatio * 100) },
        noticePeriod: { earned: noticeEarned, max: weights.noticePeriod, percentage: Math.round(noticeRatio * 100) }
      },
      matchedSkills,
      missingSkills,
      missingCriticalSkills,
      evidenceScore: evidence.overallEvidenceScore
    };
  }
}
