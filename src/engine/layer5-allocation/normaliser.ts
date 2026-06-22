import { AllocationSlot, CanonicalCategory } from '@/types/engine';

/**
 * Normalise a list of category-percentage pairs so they sum to exactly 100.
 * Uses the Largest Remainder Method to handle rounding.
 *
 * Input: [{category, percent}, ...] — raw doubles
 * Output: [{category, percent}, ...] — integer percentages summing to 100
 */
export function normaliseAllocation(slots: { category: CanonicalCategory; percent: number }[]): AllocationSlot[] {
  if (slots.length === 0) return [];

  const total = slots.reduce((sum, s) => sum + s.percent, 0);
  if (total === 0) return [];

  // Scale to 100
  const scaled = slots.map((s) => ({
    category: s.category,
    raw: (s.percent / total) * 100,
  }));

  // Integer parts + fractional remainders
  const withRemainder = scaled.map((s) => ({
    category: s.category,
    integer: Math.floor(s.raw),
    remainder: s.raw - Math.floor(s.raw),
  }));

  let allocated = withRemainder.reduce((sum, s) => sum + s.integer, 0);
  const remainder = 100 - allocated;

  // Distribute remainder to slots with largest fractional parts
  withRemainder.sort((a, b) => b.remainder - a.remainder);

  for (let i = 0; i < remainder && i < withRemainder.length; i++) {
    withRemainder[i].integer += 1;
  }

  // Re-sort by percent descending for display
  withRemainder.sort((a, b) => b.integer - a.integer);

  return withRemainder.map((s) => ({
    canonicalCategory: s.category,
    percent: s.integer,
    rationale: '',
  }));
}
