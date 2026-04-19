import { spells } from '@/data/spells';
import { items } from '@/data/items';
import { companions } from '@/data/companions';
import { quests } from '@/data/quests';
import { classes } from '@/data/classes';

export type SearchCategory = 'spells' | 'items' | 'companions' | 'quests' | 'classes';

export interface SearchResult {
  item: { id: string; name: string; [key: string]: unknown };
  category: SearchCategory;
  href: string;
  score: number;
  matchedText: string;
}

const CATEGORY_CONFIG: Record<SearchCategory, { icon: string; label: string; color: string }> = {
  spells: { icon: '✨', label: 'Spells', color: '#a78bfa' },
  items: { icon: '⚔️', label: 'Items', color: '#f59e0b' },
  companions: { icon: '🛡️', label: 'Companions', color: '#34d399' },
  quests: { icon: '📜', label: 'Quests', color: '#60a5fa' },
  classes: { icon: '🎯', label: 'Classes', color: '#f472b6' },
};

export function getCategoryConfig(cat: SearchCategory) {
  return CATEGORY_CONFIG[cat];
}

function scoreMatch(value: string, query: string): number {
  const lower = value.toLowerCase();
  const q = query.toLowerCase().trim();
  const idx = lower.indexOf(q);
  if (idx === -1) return -1;
  const positionBonus = Math.max(0, 100 - idx * 10);
  const completenessBonus = lower === q ? 50 : lower.startsWith(q) ? 20 : 0;
  return positionBonus + completenessBonus;
}

function buildResult(
  item: { id: string; name: string; [key: string]: unknown },
  category: SearchCategory,
  query: string,
  fields: string[],
): SearchResult | null {
  let bestScore = -1;
  let matchedText = item.name;

  for (const field of fields) {
    const val = (item as Record<string, unknown>)[field];
    if (typeof val !== 'string') continue;
    const s = scoreMatch(val, query);
    if (s > bestScore) {
      bestScore = s;
      matchedText = val;
    }
  }

  if (bestScore < 0) return null;

  const hrefMap: Record<SearchCategory, string> = {
    spells: `/spells/${item.id}`,
    items: `/items/${item.id}`,
    companions: `/companions/${item.id}`,
    quests: `/quests/${item.id}`,
    classes: `/builds/${item.id}`,
  };

  return {
    item,
    category,
    href: hrefMap[category],
    score: bestScore,
    matchedText: matchedText.length > 120 ? matchedText.slice(0, 120) + '...' : matchedText,
  };
}

export function globalSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  // Spells: search name, school, description
  for (const spell of spells) {
    const r = buildResult(spell as unknown as SearchResult['item'], 'spells', query, ['name', 'school', 'description']);
    if (r) results.push(r);
  }

  // Items: search name, description, location
  for (const item of items) {
    const r = buildResult(item as unknown as SearchResult['item'], 'items', query, ['name', 'description', 'location']);
    if (r) results.push(r);
  }

  // Companions: search name, race, class, description
  for (const companion of companions) {
    const r = buildResult(companion as unknown as SearchResult['item'], 'companions', query, ['name', 'race', 'class', 'description']);
    if (r) results.push(r);
  }

  // Quests: search name, description
  for (const quest of quests) {
    const r = buildResult(quest as unknown as SearchResult['item'], 'quests', query, ['name', 'description']);
    if (r) results.push(r);
  }

  // Classes: search name, description
  for (const cls of classes) {
    const r = buildResult(cls as unknown as SearchResult['item'], 'classes', query, ['name', 'description']);
    if (r) results.push(r);
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ── Recent Searches (localStorage) ──

const STORAGE_KEY = 'tadpole-recent-searches';
const MAX_RECENT = 8;

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
