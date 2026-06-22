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
  profile: string;
  allocationPercent: number;
}
