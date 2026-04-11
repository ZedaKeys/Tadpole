'use client';

import { useState, useEffect, useCallback } from 'react';
import { dualLoad, dualSave } from '@/lib/storage';

type FavoriteType = 'spells' | 'items' | 'companions';

function getStorageKey(type: FavoriteType): string {
  return `tadpole-favorites-${type}`;
}

export function useFavorites(type: FavoriteType) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const storageKey = getStorageKey(type);

  useEffect(() => {
    dualLoad<string[]>(storageKey).then((stored) => {
      if (Array.isArray(stored)) {
        setFavorites(stored);
      }
      setLoaded(true);
    });
  }, [storageKey]);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = prev.includes(id)
          ? prev.filter((fid) => fid !== id)
          : [...prev, id];
        dualSave(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const isFavorite = useCallback(
    (id: string) => favorites.includes(id),
    [favorites],
  );

  return { favorites, toggleFavorite, isFavorite, loaded };
}
