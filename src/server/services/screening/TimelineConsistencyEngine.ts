import { DeterministicParsedResume } from "./PureResumeParser.js";

export interface ConsistencyRiskFlag {
  code: string;
  category: "Timeline Conflict" | "Experience Inconsistency" | "Keyword-Only Claim" | "Verification Risk" | "Insufficient Evidence";
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  detail: string;
}

export interface ConsistencyEvaluation {
  hasCriticalInconsistencies: boolean;
  riskScore: number; // 0 - 100
  riskFlags: ConsistencyRiskFlag[];
}

export class TimelineConsistencyEngine {
  static evaluate(parsed: DeterministicParsedResume): ConsistencyEvaluation {
    const riskFlags: ConsistencyRiskFlag[] = [];
    const currentYear = new Date().getFullYear();

    // 1. Check Impossible Employment Dates
    for (const emp of parsed.employmentHistory) {
      if (emp.startDate) {
        const startY = parseInt(emp.startDate, 10);
        if (startY > currentYear) {
          riskFlags.push({
            code: "FUTURE_START_DATE",
            category: "Timeline Conflict",
            severity: "HIGH",
            message: "Employment start date is in the future.",
            detail: `Found start year ${startY} at ${emp.company} which exceeds current year ${currentYear}.`
          });
        }
        if (emp.endDate && !emp.isCurrent) {
          const endY = parseInt(emp.endDate, 10);
          if (endY < startY) {
            riskFlags.push({
              code: "INVERTED_TIMELINE",
              category: "Timeline Conflict",
              severity: "HIGH",
              message: "Employment end date precedes start date.",
              detail: `${emp.company} lists start year ${startY} and end year ${endY}.`
            });
          }
        }
      }
    }

    // 2. Check Technology Timeline Anachronisms (e.g. claiming 6+ years of LangChain / LangGraph)
    const modernTechReleaseYears: Record<string, number> = {
      "langchain": 2022,
      "langgraph": 2024,
      "chatgpt": 2022,
      "gpt-4": 2023,
      "crewai": 2023,
      "autogen": 2023,
      "fastapi": 2018
    };

    const fullText = `${parsed.sections.experience} ${parsed.sections.projects}`.toLowerCase();
    for (const [tech, releaseYear] of Object.entries(modernTechReleaseYears)) {
      const yearRegex = new RegExp(`\\b(20\\d{2})\\b[\\s\\S]{0,100}\\b${tech}\\b`, "i");
      const match = fullText.match(yearRegex);
      if (match && match[1]) {
        const claimedYear = parseInt(match[1], 10);
        if (claimedYear < releaseYear - 1) {
          riskFlags.push({
            code: "TECH_ANACHRONISM",
            category: "Experience Inconsistency",
            severity: "MEDIUM",
            message: `Technology timeline verification required for ${tech.toUpperCase()}.`,
            detail: `${tech.toUpperCase()} released in ${releaseYear}, but appears associated with timeline context ${claimedYear}.`
          });
        }
      }
    }

    // 3. Keyword-only check with no project descriptions
    if (parsed.skills.length > 10 && parsed.projects.length === 0 && parsed.employmentHistory.length === 0) {
      riskFlags.push({
        code: "NO_PROJECT_EVIDENCE",
        category: "Insufficient Evidence",
        severity: "HIGH",
        message: "No documented project or employment breakdown.",
        detail: "Profile lists technical keywords without corresponding project history."
      });
    }

    const hasCritical = riskFlags.some(f => f.severity === "HIGH");
    const riskScore = Math.min(100, riskFlags.reduce((acc, f) => acc + (f.severity === "HIGH" ? 35 : f.severity === "MEDIUM" ? 20 : 10), 0));

    return {
      hasCriticalInconsistencies: hasCritical,
      riskScore,
      riskFlags
    };
  }
}
