import { CanonicalCategory } from '@/types/engine';

/**
 * Maps raw category codes from Data.xlsx to canonical SEBI-aligned names.
 * All downstream engine layers use canonical names only.
 */
const RAW_TO_CANONICAL: Record<string, CanonicalCategory> = {
  // ── Equity ──────────────────────────────────────────────
  'EQ-LC': 'LARGE_CAP',
  'EQ-DIV Y': 'LARGE_CAP',

  'EQ-MC': 'MID_CAP',
  'EQ-SC': 'SMALL_CAP',
  'EQ-L&MC': 'LARGE_MID_CAP',

  'EQ-MLC': 'FLEXI_CAP',
  'EQ-FLX': 'FLEXI_CAP',
  'EQ-VAL': 'FLEXI_CAP',
  'EQ-Quant': 'FLEXI_CAP',

  'EQ-ELSS': 'ELSS',

  // Sectoral
  'EQ-BANK': 'SECTORAL_BANKING',
  'EQ-IT': 'SECTORAL_TECH',
  'EQ-Pharma': 'SECTORAL_PHARMA',
  'EQ-INFRA': 'SECTORAL_INFRA',

  // Thematic
  'EQ-THEMATIC': 'THEMATIC',
  'EQ-Consumption': 'THEMATIC',
  'EQ-Manufacturing': 'THEMATIC',
  'EQ-Innovation': 'THEMATIC',
  'EQ-SA&T': 'THEMATIC',
  'EQ-TBC': 'THEMATIC',
  'EQ-T-ESG': 'THEMATIC',
  'EQ-Energy': 'THEMATIC',
  'EQ-PSU': 'THEMATIC',

  // International
  'EQ-INTL': 'INTERNATIONAL',
  'EQ-MNC': 'INTERNATIONAL',

  // ── Debt ────────────────────────────────────────────────
  'DT-LIQ': 'DEBT_LIQUID',
  'DT-OVERNHT': 'DEBT_OVERNIGHT',

  'DT-SD': 'DEBT_SHORT_TERM',
  'DT-USD': 'DEBT_SHORT_TERM',
  'DT-LD': 'DEBT_SHORT_TERM',

  'DT-MD': 'DEBT_MEDIUM_TERM',
  'DT-M to LD': 'DEBT_MEDIUM_TERM',

  'DT-LONG D': 'DEBT_LONG_TERM',

  'DT-GL': 'DEBT_GILT',
  'DT-Gilt 10Y CD': 'DEBT_GILT',

  'DT-CB': 'DEBT_CORPORATE_BOND',
  'DT-BK & PSU': 'DEBT_BANKING_PSU',
  'DT-Floater': 'DEBT_FLOATING_RATE',
  'DT-TM': 'DEBT_TARGET_MATURITY',
  'DT-DB': 'DEBT_DYNAMIC_BOND',
  'DT-MM': 'DEBT_MONEY_MARKET',
  'DT-CR': 'DEBT_CREDIT_RISK',
  'DT-OTH': 'DEBT_OTHERS',

  // ── Hybrid ──────────────────────────────────────────────
  'HY-AH': 'HYBRID_AGGRESSIVE',

  'HY-CH': 'HYBRID_CONSERVATIVE',
  'HY-BH': 'HYBRID_CONSERVATIVE',
  'HY-AR': 'HYBRID_CONSERVATIVE',
  'HY-EQ S': 'HYBRID_CONSERVATIVE',
  'HY-IPA': 'HYBRID_CONSERVATIVE',

  'HY-DAA': 'HYBRID_BALANCED',
  'HY-MAA': 'HYBRID_BALANCED',

  // ── Commodities ─────────────────────────────────────────
  'Gold-Funds': 'GOLD_FUND',
  'Silver-Funds': 'SILVER_FUND',
};

/**
 * Name-based overrides — applied before the raw-code lookup so that
 * funds whose category says "Large Cap" but whose name says "Index" or "ETF"
 * are correctly classified as index/ETF products.
 */
interface NamePattern {
  patterns: RegExp[];
  canonical: CanonicalCategory;
}

const NAME_OVERRIDES: NamePattern[] = [
  {
    patterns: [/index/i, /nifty\s*\d/i, /sensex/i, /bse\s*\d/i],
    canonical: 'INDEX_EQUITY',
  },
  {
    patterns: [/etf/i],
    canonical: 'ETF_EQUITY',
  },
  {
    patterns: [/gold.*etf/i, /etf.*gold/i],
    canonical: 'ETF_GOLD',
  },
];

/**
 * Normalise a single fund's category string + fund name to a canonical category.
 */
export function normaliseCategory(rawCategory: string, fundName: string): CanonicalCategory {
  const trimmed = (rawCategory || '').trim();
  const name = (fundName || '').trim();

  const matchedOverride = NAME_OVERRIDES.find((o) => o.patterns.some((p) => p.test(name)));
  if (matchedOverride) return matchedOverride.canonical;

  const key = trimmed;
  if (RAW_TO_CANONICAL[key]) return RAW_TO_CANONICAL[key];

  if (trimmed === '' || trimmed === 'UNKNOWN') return 'UNKNOWN';

  return 'UNKNOWN';
}

/**
 * Return all canonical categories used in the system.
 */
export function allCanonicalCategories(): CanonicalCategory[] {
  return [
    'LARGE_CAP', 'LARGE_MID_CAP', 'FLEXI_CAP', 'MULTI_CAP',
    'MID_CAP', 'SMALL_CAP', 'ELSS',
    'INDEX_EQUITY', 'INDEX_DEBT', 'ETF_EQUITY', 'ETF_GOLD', 'ETF_DEBT',
    'HYBRID_CONSERVATIVE', 'HYBRID_BALANCED', 'HYBRID_AGGRESSIVE',
    'DEBT_LIQUID', 'DEBT_OVERNIGHT', 'DEBT_SHORT_TERM', 'DEBT_MEDIUM_TERM',
    'DEBT_LONG_TERM', 'DEBT_GILT', 'DEBT_CORPORATE_BOND', 'DEBT_BANKING_PSU',
    'DEBT_FLOATING_RATE', 'DEBT_TARGET_MATURITY', 'DEBT_DYNAMIC_BOND',
    'DEBT_MONEY_MARKET', 'DEBT_CREDIT_RISK', 'DEBT_OTHERS',
    'SECTORAL_BANKING', 'SECTORAL_TECH', 'SECTORAL_PHARMA', 'SECTORAL_INFRA',
    'THEMATIC', 'GOLD_FUND', 'SILVER_FUND', 'INTERNATIONAL', 'FOF',
    'UNKNOWN',
  ];
}
