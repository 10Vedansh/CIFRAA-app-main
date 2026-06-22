import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MutualFund, CATEGORY_LABELS } from '@/types/mutualFund';
import { Bookmark, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAUM } from '@/utils/displayUtils';

interface FundCardProps {
  fund: MutualFund & {
    downsideRisk?: 'low' | 'moderate' | 'high';
    suitabilityBadge?: 'aligned' | 'adjusted' | 'limited';
    reasons?: string[];
    matchScore?: number;
    reason?: string;
    profile?: string;
    allocationPercent?: number;
  };
  onClick?: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: (fund: MutualFund) => void;
}

const getCategoryColor = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.startsWith('EQ-')) return 'bg-primary/20 text-primary border-primary/30';
  if (cat.startsWith('DT-')) return 'bg-success/20 text-success border-success/30';
  if (cat.startsWith('HY-')) return 'bg-warning/20 text-warning border-warning/30';
  if (cat.includes('GOLD') || cat.includes('SILVER')) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  return 'bg-muted text-muted-foreground';
};

const getRiskLabel = (category: string): string => {
  const cat = category.toUpperCase();
  if (cat.includes('SC') || cat.includes('THEMATIC') || cat.includes('SA&T') || cat.includes('PSU') || cat.includes('ENERGY')) return 'High Risk';
  if (cat.startsWith('DT-LIQ') || cat.includes('OVERNHT') || cat.includes('MM')) return 'Low Risk';
  if (cat.startsWith('DT-')) return 'Low to Moderate Risk';
  if (cat.startsWith('HY-')) return 'Moderate Risk';
  if (cat.includes('LC') || cat.includes('L&MC') || cat.includes('FLX') || cat.includes('MLC')) return 'Moderate Risk';
  if (cat.includes('MC')) return 'Moderately High Risk';
  return 'Moderate Risk';
};

const getDisplayCategory = (category: string): string => {
  const label = CATEGORY_LABELS[category];
  if (label) {
    const cat = category.toUpperCase();
    const assetClass = cat.startsWith('EQ-') ? 'EQUITY' : cat.startsWith('DT-') ? 'DEBT' : cat.startsWith('HY-') ? 'HYBRID' : '';
    if (assetClass) return `${assetClass}, ${label}`;
    return label;
  }
  return category;
};

function fmtVal(val: number | null | undefined, decimals = 1, suffix = ''): string {
  if (val === null || val === undefined) return 'NA';
  return `${val.toFixed(decimals)}${suffix}`;
}

export function FundCard({ fund, onClick, isBookmarked = false, onBookmarkToggle }: FundCardProps) {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmarkToggle?.(fund);
  };

  return (
    <Card 
      className={cn(
        "glass-card hover-lift cursor-pointer group relative overflow-hidden",
        "transition-all duration-300"
      )}
      onClick={onClick}
    >
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-4 right-4 h-10 w-10 p-0 z-10"
        onClick={handleBookmarkClick}
      >
        <Bookmark 
          className={cn(
            "h-5 w-5 transition-colors",
            isBookmarked 
              ? "fill-primary text-primary" 
              : "text-muted-foreground hover:text-primary"
          )} 
        />
      </Button>

      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2 pr-12">
            <Badge variant="outline" className={cn(getCategoryColor(fund.category), "text-xs px-2.5 py-0.5")}>
              {getDisplayCategory(fund.category)}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 pr-12 leading-snug">
            {fund.name}
          </h3>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{fund.amc}</span>
            <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full">{getRiskLabel(fund.category)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-5 pb-5">
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* 1Y Return */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">1Y Return</p>
            <p className={cn(
              "text-lg font-bold",
              (fund.ret1Y ?? fund.cagr1Y) === null || (fund.ret1Y ?? fund.cagr1Y) === undefined
                ? "text-muted-foreground" : (fund.ret1Y ?? fund.cagr1Y)! >= 0 ? "text-success" : "text-destructive"
            )}>
              {(fund.ret1Y ?? fund.cagr1Y) !== null && (fund.ret1Y ?? fund.cagr1Y) !== undefined
                ? `${(fund.ret1Y ?? fund.cagr1Y)! >= 0 ? '+' : ''}${(fund.ret1Y ?? fund.cagr1Y)!.toFixed(1)}%`
                : 'NA'}
            </p>
          </div>

          {/* 3Y Return */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">3Y Return</p>
            <p className={cn(
              "text-lg font-bold",
              (fund.ret3Y ?? fund.cagr3Y) === null || (fund.ret3Y ?? fund.cagr3Y) === undefined
                ? "text-muted-foreground" : (fund.ret3Y ?? fund.cagr3Y)! >= 0 ? "text-success" : "text-destructive"
            )}>
              {(fund.ret3Y ?? fund.cagr3Y) !== null && (fund.ret3Y ?? fund.cagr3Y) !== undefined
                ? `${(fund.ret3Y ?? fund.cagr3Y)! >= 0 ? '+' : ''}${(fund.ret3Y ?? fund.cagr3Y)!.toFixed(1)}%`
                : 'NA'}
            </p>
          </div>

          {/* Expense Ratio */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Expense Ratio</p>
            <p className="text-lg font-bold text-foreground">{fmtVal(fund.expenseRatio, 2, '%')}</p>
          </div>

          {/* AUM */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">AUM</p>
            <p className="text-lg font-bold text-foreground">{formatAUM(fund.aum)}</p>
          </div>
        </div>

        {/* Allocation % */}
        {fund.allocationPercent !== undefined && fund.allocationPercent > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10 text-center">
            <span className="text-xs text-muted-foreground">Target Allocation: </span>
            <span className="text-sm font-semibold text-primary">{fund.allocationPercent.toFixed(0)}%</span>
          </div>
        )}

        {/* Recommendation Reason */}
        {fund.reason && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Why this fund?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{fund.reason}</p>
          </div>
        )}

        {/* Legacy reasons fallback */}
        {!fund.reason && fund.reasons && fund.reasons.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Why this fund?</span>
            </div>
            <ul className="space-y-1">
              {fund.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-primary/60 mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
