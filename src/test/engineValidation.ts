/**
 * Sprint 8 — Integration Validation Suite.
 *
 * Run in browser console:
 *   import { runAllTests } from '@/test/engineValidation';
 *   runAllTests().then(console.log);
 *
 * Tests:
 *   - All 18 personas produce a non-empty portfolio
 *   - All 12 Phase 9 edge cases resolve correctly
 *   - Every allocation sums to exactly 100
 *   - Zero-result portfolios never occur
 */

import { RawAnswers, InvestmentGoal, HorizonBand, MarketBehaviour, ExperienceLevel, ExistingInvestmentsOption } from '@/types/engine';
import { loadNormalisedUniverse } from '@/data/dataLoader';
import { buildPortfolio } from '@/engine/layer9-portfolio/portfolioConstructor';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

async function testPersona(
  name: string,
  answers: RawAnswers,
  expectedPersonaId?: string,
): Promise<TestResult> {
  try {
    const universe = await loadNormalisedUniverse();
    const portfolio = buildPortfolio(answers, universe);

    const allocSum = portfolio.allocationPlan.totalPercent;
    const hasFunds = portfolio.recommendedFunds.length > 0;
    const personaMatch = expectedPersonaId
      ? portfolio.investorPersona.personaId === expectedPersonaId
      : true;

    const issues: string[] = [];
    if (allocSum !== 100) issues.push(`allocation sum = ${allocSum} (expected 100)`);
    if (!hasFunds) issues.push('no recommendations (empty portfolio)');
    if (!personaMatch) issues.push(`persona ${portfolio.investorPersona.personaId} ≠ expected ${expectedPersonaId}`);

    return {
      name,
      passed: issues.length === 0,
      details: issues.length > 0
        ? issues.join('; ')
        : `OK — ${portfolio.investorPersona.personaName} (${portfolio.investorPersona.personaId}), ${portfolio.recommendedFunds.length} funds, ${allocSum}% allocated`,
    };
  } catch (err) {
    return { name, passed: false, details: `Error: ${err}` };
  }
}

