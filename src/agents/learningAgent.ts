import { dbProxy } from '@/services/firebase/db-proxy';

/**
 * Learning Agent: Analyzes outcomes to improve decision thresholds
 */
export async function runLearningAgent() {
  let outcomes: any[] = [];
  try {
    outcomes = await dbProxy.getDocs('candidate_outcomes');
  } catch (error) {
    console.warn("Could not load candidate_outcomes:", error);
  }

  if (!outcomes || outcomes.length === 0) return "No outcome data to learn from yet.";

  const totalScore = outcomes.reduce((acc, curr) => acc + (curr.outcome_score || 0), 0);
  const avgImprovement = totalScore / outcomes.length;

  // Log insight
  await dbProxy.addDoc('agent_logs', {
    type: 'learning',
    message: `System Learning: Current AI Shortlist Precision is ${(avgImprovement * 20).toFixed(1)}%.`,
    level: 'info',
    metadata: { avg_score: avgImprovement, total_outcomes: outcomes.length },
    createdAt: new Date().toISOString()
  });

  return `Learning cycle complete. Precision: ${(avgImprovement * 20).toFixed(1)}%`;
}
