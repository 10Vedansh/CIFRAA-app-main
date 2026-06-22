import { RawAnswers, ConflictFlag } from '@/types/engine';
import { PersonaInfo } from './personaMapper';

export interface ConflictOverrideResult {
  persona: PersonaInfo;
  conflictFlags: ConflictFlag[];
}

/**
 * Detect conflicts between questionnaire answers and apply persona overrides.
 */
export function applyConflictOverrides(
  answers: RawAnswers,
  basePersona: PersonaInfo,
): ConflictOverrideResult {
  const flags: ConflictFlag[] = [];
  let persona = { ...basePersona };

  // Conflict: Wealth Creation goal + very short horizon
  if (answers.goal === 'Wealth Creation' && (answers.horizon === '< 1 Year' || answers.horizon === '1–3 Years')) {
    flags.push({
      id: 'CONF-WC-HZ',
      description: 'Wealth Creation goal with a short investment horizon limits equity exposure.',
      resolution: 'Switching to a Balanced Wealth Creator approach — capping equity and increasing liquid allocation.',
    });
    persona = {
      personaId: 'balanced_wealth_creator',
      personaName: 'Balanced Wealth Creator',
      description: 'Seeking steady long-term growth with controlled risk.',
      riskOrientation: 'Moderate-Aggressive',
    };
  }

  // Conflict: Preservation + Buy the Dip
  if (answers.goal === 'Preservation' && answers.marketBehaviour === 'Buy the Dip') {
    flags.push({
      id: 'CONF-PR-BD',
      description: 'Capital preservation goal with Buy-the-Dip behaviour suggests a mixed approach.',
      resolution: 'Allocating a portion to large-cap equity while maintaining a strong debt core.',
    });
    persona = {
      personaId: 'cautious_opportunist',
      personaName: 'Cautious Opportunist',
      description: 'Balancing capital preservation with selective opportunity capture.',
      riskOrientation: 'Moderate',
    };
  }

  // Conflict: Retirement goal + short horizon
  if (answers.goal === 'Retirement' && answers.horizon === '< 1 Year') {
    flags.push({
      id: 'CONF-RT-HZ',
      description: 'Retirement goal with very short horizon requires capital preservation.',
      resolution: 'Switching to Preretirement Consolidator — reducing equity, increasing debt and liquid.',
    });
    persona = {
      personaId: 'preretirement_consolidator',
      personaName: 'Pre-Retirement Consolidator',
      description: 'Protecting accumulated retirement savings as retirement approaches.',
      riskOrientation: 'Conservative',
    };
  }

  return { persona, conflictFlags: flags };
}
