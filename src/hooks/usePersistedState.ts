'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeGet, safeSet } from '@/lib/storage';

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = safeGet<T>(key);
    if (stored !== null) {
      setState(stored);
    }
    setLoaded(true);
  }, [key]);

  const setPersistedState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        safeSet(key, next);
        return next;
      });
    },
    [key],
  );

  return [state, setPersistedState, loaded];
}
