import { RecommendedFund } from '@/types/engine';

/**
 * Generate a human-readable reason for why a specific fund was selected.
 * Phase 8.4 template: "[FUND] selected from [N] eligible [CATEGORY] funds."
 */
export function explainFundSelection(
  rec: RecommendedFund,
  slotEligibleCount: number,
): string {
  return `${rec.fundName} was selected from ${slotEligibleCount} eligible ${rec.canonicalCategory} funds with a score of ${rec.matchScore.toFixed(1)}.`;
}
