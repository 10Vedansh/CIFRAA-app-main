import { RawAnswers, Constraint } from '@/types/engine';

export interface SoftPreference extends Constraint {
  tier: 'soft';
  action: {
    type: 'score_bonus';
    field: string;
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    value: number;
    bonus: number;
    description: string;
  };
}

/**
 * Generate soft preferences — never filter funds out, only add score bonus
 * during ranking.
 */
export function getSoftPreferences(answers: RawAnswers): SoftPreference[] {
  const preferences: SoftPreference[] = [];

  // Expense Ratio < 0.5% (index/passive) → +15 points
  preferences.push({
    id: 'SP-01',
    tier: 'soft',
    rule: 'Expense ratio below 0.5% indicates low-cost passsive fund.',
    action: {
      type: 'score_bonus',
      field: 'expenseRatio',
      operator: 'lt',
      value: 0.5,
      bonus: 15,
      description: 'Low expense ratio bonus',
    },
  });

  // Positive Alpha vs benchmark → +10 points
  preferences.push({
    id: 'SP-02',
    tier: 'soft',
    rule: 'Positive Alpha indicates fund manager adds value over benchmark.',
    action: {
      type: 'score_bonus',
      field: 'alpha',
      operator: 'gt',
      value: 0,
      bonus: 10,
      description: 'Positive alpha bonus',
    },
  });

  // Beta < 1.0 → +8 points (for conservative investors) — checked at ranking time
  preferences.push({
    id: 'SP-03',
    tier: 'soft',
    rule: 'Beta below 1.0 indicates lower market sensitivity.',
    action: {
      type: 'score_bonus',
      field: 'beta',
      operator: 'lt',
      value: 1.0,
      bonus: 8,
      description: 'Low beta stability bonus',
    },
  });

  // Sharpe Ratio > 1.0 → +12 points
  preferences.push({
    id: 'SP-04',
    tier: 'soft',
    rule: 'Sharpe ratio above 1.0 indicates superior risk-adjusted returns.',
    action: {
      type: 'score_bonus',
      field: 'sharpeRatio',
      operator: 'gt',
      value: 1.0,
      bonus: 12,
      description: 'Strong risk-adjusted return bonus',
    },
  });

  // 5Y CAGR available → +5 points
  preferences.push({
    id: 'SP-05',
    tier: 'soft',
    rule: '5-year CAGR available — longer track record is more reliable.',
    action: {
      type: 'score_bonus',
      field: 'cagr5Y',
      operator: 'gt',
      value: 0,
      bonus: 5,
      description: 'Long track record bonus',
    },
  });

  // AUM > 5000 Cr → +5 points
  preferences.push({
    id: 'SP-06',
    tier: 'soft',
    rule: 'AUM above 5000 Cr is an institutional trust signal.',
    action: {
      type: 'score_bonus',
      field: 'aum',
      operator: 'gt',
      value: 5000,
      bonus: 5,
      description: 'Large AUM trust bonus',
    },
  });

  return preferences;
}
