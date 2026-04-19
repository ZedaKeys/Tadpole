'use client';

import { useState, useEffect, useCallback } from 'react';
import { dualLoad, dualSave } from '@/lib/storage';

const CHECKLIST_PREFIX = 'tadpole-checklist';

function getStorageKey(areaId: string): string {
  return `${CHECKLIST_PREFIX}-${areaId}`;
}

export function useChecklist(areaId: string) {
  const [checked, setChecked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const storageKey = getStorageKey(areaId);

  useEffect(() => {
    dualLoad<string[]>(storageKey).then((stored) => {
      if (Array.isArray(stored)) {
        setChecked(stored);
      }
      setLoaded(true);
    });
  }, [storageKey]);

  const toggle = useCallback(
    (poiId: string) => {
      setChecked((prev) => {
        const next = prev.includes(poiId)
          ? prev.filter((id) => id !== poiId)
          : [...prev, poiId];
        dualSave(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const isChecked = useCallback(
    (poiId: string) => checked.includes(poiId),
    [checked],
  );

  const progress = useCallback(
    (total: number) => ({
      current: checked.length,
      total,
      percentage: total > 0 ? Math.round((checked.length / total) * 100) : 0,
    }),
    [checked],
  );

  return { checked, toggle, isChecked, progress, loaded };
}
