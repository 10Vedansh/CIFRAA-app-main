import { AllocationPlan, RecommendedFund } from '@/types/engine';
import { NormalisedFundUniverse } from '@/data/normalisedFundUniverse';
import { rankCategory } from '@/engine/layer6-ranking/rankingEngine';
import { selectTopPerSlot } from './selector';
import { deduplicateSelections } from './deduplicator';

/**
 * Layer 7 entry point.
 * Takes an allocation plan + normalised fund universe and produces
 * the final RecommendedFund[] list.
 */
export function generateRecommendations(
  allocationPlan: AllocationPlan,
  universe: NormalisedFundUniverse,
): RecommendedFund[] {
  console.log("GENERATE RECOMMENDATIONS — allocation slots:", allocationPlan.slots.length);

  // Rank funds for every slot category
  const rankedByCategory = new Map<string, ReturnType<typeof rankCategory>>();
  const uniqueCategories = new Set(allocationPlan.slots.map((s) => s.canonicalCategory));

  for (const cat of uniqueCategories) {
    const funds = universe.getByCategory(cat);
    console.log("INPUT FUNDS for " + cat + ":", funds.length);
    const ranked = rankCategory(funds, cat);
    console.log("FILTERED FUNDS for " + cat + ":", ranked.length);
    rankedByCategory.set(cat, ranked);
  }

  // Select top N per slot, then deduplicate
  const selections = selectTopPerSlot(allocationPlan.slots, rankedByCategory, 2);
  console.log("SELECTIONS per slot:", selections.map(s => s.slot.canonicalCategory + "→" + s.selected.length + "/" + s.eligibleCount + " eligible").join(", "));

  const deduped = deduplicateSelections(selections);
  console.log("DEDUPED selections:", deduped.length);

  // Flatten to RecommendedFund[]
  const result: RecommendedFund[] = [];
  for (const ds of deduped) {
    for (const ranked of ds.selected) {
      const slotShare = ranked.fund.id // split allocation % among selected funds in this slot
        ? ds.slot.percent / ds.selected.length
        : ds.slot.percent;

      result.push({
        fundId: ranked.fund.id,
        fundName: ranked.fund.name,
        canonicalCategory: ds.slot.canonicalCategory,
        matchScore: ranked.compositeScore,
        allocationPercent: Math.round(slotShare * 100) / 100,
        reason: `Ranked #${ds.selected.indexOf(ranked) + 1} in ${ds.slot.canonicalCategory} with a composite score of ${ranked.compositeScore.toFixed(1)}.`,
      });
    }
  }

  return result;
}
