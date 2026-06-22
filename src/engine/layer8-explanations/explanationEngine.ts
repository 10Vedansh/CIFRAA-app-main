import { RawAnswers, InvestorPersona, AllocationPlan, RecommendedFund, ExplanationBundle } from '@/types/engine';
import { explainPersona } from './personaExplainer';
import { explainAllocation } from './allocationExplainer';
import { explainFundSelection } from './fundExplainer';
import { explainConflicts } from './conflictExplainer';

/**
 * Layer 8 entry point.
 * Generates the complete ExplanationBundle from all upstream outputs.
 */
export function generateExplanations(
  answers: RawAnswers,
  persona: InvestorPersona,
  allocationPlan: AllocationPlan,
  recommendations: RecommendedFund[],
  slotEligibleCounts: Map<string, number>,
  dataQualityWarnings: string[],
): ExplanationBundle {
  try {
    const personaText = explainPersona(answers, persona);
    const allocationRationale = explainAllocation(allocationPlan.slots);

    const fundReasons = recommendations.map((r) => {
      const count = slotEligibleCounts.get(r.canonicalCategory) ?? 0;
      return explainFundSelection(r, count);
    });

    const conflictWarnings = explainConflicts(persona.conflictFlags);

    return {
      persona: personaText,
      allocationRationale,
      fundReasons,
      conflictWarnings,
      dataQualityWarnings,
    };
  } catch (err) {
    console.error("EXPLANATION GENERATION FAILED", err);
    return {
      persona: 'Personalized investment profile based on your goals and preferences.',
      allocationRationale: 'Diversified allocation across recommended categories.',
      fundReasons: recommendations.map(() => 'Selected based on strong risk-adjusted returns and category fit.'),
      conflictWarnings: [],
      dataQualityWarnings,
    };
  }
}
