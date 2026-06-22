import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, Shield, Target, Lightbulb } from 'lucide-react';
import { PortfolioItem } from '@/hooks/usePortfolio';
import { MutualFund, CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/mutualFund';
import { UserProfile } from '@/hooks/useAuth';

interface EnrichedHolding {
  item: PortfolioItem;
  fund?: MutualFund;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  allocationPercent: number;
}

const CANONICAL_DISPLAY: Record<string, string> = {
  ...CATEGORY_LABELS,
  'EQ-FLX': 'Flexi Cap', 'EQ-LC': 'Large Cap', 'EQ-MC': 'Mid Cap',
  'EQ-SC': 'Small Cap', 'EQ-ELSS': 'ELSS', 'EQ-THEMATIC': 'Thematic',
  'EQ-SA&T': 'Sectoral', 'EQ-INTL': 'International',
  'HY-AH': 'Aggressive Hybrid', 'HY-CH': 'Conservative Hybrid',
  'DT-LIQ': 'Liquid', 'DT-USD': 'Ultra Short Duration',
  'Gold-Funds': 'Gold', 'Silver-Funds': 'Silver',
};

const ALL_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#22d3ee','#a855f7','#e11d48','#0ea5e9'];

interface PortfolioAnalyticsProps {
  portfolio: PortfolioItem[];
  funds: MutualFund[];
  userProfile: UserProfile | null;
}

function getCategoryLabel(cat: string | null): string {
  if (!cat) return 'Other';
  return CANONICAL_DISPLAY[cat] || CATEGORY_LABELS[cat] || cat;
}

function matchFund(name: string, funds: MutualFund[]): MutualFund | undefined {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  let best: MutualFund | undefined;
  let bestScore = 0;
  for (const f of funds) {
    const fc = f.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let score = 0;
    for (let i = 0; i < Math.min(clean.length, fc.length); i++) {
      if (clean[i] === fc[i]) score++;
      else break;
    }
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return bestScore > 5 ? best : undefined;
}

function estimateRiskLevel(holdings: EnrichedHolding[]): string {
  const matched = holdings.filter(h => h.fund);
  if (!matched.length) return 'Moderate';
  const avg = matched.reduce((s, h) => s + (h.fund!.riskLevel === 'High' ? 3 : h.fund!.riskLevel === 'Moderate' ? 2 : 1), 0) / matched.length;
  if (avg >= 2.5) return 'Aggressive';
  if (avg >= 2.0) return 'Growth';
  if (avg >= 1.5) return 'Moderate';
  if (avg >= 1.0) return 'Conservative';
  return 'Very Conservative';
}

function questionnaireRiskLabel(profile: UserProfile | null): string {
  const slider = profile?.risk_slider ?? 5;
  if (slider >= 9) return 'Aggressive';
  if (slider >= 7) return 'Growth';
  if (slider >= 5) return 'Moderate';
  if (slider >= 3) return 'Conservative';
  return 'Very Conservative';
}

const RISK_LEVELS = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] as const;
const RISK_COLORS = ['bg-emerald-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
const RISK_TEXT = ['text-emerald-400', 'text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];

function riskIndex(label: string): number {
  const i = RISK_LEVELS.indexOf(label as any);
  return i >= 0 ? i : 2;
}

// ─── Small Health Gauge (SVG) ──────────────────────────────────────
function MiniGauge({ score, size = 100 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const stroke = score >= 90 ? '#34d399' : score >= 75 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={size * 0.08} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth={size * 0.08}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export function PortfolioAnalytics({ portfolio, funds, userProfile }: PortfolioAnalyticsProps) {
  const enriched = useMemo((): EnrichedHolding[] => {
    const totalInv = portfolio.reduce((s, i) => s + (i.invested_amount || 0), 0);
    const result = portfolio.map(item => {
      const fund = matchFund(item.fund_name, funds);
      const nav = fund?.nav ?? item.purchase_nav ?? 0;
      const units = item.units || 0;
      const cv = fund ? units * nav : (item.invested_amount || 0);
      const inv = item.invested_amount || 0;
      return { item, fund, currentValue: cv, gainLoss: cv - inv, gainLossPercent: inv > 0 ? (cv - inv) / inv * 100 : 0, allocationPercent: 0 };
    });
    const tv = result.reduce((s, h) => s + h.currentValue, 0);
    result.forEach(h => { h.allocationPercent = tv > 0 ? (h.currentValue / tv) * 100 : 0; });
    return result;
  }, [portfolio, funds]);

  const totalInvested = useMemo(() => portfolio.reduce((s, i) => s + (i.invested_amount || 0), 0), [portfolio]);
  const totalCurrent = useMemo(() => enriched.reduce((s, h) => s + h.currentValue, 0), [enriched]);
  const totalGain = totalCurrent - totalInvested;
  const totalGainPct = totalInvested > 0 ? totalGain / totalInvested * 100 : 0;

  const riskLabel = useMemo(() => estimateRiskLevel(enriched), [enriched]);
  const qRisk = useMemo(() => questionnaireRiskLabel(userProfile), [userProfile]);
  const riskIdx = riskIndex(riskLabel);
  const aligned = riskLabel === qRisk;
  const nearby = !aligned && Math.abs(riskIndex(riskLabel) - riskIndex(qRisk)) <= 1;

  // Health score
  const healthScore = useMemo(() => {
    const breakdown = { diversification: 0, fundQuality: 0, expenseEff: 0, riskAlignment: 0, concentration: 0 };
    const n = enriched.length;

    // Diversification (25)
    if (n >= 5 && n <= 12) breakdown.diversification = 25;
    else if (n >= 3 || n <= 15) breakdown.diversification = 15;
    else breakdown.diversification = 5;

    // Fund quality (25)
    const matched = enriched.filter(h => h.fund);
    if (matched.length > 0) {
      breakdown.fundQuality = Math.round(matched.reduce((s, h) => s + (h.fund!.strengthBadge === 'Strong' ? 25 : h.fund!.strengthBadge === 'Balanced' ? 15 : 5), 0) / matched.length);
    }

    // Expense efficiency (20)
    const we = enriched.filter(h => h.fund && h.fund.expenseRatio > 0);
    if (we.length > 0) {
      const avg = we.reduce((s, h) => s + h.fund!.expenseRatio, 0) / we.length;
      breakdown.expenseEff = avg < 0.8 ? 20 : avg < 1.2 ? 16 : avg < 1.6 ? 12 : avg < 2.0 ? 8 : 4;
    }

    // Risk alignment (20)
    if (aligned) breakdown.riskAlignment = 20;
    else if (nearby) breakdown.riskAlignment = 12;
    else breakdown.riskAlignment = 5;

    // Concentration (10)
    const cats: Record<string, number> = {};
    enriched.forEach(h => { const c = h.item.fund_category || 'Other'; cats[c] = (cats[c] || 0) + h.allocationPercent; });
    const maxCat = Math.max(...Object.values(cats), 0);
    breakdown.concentration = maxCat < 30 ? 10 : maxCat < 50 ? 7 : maxCat < 70 ? 4 : 1;

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { score: Math.min(Math.round(score), 100), breakdown };
  }, [enriched, aligned, nearby]);

  // Summary of contributions per category
  const allocationData = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(h => {
      const cat = getCategoryLabel(h.item.fund_category);
      map[cat] = (map[cat] || 0) + h.currentValue;
    });
    return Object.entries(map).map(([n, v]) => ({ name: n, value: v, pct: totalCurrent > 0 ? v / totalCurrent * 100 : 0 })).sort((a, b) => b.value - a.value);
  }, [enriched, totalCurrent]);

  const uniqueCategoryCount = useMemo(() => new Set(enriched.map(h => h.item.fund_category || 'Other')).size, [enriched]);

  // AMC data
  const amcData = useMemo(() => {
    const map: Record<string, number> = {};
    enriched.forEach(h => {
      const a = h.fund?.amc || 'Unknown';
      map[a] = (map[a] || 0) + h.currentValue;
    });
    return Object.entries(map).map(([n, v]) => ({ name: n, value: v, pct: totalCurrent > 0 ? v / totalCurrent * 100 : 0 })).sort((a, b) => b.value - a.value);
  }, [enriched, totalCurrent]);

  const maxAmcPct = amcData[0]?.pct ?? 0;
  const singleAmc = amcData.length <= 1;
  const singleCategory = allocationData.length <= 1;
  const uniqueAmcs = amcData.filter(a => a.name !== 'Unknown').length;

  // Warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    if (enriched.length < 3) w.push('Too few funds — add more for diversification');
    if (enriched.length > 15) w.push('Too many funds — consider consolidating to 10-12');
    if (maxAmcPct > 40) w.push(`Single AMC ${maxAmcPct.toFixed(0)}% — reduce exposure below 40%`);
    if (allocationData[0]?.pct > 60) w.push(`Single category ${allocationData[0].pct.toFixed(0)}% — diversify across categories`);
    return w;
  }, [enriched, maxAmcPct, allocationData]);

  // AMC concentration level
  const amcRiskLevel = maxAmcPct > 60 ? 'High' : maxAmcPct > 40 ? 'Moderate' : maxAmcPct > 0 ? 'Low' : 'None';

  // Insights
  const insights = useMemo(() => {
    const out: string[] = [];
    const eqCats = new Set(['EQ-FLX','EQ-LC','EQ-MC','EQ-SC','EQ-ELSS','EQ-THEMATIC','EQ-SA&T','EQ-INTL','EQ-L&MC','EQ-MLC','EQ-VAL']);
    const eqPct = enriched.filter(h => eqCats.has(h.item.fund_category || '')).reduce((s, h) => s + h.allocationPercent, 0);
    if (eqPct > 0 && eqPct < 30) out.push('Equity allocation is below recommended levels for long-term growth.');
    if (maxAmcPct > 40) out.push(`Portfolio is heavily concentrated in ${amcData[0].name}.`);
    if (totalGain > 0) out.push(`Portfolio has generated +${totalGainPct.toFixed(1)}% return.`);
    if (totalGain < 0) out.push(`Portfolio has declined ${Math.abs(totalGainPct).toFixed(1)}%. Consider reviewing underperformers.`);
    if (aligned) out.push('Portfolio risk matches your investor profile.');
    else if (nearby) out.push('Portfolio risk is close to your profile — minor adjustments recommended.');
    else out.push('Portfolio risk differs significantly from your profile — consider rebalancing.');
    if (singleCategory) out.push('All assets in one category — diversify across multiple categories.');
    if (allocationData.find(a => a.name === 'Liquid' && a.pct > 30)) out.push('High liquid allocation limits long-term growth potential.');
    const sc = enriched.filter(h => h.item.fund_category === 'EQ-SC').reduce((s, h) => s + h.allocationPercent, 0);
    if (sc > 15) out.push('Small-cap allocation exceeds recommended 15% limit.');
    return out.slice(0, 5);
  }, [enriched, totalGain, totalGainPct, aligned, nearby, singleCategory, maxAmcPct, amcData, allocationData]);

  // Improvement opportunities
  const improvements = useMemo(() => {
    const actions: string[] = [];
    if (uniqueCategoryCount < 3) {
      if (!allocationData.find(a => a.name === 'Flexi Cap' || a.name === 'Large Cap')) actions.push('Add a Flexi Cap or Large Cap fund for growth');
    }
    if (maxAmcPct > 40) actions.push(`Reduce ${amcData[0].name} exposure below 40%`);
    if (uniqueAmcs < 2) actions.push('Add funds from different AMCs for better diversification');
    if (enriched.length < 3) actions.push('Add 2-3 more funds across different categories');
    if (!aligned && riskIdx > riskIndex(qRisk)) actions.push('Shift allocation toward debt/liquid to reduce portfolio risk');
    if (!aligned && riskIdx < riskIndex(qRisk)) actions.push('Increase equity allocation for higher growth potential');
    const losers = enriched.filter(h => h.gainLossPercent < -10);
    if (losers.length > 0) actions.push(`Review ${losers[0].item.fund_name} — declined ${Math.abs(losers[0].gainLossPercent).toFixed(0)}%`);
    if (allocationData.find(a => a.pct > 50)) actions.push(`Reduce ${allocationData[0].name} allocation below 50%`);

    return actions.slice(0, 4);
  }, [uniqueCategoryCount, maxAmcPct, amcData, uniqueAmcs, enriched, aligned, riskIdx, qRisk, allocationData]);

  const potentialHealth = Math.min(healthScore.score + improvements.length * 3, 100);

  // ─── Strongest / Weakest area ─────────────────────────────────────
  const breakdownEntries: [string, number, number][] = [
    ['Diversification', healthScore.breakdown.diversification, 25],
    ['Fund Quality', healthScore.breakdown.fundQuality, 25],
    ['Expense Efficiency', healthScore.breakdown.expenseEff, 20],
    ['Risk Alignment', healthScore.breakdown.riskAlignment, 20],
    ['Concentration', healthScore.breakdown.concentration, 10],
  ];
  const strongest = breakdownEntries.reduce((a, b) => a[1] >= b[1] ? a : b);
  const weakest = breakdownEntries.reduce((a, b) => a[1] <= b[1] ? a : b);
  const healthLabel = healthScore.score >= 90 ? 'Excellent' : healthScore.score >= 75 ? 'Healthy' : healthScore.score >= 60 ? 'Moderate' : healthScore.score >= 40 ? 'Needs Attention' : 'High Risk';

  const gainColor = totalGain >= 0 ? 'text-success' : 'text-destructive';
  const GainIcon = totalGain >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ─── 1. Portfolio Summary ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card col-span-2 md:col-span-1 relative overflow-hidden">
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Portfolio Value</p>
            <p className="text-2xl font-bold text-foreground mt-1">₹{Math.round(totalCurrent).toLocaleString()}</p>
            <div className={cn('flex items-center gap-1.5 mt-1 text-xs font-medium', gainColor)}>
              <GainIcon className="h-3 w-3" />
              {totalGain >= 0 ? '+' : ''}₹{Math.round(Math.abs(totalGain)).toLocaleString()} ({totalGainPct >= 0 ? '+' : ''}{totalGainPct.toFixed(2)}%)
            </div>
          </CardContent>
          <div className={cn('absolute top-0 right-0 w-24 h-24 opacity-[0.07]')}>
            <GainIcon className="w-full h-full" />
          </div>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invested</p>
            <p className="text-xl font-bold text-foreground mt-1">₹{Math.round(totalInvested).toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Health</p>
            <p className={cn('text-xl font-bold mt-1', healthScore.score >= 75 ? 'text-success' : healthScore.score >= 60 ? 'text-warning' : 'text-destructive')}>
              {healthScore.score}/100
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-xl font-bold', RISK_TEXT[riskIdx])}>{riskLabel}</span>
              <span className="text-[10px] text-muted-foreground">{portfolio.length} funds</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. Health & Risk ──────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Health Score */}
        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-foreground mb-4">Portfolio Health</p>
            <div className="flex items-start gap-5">
              <div className="relative flex flex-col items-center shrink-0">
                <MiniGauge score={healthScore.score} size={100} />
                <span className={cn('text-lg font-bold mt-1', healthScore.score >= 75 ? 'text-success' : healthScore.score >= 60 ? 'text-warning' : 'text-destructive')}>{healthScore.score}</span>
                <span className="text-[10px] text-muted-foreground">{healthLabel}</span>
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                {breakdownEntries.map(([label, val, max]) => {
                  const pct = val / max;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{label}</span>
                        <span className={cn('font-medium', pct >= 0.8 ? 'text-success' : pct >= 0.5 ? 'text-warning' : 'text-destructive')}>{val}/{max}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/30 mt-0.5 overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all', pct >= 0.8 ? 'bg-success' : pct >= 0.5 ? 'bg-warning' : 'bg-destructive')}
                          style={{ width: `${pct * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-border/30 space-y-0.5">
                  <p className="text-success text-[10px]">
                    <CheckCircle2 className="h-3 w-3 inline mr-1" />
                    Strongest: {strongest[0]} ({strongest[1]}/{strongest[2]})
                  </p>
                  <p className={cn('text-[10px]', weakest[1] < weakest[2] * 0.6 ? 'text-warning' : 'text-muted-foreground')}>
                    <Info className="h-3 w-3 inline mr-1" />
                    {weakest[1] < weakest[2] * 0.6 ? 'Needs improvement: ' : 'Area: '}{weakest[0]} ({weakest[1]}/{weakest[2]})
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Meter */}
        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-foreground mb-4">Risk Assessment</p>
            <div className="space-y-4">
              <div className="relative">
                <div className="flex h-2 rounded-full overflow-hidden">
                  {RISK_COLORS.map((c, i) => (
                    <div key={i} className={cn('flex-1 h-full transition-opacity', i === riskIdx ? c : 'bg-muted/20')} />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  {RISK_LEVELS.map((l, i) => (
                    <span key={l} className={cn(i === riskIdx ? RISK_TEXT[riskIdx] + ' font-semibold' : '')}>{l}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Portfolio Risk</p>
                  <p className={cn('text-base font-semibold', RISK_TEXT[riskIdx])}>{riskLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Profile</p>
                  <p className="text-base font-semibold text-foreground">{qRisk}</p>
                </div>
              </div>

              <div className={cn('flex items-center gap-2 text-xs p-2.5 rounded-lg', aligned ? 'bg-success/10 text-success' : nearby ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')}>
                {aligned ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                {aligned ? 'Aligned with your investor profile' : nearby ? 'Close to your profile — minor adjustments needed' : 'Portfolio risk differs from your profile'}
              </div>

              {/* Diversification mini */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{portfolio.length}</p>
                  <p className="text-[10px] text-muted-foreground">Funds</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{uniqueCategoryCount}</p>
                  <p className="text-[10px] text-muted-foreground">Categories</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{uniqueAmcs}</p>
                  <p className="text-[10px] text-muted-foreground">AMCs</p>
                </div>
              </div>

              {warnings.length > 0 && (
                <div className="space-y-1">
                  {warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-warning">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 3. Allocation & AMC ────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Asset Allocation */}
        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-semibold text-foreground mb-4">Asset Allocation</p>
            {singleCategory ? (
              <div className="space-y-3">
                {allocationData.map((entry, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-muted-foreground">₹{Math.round(entry.value).toLocaleString()} ({entry.pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: '100%' }} />
                    </div>
                  </div>
                ))}
                {singleCategory && (
                  <div className="flex items-center gap-1.5 text-[10px] text-warning mt-2">
                    <AlertTriangle className="h-3 w-3" /> All assets in one category — add diversity
                  </div>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                        paddingAngle={2} dataKey="value">
                        {allocationData.map((_, i) => (
                          <Cell key={i} fill={ALL_COLORS[i % ALL_COLORS.length]} stroke="hsl(var(--background))" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs max-h-[220px] overflow-y-auto">
                  {allocationData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ALL_COLORS[i % ALL_COLORS.length] }} />
                      <span className="text-muted-foreground flex-1 truncate">{entry.name}</span>
                      <span className="font-medium">{entry.pct.toFixed(1)}%</span>
                      <span className="text-muted-foreground">₹{Math.round(entry.value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AMC Concentration */}
        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-foreground">AMC Exposure</p>
              {amcRiskLevel !== 'Low' && (
                <Badge variant="outline" className={cn('text-[10px]', amcRiskLevel === 'High' ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-warning/10 text-warning border-warning/30')}>
                  {amcRiskLevel} Concentration
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {amcData.slice(0, 6).map((entry, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-foreground font-medium">{entry.name}</span>
                    <span className={cn('font-medium', entry.pct > 40 ? 'text-destructive' : 'text-muted-foreground')}>
                      {entry.pct.toFixed(1)}% {entry.pct > 40 && '⚠'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                    <div className={cn('h-full rounded-full', entry.pct > 40 ? 'bg-destructive' : entry.pct > 20 ? 'bg-warning' : 'bg-primary/50')}
                      style={{ width: `${Math.min(entry.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
              {amcData.length > 6 && <p className="text-[10px] text-muted-foreground">+{amcData.length - 6} more</p>}
            </div>
            {singleAmc && (
              <div className="flex items-center gap-1.5 text-xs text-destructive mt-3 p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Single AMC — high concentration risk
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 7. Holdings ────────────────────────────────────────────── */}
      <Card className="glass-card">
        <CardContent className="pt-5 pb-4">
          <p className="text-xs font-semibold text-foreground mb-4">Fund Holdings</p>
          <div className="space-y-3">
            {enriched.map((h, idx) => (
              <Card key={idx} className="bg-muted/5 border-border/30">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-medium text-sm text-foreground truncate">{h.item.fund_name}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0">{getCategoryLabel(h.item.fund_category)}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>AMC: {h.fund?.amc || 'N/A'}</span>
                        <span>Weight: {h.allocationPercent.toFixed(1)}%</span>
                        {h.fund?.expenseRatio && <span>Expense: {h.fund.expenseRatio.toFixed(2)}%</span>}
                        {h.fund?.aum && <span>AUM: ₹{(h.fund.aum / 1000).toFixed(1)}K Cr</span>}
                        {h.fund?.strengthBadge && (
                          <Badge variant="outline" className={cn('text-[10px] border-0',
                            h.fund.strengthBadge === 'Strong' ? 'bg-success/10 text-success' :
                            h.fund.strengthBadge === 'Balanced' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')}>
                            {h.fund.strengthBadge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">₹{Math.round(h.currentValue).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Invested: ₹{Math.round(h.item.invested_amount ?? 0).toLocaleString()}</p>
                      <p className={cn('text-xs font-medium mt-0.5', h.gainLoss >= 0 ? 'text-success' : 'text-destructive')}>
                        {h.gainLoss >= 0 ? '+' : ''}₹{Math.round(h.gainLoss).toLocaleString()} ({h.gainLossPercent >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── 9. AI Insights ─────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Card className="glass-card">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Portfolio Insights</p>
            </div>
            <div className="space-y-2">
              {insights.map((insight, i) => {
                const isWarning = insight.includes('⚠') || insight.includes('below') || insight.includes('exceed') || insight.includes('limited') || insight.includes('concentrat') || insight.includes('decline') || insight.includes('differs');
                return (
                  <div key={i} className={cn('flex items-start gap-3 p-3 rounded-lg text-sm', isWarning ? 'bg-warning/5' : 'bg-muted/5')}>
                    {isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    ) : insight.includes('matches') || insight.includes('generated') ? (
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    )}
                    <span className="text-foreground">{insight}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 10. Improvement Opportunities ──────────────────────────── */}
      {improvements.length > 0 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-foreground">Improvement Opportunities</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-muted/10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Current Health</p>
                <p className={cn('text-2xl font-bold', healthScore.score >= 75 ? 'text-success' : 'text-warning')}>{healthScore.score}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/10 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Potential Health</p>
                <p className="text-2xl font-bold text-primary">{potentialHealth}</p>
              </div>
            </div>

            <div className="space-y-2">
              {improvements.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{action}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Expected improvement: +{Math.round((potentialHealth - healthScore.score) / improvements.length)} health score
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card className="bg-warning/5 border-warning/20">
        <CardContent className="py-3 flex items-start gap-2">
          <Shield className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground">
            <strong className="text-warning">Disclaimer:</strong> Analytics based on imported CAMS data and fund database.
            Health score is indicative. Consult a financial advisor before making investment decisions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
