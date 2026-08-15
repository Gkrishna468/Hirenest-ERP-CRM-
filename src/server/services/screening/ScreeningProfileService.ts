export interface ScreeningProfile {
  profileId: string;
  name: string;
  requiredSkills: string[];
  preferredSkills: string[];
  criticalSkills: string[];
  minimumRelevantExperienceMonths: number;
  minimumTotalExperienceMonths: number;
  weights: {
    skills: number; // e.g. 35
    relevantExperience: number; // e.g. 20
    projectEvidence: number; // e.g. 10
    technicalDepth: number; // e.g. 10
    titleAlignment: number; // e.g. 10
    domainAlignment: number; // e.g. 5
    location: number; // e.g. 5
    noticePeriod: number; // e.g. 5
  };
  minimumScoreToPass: number; // e.g. 70
  hardRejectRules: {
    rejectIfCriticalSkillMissing: boolean;
    rejectIfInsufficientExperience: boolean;
    rejectIfKeywordOnlyCritical: boolean;
  };
}

export const DEFAULT_AI_GENAI_PROFILE: ScreeningProfile = {
  profileId: "SR_AI_GENAI_ENGINEER",
  name: "Senior AI / Python & GenAI Engineer",
  requiredSkills: ["Python", "GenAI", "LLM", "RAG", "LangChain", "FastAPI"],
  preferredSkills: ["LangGraph", "Vector DB", "Docker", "AWS", "Agentic AI"],
  criticalSkills: ["Python", "GenAI", "LLM", "RAG"],
  minimumRelevantExperienceMonths: 24, // 2 years relevant GenAI
  minimumTotalExperienceMonths: 60, // 5 years total
  weights: {
    skills: 35,
    relevantExperience: 20,
    projectEvidence: 10,
    technicalDepth: 10,
    titleAlignment: 10,
    domainAlignment: 5,
    location: 5,
    noticePeriod: 5
  },
  minimumScoreToPass: 70,
  hardRejectRules: {
    rejectIfCriticalSkillMissing: true,
    rejectIfInsufficientExperience: true,
    rejectIfKeywordOnlyCritical: true
  }
};

export class ScreeningProfileService {
  static getProfileForRequirement(req?: any): ScreeningProfile {
    if (!req) return DEFAULT_AI_GENAI_PROFILE;

    const skills: string[] = Array.isArray(req.skills) 
      ? req.skills 
      : (req.primarySkills || ["Python", "GenAI", "RAG", "LLM"]);

    const cleanSkills = skills.map(s => typeof s === "string" ? s.trim() : "").filter(Boolean);
    const critical = cleanSkills.slice(0, 3);

    const minExpYears = req.experience?.min || (typeof req.experienceMin === "number" ? req.experienceMin : 3);
    const minTotalMonths = minExpYears * 12;
    const minRelMonths = Math.max(18, Math.round(minTotalMonths * 0.4)); // at least 40% relevant

    return {
      profileId: req.id || req.requirementId || "CUSTOM_REQUIREMENT_PROFILE",
      name: req.title || "Custom Staffing Role",
      requiredSkills: cleanSkills.length > 0 ? cleanSkills : ["Python", "Software Engineering"],
      preferredSkills: (req.secondarySkills || []).length > 0 ? req.secondarySkills : ["Cloud", "Docker", "CI/CD"],
      criticalSkills: critical.length > 0 ? critical : ["Python"],
      minimumRelevantExperienceMonths: minRelMonths,
      minimumTotalExperienceMonths: minTotalMonths,
      weights: {
        skills: 35,
        relevantExperience: 20,
        projectEvidence: 10,
        technicalDepth: 10,
        titleAlignment: 10,
        domainAlignment: 5,
        location: 5,
        noticePeriod: 5
      },
      minimumScoreToPass: 70,
      hardRejectRules: {
        rejectIfCriticalSkillMissing: true,
        rejectIfInsufficientExperience: false, // flag as review if slightly below
        rejectIfKeywordOnlyCritical: true
      }
    };
  }
}
