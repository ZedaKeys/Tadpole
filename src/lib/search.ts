interface SearchableItem {
  [key: string]: unknown;
}

interface ScoredResult<T> {
  item: T;
  score: number;
}

/**
 * Simple fuzzy search: lowercase substring match with scoring based on
 * position (earlier = better) and completeness (full query match bonus).
 */
function fuzzySearch<T extends SearchableItem>(
  items: T[],
  query: string,
  keys: string[],
): ScoredResult<T>[] {
  if (!query.trim()) return items.map((item) => ({ item, score: 0 }));

  const q = query.toLowerCase().trim();
  const results: ScoredResult<T>[] = [];

  for (const item of items) {
    let bestScore = -1;

    for (const key of keys) {
      const val = item[key];
      if (typeof val !== 'string') continue;

      const lower = val.toLowerCase();
      const idx = lower.indexOf(q);

      if (idx === -1) continue;

      // Score: higher is better
      // Position bonus: match at start of string is worth more
      const positionBonus = Math.max(0, 100 - idx * 10);
      // Completeness bonus: exact match or query equals full value
      const completenessBonus = lower === q ? 50 : lower.startsWith(q) ? 20 : 0;
      // Key weight bonus (earlier keys in the array are more important)
      const keyWeight = (keys.length - keys.indexOf(key)) * 5;

      const score = positionBonus + completenessBonus + keyWeight;
      if (score > bestScore) bestScore = score;
    }

    if (bestScore >= 0) {
      results.push({ item, score: bestScore });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export { fuzzySearch };
export type { ScoredResult };
