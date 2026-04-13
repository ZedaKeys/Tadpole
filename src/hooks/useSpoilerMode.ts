'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SpoilerMode } from '@/types';
import { safeGet, safeSet } from '@/lib/storage';
import { SPOILER_KEY } from '@/lib/spoiler';

const DEFAULT_MODE: SpoilerMode = 'none';

export function useSpoilerMode() {
  const [mode, setModeState] = useState<SpoilerMode>(DEFAULT_MODE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = safeGet<SpoilerMode>(SPOILER_KEY);
    if (stored === 'none' || stored === 'hints' || stored === 'full') {
      // Load from localStorage (external system sync)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModeState(stored);
    }
    setLoaded(true);
  }, []);

  const setMode = useCallback((newMode: SpoilerMode) => {
    setModeState(newMode);
    safeSet(SPOILER_KEY, newMode);
  }, []);

  return { mode, setMode, loaded };
}
