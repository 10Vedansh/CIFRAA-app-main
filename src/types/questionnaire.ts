export const GOALS = {
  WEALTH_CREATION: 'Wealth Creation',
  RETIREMENT: 'Retirement',
  FAMILY_GOALS: 'Family Goals',
  PASSIVE_INCOME: 'Passive Income',
  TAX_SAVING: 'Tax Saving',
  PRESERVATION: 'Preservation',
} as const;

export const HORIZONS = {
  LESS_THAN_1Y: '< 1 Year',
  ONE_TO_THREE_Y: '1–3 Years',
  THREE_TO_FIVE_Y: '3–5 Years',
  FIVE_TO_TEN_Y: '5–10 Years',
  TEN_Y_PLUS: '10 Years+',
} as const;

export const MARKET_REACTIONS = {
  WITHDRAW: 'Withdraw',
  WAIT_AND_WATCH: 'Wait & Watch',
  SIP_THROUGH: 'SIP through it',
  BUY_THE_DIP: 'Buy the Dip',
} as const;

export const EXPERIENCE_LEVELS = {
  FIRST_TIME: 'First-Time',
  SOME_EXPERIENCE: 'Some Experience',
  EXPERIENCED: 'Experienced',
} as const;

export const EXISTING_INVESTMENTS = {
  NONE: 'None',
  UNDER_5L: 'Under ₹5L',
  FIVE_TO_25L: '₹5L – ₹25L',
  ABOVE_25L: '₹25L+',
} as const;

export const EMERGENCY_FUND_STATUS = {
  LESS_THAN_3M: '< 3 Months',
  THREE_TO_6M: '3-6 Months',
  SIX_M_PLUS: '6 Months+',
} as const;

export const INVESTOR_STAGES = {
  STUDENT: 'Student',
  EARLY_CAREER: 'Early Career',
  MID_CAREER: 'Mid-Career',
  BUSINESS_OWNER: 'Business Owner',
  RETIRED: 'Retired',
} as const;

// Labels for UI display (mirrors enums so UI shows readable text)
export const GOAL_LABELS: Record<string, string> = {
  [GOALS.WEALTH_CREATION]: 'Wealth Creation',
  [GOALS.RETIREMENT]: 'Retirement',
  [GOALS.FAMILY_GOALS]: 'Family Goals',
  [GOALS.PASSIVE_INCOME]: 'Passive Income',
  [GOALS.TAX_SAVING]: 'Tax Saving',
  [GOALS.PRESERVATION]: 'Preservation',
};

export const HORIZON_LABELS: Record<string, string> = {
  [HORIZONS.LESS_THAN_1Y]: 'Immediate / very short-term',
  [HORIZONS.ONE_TO_THREE_Y]: 'Short-term goals',
  [HORIZONS.THREE_TO_FIVE_Y]: 'Medium-term planning',
  [HORIZONS.FIVE_TO_TEN_Y]: 'Long-term growth',
  [HORIZONS.TEN_Y_PLUS]: 'Very long-term wealth',
};

export const MARKET_REACTION_LABELS: Record<string, string> = {
  [MARKET_REACTIONS.WITHDRAW]: 'Exit at first sign of trouble',
  [MARKET_REACTIONS.WAIT_AND_WATCH]: 'Observe before deciding',
  [MARKET_REACTIONS.SIP_THROUGH]: 'Continue investing through volatility',
  [MARKET_REACTIONS.BUY_THE_DIP]: 'See opportunity in downturns',
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  [EXPERIENCE_LEVELS.FIRST_TIME]: 'New to investing',
  [EXPERIENCE_LEVELS.SOME_EXPERIENCE]: 'Have invested before',
  [EXPERIENCE_LEVELS.EXPERIENCED]: 'Regular investor',
};

export const EXISTING_INVESTMENTS_LABELS: Record<string, string> = {
  [EXISTING_INVESTMENTS.NONE]: 'No current investments',
  [EXISTING_INVESTMENTS.UNDER_5L]: 'Less than 5 lakhs',
  [EXISTING_INVESTMENTS.FIVE_TO_25L]: 'Between 5-25 lakhs',
  [EXISTING_INVESTMENTS.ABOVE_25L]: 'More than 25 lakhs',
};

export const EMERGENCY_FUND_LABELS: Record<string, string> = {
  [EMERGENCY_FUND_STATUS.LESS_THAN_3M]: 'Less than 3 months expenses',
  [EMERGENCY_FUND_STATUS.THREE_TO_6M]: '3-6 months of expenses',
  [EMERGENCY_FUND_STATUS.SIX_M_PLUS]: 'More than 6 months expenses',
};

export const INVESTOR_STAGE_LABELS: Record<string, string> = {
  [INVESTOR_STAGES.STUDENT]: 'Pursuing education',
  [INVESTOR_STAGES.EARLY_CAREER]: 'Building foundation',
  [INVESTOR_STAGES.MID_CAREER]: 'Growing responsibilities',
  [INVESTOR_STAGES.BUSINESS_OWNER]: 'Entrepreneurial income',
  [INVESTOR_STAGES.RETIRED]: 'Post-retirement life',
};

export const ALL_HORIZONS: string[] = Object.values(HORIZONS);
export const ALL_GOALS: string[] = Object.values(GOALS);
export const ALL_MARKET_REACTIONS: string[] = Object.values(MARKET_REACTIONS);
export const ALL_EXPERIENCE_LEVELS: string[] = Object.values(EXPERIENCE_LEVELS);
export const ALL_EXISTING_INVESTMENTS: string[] = Object.values(EXISTING_INVESTMENTS);
export const ALL_EMERGENCY_FUND_STATUS: string[] = Object.values(EMERGENCY_FUND_STATUS);
export const ALL_INVESTOR_STAGES: string[] = Object.values(INVESTOR_STAGES);
