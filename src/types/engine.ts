export type InvestmentGoal =
  | 'Wealth Creation'
  | 'Retirement'
  | 'Family Goals'
  | 'Passive Income'
  | 'Tax Saving'
  | 'Preservation';

export type HorizonBand =
  | '< 1 Year'
  | '1–3 Years'
  | '3–5 Years'
  | '5–10 Years'
  | '10 Years+';

export type MarketBehaviour =
  | 'Withdraw'
  | 'Wait & Watch'
  | 'SIP through it'
  | 'Buy the Dip';

export type ExperienceLevel =
  | 'First-Time'
  | 'Some Experience'
  | 'Experienced';

export type EmergencyFundStatus =
  | 'None'
  | 'Less than 3 months'
  | '3–6 months'
  | '6 Months+';

export type ExistingInvestmentsOption =
  | 'None'
  | 'Under ₹5L'
  | '₹5L – ₹25L'
  | '₹25L+';

export interface RawAnswers {
  goal: InvestmentGoal;
  horizon: HorizonBand;
  riskSlider: number;
  marketBehaviour: MarketBehaviour;
  experience: ExperienceLevel;
  existingInvestments: ExistingInvestmentsOption;
  hasEmergencyFund: boolean;
}

export type PersonaId =
  | 'capital_shield'
  | 'cautious_accumulator'
  | 'steady_income_builder'
  | 'balanced_foundation'
  | 'disciplined_accumulator'
  | 'goal_oriented_builder'
  | 'tax_efficient_growth'
  | 'retirement_growth'
  | 'preretirement_consolidator'
  | 'long_term_compounder'
  | 'balanced_wealth_creator'
  | 'opportunity_seeker'
  | 'aggressive_wealth_builder'
  | 'alpha_hunter'
  | 'student_compounder'
  | 'cautious_opportunist'
  | 'income_inflation_hedge'
  | 'passive_core_builder';

export type RiskOrientation =
  | 'Ultra-Conservative'
  | 'Conservative'
  | 'Conservative-Moderate'
  | 'Moderate'
  | 'Moderate-Aggressive'
  | 'Aggressive'
  | 'Very Aggressive';

export interface ConflictFlag {
  id: string;
  description: string;
  resolution: string;
}

export interface InvestorPersona {
  personaId: PersonaId;
  personaName: string;
  description: string;
  riskOrientation: RiskOrientation;
  conflictFlags: ConflictFlag[];
}

export type ConstraintTier = 'mandatory' | 'preferred' | 'soft';

export interface Constraint {
  id: string;
  tier: ConstraintTier;
  rule: string;
}

export interface ConstraintSet {
  mandatory: Constraint[];
  preferred: Constraint[];
  soft: Constraint[];
}

export type CanonicalCategory =
  | 'LARGE_CAP'
  | 'LARGE_MID_CAP'
  | 'FLEXI_CAP'
  | 'MULTI_CAP'
  | 'MID_CAP'
  | 'SMALL_CAP'
  | 'ELSS'
  | 'INDEX_EQUITY'
  | 'INDEX_DEBT'
  | 'ETF_EQUITY'
  | 'ETF_GOLD'
  | 'ETF_DEBT'
  | 'HYBRID_CONSERVATIVE'
  | 'HYBRID_BALANCED'
  | 'HYBRID_AGGRESSIVE'
  | 'DEBT_LIQUID'
  | 'DEBT_OVERNIGHT'
  | 'DEBT_SHORT_TERM'
  | 'DEBT_MEDIUM_TERM'
  | 'DEBT_LONG_TERM'
  | 'DEBT_GILT'
  | 'DEBT_CORPORATE_BOND'
  | 'DEBT_BANKING_PSU'
  | 'DEBT_FLOATING_RATE'
  | 'DEBT_TARGET_MATURITY'
  | 'DEBT_DYNAMIC_BOND'
  | 'DEBT_MONEY_MARKET'
  | 'DEBT_CREDIT_RISK'
  | 'DEBT_OTHERS'
  | 'SECTORAL_BANKING'
  | 'SECTORAL_TECH'
  | 'SECTORAL_PHARMA'
  | 'SECTORAL_INFRA'
  | 'THEMATIC'
  | 'GOLD_FUND'
  | 'SILVER_FUND'
  | 'INTERNATIONAL'
  | 'FOF'
  | 'UNKNOWN';

export const CANONICAL_LABELS: Record<CanonicalCategory, string> = {
  LARGE_CAP: 'Large Cap',
  LARGE_MID_CAP: 'Large & Mid Cap',
  FLEXI_CAP: 'Flexi Cap',
  MULTI_CAP: 'Multi Cap',
  MID_CAP: 'Mid Cap',
  SMALL_CAP: 'Small Cap',
  ELSS: 'ELSS (Tax Saving)',
  INDEX_EQUITY: 'Index Fund - Equity',
  INDEX_DEBT: 'Index Fund - Debt',
  ETF_EQUITY: 'ETF - Equity',
  ETF_GOLD: 'ETF - Gold',
  ETF_DEBT: 'ETF - Debt',
  HYBRID_CONSERVATIVE: 'Conservative Hybrid',
  HYBRID_BALANCED: 'Balanced Advantage / DAA',
  HYBRID_AGGRESSIVE: 'Aggressive Hybrid',
  DEBT_LIQUID: 'Liquid Fund',
  DEBT_OVERNIGHT: 'Overnight Fund',
  DEBT_SHORT_TERM: 'Short Duration',
  DEBT_MEDIUM_TERM: 'Medium Duration',
  DEBT_LONG_TERM: 'Long Duration',
  DEBT_GILT: 'Gilt Fund',
  DEBT_CORPORATE_BOND: 'Corporate Bond',
  DEBT_BANKING_PSU: 'Banking & PSU',
  DEBT_FLOATING_RATE: 'Floating Rate',
  DEBT_TARGET_MATURITY: 'Target Maturity',
  DEBT_DYNAMIC_BOND: 'Dynamic Bond',
  DEBT_MONEY_MARKET: 'Money Market',
  DEBT_CREDIT_RISK: 'Credit Risk',
  DEBT_OTHERS: 'Other Debt',
  SECTORAL_BANKING: 'Sectoral - Banking',
  SECTORAL_TECH: 'Sectoral - Technology',
  SECTORAL_PHARMA: 'Sectoral - Pharma',
  SECTORAL_INFRA: 'Sectoral - Infrastructure',
  THEMATIC: 'Thematic',
  GOLD_FUND: 'Gold Fund',
  SILVER_FUND: 'Silver Fund',
  INTERNATIONAL: 'International',
  FOF: 'Fund of Funds',
  UNKNOWN: 'Unknown',
};

export interface AllocationSlot {
  canonicalCategory: CanonicalCategory;
  percent: number;
  rationale: string;
}

export interface AllocationPlan {
  slots: AllocationSlot[];
  totalPercent: number;
  adjustmentsApplied: string[];
}

export interface RecommendedFund {
  fundId: string;
  fundName: string;
  canonicalCategory: CanonicalCategory;
  matchScore: number;
  allocationPercent: number;
  reason: string;
}

export interface ExplanationBundle {
  persona: string;
  allocationRationale: string[];
  fundReasons: string[];
  conflictWarnings: string[];
  dataQualityWarnings: string[];
}

export interface FinalPortfolio {
  investorPersona: InvestorPersona;
  allocationPlan: AllocationPlan;
  recommendedFunds: RecommendedFund[];
  explanations: ExplanationBundle;
  generatedAt: Date;
}
