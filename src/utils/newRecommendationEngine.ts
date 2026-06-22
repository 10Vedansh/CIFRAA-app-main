import { MutualFund } from '@/types/mutualFund';

export interface QuestionnaireAnswers {
  investorStage: string;
  primaryGoal: string;
  investmentHorizon: string;
  marketReaction: string;
  experience: string;
  existingInvestments: string;
  emergencyFund: string;
}

export interface RecommendedFund extends MutualFund {
  matchScore: number;
  reason: string;
  profile: InvestorProfile;
  allocationPercent: number;
}

export type InvestorProfile = 'Conservative' | 'Moderate' | 'Growth' | 'Aggressive';

const STAGE_SCORES: Record<string, number> = {
  'Student': 2, 'Early Career': 3, 'Mid-Career': 3, 'Business Owner': 4, 'Retired': 1,
};
const GOAL_SCORES: Record<string, number> = {
  'Wealth Creation': 4, 'Retirement': 2, 'Family Goals': 2, 'Passive Income': 1, 'Tax Saving': 3, 'Preservation': 1,
};
const HORIZON_SCORES: Record<string, number> = {
  '< 3 Years': 1, '3-5 Years': 2, '5-10 Years': 3, '10 Years+': 4,
};
const REACTION_SCORES: Record<string, number> = {
  'Withdraw': 1, 'Wait & Watch': 2, 'Buy the Dip': 4,
};
const EXPERIENCE_SCORES: Record<string, number> = {
  'First-Time': 1, 'Some Experience': 2, 'Experienced': 4,
};
const INVESTMENT_SCORES: Record<string, number> = {
  'None': 1, 'Under ₹5L': 2, '₹5L – ₹25L': 3, '₹25L+': 4,
};
const EMERGENCY_SCORES: Record<string, number> = {
  '< 3 Months': 1, '3-6 Months': 2, '6 Months+': 4,
};

const PROFILE_RANGES: [InvestorProfile, number, number][] = [
  ['Conservative', 7, 12],
  ['Moderate', 13, 18],
  ['Growth', 19, 24],
  ['Aggressive', 25, 100],
];

interface ProfileCategory {
  categories: string[];
  allocationPercent: number;
}

const PROFILE_MAPPING: Record<InvestorProfile, ProfileCategory[]> = {
  Conservative: [
    { categories: ['INDEX'], allocationPercent: 35 },
    { categories: ['EQ-LC'], allocationPercent: 35 },
    { categories: ['HY-CH'], allocationPercent: 20 },
    { categories: ['DT-SD'], allocationPercent: 10 },
  ],
  Moderate: [
    { categories: ['EQ-LC'], allocationPercent: 30 },
    { categories: ['EQ-FLX'], allocationPercent: 30 },
    { categories: ['HY-DAA'], allocationPercent: 20 },
    { categories: ['HY-AH'], allocationPercent: 20 },
  ],
  Growth: [
    { categories: ['EQ-FLX'], allocationPercent: 30 },
    { categories: ['EQ-L&MC'], allocationPercent: 25 },
    { categories: ['EQ-MC'], allocationPercent: 25 },
    { categories: ['EQ-ELSS'], allocationPercent: 20 },
  ],
  Aggressive: [
    { categories: ['EQ-MC'], allocationPercent: 30 },
    { categories: ['EQ-SC'], allocationPercent: 30 },
    { categories: ['SECTORAL'], allocationPercent: 20 },
    { categories: ['EQ-FLX'], allocationPercent: 20 },
  ],
};

let indexFundIdCounter = 0;

function detectCategoryGroup(category: string, name: string): string {
  const cat = (category || '').trim();
  const n = name.toLowerCase();

  const isIndex = n.includes('index') || n.includes('nifty') || n.includes('sensex') || n.includes('etf');
  if (isIndex) return 'INDEX';

  if (['EQ-BANK', 'EQ-IT', 'EQ-Pharma', 'EQ-INFRA', 'EQ-PSU', 'EQ-Energy', 'EQ-Consumption',
    'EQ-THEMATIC', 'EQ-SA&T', 'EQ-TBC', 'EQ-Manufacturing', 'EQ-Innovation'].includes(cat)) return 'SECTORAL';

  const eqMap: Record<string, string> = {
    'EQ-LC': 'EQ-LC', 'EQ-MC': 'EQ-MC', 'EQ-SC': 'EQ-SC', 'EQ-L&MC': 'EQ-L&MC',
    'EQ-MLC': 'EQ-FLX', 'EQ-FLX': 'EQ-FLX', 'EQ-VAL': 'EQ-FLX', 'EQ-Quant': 'EQ-FLX',
    'EQ-ELSS': 'EQ-ELSS', 'EQ-DIV Y': 'EQ-LC',
  };
  if (eqMap[cat]) return eqMap[cat];

  const hyMap: Record<string, string> = {
    'HY-CH': 'HY-CH', 'HY-BH': 'HY-CH', 'HY-DAA': 'HY-DAA', 'HY-AH': 'HY-AH',
    'HY-AR': 'HY-CH', 'HY-MAA': 'HY-DAA', 'HY-EQ S': 'HY-CH', 'HY-IPA': 'HY-CH',
  };
  if (hyMap[cat]) return hyMap[cat];

  const dtMap: Record<string, string> = {
    'DT-SD': 'DT-SD', 'DT-LD': 'DT-SD', 'DT-MD': 'DT-SD', 'DT-CB': 'DT-SD',
    'DT-BK & PSU': 'DT-SD', 'DT-Floater': 'DT-SD',
    'DT-LIQ': 'DT-SD', 'DT-USD': 'DT-SD', 'DT-OVERNHT': 'DT-SD', 'DT-MM': 'DT-SD',
    'DT-GL': 'DT-SD', 'DT-TM': 'DT-SD', 'DT-LONG D': 'DT-SD', 'DT-M to LD': 'DT-SD',
    'DT-CR': 'DT-SD', 'DT-DB': 'DT-SD', 'DT-Gilt 10Y CD': 'DT-SD',
  };
  if (dtMap[cat]) return dtMap[cat];

  return cat;
}

