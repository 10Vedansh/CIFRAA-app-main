import { getWorkbookFunds } from '@/utils/workbookLoader';
import { NormalisedFundUniverse } from '@/data/normalisedFundUniverse';

let universeInstance: NormalisedFundUniverse | null = null;
let loadPromise: Promise<NormalisedFundUniverse> | null = null;

/**
 * Load Data.xlsx, normalise all fund categories, and return a
 * NormalisedFundUniverse singleton.  Subsequent calls return the
 * cached instance.
 */
export async function loadNormalisedUniverse(): Promise<NormalisedFundUniverse> {
  if (universeInstance) return universeInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const funds = await getWorkbookFunds();
    universeInstance = new NormalisedFundUniverse(funds);

    const s = universeInstance.summary();
    console.log(`[dataLoader] Normalised universe loaded: ${s.totalFunds} funds, ${s.categoryCount} categories, ${s.unknownCount} unknown`);

    return universeInstance;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

/**
 * Reset the cached universe (useful for testing or hot-reload).
 */
export function clearUniverseCache(): void {
  universeInstance = null;
  loadPromise = null;
}
