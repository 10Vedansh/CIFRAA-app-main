import { useState, useEffect, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, User, Target, Clock, TrendingUp, GraduationCap, Wallet, Shield, AlertCircle, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  INVESTOR_STAGES, INVESTOR_STAGE_LABELS,
  GOALS, GOAL_LABELS,
  HORIZONS, HORIZON_LABELS,
  MARKET_REACTIONS, MARKET_REACTION_LABELS,
  EXPERIENCE_LEVELS, EXPERIENCE_LABELS,
  EXISTING_INVESTMENTS, EXISTING_INVESTMENTS_LABELS,
  EMERGENCY_FUND_STATUS, EMERGENCY_FUND_LABELS,
} from '@/types/questionnaire';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface Option {
  value: string;
  label: string;
  desc: string;
}

interface Section {
  key: string;
  label: string;
  icon: React.ElementType;
  options?: Option[];
  type?: 'select' | 'slider';
  min?: number;
  max?: number;
}

function buildOptions(values: Record<string, string>, labels: Record<string, string>, descs: Record<string, string>): Option[] {
  return Object.values(values).map(v => ({ value: v, label: labels[v] || v, desc: descs[v] || v }));
}

const SECTIONS: Section[] = [
  {
    key: 'investorStage', label: 'Investor Stage', icon: User,
    options: [
      { value: INVESTOR_STAGES.STUDENT, label: 'Student', desc: INVESTOR_STAGE_LABELS[INVESTOR_STAGES.STUDENT] },
      { value: INVESTOR_STAGES.EARLY_CAREER, label: 'Early Career', desc: INVESTOR_STAGE_LABELS[INVESTOR_STAGES.EARLY_CAREER] },
      { value: INVESTOR_STAGES.MID_CAREER, label: 'Mid-Career', desc: INVESTOR_STAGE_LABELS[INVESTOR_STAGES.MID_CAREER] },
      { value: INVESTOR_STAGES.BUSINESS_OWNER, label: 'Business Owner', desc: INVESTOR_STAGE_LABELS[INVESTOR_STAGES.BUSINESS_OWNER] },
      { value: INVESTOR_STAGES.RETIRED, label: 'Retired', desc: INVESTOR_STAGE_LABELS[INVESTOR_STAGES.RETIRED] },
    ],
  },
  {
    key: 'primaryGoal', label: 'Primary Goal', icon: Target,
    options: [
      { value: GOALS.WEALTH_CREATION, label: 'Wealth Creation', desc: GOAL_LABELS[GOALS.WEALTH_CREATION] },
      { value: GOALS.RETIREMENT, label: 'Retirement', desc: GOAL_LABELS[GOALS.RETIREMENT] },
      { value: GOALS.FAMILY_GOALS, label: 'Family Goals', desc: GOAL_LABELS[GOALS.FAMILY_GOALS] },
      { value: GOALS.PASSIVE_INCOME, label: 'Passive Income', desc: GOAL_LABELS[GOALS.PASSIVE_INCOME] },
      { value: GOALS.TAX_SAVING, label: 'Tax Saving', desc: GOAL_LABELS[GOALS.TAX_SAVING] },
      { value: GOALS.PRESERVATION, label: 'Preservation', desc: GOAL_LABELS[GOALS.PRESERVATION] },
    ],
  },
  {
    key: 'investmentHorizon', label: 'Investment Horizon', icon: Clock,
    options: [
      { value: HORIZONS.LESS_THAN_1Y, label: '< 1 Year', desc: HORIZON_LABELS[HORIZONS.LESS_THAN_1Y] },
      { value: HORIZONS.ONE_TO_THREE_Y, label: '1–3 Years', desc: HORIZON_LABELS[HORIZONS.ONE_TO_THREE_Y] },
      { value: HORIZONS.THREE_TO_FIVE_Y, label: '3–5 Years', desc: HORIZON_LABELS[HORIZONS.THREE_TO_FIVE_Y] },
      { value: HORIZONS.FIVE_TO_TEN_Y, label: '5–10 Years', desc: HORIZON_LABELS[HORIZONS.FIVE_TO_TEN_Y] },
      { value: HORIZONS.TEN_Y_PLUS, label: '10 Years+', desc: HORIZON_LABELS[HORIZONS.TEN_Y_PLUS] },
    ],
  },
  {
    key: 'marketReaction', label: 'Market Reaction', icon: TrendingUp,
    options: [
      { value: MARKET_REACTIONS.WITHDRAW, label: 'Withdraw', desc: MARKET_REACTION_LABELS[MARKET_REACTIONS.WITHDRAW] },
      { value: MARKET_REACTIONS.WAIT_AND_WATCH, label: 'Wait & Watch', desc: MARKET_REACTION_LABELS[MARKET_REACTIONS.WAIT_AND_WATCH] },
      { value: MARKET_REACTIONS.SIP_THROUGH, label: 'SIP through it', desc: MARKET_REACTION_LABELS[MARKET_REACTIONS.SIP_THROUGH] },
      { value: MARKET_REACTIONS.BUY_THE_DIP, label: 'Buy the Dip', desc: MARKET_REACTION_LABELS[MARKET_REACTIONS.BUY_THE_DIP] },
    ],
  },
  {
    key: 'riskTolerance', label: 'Risk Tolerance', icon: Gauge,
    type: 'slider', min: 1, max: 10,
  },
  {
    key: 'experience', label: 'Experience', icon: GraduationCap,
    options: [
      { value: EXPERIENCE_LEVELS.FIRST_TIME, label: 'First-Time', desc: EXPERIENCE_LABELS[EXPERIENCE_LEVELS.FIRST_TIME] },
      { value: EXPERIENCE_LEVELS.SOME_EXPERIENCE, label: 'Some Experience', desc: EXPERIENCE_LABELS[EXPERIENCE_LEVELS.SOME_EXPERIENCE] },
      { value: EXPERIENCE_LEVELS.EXPERIENCED, label: 'Experienced', desc: EXPERIENCE_LABELS[EXPERIENCE_LEVELS.EXPERIENCED] },
    ],
  },
  {
    key: 'existingInvestments', label: 'Existing Investments', icon: Wallet,
    options: [
      { value: EXISTING_INVESTMENTS.NONE, label: 'None', desc: EXISTING_INVESTMENTS_LABELS[EXISTING_INVESTMENTS.NONE] },
      { value: EXISTING_INVESTMENTS.UNDER_5L, label: 'Under ₹5L', desc: EXISTING_INVESTMENTS_LABELS[EXISTING_INVESTMENTS.UNDER_5L] },
      { value: EXISTING_INVESTMENTS.FIVE_TO_25L, label: '₹5L – ₹25L', desc: EXISTING_INVESTMENTS_LABELS[EXISTING_INVESTMENTS.FIVE_TO_25L] },
      { value: EXISTING_INVESTMENTS.ABOVE_25L, label: '₹25L+', desc: EXISTING_INVESTMENTS_LABELS[EXISTING_INVESTMENTS.ABOVE_25L] },
    ],
  },
  {
    key: 'emergencyFund', label: 'Emergency Fund', icon: Shield,
    options: [
      { value: EMERGENCY_FUND_STATUS.LESS_THAN_3M, label: '< 3 Months', desc: EMERGENCY_FUND_LABELS[EMERGENCY_FUND_STATUS.LESS_THAN_3M] },
      { value: EMERGENCY_FUND_STATUS.THREE_TO_6M, label: '3-6 Months', desc: EMERGENCY_FUND_LABELS[EMERGENCY_FUND_STATUS.THREE_TO_6M] },
      { value: EMERGENCY_FUND_STATUS.SIX_M_PLUS, label: '6 Months+', desc: EMERGENCY_FUND_LABELS[EMERGENCY_FUND_STATUS.SIX_M_PLUS] },
    ],
  },
];

