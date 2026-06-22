import { RawAnswers, Constraint } from '@/types/engine';

export interface PreferredConstraint extends Constraint {
  tier: 'preferred';
  action: {
    type: 'prefer_property';
    field: string;
    operator: 'gt' | 'lt' | 'gte' | 'lte';
    value: number;
    relaxTo?: { operator: 'gt' | 'lt' | 'gte' | 'lte'; value: number };
  };
  categoryScope: 'equity' | 'debt' | 'all';
}

/**
 * Generate preferred constraints from raw answers.
 * Applied unless < 3 funds match; if so, relaxed and a warning is appended.
 */
export function getPreferredConstraints(answers: RawAnswers): PreferredConstraint[] {
  const constraints: PreferredConstraint[] = [];

  // PC-01: Prefer AUM > 500 Cr for Debt funds (relax to > 100 Cr)
  constraints.push({
    id: 'PC-01',
    tier: 'preferred',
    rule: 'Prefer Debt funds with AUM above 500 Cr for better liquidity.',
    action: {
      type: 'prefer_property',
      field: 'aum',
      operator: 'gt',
      value: 500,
      relaxTo: { operator: 'gt', value: 100 },
    },
    categoryScope: 'debt',
  });

  // PC-02: Prefer AUM > 1000 Cr for Equity funds (relax to > 200 Cr)
  constraints.push({
    id: 'PC-02',
    tier: 'preferred',
    rule: 'Prefer Equity funds with AUM above 1000 Cr for institutional trust.',
    action: {
      type: 'prefer_property',
      field: 'aum',
      operator: 'gt',
      value: 1000,
      relaxTo: { operator: 'gt', value: 200 },
    },
    categoryScope: 'equity',
  });

  // PC-03: Prefer Expense Ratio < 1.0% for active funds (relax to < 2.0%)
  constraints.push({
    id: 'PC-03',
    tier: 'preferred',
    rule: 'Prefer active funds with expense ratio below 1.0% to minimise costs.',
    action: {
      type: 'prefer_property',
      field: 'expenseRatio',
      operator: 'lt',
      value: 1.0,
      relaxTo: { operator: 'lt', value: 2.0 },
    },
    categoryScope: 'all',
  });

  // PC-04: Prefer fund age > 3 years (relax to > 1 year)
  constraints.push({
    id: 'PC-04',
    tier: 'preferred',
    rule: 'Prefer funds with a track record longer than 3 years.',
    action: {
      type: 'prefer_property',
      field: 'fundAge',
      operator: 'gt',
      value: 3,
      relaxTo: { operator: 'gt', value: 1 },
    },
    categoryScope: 'all',
  });

  // PC-05: Prefer 3Y CAGR available (non-null)
  constraints.push({
    id: 'PC-05',
    tier: 'preferred',
    rule: 'Prefer funds with 3-year CAGR available for better track record assessment.',
    action: {
      type: 'prefer_property',
      field: 'cagr3Y',
      operator: 'gt',
      value: 0,
      relaxTo: { operator: 'gt', value: -999 }, // effectively always relaxes
    },
    categoryScope: 'all',
  });

  return constraints;
}
