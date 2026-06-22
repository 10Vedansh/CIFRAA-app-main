import { RawAnswers, InvestorPersona, FinalPortfolio } from '@/types/engine';
import { NormalisedFundUniverse } from '@/data/normalisedFundUniverse';
import { resolvePersona } from '@/engine/layer2-persona/personaEngine';
import { computeConstraints } from '@/engine/layer3-constraints/constraintEngine';
import { getEligibleCategories, EligibleCategorySlot } from '@/engine/layer4-category/categoryEligibility';
import { applyFallback } from '@/engine/layer4-category/fallbackExpansion';
import { buildAllocationPlan } from '@/engine/layer5-allocation/allocationEngine';
import { generateRecommendations } from '@/engine/layer7-recommendations/recommendationEngine';
import { generateExplanations } from '@/engine/layer8-explanations/explanationEngine';
import {
  ALL_GOALS, ALL_HORIZONS, ALL_MARKET_REACTIONS,
  ALL_EXPERIENCE_LEVELS, ALL_EXISTING_INVESTMENTS,
} from '@/types/questionnaire';

/**
 * Layer 9 entry point.
 * Wires all 9 layers together to produce a FinalPortfolio from raw answers.
 */
export function buildPortfolio(
  answers: RawAnswers,
  universe: NormalisedFundUniverse,
): FinalPortfolio {
  console.log("BUILD PORTFOLIO — answers:", {
    goal: answers.goal,
    horizon: answers.horizon,
    marketBehaviour: answers.marketBehaviour,
    experience: answers.experience,
    existingInvestments: answers.existingInvestments,
    hasEmergencyFund: answers.hasEmergencyFund,
  });

  // Validate all enum values
  if (!ALL_GOALS.includes(answers.goal)) {
    throw new Error(`Invalid goal: "${answers.goal}". Must be one of: ${ALL_GOALS.join(', ')}`);
  }
  if (!ALL_HORIZONS.includes(answers.horizon)) {
    throw new Error(`Invalid horizon: "${answers.horizon}". Must be one of: ${ALL_HORIZONS.join(', ')}`);
  }
  if (!ALL_MARKET_REACTIONS.includes(answers.marketBehaviour)) {
    throw new Error(`Invalid marketBehaviour: "${answers.marketBehaviour}". Must be one of: ${ALL_MARKET_REACTIONS.join(', ')}`);
  }
  if (!ALL_EXPERIENCE_LEVELS.includes(answers.experience)) {
    throw new Error(`Invalid experience: "${answers.experience}". Must be one of: ${ALL_EXPERIENCE_LEVELS.join(', ')}`);
  }
  if (!ALL_EXISTING_INVESTMENTS.includes(answers.existingInvestments)) {
    throw new Error(`Invalid existingInvestments: "${answers.existingInvestments}". Must be one of: ${ALL_EXISTING_INVESTMENTS.join(', ')}`);
  }

  // L2: Persona
  const investorPersona = resolvePersona(answers);
  console.log("GENERATED PERSONA", { personaId: investorPersona.personaId, personaName: investorPersona.personaName, riskOrientation: investorPersona.riskOrientation });

  // L3: Constraints
  const constraints = computeConstraints(answers);

  // L4: Category Eligibility + Fallback
  let eligibleResult = getEligibleCategories(investorPersona, constraints, universe, answers);
  let eligibleSlots: EligibleCategorySlot[] = eligibleResult.slots;
  console.log("CATEGORY ELIGIBILITY — slots:", eligibleSlots.length, eligibleSlots.map(s => s.canonicalCategory + ":" + s.allocationPercent + "%").join(", "));

  const fallbackResult = applyFallback(eligibleSlots, universe);
  eligibleSlots = fallbackResult.slots;
  console.log("FALLBACK EXPANSION — slots:", eligibleSlots.length, eligibleSlots.map(s => s.canonicalCategory + ":" + s.allocationPercent + "%").join(", "), "warnings:", fallbackResult.warnings);

  // L5: Allocation
  const allocationPlan = buildAllocationPlan(eligibleSlots, answers);
  console.log("GENERATED ALLOCATION", allocationPlan);
  console.log("ALLOCATION SUM:", allocationPlan.slots.reduce((sum, s) => sum + s.percent, 0));

  // L7: Recommendations (depends on L6 internally)
  const recommendations = generateRecommendations(allocationPlan, universe);
  console.log("RECOMMENDED FUNDS — count:", recommendations.length);
  console.log("RECOMMENDED FUNDS", recommendations);

  // === ALLOCATION AUDIT REPORT ===
  console.log("\n========== ALLOCATION AUDIT REPORT ==========");
  console.log("PERSONA:", investorPersona.personaName, `(${investorPersona.riskOrientation})`);
  console.log("TARGET CATEGORY ALLOCATION:");
  for (const slot of allocationPlan.slots) {
    const targetPct = slot.percent;
    const fundsInCat = recommendations.filter(r => r.canonicalCategory === slot.canonicalCategory);
    const actualPct = fundsInCat.reduce((sum, r) => sum + r.allocationPercent, 0);
    console.log(`  ${slot.canonicalCategory}: target=${targetPct}%`);
    console.log(`    Funds:`);
    for (const f of fundsInCat) {
      console.log(`      - ${f.fundName} (${f.allocationPercent}%)`);
    }
    const availableInUniverse = universe.getByCategory(slot.canonicalCategory).length;
    if (availableInUniverse === 0) {
      console.log(`    ⚠ No funds available in universe for this category`);
    }
  }
  const totalTarget = allocationPlan.totalPercent;
  const totalActual = Math.round(recommendations.reduce((sum, r) => sum + r.allocationPercent, 0) * 100) / 100;
  console.log(`TOTALS — target: ${totalTarget}%, actual distributed: ${totalActual}%`);
  console.log(`RECOMMENDED FUNDS TOTAL: ${recommendations.length}`);
  console.log("==============================================\n");

  // Build eligible counts for explanations
  const rankedByCat = new Map<string, number>();
  for (const slot of allocationPlan.slots) {
    const count = universe.getByCategory(slot.canonicalCategory).length;
    rankedByCat.set(slot.canonicalCategory, count);
  }

  // Collect data quality warnings from all layers
  const dataQualityWarnings: string[] = [
    ...constraints.warnings,
    ...fallbackResult.warnings,
    ...eligibleResult.adjustments,
  ];
  if (universe.unknownCategoryCount() > 0) {
    dataQualityWarnings.push(
      `${universe.unknownCategoryCount()} funds have unknown categories and were excluded.`,
    );
  }

  // L8: Explanations
  const explanations = generateExplanations(
    answers,
    investorPersona,
    allocationPlan,
    recommendations,
    rankedByCat,
    dataQualityWarnings,
  );

  return {
    investorPersona,
    allocationPlan,
    recommendedFunds: recommendations,
    explanations,
    generatedAt: new Date(),
  };
}
