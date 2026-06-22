import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, User, Target, Clock, TrendingUp, GraduationCap, Wallet, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeTotalScore, getProfile, QuestionnaireAnswers, InvestorProfile } from '@/utils/newRecommendationEngine';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const SECTIONS: { key: keyof QuestionnaireAnswers; label: string; icon: React.ElementType; options: { value: string; desc: string }[] }[] = [
  {
    key: 'investorStage', label: 'Investor Stage', icon: User,
    options: [
      { value: 'Student', desc: 'Pursuing education' },
      { value: 'Early Career', desc: 'Building foundation' },
      { value: 'Mid-Career', desc: 'Growing responsibilities' },
      { value: 'Business Owner', desc: 'Entrepreneurial income' },
      { value: 'Retired', desc: 'Post-retirement life' },
    ],
  },
  {
    key: 'primaryGoal', label: 'Primary Goal', icon: Target,
    options: [
      { value: 'Wealth Creation', desc: 'Long-term wealth building' },
      { value: 'Retirement', desc: 'Retirement corpus' },
      { value: 'Family Goals', desc: 'Children education / marriage' },
      { value: 'Passive Income', desc: 'Regular income stream' },
      { value: 'Tax Saving', desc: 'Section 80C benefits' },
      { value: 'Preservation', desc: 'Capital protection' },
    ],
  },
  {
    key: 'investmentHorizon', label: 'Investment Horizon', icon: Clock,
    options: [
      { value: '< 3 Years', desc: 'Short-term goals' },
      { value: '3-5 Years', desc: 'Medium-term planning' },
      { value: '5-10 Years', desc: 'Long-term growth' },
      { value: '10 Years+', desc: 'Very long-term wealth' },
    ],
  },
  {
    key: 'marketReaction', label: 'Market Reaction', icon: TrendingUp,
    options: [
      { value: 'Withdraw', desc: 'Exit at first sign of trouble' },
      { value: 'Wait & Watch', desc: 'Observe before deciding' },
      { value: 'Buy the Dip', desc: 'See opportunity in downturns' },
    ],
  },
  {
    key: 'experience', label: 'Experience', icon: GraduationCap,
    options: [
      { value: 'First-Time', desc: 'New to investing' },
      { value: 'Some Experience', desc: 'Have invested before' },
      { value: 'Experienced', desc: 'Regular investor' },
    ],
  },
  {
    key: 'existingInvestments', label: 'Existing Investments', icon: Wallet,
    options: [
      { value: 'None', desc: 'No current investments' },
      { value: 'Under ₹5L', desc: 'Less than 5 lakhs' },
      { value: '₹5L – ₹25L', desc: 'Between 5-25 lakhs' },
      { value: '₹25L+', desc: 'More than 25 lakhs' },
    ],
  },
  {
    key: 'emergencyFund', label: 'Emergency Fund', icon: Shield,
    options: [
      { value: '< 3 Months', desc: 'Less than 3 months expenses' },
      { value: '3-6 Months', desc: '3-6 months of expenses' },
      { value: '6 Months+', desc: 'More than 6 months expenses' },
    ],
  },
];

