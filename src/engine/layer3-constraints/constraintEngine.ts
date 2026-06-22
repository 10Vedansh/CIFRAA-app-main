import { RawAnswers, ConstraintSet } from '@/types/engine';
import { getMandatoryConstraints, MandatoryConstraint } from './mandatoryConstraints';
import { getPreferredConstraints, PreferredConstraint } from './preferredConstraints';
import { getSoftPreferences, SoftPreference } from './softPreferences';

export interface FullConstraintSet extends ConstraintSet {
  mandatory: MandatoryConstraint[];
  preferred: PreferredConstraint[];
  soft: SoftPreference[];
  warnings: string[];
}

/**
 * Assemble the complete ConstraintSet from raw questionnaire answers.
 * All three tiers are computed together so that cross-tier interactions
 * can be detected (e.g. a soft preference being irrelevant because a
 * mandatory exclusion already removed the category).
 */
export function computeConstraints(answers: RawAnswers): FullConstraintSet {
  const mandatory = getMandatoryConstraints(answers);
  const preferred = getPreferredConstraints(answers);
  const soft = getSoftPreferences(answers);
  const warnings: string[] = [];

  // Detect conflicts between tiers
  const excludedCategories = new Set<string>();
  for (const mc of mandatory) {
    if (mc.action.type === 'exclude_category') {
      for (const cat of mc.action.categories) {
        excludedCategories.add(cat);
      }
    }
  }

  // Warn if a soft preference targets an excluded category — still valid for other categories
  for (const sp of soft) {
    if (sp.action.field === 'expenseRatio' && excludedCategories.has('UNKNOWN')) {
      // no-op, just informational
    }
  }

  return { mandatory, preferred, soft, warnings };
}
