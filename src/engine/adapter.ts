import { RawAnswers } from '@/types/engine';
import { QuestionnaireAnswers } from '@/utils/newRecommendationEngine';

/**
 * Bridge between the old QuestionnaireAnswers format (used by PreferencesModal / useAuth)
 * and the new RawAnswers format used by the v2 engine.
 *
 * The new engine requires:
 *   - riskSlider: number (1-10) — defaults to 5 if missing
 *   - hasEmergencyFund: boolean — derived from emergency_fund string
 */

const EMERGENCY_NO: readonly string[] = ['None', 'Less than 3 months', '< 3 Months'];

export function toRawAnswers(
  old: QuestionnaireAnswers,
  riskSlider?: number,
): RawAnswers {
  const horizon = old.investmentHorizon as RawAnswers['horizon'];
  const goal = old.primaryGoal as RawAnswers['goal'];
  const marketBehaviour = old.marketReaction as RawAnswers['marketBehaviour'];
  const experience = old.experience as RawAnswers['experience'];
  const existingInvestments = old.existingInvestments as RawAnswers['existingInvestments'];

  return {
    goal: goal || 'Wealth Creation',
    horizon: horizon || '5–10 Years',
    riskSlider: riskSlider ?? 5,
    marketBehaviour: marketBehaviour || 'Wait & Watch',
    experience: experience || 'First-Time',
    existingInvestments: existingInvestments || 'None',
    hasEmergencyFund: !EMERGENCY_NO.includes(old.emergencyFund),
  };
}