export function PreferencesModal({ isOpen, onClose, onSaved }: PreferencesModalProps) {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<QuestionnaireAnswers & { riskSlider: number }>({
    investorStage: '', primaryGoal: '', investmentHorizon: '',
    marketReaction: '', experience: '', existingInvestments: '', emergencyFund: '',
    riskSlider: 5,
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
        riskSlider: (profile as any).risk_slider ?? 5,
      });
    }
  }, [profile, isOpen]);

  const updateField = useCallback((field: string, value: string | number) => {
    setHasInteracted(true);
    setPreferences(prev => ({ ...prev, [field]: value }));
  }, []);

  const { riskSlider: _rs, ...prefsWithoutSlider } = preferences;
  const allFilled = useMemo(() => Object.values(prefsWithoutSlider).every(v => v !== ''), [prefsWithoutSlider]);
  const missingCount = useMemo(() => Object.values(prefsWithoutSlider).filter(v => !v).length, [prefsWithoutSlider]);

  const handleSubmit = async () => {
    if (!allFilled) {
      toast.error(`Please answer all questions (${missingCount} remaining).`);
      return;
    }
    setIsLoading(true);
    try {
      console.log('[PreferencesModal] Saving preferences', preferences);
      const result = await updateProfile({
        investor_stage: preferences.investorStage,
        primary_goal: preferences.primaryGoal,
        investment_horizon: preferences.investmentHorizon,
        market_reaction: preferences.marketReaction,
        experience_level: preferences.experience,
        existing_investments_range: preferences.existingInvestments,
        emergency_fund: preferences.emergencyFund,
        onboarding_completed: true,
        risk_slider: preferences.riskSlider,
      });
      if (result.error) {
        console.error('[PreferencesModal] updateProfile returned error', result.error);
        toast.error('Failed to save preferences. Please try again.');
        return;
      }
      await refreshProfile();
      const savedProfile = localStorage.getItem('cifraa_user_profile');
      console.log('[PreferencesModal] Profile saved', savedProfile ? JSON.parse(savedProfile) : null);
      toast.success('Preferences saved successfully!');
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('[PreferencesModal] Preference save failed', err);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

              {section.type === 'slider' ? (
                <div className="px-1 py-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Low Risk</span>
                    <span className="font-bold text-base text-primary">{(preferences as any)[section.key] ?? 5}/10</span>
                    <span>High Risk</span>
                  </div>
                  <Slider
                    min={section.min ?? 1}
                    max={section.max ?? 10}
                    step={1}
                    value={[(preferences as any)[section.key] ?? 5]}
                    onValueChange={([v]) => updateField(section.key, v)}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(section.options ?? []).map(opt => {
                    const selected = (preferences as any)[section.key] === opt.value;
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
                                {opt.label}
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
              )}
            </div>
          ))}

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
