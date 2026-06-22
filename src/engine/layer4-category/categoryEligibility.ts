import { CanonicalCategory, InvestorPersona, RawAnswers, InvestmentGoal, HorizonBand } from '@/types/engine';
import { FullConstraintSet } from '@/engine/layer3-constraints/constraintEngine';
import { NormalisedFundUniverse } from '@/data/normalisedFundUniverse';

export interface EligibleCategorySlot {
  canonicalCategory: CanonicalCategory;
  allocationPercent: number;
  rationale: string;
  fallbackLevel: number;
}

/**
 * Goal-based category eligibility with maximum percentage caps.
 * Tier 1: Goal + Horizon are the primary determinants of what categories are allowed.
 */
interface GoalRule {
  baseAllocation: { category: CanonicalCategory; percent: number; rationale: string }[];
  caps: Partial<Record<CanonicalCategory, number>>;
}

const GOAL_RULES: Record<InvestmentGoal, GoalRule> = {
  Retirement: {
    baseAllocation: [
      { category: 'LARGE_CAP', percent: 30, rationale: 'Large-cap equity for stable long-term compounding.' },
      { category: 'FLEXI_CAP', percent: 20, rationale: 'Flexi cap for manager-driven diversification.' },
      { category: 'INDEX_EQUITY', percent: 15, rationale: 'Low-cost index exposure for core equity allocation.' },
      { category: 'HYBRID_BALANCED', percent: 15, rationale: 'Balanced advantage for automatic equity-debt adjustment.' },
      { category: 'ELSS', percent: 10, rationale: 'Tax-efficient growth component with 3-year horizon minimum.' },
      { category: 'MID_CAP', percent: 10, rationale: 'Moderate mid-cap exposure for additional growth.' },
    ],
    caps: {
      SMALL_CAP: 10,
      SECTORAL_BANKING: 10,
      SECTORAL_TECH: 10,
      SECTORAL_PHARMA: 10,
      SECTORAL_INFRA: 10,
      THEMATIC: 5,
    },
  },

  Preservation: {
    baseAllocation: [
      { category: 'DEBT_SHORT_TERM', percent: 30, rationale: 'Short-term debt for stable returns and low volatility.' },
      { category: 'DEBT_LIQUID', percent: 20, rationale: 'Liquid fund for capital preservation and accessibility.' },
      { category: 'HYBRID_CONSERVATIVE', percent: 20, rationale: 'Conservative hybrid for modest equity exposure.' },
      { category: 'INDEX_EQUITY', percent: 10, rationale: 'Limited index exposure for inflation-beating growth.' },
      { category: 'GOLD_FUND', percent: 10, rationale: 'Gold as an inflation hedge and portfolio diversifier.' },
      { category: 'DEBT_CORPORATE_BOND', percent: 10, rationale: 'Corporate bonds for yield enhancement.' },
    ],
    caps: {
      LARGE_CAP: 20,
      FLEXI_CAP: 15,
      MID_CAP: 5,
      SMALL_CAP: 0,
      SECTORAL_BANKING: 0,
      SECTORAL_TECH: 0,
      SECTORAL_PHARMA: 0,
      SECTORAL_INFRA: 0,
      THEMATIC: 0,
    },
  },

  'Wealth Creation': {
    baseAllocation: [
      { category: 'FLEXI_CAP', percent: 35, rationale: 'Flexi cap for tactical growth allocation and manager-driven diversification.' },
      { category: 'MID_CAP', percent: 25, rationale: 'Mid-cap for higher growth potential in aggressive portfolio.' },
      { category: 'SMALL_CAP', percent: 20, rationale: 'Small-cap for maximum growth potential and alpha generation.' },
      { category: 'THEMATIC', percent: 5, rationale: 'Thematic opportunities for tactical growth.' },
      { category: 'SECTORAL_TECH', percent: 5, rationale: 'Technology sector for innovation-driven growth.' },
      { category: 'ETF_EQUITY', percent: 5, rationale: 'Low-cost ETF exposure for efficient market tracking.' },
      { category: 'ELSS', percent: 5, rationale: 'Tax-efficient growth with Section 80C benefits.' },
    ],
    caps: {
      SMALL_CAP: 25,
      SECTORAL_BANKING: 10,
      SECTORAL_TECH: 10,
      SECTORAL_PHARMA: 10,
      SECTORAL_INFRA: 10,
      THEMATIC: 10,
      GOLD_FUND: 0,
      SILVER_FUND: 0,
    },
  },

  'Passive Income': {
    baseAllocation: [
      { category: 'DEBT_CORPORATE_BOND', percent: 25, rationale: 'Corporate bonds for regular income generation.' },
      { category: 'DEBT_SHORT_TERM', percent: 20, rationale: 'Short-term debt for stability and yield.' },
      { category: 'HYBRID_CONSERVATIVE', percent: 20, rationale: 'Conservative hybrid for diversified income.' },
      { category: 'DEBT_GILT', percent: 10, rationale: 'Gilt for sovereign-guaranteed income.' },
      { category: 'LARGE_CAP', percent: 10, rationale: 'Large-cap equity for modest growth and dividends.' },
      { category: 'HYBRID_BALANCED', percent: 10, rationale: 'Balanced advantage for equity-debt flexibility.' },
      { category: 'GOLD_FUND', percent: 5, rationale: 'Gold as an inflation-adjusted income diversifier.' },
    ],
    caps: {
      LARGE_CAP: 20,
      MID_CAP: 10,
      SMALL_CAP: 0,
      FLEXI_CAP: 10,
      SECTORAL_BANKING: 0,
      SECTORAL_TECH: 0,
      SECTORAL_PHARMA: 0,
      SECTORAL_INFRA: 0,
      THEMATIC: 0,
    },
  },

  'Tax Saving': {
    baseAllocation: [
      { category: 'ELSS', percent: 50, rationale: 'ELSS for Section 80C tax benefit with equity growth.' },
      { category: 'LARGE_CAP', percent: 20, rationale: 'Large-cap equity for stable portfolio base.' },
      { category: 'FLEXI_CAP', percent: 15, rationale: 'Flexi cap for diversified equity exposure.' },
      { category: 'INDEX_EQUITY', percent: 15, rationale: 'Low-cost index for broad market tracking.' },
    ],
    caps: {
      ELSS: 75,
      LARGE_CAP: 40,
      MID_CAP: 15,
      SMALL_CAP: 0,
      SECTORAL_BANKING: 0,
      SECTORAL_TECH: 0,
      SECTORAL_PHARMA: 0,
      SECTORAL_INFRA: 0,
      THEMATIC: 0,
    },
  },

  'Family Goals': {
    baseAllocation: [
      { category: 'LARGE_CAP', percent: 25, rationale: 'Large-cap equity for achieving family financial goals.' },
      { category: 'FLEXI_CAP', percent: 20, rationale: 'Flexi cap for diversified growth.' },
      { category: 'HYBRID_BALANCED', percent: 15, rationale: 'Balanced advantage for downside protection.' },
      { category: 'ELSS', percent: 15, rationale: 'Tax-efficient growth for goal funding.' },
      { category: 'INDEX_EQUITY', percent: 10, rationale: 'Low-cost core equity allocation.' },
      { category: 'DEBT_SHORT_TERM', percent: 10, rationale: 'Goal-timeline debt allocation for stability.' },
      { category: 'MID_CAP', percent: 5, rationale: 'Limited mid-cap exposure for additional growth.' },
    ],
    caps: {
      SMALL_CAP: 10,
      SECTORAL_BANKING: 10,
      SECTORAL_TECH: 10,
      SECTORAL_PHARMA: 10,
      SECTORAL_INFRA: 10,
      THEMATIC: 10,
    },
  },
};

