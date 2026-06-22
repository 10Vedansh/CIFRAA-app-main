import { RawAnswers, InvestorPersona } from '@/types/engine';
import { mapPersona } from './personaMapper';
import { applyConflictOverrides } from './conflictOverrides';

/**
 * Layer 2 entry point.
 * Transforms raw questionnaire answers into a fully resolved InvestorPersona
 * with conflict detection and persona overrides.
 */
export function resolvePersona(answers: RawAnswers): InvestorPersona {
  const basePersona = mapPersona(answers.goal);
  const { persona, conflictFlags } = applyConflictOverrides(answers, basePersona);

  return {
    personaId: persona.personaId,
    personaName: persona.personaName,
    description: persona.description,
    riskOrientation: persona.riskOrientation,
    conflictFlags,
  };
}
