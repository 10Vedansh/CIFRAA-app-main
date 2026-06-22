import { RawAnswers, AllocationPlan, CanonicalCategory } from '@/types/engine';
import { EligibleCategorySlot } from '@/engine/layer4-category/categoryEligibility';
import { applyDynamicAdjustments, AllocationSlot } from './dynamicAdjustments';
import { normaliseAllocation } from './normaliser';

/**
 * Layer 5 entry point.
 * Takes eligible category slots from Layer 4 and produces a normalised
 * AllocationPlan that always sums to 100%.
 */
export function buildAllocationPlan(
  eligibleSlots: EligibleCategorySlot[],
  answers: RawAnswers,
): AllocationPlan {
  const baseSlots: AllocationSlot[] = eligibleSlots.map((s) => ({
    category: s.canonicalCategory,
    percent: s.allocationPercent,
  }));

  const { slots: adjustedSlots, adjustmentsApplied } = applyDynamicAdjustments(baseSlots, answers);

  const normalised = normaliseAllocation(adjustedSlots);

  const rationaleMap = new Map<CanonicalCategory, string>();
  for (const es of eligibleSlots) {
    rationaleMap.set(es.canonicalCategory, es.rationale);
  }

  const finalSlots = normalised.map((s) => ({
    ...s,
    rationale: rationaleMap.get(s.canonicalCategory) ?? '',
  }));

  const totalPercent = finalSlots.reduce((sum, s) => sum + s.percent, 0);

  return {
    slots: finalSlots,
    totalPercent,
    adjustmentsApplied,
  };
}
