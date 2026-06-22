import { SlotSelection } from './selector';

/**
 * Deduplicate fund selections across allocation slots.
 * If the same fund is selected in two slots, the lower-priority slot
 * falls back to the next-ranked fund.
 */
export function deduplicateSelections(
  selections: SlotSelection[],
): SlotSelection[] {
  const usedFundIds = new Set<string>();
  const result: SlotSelection[] = [];

  for (const selection of selections) {
    const deduped: typeof selection.selected = [];

    // Collect all distinct funds (preserving rank order) that aren't used yet
    for (const ranked of selection.selected) {
      if (deduped.length >= 2) break;
      if (!usedFundIds.has(ranked.fund.id)) {
        deduped.push(ranked);
        usedFundIds.add(ranked.fund.id);
      }
    }

    // If dedup reduced count below minimum, pull next-ranked funds
    if (deduped.length < 1 && selection.eligibleCount > 0) {
      // Search remaining eligible funds for any not used
      for (const ranked of selection.selected) {
        if (!usedFundIds.has(ranked.fund.id)) {
          deduped.push(ranked);
          usedFundIds.add(ranked.fund.id);
          break;
        }
      }
    }

    result.push({ ...selection, selected: deduped });
  }

  return result;
}