function getBaseSlots(goal: InvestmentGoal): EligibleCategorySlot[] {
  const rule = GOAL_RULES[goal];
  if (!rule) return [];
  return rule.baseAllocation.map((s) => ({
    canonicalCategory: s.category,
    allocationPercent: s.percent,
    rationale: s.rationale,
    fallbackLevel: 0,
  }));
}

function applyCaps(slots: EligibleCategorySlot[], goal: InvestmentGoal): EligibleCategorySlot[] {
  const rule = GOAL_RULES[goal];
  if (!rule) return slots;
  return slots.map((slot) => {
    const cap = rule.caps[slot.canonicalCategory];
    if (cap !== undefined && slot.allocationPercent > cap) {
      return { ...slot, allocationPercent: cap, rationale: `${slot.rationale} (capped at ${cap}% per ${goal} goal rules)` };
    }
    return slot;
  });
}

function applyHorizonAdjustments(slots: EligibleCategorySlot[], horizon: HorizonBand): { slots: EligibleCategorySlot[]; adjustments: string[] } {
  const adjustments: string[] = [];
  let result = slots.map((s) => ({ ...s }));

  const equityCategories: CanonicalCategory[] = [
    'LARGE_CAP', 'LARGE_MID_CAP', 'FLEXI_CAP', 'MULTI_CAP',
    'MID_CAP', 'SMALL_CAP', 'ELSS',
    'INDEX_EQUITY', 'ETF_EQUITY',
    'SECTORAL_BANKING', 'SECTORAL_TECH', 'SECTORAL_PHARMA', 'SECTORAL_INFRA',
    'THEMATIC', 'INTERNATIONAL',
  ];

  const equitySum = () => result.filter((s) => equityCategories.includes(s.canonicalCategory)).reduce((sum, s) => sum + s.allocationPercent, 0);

  const debtCats: CanonicalCategory[] = [
    'DEBT_LIQUID', 'DEBT_OVERNIGHT', 'DEBT_SHORT_TERM', 'DEBT_MEDIUM_TERM',
    'DEBT_LONG_TERM', 'DEBT_GILT', 'DEBT_CORPORATE_BOND', 'DEBT_BANKING_PSU',
    'DEBT_FLOATING_RATE', 'DEBT_TARGET_MATURITY', 'DEBT_DYNAMIC_BOND',
    'DEBT_MONEY_MARKET', 'DEBT_CREDIT_RISK', 'DEBT_OTHERS',
  ];

  if (horizon === '< 1 Year') {
    const eq = equitySum();
    if (eq > 0) {
      const debtSum = result.filter((s) => debtCats.includes(s.canonicalCategory)).reduce((sum, s) => sum + s.allocationPercent, 0);
      let remaining = eq;
      for (const s of result) {
        if (equityCategories.includes(s.canonicalCategory)) {
          result = result.filter((x) => x !== s);
        }
      }
      if (!result.some((s) => s.canonicalCategory === 'DEBT_LIQUID')) {
        result.push({
          canonicalCategory: 'DEBT_LIQUID',
          allocationPercent: 0,
          rationale: 'Liquid fund for short-term capital preservation.',
          fallbackLevel: 0,
        });
      }
      const liq = result.find((s) => s.canonicalCategory === 'DEBT_LIQUID');
      if (liq) liq.allocationPercent += remaining;
      adjustments.push(`Horizon < 1 year: all equity reallocated to liquid/debt.`);
    }
  }

  if (horizon === '1–3 Years' || horizon === '< 1 Year') {
    const eq = equitySum();
    const maxEquity = horizon === '1–3 Years' ? 30 : 0;
    if (eq > maxEquity) {
      const excess = eq - maxEquity;
      for (const s of result) {
        if (equityCategories.includes(s.canonicalCategory)) {
          const reduction = (s.allocationPercent / eq) * excess;
          s.allocationPercent = Math.max(0, s.allocationPercent - reduction);
        }
      }
      const debtSlot = result.find((s) => s.canonicalCategory === 'DEBT_SHORT_TERM');
      if (debtSlot) {
        debtSlot.allocationPercent += excess;
      } else {
        result.push({
          canonicalCategory: 'DEBT_SHORT_TERM',
          allocationPercent: excess,
          rationale: 'Short-term debt for horizon-aligned stability.',
          fallbackLevel: 0,
        });
      }
      adjustments.push(`Horizon ${horizon}: equity capped at ${maxEquity}%.`);
    }
  }

  if (horizon === '1–3 Years') {
    result = result.filter((s) => s.canonicalCategory !== 'SMALL_CAP' && s.canonicalCategory !== 'ELSS');
    adjustments.push(`Horizon 1-3 years: Small Cap and ELSS excluded.`);
  }

  return { slots: result, adjustments };
}

