import { AIProvider, ParseResumeResult, CandidateSummaryResult, RequirementMatchResult, EmailDraftResult } from "../types";

export class HeuristicProvider implements AIProvider {
  name = "Heuristic";

  isAvailable(): boolean {
    return true; // Always available fallback
  }

  async parseResume(text: string): Promise<ParseResumeResult> {
    const skills = [];
    const lowerText = text.toLowerCase();
    
    const knownSkills = ['react', 'node.js', 'typescript', 'python', 'java', 'aws', 'docker', 'kubernetes', 'sql', 'nosql', 'firebase', 'gcp', 'azure', 'express', 'nestjs', 'spring', 'go', 'rust', 'angular', 'vue'];
    
    for (const skill of knownSkills) {
      if (lowerText.includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    }
    
    let experience = "0 Years";
    const expMatch = lowerText.match(/(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/);
    if (expMatch && expMatch[1]) {
      experience = `${expMatch[1]} Years`;
    } else {
      if (lowerText.includes('senior')) experience = "5 Years";
      else if (lowerText.includes('mid')) experience = "3 Years";
      else experience = "1 Year";
    }

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);

    return {
      name: "Unknown Candidate", // Hard to extract heuristically reliably
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      currentTitle: "Software Engineer",
      skills: skills.length > 0 ? skills : ["General Software Engineering"],
      experience,
      currentCompany: "",
      noticePeriod: "Negotiable",
      expectedSalary: "Negotiable",
      location: ""
    };
  }

  async summarizeCandidate(data: any): Promise<CandidateSummaryResult> {
    const years = data.experience || "0";
    const skills = (data.skills || []).slice(0, 3).join(', ');
    
    return {
      summary: `Candidate with ${years} years of experience. Key skills include ${skills || 'general technologies'}.`,
      strengths: (data.skills || []).slice(0, 5),
      recommendation: "Recommend",
      reason: "Heuristic evaluation based on provided skills."
    };
  }

  async matchRequirement(candidate: any, requirement: any): Promise<RequirementMatchResult> {
    throw new Error("Method not implemented.");
  }

  async draftEmail(prompt: string, context: any): Promise<EmailDraftResult> {
    throw new Error("Method not implemented.");
  }
}
