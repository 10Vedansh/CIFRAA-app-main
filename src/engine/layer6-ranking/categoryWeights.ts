import { CanonicalCategory } from '@/types/engine';

/**
 * Category-specific scoring weights per Phase 6.2.
 * Each weight row sums to 100%.
 */
export interface CategoryWeights {
  wReturn: number;
  wRisk: number;
  wCost: number;
  wQuality: number;
  wSize: number;
}

const DEFAULT_WEIGHTS: CategoryWeights = { wReturn: 30, wRisk: 20, wCost: 15, wQuality: 20, wSize: 15 };

const WEIGHT_MAP: Partial<Record<CanonicalCategory, CategoryWeights>> = {
  LARGE_CAP:        { wReturn: 25, wRisk: 25, wCost: 20, wQuality: 15, wSize: 15 },
  LARGE_MID_CAP:    { wReturn: 30, wRisk: 20, wCost: 15, wQuality: 20, wSize: 15 },
  FLEXI_CAP:        { wReturn: 30, wRisk: 20, wCost: 15, wQuality: 20, wSize: 15 },
  MULTI_CAP:        { wReturn: 30, wRisk: 20, wCost: 15, wQuality: 20, wSize: 15 },
  MID_CAP:          { wReturn: 35, wRisk: 20, wCost: 10, wQuality: 25, wSize: 10 },
  SMALL_CAP:        { wReturn: 35, wRisk: 15, wCost: 10, wQuality: 30, wSize: 10 },
  ELSS:             { wReturn: 30, wRisk: 20, wCost: 15, wQuality: 20, wSize: 15 },
  INDEX_EQUITY:     { wReturn: 20, wRisk: 25, wCost: 40, wQuality: 0,  wSize: 15 },
  INDEX_DEBT:       { wReturn: 20, wRisk: 25, wCost: 40, wQuality: 0,  wSize: 15 },
  ETF_EQUITY:       { wReturn: 20, wRisk: 25, wCost: 40, wQuality: 0,  wSize: 15 },
  ETF_GOLD:         { wReturn: 20, wRisk: 25, wCost: 40, wQuality: 0,  wSize: 15 },
  ETF_DEBT:         { wReturn: 20, wRisk: 25, wCost: 40, wQuality: 0,  wSize: 15 },
  HYBRID_CONSERVATIVE: { wReturn: 25, wRisk: 30, wCost: 15, wQuality: 15, wSize: 15 },
  HYBRID_BALANCED:  { wReturn: 25, wRisk: 30, wCost: 15, wQuality: 15, wSize: 15 },
  HYBRID_AGGRESSIVE:{ wReturn: 25, wRisk: 30, wCost: 15, wQuality: 15, wSize: 15 },
  DEBT_LIQUID:      { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_OVERNIGHT:   { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_SHORT_TERM:  { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_MEDIUM_TERM: { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_LONG_TERM:   { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_GILT:        { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_CORPORATE_BOND: { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_BANKING_PSU: { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_FLOATING_RATE:  { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_TARGET_MATURITY:{ wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_DYNAMIC_BOND:{ wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_MONEY_MARKET:{ wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_CREDIT_RISK: { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  DEBT_OTHERS:      { wReturn: 20, wRisk: 35, wCost: 25, wQuality: 5,  wSize: 15 },
  SECTORAL_BANKING: { wReturn: 40, wRisk: 15, wCost: 10, wQuality: 30, wSize: 5 },
  SECTORAL_TECH:    { wReturn: 40, wRisk: 15, wCost: 10, wQuality: 30, wSize: 5 },
  SECTORAL_PHARMA:  { wReturn: 40, wRisk: 15, wCost: 10, wQuality: 30, wSize: 5 },
  SECTORAL_INFRA:   { wReturn: 40, wRisk: 15, wCost: 10, wQuality: 30, wSize: 5 },
  THEMATIC:         { wReturn: 40, wRisk: 15, wCost: 10, wQuality: 30, wSize: 5 },
  GOLD_FUND:        { wReturn: 30, wRisk: 20, wCost: 30, wQuality: 0,  wSize: 20 },
  SILVER_FUND:      { wReturn: 30, wRisk: 20, wCost: 30, wQuality: 0,  wSize: 20 },
  INTERNATIONAL:    { wReturn: 30, wRisk: 20, wCost: 15, wQuality: 20, wSize: 15 },
};

export function getWeights(category: CanonicalCategory): CategoryWeights {
  return WEIGHT_MAP[category] ?? DEFAULT_WEIGHTS;
}
