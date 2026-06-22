import { NormalisedFund } from '@/data/normalisedFundUniverse';

export interface ResolvedMetrics {
  bestCAGR: number | null;
  usedCAGRLabel: string;
  penalty: number;
  sharpe: number | null;
  alpha: number | null;
  expense: number;
  aum: number | null;
  beta: number | null;
  warnings: string[];
}

/**
 * Resolve a fund's metrics with graceful degradation for null values.
 * Implements Phase 6.3 fallback rules.
 */
export function resolveMetrics(
  fund: NormalisedFund,
  categoryAvgSharpe: number | null,
  categoryMedianAUM: number | null,
): ResolvedMetrics {
  const warnings: string[] = [];

  // ── CAGR resolution ──────────────────────────────────────
  let bestCAGR: number | null = null;
  let usedCAGRLabel = '';
  let penalty = 0;

  if (fund.cagr5Y != null && !isNaN(fund.cagr5Y)) {
    bestCAGR = fund.cagr5Y;
    usedCAGRLabel = '5Y CAGR';
  } else if (fund.ret5Y != null && !isNaN(fund.ret5Y)) {
    bestCAGR = fund.ret5Y;
    usedCAGRLabel = '5Y CAGR (ret)';
  } else if (fund.cagr3Y != null && !isNaN(fund.cagr3Y)) {
    bestCAGR = fund.cagr3Y;
    usedCAGRLabel = '3Y CAGR';
    penalty = 5;
  } else if (fund.ret3Y != null && !isNaN(fund.ret3Y)) {
    bestCAGR = fund.ret3Y;
    usedCAGRLabel = '3Y CAGR (ret)';
    penalty = 5;
  } else if (fund.cagr1Y != null && !isNaN(fund.cagr1Y)) {
    bestCAGR = fund.cagr1Y;
    usedCAGRLabel = '1Y CAGR';
    penalty = 10;
  } else if (fund.ret1Y != null && !isNaN(fund.ret1Y)) {
    bestCAGR = fund.ret1Y;
    usedCAGRLabel = '1Y CAGR (ret)';
    penalty = 10;
  } else {
    bestCAGR = null;
    usedCAGRLabel = 'none';
    penalty = 0;
    warnings.push(`${fund.name}: All CAGR columns null — ReturnScore = 0.`);
  }

  // ── Sharpe resolution ────────────────────────────────────
  let sharpe: number | null = null;
  if (fund.sharpeRatio != null && !isNaN(fund.sharpeRatio)) {
    sharpe = fund.sharpeRatio;
  } else if (categoryAvgSharpe != null) {
    sharpe = categoryAvgSharpe;
    warnings.push(`${fund.name}: Sharpe null — using category average ${categoryAvgSharpe.toFixed(2)}.`);
  }

  // ── Alpha resolution ─────────────────────────────────────
  let alpha: number | null = null;
  if (fund.alpha != null && !isNaN(fund.alpha)) {
    alpha = fund.alpha;
  }
  // If null, QualityScore derived from alpha will be 0 — that's per-spec

  // ── Expense resolution ────────────────────────────────────
  let expense = 1.5; // conservative default
  if (fund.expenseRatio != null && !isNaN(fund.expenseRatio) && fund.expenseRatio > 0) {
    expense = fund.expenseRatio;
  } else {
    warnings.push(`${fund.name}: Expense ratio null — assumed 1.5%.`);
  }

  // ── AUM resolution ───────────────────────────────────────
  let aum: number | null = null;
  if (fund.aum != null && !isNaN(fund.aum) && fund.aum > 0) {
    aum = fund.aum;
  } else if (categoryMedianAUM != null) {
    aum = categoryMedianAUM;
    warnings.push(`${fund.name}: AUM null — using category median ${categoryMedianAUM.toFixed(0)} Cr.`);
  }

  // ── Beta resolution ──────────────────────────────────────
  let beta: number | null = null;
  if (fund.beta != null && !isNaN(fund.beta)) {
    beta = fund.beta;
  }

  return { bestCAGR, usedCAGRLabel, penalty, sharpe, alpha, expense, aum, beta, warnings };
}

/**
 * Compute the category-average Sharpe ratio for imputation.
 */
export function computeCategoryAvgSharpe(funds: NormalisedFund[]): number | null {
  const values = funds
    .map((f) => f.sharpeRatio)
    .filter((v): v is number => v != null && !isNaN(v));
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compute the category-median AUM for imputation.
 */
export function computeCategoryMedianAUM(funds: NormalisedFund[]): number | null {
  const values = funds
    .map((f) => f.aum)
    .filter((v): v is number => v != null && !isNaN(v) && v > 0);
  if (values.length === 0) return null;
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
}
