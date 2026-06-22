import { AllocationSlot } from '@/types/engine';
import { NormalisedFund } from '@/data/normalisedFundUniverse';
import { RankedFund } from '@/engine/layer6-ranking/rankingEngine';

export interface SlotSelection {
  slot: AllocationSlot;
  selected: RankedFund[];
  eligibleCount: number;
}

/**
 * Select the top N ranked funds for each allocation slot.
 * Returns the raw selection before deduplication.
 */
export function selectTopPerSlot(
  slots: AllocationSlot[],
  rankedByCategory: Map<string, RankedFund[]>,
  topN = 2,
): SlotSelection[] {
  console.log("SELECT TOP PER SLOT — slots:", slots.length, "ranked categories:", rankedByCategory.size);
  return slots.map((slot) => {
    const ranked = rankedByCategory.get(slot.canonicalCategory) ?? [];
    const eligibleCount = ranked.length;
    const selected = ranked.slice(0, Math.min(topN, ranked.length));
    console.log(`  ${slot.canonicalCategory}: haveRanked=${ranked.length}, eligibleCount=${eligibleCount}, selected=${selected.length}`);
    return { slot, selected, eligibleCount };
  });
}
