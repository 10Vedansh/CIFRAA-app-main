import { InvestmentGoal, PersonaId, RiskOrientation } from '@/types/engine';

export interface PersonaInfo {
  personaId: PersonaId;
  personaName: string;
  description: string;
  riskOrientation: RiskOrientation;
}

const DESCRIPTIONS: Record<PersonaId, string> = {
  capital_shield: 'Focused on protecting capital while generating stable inflation-beating returns.',
  cautious_accumulator: 'Seeks steady growth with a strong preference for capital preservation.',
  steady_income_builder: 'Focused on generating regular income with low portfolio volatility.',
  balanced_foundation: 'Building a balanced portfolio for medium-term financial goals.',
  disciplined_accumulator: 'Systematically building wealth through consistent long-term investing.',
  goal_oriented_builder: 'Focused on achieving specific financial goals within defined timeframes.',
  tax_efficient_growth: 'Optimising for tax efficiency while pursuing long-term capital appreciation.',
  retirement_growth: 'Focused on building a retirement corpus through disciplined long-term investing.',
  preretirement_consolidator: 'Protecting accumulated retirement savings as retirement approaches.',
  long_term_compounder: 'Patiently compounding wealth over extended time horizons.',
  balanced_wealth_creator: 'Seeking steady long-term growth with controlled risk.',
  opportunity_seeker: 'Actively seeking market opportunities for tactical alpha generation.',
  aggressive_wealth_builder: 'Focused on maximum long-term wealth creation, accepting higher volatility.',
  alpha_hunter: 'Pursuing significant outperformance through concentrated high-conviction positions.',
  student_compounder: 'Beginning the investment journey with a focus on learning and steady compounding.',
  cautious_opportunist: 'Balancing capital preservation with selective opportunity capture.',
  income_inflation_hedge: 'Generating real returns after inflation through diversified income sources.',
  passive_core_builder: 'Building wealth through low-cost passive investments and evidence-based strategies.',
};

/**
 * Map a primary investment goal to one of 18 personas.
 * Goal is the primary driver; the persona refines the goal with an investment style.
 */
export function mapPersona(goal: InvestmentGoal): PersonaInfo {
  switch (goal) {
    case 'Preservation':
      return { personaId: 'capital_shield', personaName: 'Capital Preservation Investor', description: DESCRIPTIONS.capital_shield, riskOrientation: 'Ultra-Conservative' };
    case 'Passive Income':
      return { personaId: 'steady_income_builder', personaName: 'Steady Income Builder', description: DESCRIPTIONS.steady_income_builder, riskOrientation: 'Conservative' };
    case 'Retirement':
      return { personaId: 'retirement_growth', personaName: 'Retirement Growth Planner', description: DESCRIPTIONS.retirement_growth, riskOrientation: 'Moderate' };
    case 'Tax Saving':
      return { personaId: 'tax_efficient_growth', personaName: 'Tax-Efficient Growth Investor', description: DESCRIPTIONS.tax_efficient_growth, riskOrientation: 'Moderate-Aggressive' };
    case 'Family Goals':
      return { personaId: 'goal_oriented_builder', personaName: 'Goal-Oriented Builder', description: DESCRIPTIONS.goal_oriented_builder, riskOrientation: 'Moderate' };
    case 'Wealth Creation':
      return { personaId: 'aggressive_wealth_builder', personaName: 'Aggressive Wealth Builder', description: DESCRIPTIONS.aggressive_wealth_builder, riskOrientation: 'Very Aggressive' };
  }
}

