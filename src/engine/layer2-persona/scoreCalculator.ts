import { RawAnswers } from '@/types/engine';

/**
 * Compute a 0-100 risk score from raw questionnaire answers.
 * Weighted formula per Phase 2:
 *   Q3 Risk slider (40%) + Q2 Horizon (20%) + Q4 Market Behaviour (20%)
 *   + Q5 Experience (10%) + Q6 Existing Investments (10%)
 */
export function computeRiskScore(answers: RawAnswers): number {
  // Q3: Risk slider (1-10) scaled to 0-40
  const riskScore = Math.round((answers.riskSlider / 10) * 40);

  // Q2: Horizon (0-20)
  const horizonScores: Record<RawAnswers['horizon'], number> = {
    '< 1 Year': 2,
    '1–3 Years': 6,
    '3–5 Years': 10,
    '5–10 Years': 16,
    '10 Years+': 20,
  };
  const horizonScore = horizonScores[answers.horizon];

  // Q4: Market Behaviour (0-20)
  const behaviourScores: Record<RawAnswers['marketBehaviour'], number> = {
    'Withdraw': 0,
    'Wait & Watch': 6,
    'SIP through it': 12,
    'Buy the Dip': 20,
  };
  const behaviourScore = behaviourScores[answers.marketBehaviour];

  // Q5: Experience (0-10)
  const experienceScores: Record<RawAnswers['experience'], number> = {
    'First-Time': 2,
    'Some Experience': 5,
    'Experienced': 10,
  };
  const experienceScore = experienceScores[answers.experience];

  // Q6: Existing Investments (0-10)
  const investmentScores: Record<RawAnswers['existingInvestments'], number> = {
    'None': 0,
    'Under ₹5L': 3,
    '₹5L – ₹25L': 6,
    '₹25L+': 10,
  };
  const investmentScore = investmentScores[answers.existingInvestments];

  const total = riskScore + horizonScore + behaviourScore + experienceScore + investmentScore;
  return Math.min(Math.max(total, 0), 100);
}
