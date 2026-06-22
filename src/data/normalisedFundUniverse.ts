import { MutualFund } from '@/types/mutualFund';
import { CanonicalCategory } from '@/types/engine';
import { normaliseCategory } from '@/engine/layer4-category/normalisationTable';

/**
 * A MutualFund with a normalised canonical category assigned at load time.
 * The canonicalCategory is the key used by all downstream engine layers.
 */
export interface NormalisedFund extends MutualFund {
  canonicalCategory: CanonicalCategory;
}

/**
 * The in-memory normalised fund universe.
 * Parsed once from Data.xlsx, then all layers read from this container.
 */
export class NormalisedFundUniverse {
  private funds: NormalisedFund[] = [];
  private byCategory: Map<CanonicalCategory, NormalisedFund[]> = new Map();
  private totalFunds = 0;
  private unknownCount = 0;

  constructor(funds: MutualFund[]) {
    for (const f of funds) {
      const canonical = normaliseCategory(f.category, f.name);
      const nf: NormalisedFund = { ...f, canonicalCategory: canonical };
      this.funds.push(nf);
      this.totalFunds++;
      if (canonical === 'UNKNOWN') {
        this.unknownCount++;
      } else {
        const existing = this.byCategory.get(canonical) ?? [];
        existing.push(nf);
        this.byCategory.set(canonical, existing);
      }
    }
  }

  all(): NormalisedFund[] {
    return this.funds;
  }

  getByCategory(cat: CanonicalCategory): NormalisedFund[] {
    return this.byCategory.get(cat) ?? [];
  }

  categories(): CanonicalCategory[] {
    return Array.from(this.byCategory.keys());
  }

  fundCount(): number {
    return this.totalFunds;
  }

  unknownCategoryCount(): number {
    return this.unknownCount;
  }

  categoryFundCount(cat: CanonicalCategory): number {
    return this.byCategory.get(cat)?.length ?? 0;
  }

  summary(): NormalisedUniverseSummary {
    const entries: CategorySummaryEntry[] = [];
    for (const [cat, funds] of this.byCategory.entries()) {
      entries.push({ category: cat, count: funds.length });
    }
    entries.sort((a, b) => b.count - a.count);
    return {
      totalFunds: this.totalFunds,
      unknownCount: this.unknownCount,
      categoryCount: this.byCategory.size,
      categories: entries,
    };
  }
}

export interface CategorySummaryEntry {
  category: CanonicalCategory;
  count: number;
}

export interface NormalisedUniverseSummary {
  totalFunds: number;
  unknownCount: number;
  categoryCount: number;
  categories: CategorySummaryEntry[];
}
