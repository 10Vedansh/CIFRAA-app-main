import { ConflictFlag } from '@/types/engine';

/**
 * Generate human-readable conflict warning messages.
 */
export function explainConflicts(flags: ConflictFlag[]): string[] {
  return flags.map(
    (f) => `${f.description} ${f.resolution}`,
  );
}
