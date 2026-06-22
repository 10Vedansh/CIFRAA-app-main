import { RawAnswers, CanonicalCategory } from '@/types/engine';

export interface AllocationSlot {
  category: CanonicalCategory;
  percent: number;
}

export interface AdjustmentResult {
  slots: AllocationSlot[];
  adjustmentsApplied: string[];
}

/**
 * Tier 2 allocation modifiers.
 * Market Reaction and Emergency Fund adjust percentages only.
 * They do not override Tier 1 (Goal + Horizon) category restrictions.
 */
export function applyDynamicAdjustments(
  slots: AllocationSlot[],
  answers: RawAnswers,
): AdjustmentResult {
  const result: AllocationSlot[] = slots.map((s) => ({ ...s }));
  const adjustments: string[] = [];

  const equityCategories: CanonicalCategory[] = [
    'LARGE_CAP', 'LARGE_MID_CAP', 'FLEXI_CAP', 'MULTI_CAP',
    'MID_CAP', 'SMALL_CAP', 'ELSS',
    'INDEX_EQUITY', 'ETF_EQUITY',
    'SECTORAL_BANKING', 'SECTORAL_TECH', 'SECTORAL_PHARMA', 'SECTORAL_INFRA',
    'THEMATIC', 'INTERNATIONAL',
  ];

  const equitySum = () =>
    result.filter((s) => equityCategories.includes(s.category)).reduce((sum, s) => sum + s.percent, 0);

  const debtCats: CanonicalCategory[] = [
    'DEBT_LIQUID', 'DEBT_OVERNIGHT', 'DEBT_SHORT_TERM', 'DEBT_MEDIUM_TERM',
    'DEBT_LONG_TERM', 'DEBT_GILT', 'DEBT_CORPORATE_BOND', 'DEBT_BANKING_PSU',
    'DEBT_FLOATING_RATE', 'DEBT_TARGET_MATURITY', 'DEBT_DYNAMIC_BOND',
    'DEBT_MONEY_MARKET', 'DEBT_CREDIT_RISK', 'DEBT_OTHERS',
  ];

  const subtractFromEquity = (amount: number) => {
    const eqSum = equitySum();
    if (eqSum <= 0) return;
    for (const s of result) {
      if (equityCategories.includes(s.category)) {
        const reduction = (s.percent / eqSum) * amount;
        s.percent = Math.max(0, s.percent - reduction);
      }
    }
  };

  const addToSlot = (cat: CanonicalCategory, amount: number) => {
    const existing = result.find((s) => s.category === cat);
    if (existing) {
      existing.percent += amount;
    } else {
      result.push({ category: cat, percent: amount });
    }
  };

  // ADJ-EF: No emergency fund → +15% to Liquid, subtract from equity
  if (!answers.hasEmergencyFund) {
    const liquidSlot = result.find((s) => s.category === 'DEBT_LIQUID');
    const liquidPercent = liquidSlot ? liquidSlot.percent : 0;
    const addAmount = Math.min(15, 40 - liquidPercent);
    if (addAmount > 0) {
      addToSlot('DEBT_LIQUID', addAmount);
      subtractFromEquity(addAmount);
      adjustments.push('No emergency fund — increased liquid allocation by 15%.');
    }
  }

  // ADJ-MR: Buy the Dip behaviour → +5% to equity categories (shift from debt)
  if (answers.marketBehaviour === 'Buy the Dip') {
    const eqSum = equitySum();
    const debtSum = result.filter((s) => debtCats.includes(s.category)).reduce((sum, s) => sum + s.percent, 0);
    if (debtSum > 5) {
      const shift = Math.min(5, debtSum);
      subtractFromEquity(-shift); // add to equity
      for (const s of result) {
        if (debtCats.includes(s.category)) {
          const reduction = (s.percent / debtSum) * shift;
          s.percent = Math.max(0, s.percent - reduction);
        }
      }
      adjustments.push('Buy the Dip — shifted 5% from debt to equity categories.');
    }
  }

  const cleaned = result.filter((s) => s.percent > 0);

  return { slots: cleaned, adjustments };
}