const PROFILES: { key: InvestorProfile; range: string; color: string; bg: string; desc: string; riskLevel: string; shortDesc: string }[] = [
  { key: 'Conservative', range: '7 – 12', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', desc: 'Focus on capital preservation and stable growth.', riskLevel: 'Low', shortDesc: 'Capital Preservation' },
  { key: 'Moderate', range: '13 – 18', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', desc: 'Balanced growth with controlled risk.', riskLevel: 'Moderate', shortDesc: 'Balanced Growth' },
  { key: 'Growth', range: '19 – 24', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', desc: 'Long-term wealth creation with moderate volatility.', riskLevel: 'Moderate-High', shortDesc: 'Wealth Creation' },
  { key: 'Aggressive', range: '25+', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', desc: 'High-growth strategy with higher market risk.', riskLevel: 'High', shortDesc: 'High Growth' },
];

export function PreferencesModal({ isOpen, onClose, onSaved }: PreferencesModalProps) {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<QuestionnaireAnswers>({
    investorStage: '', primaryGoal: '', investmentHorizon: '',
    marketReaction: '', experience: '', existingInvestments: '', emergencyFund: '',
  });
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (profile && isOpen) {
      setPreferences({
        investorStage: profile.investor_stage || '',
        primaryGoal: profile.primary_goal || '',
        investmentHorizon: profile.investment_horizon || '',
        marketReaction: profile.market_reaction || '',
        experience: profile.experience_level || '',
        existingInvestments: profile.existing_investments_range || '',
        emergencyFund: profile.emergency_fund || '',
      });
    }
  }, [profile, isOpen]);

  const totalScore = useMemo(() => computeTotalScore(preferences), [preferences]);
  const investorProfile = useMemo((): InvestorProfile | null => {
    const hasAny = Object.values(preferences).some(v => v !== '');
    if (!hasAny) return null;
    return getProfile(totalScore);
  }, [preferences, totalScore]);

  const updateField = useCallback((field: keyof QuestionnaireAnswers, value: string) => {
    setHasInteracted(true);
    setPreferences(prev => ({ ...prev, [field]: value }));
  }, []);

  const allFilled = useMemo(() => Object.values(preferences).every(v => v !== ''), [preferences]);
  const missingCount = useMemo(() => Object.values(preferences).filter(v => !v).length, [preferences]);

  const handleSubmit = async () => {
    if (!allFilled) {
      toast.error(`Please answer all questions (${missingCount} remaining).`);
      return;
    }
    setIsLoading(true);
    try {
      await updateProfile({
        investor_stage: preferences.investorStage,
        primary_goal: preferences.primaryGoal,
        investment_horizon: preferences.investmentHorizon,
        market_reaction: preferences.marketReaction,
        experience_level: preferences.experience,
        existing_investments_range: preferences.existingInvestments,
        emergency_fund: preferences.emergencyFund,
        investor_profile: investorProfile,
        total_score: totalScore,
        onboarding_completed: true,
      });
      await refreshProfile();
      toast.success(`Saved! You're a ${investorProfile} investor (Score: ${totalScore}).`);
      onSaved?.();
      onClose();
    } catch {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const profileInfo = investorProfile ? PROFILES.find(p => p.key === investorProfile) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Investment Preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {SECTIONS.map(section => (
            <div key={section.key} className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-foreground/80">
                <section.icon className="h-4 w-4 text-primary" />
                {section.label}
              </label>
              <div className="space-y-1.5">
                {section.options.map(opt => {
                  const selected = preferences[section.key] === opt.value;
                  return (
                    <Card
                      key={opt.value}
                      className={cn(
                        'cursor-pointer transition-all duration-200 border',
                        selected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-primary/40 hover:bg-secondary/30',
                      )}
                      onClick={() => updateField(section.key, opt.value)}
                    >
                      <CardContent className="p-3.5 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={cn('font-medium text-sm', selected ? 'text-primary' : 'text-foreground')}>
                            {opt.value}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                        <div className={cn(
                          'h-5 w-5 rounded-full border-2 flex-shrink-0 ml-3 flex items-center justify-center transition-all',
                          selected ? 'border-primary' : 'border-muted-foreground/30',
                        )}>
                          {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Your Investor Profile */}
          {investorProfile && profileInfo && (
            <div className={cn('rounded-xl border p-5 space-y-3', profileInfo.bg)}>
              <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Your Investor Profile</p>
              <div className="flex items-center justify-between">
                <span className={cn('text-2xl font-bold', profileInfo.color)}>{investorProfile}</span>
                <span className="text-sm font-medium text-muted-foreground">Risk: {profileInfo.riskLevel}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{profileInfo.desc}</p>
            </div>
          )}

          {hasInteracted && !allFilled && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Please answer all {missingCount} remaining question{missingCount > 1 ? 's' : ''} before saving.</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !allFilled}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
