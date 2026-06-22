import { CanonicalCategory } from '@/types/engine';
import { NormalisedFund } from '@/data/normalisedFundUniverse';
import { getWeights } from './categoryWeights';
import {
  resolveMetrics,
  computeCategoryAvgSharpe,
  computeCategoryMedianAUM,
} from './missingDataHandler';

export interface RankedFund {
  fund: NormalisedFund;
  compositeScore: number;
  componentScores: {
    returnScore: number;
    riskScore: number;
    costScore: number;
    qualityScore: number;
    sizeScore: number;
  };
  warnings: string[];
}

/**
 * Rank all funds within a single canonical category using category-specific
 * weights.  Returns funds sorted descending by compositeScore.
 */
export function rankCategory(
  funds: NormalisedFund[],
  category: CanonicalCategory,
): RankedFund[] {
  if (funds.length === 0) return [];

  const weights = getWeights(category);
  const avgSharpe = computeCategoryAvgSharpe(funds);
  const medianAUM = computeCategoryMedianAUM(funds);

  // Resolve metrics for all funds
  const resolved = funds.map((f) => ({
    fund: f,
    metrics: resolveMetrics(f, avgSharpe, medianAUM),
  }));

  // Compute component scores as percentile ranks within category
  const returnValues = resolved.map((r) => r.metrics.bestCAGR ?? 0);
  const riskValues = resolved.map((r) => r.metrics.sharpe ?? 0);
  const costValues = resolved.map((r) => r.metrics.expense);
  const qualityValues = resolved.map((r) => r.metrics.alpha ?? 0);
  const sizeValues = resolved.map((r) => r.metrics.aum ?? 0);

  const percentile = (val: number, arr: number[]): number => {
    if (arr.length <= 1) return 50;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= val);
    if (index < 0) return 0;
    return (index / (sorted.length - 1)) * 100;
  };

  const returnPct = returnValues.map((v) => percentile(v, returnValues));
  const riskPct = riskValues.map((v) => percentile(v, riskValues));
  const costPct = costValues.map((v) => 100 - percentile(v, costValues)); // lower = better
  const qualityPct = qualityValues.map((v) => percentile(v, qualityValues));
  const sizePct = sizeValues.map((v) => {
    // Log-normalise AUM: penalise extreme AUM slightly
    const logVal = v > 0 ? Math.log(v) : 0;
    const logArr = sizeValues.filter((sv) => sv > 0).map((sv) => Math.log(sv));
    return logArr.length > 0 ? percentile(logVal, logArr) : 50;
  });

  const results: RankedFund[] = resolved.map((r, i) => {
    const returnScore = returnPct[i] - r.metrics.penalty;
    const riskScore = riskPct[i];
    const costScore = costPct[i];
    const qualityScore = qualityPct[i];
    const sizeScore = sizePct[i];

    const compositeScore =
      weights.wReturn * Math.max(returnScore, 0) +
      weights.wRisk * riskScore +
      weights.wCost * costScore +
      weights.wQuality * qualityScore +
      weights.wSize * sizeScore;

    return {
      fund: r.fund,
      compositeScore: Math.round(compositeScore * 100) / 100,
      componentScores: {
        returnScore: Math.round(returnScore * 100) / 100,
        riskScore: Math.round(riskScore * 100) / 100,
        costScore: Math.round(costScore * 100) / 100,
        qualityScore: Math.round(qualityScore * 100) / 100,
        sizeScore: Math.round(sizeScore * 100) / 100,
      },
      warnings: r.metrics.warnings,
    };
  });

  results.sort((a, b) => b.compositeScore - a.compositeScore);
  return results;
}
