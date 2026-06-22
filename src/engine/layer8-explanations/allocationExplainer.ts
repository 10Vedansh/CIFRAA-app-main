import { AllocationSlot } from '@/types/engine';

/**
 * Generate per-slot allocation rationale.
 * Phase 8.3 template: "[CATEGORY] receives [PCT]% of your portfolio because [REASON]."
 */
export function explainAllocation(slots: AllocationSlot[]): string[] {
  return slots.map(
    (slot) =>
      `${slot.canonicalCategory} receives ${slot.percent}% of your portfolio. ${slot.rationale}`,
  );
}
