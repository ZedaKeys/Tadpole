import type { SpoilerMode } from '@/types';
import { safeGet, safeSet } from './storage';

const SPOILER_KEY = 'tadpole-spoiler-mode';

const DEFAULT_MODE: SpoilerMode = 'none';

function getSpoilerMode(): SpoilerMode {
  const stored = safeGet<SpoilerMode>(SPOILER_KEY);
  if (stored === 'none' || stored === 'hints' || stored === 'full') {
    return stored;
  }
  return DEFAULT_MODE;
}

function setSpoilerMode(mode: SpoilerMode): void {
  safeSet(SPOILER_KEY, mode);
}

/**
 * Determine if content should be visible based on spoiler level and user mode.
 *
 * spoilerLevel 0 = always shown (no spoiler)
 * spoilerLevel 1 = shown in hints or full mode
 * spoilerLevel 2 = shown only in full mode
 *
 * Returns true if the content should be visible.
 */
function filterBySpoiler(
  content: unknown,
  spoilerLevel: number,
  mode: SpoilerMode,
): unknown | null {
  if (spoilerLevel === 0) return content;

  if (spoilerLevel === 1) {
    if (mode === 'hints' || mode === 'full') return content;
    return null;
  }

  if (spoilerLevel >= 2) {
    if (mode === 'full') return content;
    return null;
  }

  return content;
}

export { getSpoilerMode, setSpoilerMode, filterBySpoiler, SPOILER_KEY };
