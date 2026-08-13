export interface MatchCriteriaWeights {
  skillsWeight: number;       // 35%
  experienceWeight: number;   // 20%
  titleWeight: number;        // 10%
  domainWeight: number;       // 10%
  noticeWeight: number;       // 10%
  compensationWeight: number; // 10%
  locationWeight: number;     // 5%
}

export const DEFAULT_MATCH_WEIGHTS: MatchCriteriaWeights = {
  skillsWeight: 35,
  experienceWeight: 20,
  titleWeight: 10,
  domainWeight: 10,
  noticeWeight: 10,
  compensationWeight: 10,
  locationWeight: 5,
};

export interface MatchScoreBreakdown {
  overallScore: number;
  subscores: {
    skills: number;        // max 35
    experience: number;    // max 20
    title: number;         // max 10
    domain: number;        // max 10
    notice: number;        // max 10
    compensation: number;  // max 10
    location: number;      // max 5
  };
  matchedSkills: string[];
  missingMustHaveSkills: string[];
  niceToHaveSkills: string[];
  risks: string[];
  recommendation: "Strong Match" | "Moderate Match" | "Low Match" | "Mismatch";
  explanation: string;
}

export interface CandidateForMatching {
  id?: string;
  name?: string;
  skills?: string[];
  experience?: string | number;
  yearsExperience?: string | number;
  currentTitle?: string;
  domain?: string;
  noticePeriod?: string;
  expectedSalary?: string;
  expectedCTC?: string;
  location?: string;
}

export interface RequirementForMatching {
  id?: string;
  title?: string;
  skills?: string[];
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  experience?: string | number;
  minExperience?: number;
  maxExperience?: number;
  domain?: string;
  budget?: string;
  maxBudget?: number;
  location?: string;
  workMode?: string;
}

/**
  * Pure, explainable AI Matching Engine implementing exact weighted criteria
  */
