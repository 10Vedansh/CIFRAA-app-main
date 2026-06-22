import { RawAnswers, InvestorPersona } from '@/types/engine';

/**
 * Generate a persona-level explanation paragraph.
 * Phase 8.2 template: "Based on your goal of [Q1], a [Q2] horizon..."
 */
export function explainPersona(answers: RawAnswers, persona: InvestorPersona): string {
  console.log("EXPLAIN PERSONA INPUT", { answers, persona });

  const horizonLabel = answers.horizon;
  const goalLabel = answers.goal;
  const riskLabel = answers.riskSlider;

  const parts: string[] = [
    `Based on your goal of ${goalLabel}, a ${horizonLabel} investment horizon, and your risk comfort of ${riskLabel}/10,`,
    `you are classified as a ${persona.personaName} investor (${persona.riskOrientation}).`,
  ];

  if (persona.conflictFlags?.length > 0) {
    parts.push(
      `We detected ${persona.conflictFlags.length} conflicting input(s) and adjusted your profile accordingly.`,
    );
  }

  return parts.join(' ');
}