export async function runAllPersonaTests(): Promise<TestResult[]> {
  const testCases: { name: string; answers: RawAnswers; expectedPersona?: string }[] = [
    { name: 'Capital Shield', expectedPersona: 'capital_shield', answers: { goal: 'Preservation', horizon: '< 1 Year', riskSlider: 1, marketBehaviour: 'Withdraw', experience: 'First-Time', existingInvestments: 'None', hasEmergencyFund: false } },
    { name: 'Cautious Accumulator', expectedPersona: 'cautious_accumulator', answers: { goal: 'Preservation', horizon: '3–5 Years', riskSlider: 3, marketBehaviour: 'Wait & Watch', experience: 'First-Time', existingInvestments: 'None', hasEmergencyFund: true } },
    { name: 'Steady Income Builder', expectedPersona: 'steady_income_builder', answers: { goal: 'Passive Income', horizon: '3–5 Years', riskSlider: 3, marketBehaviour: 'Wait & Watch', experience: 'Some Experience', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'Balanced Foundation Builder', expectedPersona: 'balanced_foundation', answers: { goal: 'Preservation', horizon: '5–10 Years', riskSlider: 4, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'Disciplined Accumulator', expectedPersona: 'disciplined_accumulator', answers: { goal: 'Wealth Creation', horizon: '5–10 Years', riskSlider: 5, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'Goal-Oriented Builder', expectedPersona: 'goal_oriented_builder', answers: { goal: 'Family Goals', horizon: '5–10 Years', riskSlider: 5, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'Tax-Efficient Growth', expectedPersona: 'tax_efficient_growth', answers: { goal: 'Tax Saving', horizon: '5–10 Years', riskSlider: 6, marketBehaviour: 'Buy the Dip', experience: 'Some Experience', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'Retirement Growth', expectedPersona: 'retirement_growth', answers: { goal: 'Retirement', horizon: '10 Years+', riskSlider: 5, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'Pre-Retirement Consolidator', expectedPersona: 'preretirement_consolidator', answers: { goal: 'Retirement', horizon: '3–5 Years', riskSlider: 3, marketBehaviour: 'Wait & Watch', experience: 'Experienced', existingInvestments: '₹25L+', hasEmergencyFund: true } },
    { name: 'Long-Term Compounder', expectedPersona: 'long_term_compounder', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 7, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'Balanced Wealth Creator', expectedPersona: 'balanced_wealth_creator', answers: { goal: 'Wealth Creation', horizon: '5–10 Years', riskSlider: 6, marketBehaviour: 'SIP through it', experience: 'Experienced', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'Opportunity Seeker', expectedPersona: 'opportunity_seeker', answers: { goal: 'Wealth Creation', horizon: '5–10 Years', riskSlider: 8, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'Aggressive Wealth Builder', expectedPersona: 'aggressive_wealth_builder', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 9, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹25L+', hasEmergencyFund: true } },
    { name: 'Alpha Hunter', expectedPersona: 'alpha_hunter', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 10, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹25L+', hasEmergencyFund: true } },
    { name: 'Student Compounder', expectedPersona: 'student_compounder', answers: { goal: 'Preservation', horizon: '10 Years+', riskSlider: 4, marketBehaviour: 'SIP through it', experience: 'First-Time', existingInvestments: 'None', hasEmergencyFund: true } },
    { name: 'Cautious Opportunist', expectedPersona: 'cautious_opportunist', answers: { goal: 'Preservation', horizon: '1–3 Years', riskSlider: 4, marketBehaviour: 'Buy the Dip', experience: 'First-Time', existingInvestments: 'None', hasEmergencyFund: false } },
    { name: 'Income + Inflation Hedge', expectedPersona: 'income_inflation_hedge', answers: { goal: 'Passive Income', horizon: '3–5 Years', riskSlider: 3, marketBehaviour: 'Wait & Watch', experience: 'Experienced', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'Passive Core Builder', expectedPersona: 'passive_core_builder', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 6, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
  ];

  const results: TestResult[] = [];
  for (const tc of testCases) {
    const r = await testPersona(tc.name, tc.answers, tc.expectedPersona);
    results.push(r);
  }
  return results;
}

export async function runEdgeCaseTests(): Promise<TestResult[]> {
  const edgeCases: { name: string; answers: RawAnswers }[] = [
    { name: 'TC-01: Student + Preservation', answers: { goal: 'Preservation', horizon: '< 1 Year', riskSlider: 2, marketBehaviour: 'Withdraw', experience: 'First-Time', existingInvestments: 'None', hasEmergencyFund: false } },
    { name: 'TC-02: Retired + Buy The Dip', answers: { goal: 'Preservation', horizon: '3–5 Years', riskSlider: 4, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'TC-03: Tax Saving + <3 Years', answers: { goal: 'Tax Saving', horizon: '1–3 Years', riskSlider: 4, marketBehaviour: 'Wait & Watch', experience: 'Some Experience', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'TC-04: No Emergency Fund', answers: { goal: 'Wealth Creation', horizon: '5–10 Years', riskSlider: 5, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: 'Under ₹5L', hasEmergencyFund: false } },
    { name: 'TC-05: No Existing Investments', answers: { goal: 'Wealth Creation', horizon: '5–10 Years', riskSlider: 6, marketBehaviour: 'SIP through it', experience: 'Some Experience', existingInvestments: 'None', hasEmergencyFund: true } },
    { name: 'TC-06: Very Aggressive (score 95)', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 10, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹25L+', hasEmergencyFund: true } },
    { name: 'TC-07: Very Conservative (score 5)', answers: { goal: 'Preservation', horizon: '< 1 Year', riskSlider: 1, marketBehaviour: 'Withdraw', experience: 'First-Time', existingInvestments: 'None', hasEmergencyFund: false } },
    { name: 'TC-08: Wealth Creation + Short Horizon (conflict)', answers: { goal: 'Wealth Creation', horizon: '< 1 Year', riskSlider: 7, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
    { name: 'TC-09: Preservation + Buy Dip (conflict)', answers: { goal: 'Preservation', horizon: '5–10 Years', riskSlider: 5, marketBehaviour: 'Buy the Dip', experience: 'Some Experience', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'TC-10: Beginner + Aggressive (conflict)', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 9, marketBehaviour: 'Buy the Dip', experience: 'First-Time', existingInvestments: 'Under ₹5L', hasEmergencyFund: true } },
    { name: 'TC-11: Horizon <1yr (cap)', answers: { goal: 'Wealth Creation', horizon: '< 1 Year', riskSlider: 8, marketBehaviour: 'Buy the Dip', experience: 'Experienced', existingInvestments: '₹25L+', hasEmergencyFund: true } },
    { name: 'TC-12: Risk slider very low (cap)', answers: { goal: 'Wealth Creation', horizon: '10 Years+', riskSlider: 2, marketBehaviour: 'SIP through it', experience: 'Experienced', existingInvestments: '₹5L – ₹25L', hasEmergencyFund: true } },
  ];

  const results: TestResult[] = [];
  for (const tc of edgeCases) {
    results.push(await testPersona(tc.name, tc.answers));
  }
  return results;
}

export async function runAllTests(): Promise<{ persona: TestResult[]; edgeCases: TestResult[]; summary: string }> {
  const persona = await runAllPersonaTests();
  const edgeCases = await runEdgeCaseTests();

  const personaPassed = persona.filter((r) => r.passed).length;
  const edgePassed = edgeCases.filter((r) => r.passed).length;

  const summary = `Persona tests: ${personaPassed}/${persona.length} passed. Edge case tests: ${edgePassed}/${edgeCases.length} passed. Total: ${personaPassed + edgePassed}/${persona.length + edgeCases.length}.`;

  return { persona, edgeCases, summary };
}