/**
 * Select eligible category buckets using Goal + Horizon as Tier 1 hard constraints.
 * Caps are applied per goal rules.
 */
export function getEligibleCategories(
  persona: InvestorPersona,
  constraints: FullConstraintSet,
  universe: NormalisedFundUniverse,
  answers: RawAnswers,
): { slots: EligibleCategorySlot[]; adjustments: string[] } {
  let slots = getBaseSlots(answers.goal);

  // Apply goal-specific caps
  slots = applyCaps(slots, answers.goal);

  // Apply horizon adjustments
  const { slots: horizonAdjusted, adjustments } = applyHorizonAdjustments(slots, answers.horizon);
  slots = horizonAdjusted;

  // Apply mandatory exclusions (MC-01, MC-02, MC-03)
  for (const mc of constraints.mandatory) {
    if (mc.action.type === 'exclude_category') {
      const excluded = new Set(mc.action.categories);
      slots = slots.filter((s) => !excluded.has(s.canonicalCategory));
    }
  }

  // Apply force_minimum (MC-07: emergency fund floor)
  for (const mc of constraints.mandatory) {
    if (mc.action.type === 'force_minimum') {
      const existing = slots.find((s) => s.canonicalCategory === mc.action.category);
      if (existing) {
        existing.allocationPercent = Math.max(existing.allocationPercent, mc.action.minPercent);
      } else {
        slots.push({
          canonicalCategory: mc.action.category,
          allocationPercent: mc.action.minPercent,
          rationale: mc.rule,
          fallbackLevel: 0,
        });
      }
    }
  }

  return { slots, adjustments };
}
