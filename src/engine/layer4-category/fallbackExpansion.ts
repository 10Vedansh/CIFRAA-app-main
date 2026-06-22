import { CanonicalCategory } from '@/types/engine';
import { NormalisedFundUniverse } from '@/data/normalisedFundUniverse';
import { EligibleCategorySlot } from './categoryEligibility';

/**
 * Three-stage fallback cascade to prevent empty portfolios.
 *
 * F1: Relax Tier-2 constraints (if category has 0 funds)
 * F2: Expand category to a broader parent category
 * F3: Use category-agnostic top-ranked funds
 */

// Broader parent for each canonical category (F2 expansion map)
const CATEGORY_EXPANSION: Partial<Record<CanonicalCategory, CanonicalCategory[]>> = {
  SMALL_CAP: ['MID_CAP', 'SMALL_CAP'],
  MID_CAP: ['LARGE_MID_CAP', 'MID_CAP'],
  SECTORAL_BANKING: ['THEMATIC', 'SECTORAL_BANKING'],
  SECTORAL_TECH: ['THEMATIC', 'SECTORAL_TECH'],
  SECTORAL_PHARMA: ['THEMATIC', 'SECTORAL_PHARMA'],
  SECTORAL_INFRA: ['THEMATIC', 'SECTORAL_INFRA'],
  THEMATIC: ['FLEXI_CAP', 'THEMATIC'],
  ELSS: ['LARGE_CAP', 'ELSS'],
  GOLD_FUND: ['GOLD_FUND', 'HYBRID_BALANCED'],
  SILVER_FUND: ['GOLD_FUND', 'SILVER_FUND'],
  INTERNATIONAL: ['FLEXI_CAP', 'LARGE_CAP'],
  DEBT_LONG_TERM: ['DEBT_MEDIUM_TERM', 'DEBT_LONG_TERM'],
  DEBT_CREDIT_RISK: ['DEBT_CORPORATE_BOND', 'DEBT_CREDIT_RISK'],
  DEBT_GILT: ['DEBT_SHORT_TERM', 'DEBT_GILT'],
  DEBT_MONEY_MARKET: ['DEBT_LIQUID', 'DEBT_MONEY_MARKET'],
  DEBT_OTHERS: ['DEBT_SHORT_TERM'],
};

/**
 * Apply the fallback cascade to ensure every slot has at least `minFunds`
 * available funds in the universe.
 */
export function applyFallback(
  slots: EligibleCategorySlot[],
  universe: NormalisedFundUniverse,
  minFunds = 3,
): {
  slots: EligibleCategorySlot[];
  warnings: string[];
} {
  const warnings: string[] = [];

  const result = slots.map((slot) => {
    let current = { ...slot };

    // Check fund count
    const count = universe.getByCategory(current.canonicalCategory).length;

    if (count >= minFunds) return current;

    // F1: already at fallbackLevel 0 (primary) — note the shortfall
    if (current.fallbackLevel === 0 && count > 0) {
      warnings.push(`Only ${count} funds available in ${current.canonicalCategory}.`);
      return current;
    }

    // F2: Expand to broader parent category
    if (current.fallbackLevel === 0 || current.fallbackLevel === 1) {
      const expansion = CATEGORY_EXPANSION[current.canonicalCategory];
      if (expansion) {
        for (const expandedCat of expansion) {
          const expandedCount = universe.getByCategory(expandedCat).length;
          if (expandedCount >= minFunds) {
            current = {
              ...current,
              canonicalCategory: expandedCat,
              fallbackLevel: 2,
              rationale: `${current.rationale} (category expanded to ${expandedCat} due to insufficient funds in original category)`,
            };
            warnings.push(`F2 fallback: ${slot.canonicalCategory} expanded to ${expandedCat}.`);
            break;
          }
        }
      }
    }

    // Check if F2 resolved it
    if (universe.getByCategory(current.canonicalCategory).length >= minFunds) return current;

    // F3: Use a broad default category
    current = {
      ...current,
      canonicalCategory: 'LARGE_CAP',
      fallbackLevel: 3,
      rationale: `${current.rationale} (default LARGE_CAP used — insufficient funds in all expanded categories)`,
    };
    warnings.push(`F3 fallback: ${slot.canonicalCategory} defaulted to LARGE_CAP.`);
    return current;
  });

  return { slots: result, warnings };
}
