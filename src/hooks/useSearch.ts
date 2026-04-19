'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { fuzzySearch, type ScoredResult } from '@/lib/search';

interface SearchableItem {
  [key: string]: unknown;
}

export function useSearch<T extends SearchableItem>(
  items: T[],
  keys: string[],
  debounceMs: number = 300,
) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs]);

  const results = useMemo<ScoredResult<T>[]>(
    () => fuzzySearch(items, debouncedQuery, keys),
    [items, debouncedQuery, keys],
  );

  const resultItems = useMemo(() => results.map((r) => r.item), [results]);

  const clear = useCallback(() => setQuery(''), []);

  return {
    query,
    setQuery,
    results: resultItems,
    scoredResults: results,
    clear,
    isSearching: query !== debouncedQuery,
  };
}
