import { DeterministicParsedResume } from "./PureResumeParser.js";

export interface ExperienceBreakdown {
  totalExperienceMonths: number;
  totalExperienceFormatted: string;
  relevantExperienceMonths: number;
  relevantExperienceFormatted: string;
  skillExperienceMap: Record<string, { months: number; formatted: string }>;
}

export class ExperienceCalculator {
  static formatMonths(months: number): string {
    if (months <= 0) return "0 Months";
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    if (years === 0) return `${remMonths}m`;
    if (remMonths === 0) return `${years}y`;
    return `${years}y ${remMonths}m`;
  }

  /**
   * Calculates total experience and relevant domain experience based on dated employment blocks
   */
  static calculate(
    parsed: DeterministicParsedResume,
    targetSkills: string[] = []
  ): ExperienceBreakdown {
    const totalMonths = parsed.totalExperienceMonths || 36;
    const skillMonthsMap: Record<string, { months: number; formatted: string }> = {};

    const currentYear = new Date().getFullYear();

    for (const skill of targetSkills) {
      const cleanSkill = skill.toLowerCase();
      const escaped = cleanSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const skillRegex = new RegExp(`\\b${escaped}\\b`, "i");

      let calculatedSkillMonths = 0;

      // Scan employment history for dated periods containing this skill
      for (const emp of parsed.employmentHistory) {
        const textToSearch = `${emp.role} ${emp.company} ${emp.description}`;
        if (skillRegex.test(textToSearch)) {
          const startYear = emp.startDate ? parseInt(emp.startDate, 10) : undefined;
          let endYear = emp.isCurrent ? currentYear : (emp.endDate ? parseInt(emp.endDate, 10) : undefined);
          
          if (startYear && endYear && endYear >= startYear) {
            calculatedSkillMonths += Math.max(6, (endYear - startYear) * 12);
          } else {
            calculatedSkillMonths += 12;
          }
        }
      }

      // Check projects if not found in employment
      if (calculatedSkillMonths === 0) {
        for (const proj of parsed.projects) {
          if (skillRegex.test(`${proj.title} ${proj.description}`)) {
            calculatedSkillMonths += 6;
          }
        }
      }

      // Cap skill experience by total experience
      calculatedSkillMonths = Math.min(totalMonths, calculatedSkillMonths);

      // Special domain handling: GenAI / LLM / Agentic AI technologies emerged in 2022-2023
      const isModernGenAiSkill = ["genai", "generative ai", "llm", "rag", "langchain", "langgraph", "agentic ai", "crewai"].includes(cleanSkill);
      if (isModernGenAiSkill && calculatedSkillMonths > 36) {
        // GenAI ecosystem emerged ~3 years ago; cap realistic commercial experience to 36 months unless specified
        calculatedSkillMonths = Math.min(36, calculatedSkillMonths);
      }

      skillMonthsMap[skill] = {
        months: calculatedSkillMonths,
        formatted: this.formatMonths(calculatedSkillMonths)
      };
    }

    // Compute overall relevant experience as the weighted average or max of target skills
    const skillMonthValues = Object.values(skillMonthsMap).map(s => s.months);
    let relevantMonths = skillMonthValues.length > 0
      ? Math.round(skillMonthValues.reduce((a, b) => a + b, 0) / skillMonthValues.length)
      : Math.min(totalMonths, 24);

    relevantMonths = Math.min(totalMonths, relevantMonths);

    return {
      totalExperienceMonths: totalMonths,
      totalExperienceFormatted: this.formatMonths(totalMonths),
      relevantExperienceMonths: relevantMonths,
      relevantExperienceFormatted: this.formatMonths(relevantMonths),
      skillExperienceMap: skillMonthsMap
    };
  }
}
