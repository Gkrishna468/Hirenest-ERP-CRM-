export interface OpportunityScore {
  score: number; // 0 - 100
  breakdown: {
    factor: string;
    points: number;
    description: string;
  }[];
}

export class OpportunityScoringEngine {
  calculateScore(entityType: string, entity: any, signals: string[]): OpportunityScore {
    let score = 50; // base score
    const breakdown: { factor: string; points: number; description: string; }[] = [];

    if (entityType === "client") {
      const historicalPlacements = entity.historicalPlacements || entity.placementsCount || 2;
      const placementPoints = Math.min(historicalPlacements * 10, 30);
      score += placementPoints;
      breakdown.push({ factor: "Historical Placements", points: placementPoints, description: `${historicalPlacements} successful placements on record` });

      const budgetTier = entity.budget === "High" ? 20 : 10;
      score += budgetTier;
      breakdown.push({ factor: "Client Tier / Budget", points: budgetTier, description: `${entity.budget || 'Standard'} tier account` });

      if (signals.includes("CLIENT_DORMANT")) {
        score += 15;
        breakdown.push({ factor: "Reactivation Potential", points: 15, description: "High-value dormant account with past activity" });
      }
    } else if (entityType === "requirement") {
      score += 25;
      breakdown.push({ factor: "Requirement Urgency", points: 25, description: "Open hiring requirement requiring candidate supply" });

      if (signals.includes("REQUIREMENT_NO_SUBMISSION")) {
        score += 20;
        breakdown.push({ factor: "Pipeline Gap", points: 20, description: "Zero submissions currently blocking revenue conversion" });
      }
    } else {
      score += 15;
      breakdown.push({ factor: "Pipeline Stage", points: 15, description: "Active candidate stage requiring progression" });
    }

    const finalScore = Math.min(Math.max(score, 10), 100);
    return { score: finalScore, breakdown };
  }
}

export const opportunityScoringEngine = new OpportunityScoringEngine();