function safeNum(val: number | null | undefined): number | null {
  if (val === null || val === undefined) return null;
  return isNaN(val) ? null : val;
}

export function computeTotalScore(answers: QuestionnaireAnswers): number {
  return (
    (STAGE_SCORES[answers.investorStage] || 0) +
    (GOAL_SCORES[answers.primaryGoal] || 0) +
    (HORIZON_SCORES[answers.investmentHorizon] || 0) +
    (REACTION_SCORES[answers.marketReaction] || 0) +
    (EXPERIENCE_SCORES[answers.experience] || 0) +
    (INVESTMENT_SCORES[answers.existingInvestments] || 0) +
    (EMERGENCY_SCORES[answers.emergencyFund] || 0)
  );
}

export function getProfile(totalScore: number): InvestorProfile {
  for (const [profile, min, max] of PROFILE_RANGES) {
    if (totalScore >= min && totalScore <= max) return profile;
  }
  return 'Moderate';
}

function computeFundScore(fund: MutualFund): number {
  const ret1Y = safeNum(fund.ret1Y ?? fund.cagr1Y) ?? 0;
  const ret3Y = safeNum(fund.ret3Y ?? fund.cagr3Y) ?? 0;
  const sharpe = safeNum(fund.sharpeRatio) ?? 0;
  const expense = safeNum(fund.expenseRatio) ?? 2.5;

  const returnsScore = (ret1Y + ret3Y) / 2;
  const riskScore = Math.min(sharpe * 10, 30);
  const consistencyScore = Math.min(ret3Y > 0 ? ret3Y * 2 : 0, 20);
  const expenseScore = Math.max(0, 10 - expense * 2);

  const score = 0.40 * returnsScore + 0.30 * riskScore + 0.20 * consistencyScore + 0.10 * expenseScore;
  return Math.max(score, 0);
}

function getRecommendationReason(fund: MutualFund, profile: InvestorProfile, answers: QuestionnaireAnswers): string {
  const parts: string[] = [`matches your ${profile} profile`];
  if (answers.investmentHorizon !== '< 3 Years') parts.push('long investment horizon');
  if (answers.marketReaction === 'Buy the Dip') parts.push('Buy-the-Dip market behavior');
  const goal = answers.primaryGoal.toLowerCase();
  if (goal === 'wealth creation' || goal === 'retirement') parts.push('wealth-building focus');
  if (goal === 'passive income') parts.push('income generation focus');
  if (goal === 'tax saving') parts.push('tax-saving objective');
  if (parts.length === 1) parts.push('diversification benefit');
  return `Recommended because it ${parts.join(', ')}.`;
}

function allocateFunds(allFunds: MutualFund[], profile: InvestorProfile, totalCategories: ProfileCategory[], answers: QuestionnaireAnswers): RecommendedFund[] {
  const result: RecommendedFund[] = [];

  for (const pc of totalCategories) {
    const categoryCodes = pc.categories;
    const matched: { fund: MutualFund; score: number }[] = [];

    for (const fund of allFunds) {
      const group = detectCategoryGroup(fund.category, fund.name);
      if (categoryCodes.includes(group) || categoryCodes.includes(fund.category)) {
        const score = computeFundScore(fund);
        matched.push({ fund, score });
      }
    }

    matched.sort((a, b) => b.score - a.score);
    const top = matched.slice(0, 2);

    for (const m of top) {
      result.push({
        ...m.fund,
        matchScore: m.score,
        reason: getRecommendationReason(m.fund, profile, answers),
        profile,
        allocationPercent: pc.allocationPercent / Math.max(top.length, 1),
      });
    }
  }

  result.sort((a, b) => b.matchScore - a.matchScore);
  return result;
}

export function recommendFunds(
  funds: MutualFund[],
  answers: QuestionnaireAnswers,
): RecommendedFund[] {
  const totalScore = computeTotalScore(answers);
  const profile = getProfile(totalScore);
  const categories = PROFILE_MAPPING[profile];

  return allocateFunds(funds, profile, categories, answers);
}

export { PROFILE_MAPPING };
