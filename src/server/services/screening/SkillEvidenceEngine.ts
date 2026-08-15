import { DeterministicParsedResume } from "./PureResumeParser.js";

export type EvidenceLevel = 0 | 1 | 2 | 3 | 4;

export interface SkillEvidenceItem {
  skill: string;
  evidenceLevel: EvidenceLevel;
  evidenceLevelLabel: string;
  foundInSkillsSection: boolean;
  foundInExperienceSection: boolean;
  foundInProjectsSection: boolean;
  hasTimeframe: boolean;
  hasResponsibility: boolean;
  evidenceSnippet?: string;
}

export interface SkillEvidenceEvaluation {
  skillEvidenceMap: Record<string, SkillEvidenceItem>;
  keywordOnlySkills: string[];
  highEvidenceSkills: string[];
  isKeywordOnlyProfile: boolean;
  criticalSkillEvidenceMissing: boolean;
  overallEvidenceScore: number; // 0 - 100
}

export class SkillEvidenceEngine {
  /**
   * Evaluates evidence level for an array of required or extracted skills
   */
  static evaluateSkillsEvidence(
    parsed: DeterministicParsedResume,
    skillsToEvaluate: string[],
    criticalSkills: string[] = []
  ): SkillEvidenceEvaluation {
    const map: Record<string, SkillEvidenceItem> = {};
    const keywordOnlySkills: string[] = [];
    const highEvidenceSkills: string[] = [];
    let criticalEvidenceMissing = false;

    const skillsText = (parsed.sections.skills || "").toLowerCase();
    const expText = (parsed.sections.experience || "").toLowerCase();
    const projText = (parsed.sections.projects || "").toLowerCase();
    const fullExpAndProj = `${expText}\n${projText}`;

    let totalScorePoints = 0;
    const maxScorePoints = skillsToEvaluate.length * 4 || 4;

    for (const skill of skillsToEvaluate) {
      const cleanSkill = skill.trim().toLowerCase();
      const escaped = cleanSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillRegex = new RegExp(`\\b${escaped}\\b`, "i");

      const inSkills = skillRegex.test(skillsText);
      const inExp = skillRegex.test(expText);
      const inProj = skillRegex.test(projText);

      let level: EvidenceLevel = 0;
      let hasTimeframe = false;
      let hasResponsibility = false;
      let snippet: string | undefined = undefined;

      if (!inSkills && !inExp && !inProj) {
        level = 0;
      } else if (inSkills && !inExp && !inProj) {
        level = 0; // L0: Keyword present only in the 'Skills' section
        keywordOnlySkills.push(skill);
      } else {
        // Find matching paragraph/sentence for snippet
        const sentences = fullExpAndProj.split(/[\n.]+/);
        const matchSentence = sentences.find(s => skillRegex.test(s));
        if (matchSentence) {
          snippet = matchSentence.trim().substring(0, 200);
        }

        // L4: Mentioned with numerical production/business metrics (e.g., 'reduced latency by 40%')
        const hasNumericalMetric = /(\d+%\s*(?:reduction|increase|improvement|decrease|save|optimize|speed|latency|cost|performance))|((?:reduced|increased|improved|optimized|saved|decreased)\s+.*\s+by\s+\d+)|(\d+\s*x\s*(?:faster|slower|improvement|reduction))|(\bsaved\s+\$?\d+)/i.test(matchSentence || fullExpAndProj);

        // L3: Mentioned inside a role/project with architectural context (e.g., 'Designed...')
        const hasArchitecturalContext = /(?:designed|architected|spearheaded|pipeline|infrastructure|architecture|microservices|distributed|scalable|production|enterprise)/i.test(matchSentence || fullExpAndProj);

        if (hasNumericalMetric) {
          level = 4;
          highEvidenceSkills.push(skill);
        } else if (hasArchitecturalContext) {
          level = 3;
          highEvidenceSkills.push(skill);
        } else if (inProj) {
          level = 2; // L2: Mentioned inside a project, but without any direct outcomes
        } else {
          level = 1; // L1: Mentioned inside a job role, but without a metric or project context
        }
      }

      const labels: Record<EvidenceLevel, string> = {
        0: "L0 - Keyword present only in 'Skills' section",
        1: "L1 - Mentioned inside a job role, but without a metric or project context",
        2: "L2 - Mentioned inside a project, but without any direct outcomes",
        3: "L3 - Mentioned inside a role/project with architectural context (e.g., 'Designed...')",
        4: "L4 - Mentioned with numerical production/business metrics (e.g., 'reduced latency by 40%')"
      };

      map[skill] = {
        skill,
        evidenceLevel: level,
        evidenceLevelLabel: labels[level],
        foundInSkillsSection: inSkills,
        foundInExperienceSection: inExp,
        foundInProjectsSection: inProj,
        hasTimeframe,
        hasResponsibility,
        evidenceSnippet: snippet
      };

      totalScorePoints += level;

      if (criticalSkills.map(s => s.toLowerCase()).includes(cleanSkill) && level <= 1) {
        criticalEvidenceMissing = true;
      }
    }

    const overallScore = Math.round((totalScorePoints / Math.max(1, maxScorePoints)) * 100);
    const isKeywordOnly = keywordOnlySkills.length > 0 && highEvidenceSkills.length === 0;

    return {
      skillEvidenceMap: map,
      keywordOnlySkills,
      highEvidenceSkills,
      isKeywordOnlyProfile: isKeywordOnly,
      criticalSkillEvidenceMissing: criticalEvidenceMissing,
      overallEvidenceScore: overallScore
    };
  }
}