export function calculateMatchScore(
  candidate: CandidateForMatching,
  requirement: RequirementForMatching,
  weights: MatchCriteriaWeights = DEFAULT_MATCH_WEIGHTS
): MatchScoreBreakdown {
  const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim());
  const reqSkills = (requirement.skills || requirement.mustHaveSkills || []).map((s) => s.toLowerCase().trim());
  const niceSkills = (requirement.niceToHaveSkills || []).map((s) => s.toLowerCase().trim());

  // 1. SKILLS EVALUATION (Weight: 35%)
  const matchedSkills: string[] = [];
  const missingMustHaveSkills: string[] = [];
  const niceToHaveSkills: string[] = [];

  reqSkills.forEach((s) => {
    if (candidateSkills.some((cs) => cs.includes(s) || s.includes(cs))) {
      matchedSkills.push(s);
    } else {
      missingMustHaveSkills.push(s);
    }
  });

  niceSkills.forEach((s) => {
    if (candidateSkills.some((cs) => cs.includes(s) || s.includes(cs))) {
      niceToHaveSkills.push(s);
    }
  });

  const skillMatchRatio = reqSkills.length > 0 ? matchedSkills.length / reqSkills.length : 0.8;
  const skillsScore = Math.round(skillMatchRatio * weights.skillsWeight);

  // 2. EXPERIENCE EVALUATION (Weight: 20%)
  const candExpNum = parseFloat(String(candidate.experience || candidate.yearsExperience || "0")) || 0;
  const reqExpNum = parseFloat(String(requirement.experience || requirement.minExperience || "0")) || 0;

  let experienceScore = weights.experienceWeight;
  if (reqExpNum > 0) {
    if (candExpNum >= reqExpNum) {
      experienceScore = weights.experienceWeight;
    } else if (candExpNum >= reqExpNum - 1) {
      experienceScore = Math.round(weights.experienceWeight * 0.75);
    } else {
      experienceScore = Math.round((candExpNum / reqExpNum) * weights.experienceWeight);
    }
  }

  // 3. TITLE ALIGNMENT (Weight: 10%)
  const candTitle = (candidate.currentTitle || "").toLowerCase();
  const reqTitle = (requirement.title || "").toLowerCase();
  let titleScore = Math.round(weights.titleWeight * 0.5);

  if (candTitle && reqTitle) {
    if (candTitle === reqTitle || candTitle.includes(reqTitle) || reqTitle.includes(candTitle)) {
      titleScore = weights.titleWeight;
    } else {
      const titleWords = reqTitle.split(" ").filter((w) => w.length > 3);
      const matches = titleWords.filter((w) => candTitle.includes(w));
      if (matches.length > 0) {
        titleScore = Math.round(weights.titleWeight * 0.8);
      }
    }
  }

  // 4. DOMAIN MATCH (Weight: 10%)
  const candDomain = (candidate.domain || "IT / Software").toLowerCase();
  const reqDomain = (requirement.domain || "IT / Software").toLowerCase();
  let domainScore = Math.round(weights.domainWeight * 0.6);

  if (candDomain && reqDomain && (candDomain.includes(reqDomain) || reqDomain.includes(candDomain))) {
    domainScore = weights.domainWeight;
  }

  // 5. NOTICE PERIOD MATCH (Weight: 10%)
  const notice = (candidate.noticePeriod || "30").toLowerCase();
  let noticeScore = weights.noticeWeight;
  if (notice.includes("immediate") || notice.includes("0") || notice.includes("15")) {
    noticeScore = weights.noticeWeight;
  } else if (notice.includes("30")) {
    noticeScore = Math.round(weights.noticeWeight * 0.8);
  } else if (notice.includes("60")) {
    noticeScore = Math.round(weights.noticeWeight * 0.5);
  } else if (notice.includes("90")) {
    noticeScore = Math.round(weights.noticeWeight * 0.2);
  }

  // 6. COMPENSATION MATCH (Weight: 10%)
  let compensationScore = weights.compensationWeight;
  const risks: string[] = [];
  if (candidate.expectedSalary || candidate.expectedCTC) {
    // If expected salary exceeds budget noticeably, log risk and deduct score
    const ctcStr = (candidate.expectedSalary || candidate.expectedCTC || "").toLowerCase();
    if (ctcStr.includes("high") || ctcStr.includes(">")) {
      compensationScore = Math.round(weights.compensationWeight * 0.5);
      risks.push("Expected CTC may exceed requirement target budget");
    }
  }

  // 7. LOCATION / WORK MODE MATCH (Weight: 5%)
  const candLoc = (candidate.location || "").toLowerCase();
  const reqLoc = (requirement.location || "").toLowerCase();
  let locationScore = weights.locationWeight;
  if (reqLoc && candLoc && !candLoc.includes(reqLoc) && !reqLoc.includes("remote")) {
    locationScore = Math.round(weights.locationWeight * 0.5);
    risks.push("Candidate location differs from requirement primary location");
  }

  if (missingMustHaveSkills.length > 0) {
    risks.push(`Missing key mandatory skills: ${missingMustHaveSkills.join(", ")}`);
  }

  const overallScore = Math.min(
    100,
    skillsScore + experienceScore + titleScore + domainScore + noticeScore + compensationScore + locationScore
  );

  let recommendation: "Strong Match" | "Moderate Match" | "Low Match" | "Mismatch" = "Moderate Match";
  if (overallScore >= 85) recommendation = "Strong Match";
  else if (overallScore >= 70) recommendation = "Moderate Match";
  else if (overallScore >= 50) recommendation = "Low Match";
  else recommendation = "Mismatch";

  const explanation = `${candidate.name || "Candidate"} scores ${overallScore}% match for "${
    requirement.title || "Requirement"
  }". Key skill overlap: ${
    matchedSkills.length > 0 ? matchedSkills.join(", ") : "General profile alignment"
  }. ${risks.length > 0 ? "Risks flagged: " + risks.join("; ") + "." : "No critical risks identified."}`;

  return {
    overallScore,
    subscores: {
      skills: skillsScore,
      experience: experienceScore,
      title: titleScore,
      domain: domainScore,
      notice: noticeScore,
      compensation: compensationScore,
      location: locationScore,
    },
    matchedSkills,
    missingMustHaveSkills,
    niceToHaveSkills,
    risks,
    recommendation,
    explanation,
  };
}
