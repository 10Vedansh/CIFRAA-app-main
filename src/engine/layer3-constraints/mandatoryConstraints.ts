import { RawAnswers, Constraint, CanonicalCategory } from '@/types/engine';

export interface MandatoryConstraint extends Constraint {
  tier: 'mandatory';
  action:
    | { type: 'exclude_category'; categories: CanonicalCategory[] }
    | { type: 'exclude_if_category'; category: CanonicalCategory; condition: string }
    | { type: 'force_minimum'; category: CanonicalCategory; minPercent: number };
}

function horizonMonths(horizon: RawAnswers['horizon']): number {
  switch (horizon) {
    case '< 1 Year': return 6;
    case '1–3 Years': return 24;
    case '3–5 Years': return 48;
    case '5–10 Years': return 84;
    case '10 Years+': return 180;
  }
}

/**
 * Generate mandatory constraints from raw answers.
 * These are hard exclusions — never relaxed.
 */
export function getMandatoryConstraints(answers: RawAnswers): MandatoryConstraint[] {
  const constraints: MandatoryConstraint[] = [];
  const months = horizonMonths(answers.horizon);

  // MC-01: Exclude ELSS if horizon < 36 months
  if (months < 36) {
    constraints.push({
      id: 'MC-01',
      tier: 'mandatory',
      rule: 'ELSS excluded because investment horizon (<36 months) is shorter than the 3-year ELSS lock-in period.',
      action: { type: 'exclude_category', categories: ['ELSS'] },
    });
  }

  // MC-02: Exclude Sectoral/Thematic if experience = First-Time
  if (answers.experience === 'First-Time') {
    constraints.push({
      id: 'MC-02',
      tier: 'mandatory',
      rule: 'Sectoral and Thematic funds excluded because first-time investors should start with diversified funds.',
      action: {
        type: 'exclude_category',
        categories: ['SECTORAL_BANKING', 'SECTORAL_TECH', 'SECTORAL_PHARMA', 'SECTORAL_INFRA', 'THEMATIC'],
      },
    });
  }

  // MC-03: Exclude Small Cap if experience = First-Time AND riskScore (slider) < 5 (out of 10, scaled to 50)
  if (answers.experience === 'First-Time' && answers.riskSlider < 5) {
    constraints.push({
      id: 'MC-03',
      tier: 'mandatory',
      rule: 'Small Cap funds excluded because first-time investors with low risk tolerance should avoid high-volatility categories.',
      action: { type: 'exclude_category', categories: ['SMALL_CAP'] },
    });
  }

  // MC-05: Exclude funds with AUM < 50 Cr (handled during fund ranking, flagged here)
  constraints.push({
    id: 'MC-05',
    tier: 'mandatory',
    rule: 'Funds with AUM below 50 Cr are excluded due to liquidity risk.',
    action: { type: 'exclude_if_category', category: 'UNKNOWN' as CanonicalCategory, condition: 'aum < 50' },
  });

  // MC-06: Exclude funds with age < 1 year (handled during ranking, flagged here)
  constraints.push({
    id: 'MC-06',
    tier: 'mandatory',
    rule: 'Funds launched less than 1 year ago are excluded (insufficient track record).',
    action: { type: 'exclude_if_category', category: 'UNKNOWN' as CanonicalCategory, condition: 'age < 1 year' },
  });

  // MC-08: Exclude all debt categories for Wealth Creation (aggressive growth portfolio)
  if (answers.goal === 'Wealth Creation') {
    constraints.push({
      id: 'MC-08',
      tier: 'mandatory',
      rule: 'Debt, liquid, and conservative categories excluded for aggressive Wealth Creation portfolio.',
      action: {
        type: 'exclude_category',
        categories: [
          'DEBT_LIQUID', 'DEBT_OVERNIGHT', 'DEBT_SHORT_TERM', 'DEBT_MEDIUM_TERM',
          'DEBT_LONG_TERM', 'DEBT_GILT', 'DEBT_CORPORATE_BOND', 'DEBT_BANKING_PSU',
          'DEBT_FLOATING_RATE', 'DEBT_TARGET_MATURITY', 'DEBT_DYNAMIC_BOND',
          'DEBT_MONEY_MARKET', 'DEBT_CREDIT_RISK', 'DEBT_OTHERS',
          'ETF_DEBT', 'INDEX_DEBT',
          'HYBRID_CONSERVATIVE', 'HYBRID_BALANCED', 'HYBRID_AGGRESSIVE',
        ],
      },
    });
  }

  // MC-07: Minimum 20% Debt/Liquid if emergency fund absent
  if (!answers.hasEmergencyFund) {
    constraints.push({
      id: 'MC-07',
      tier: 'mandatory',
      rule: 'Minimum 20% allocation to debt/liquid categories required because no emergency fund is in place.',
      action: {
        type: 'force_minimum',
        category: 'DEBT_LIQUID',
        minPercent: 20,
      },
    });
  }

  return constraints;
}
