1|'use client';

export const metadata = { title: 'Search — Tadpole' };

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Clock, TrendingUp, ArrowLeft, Trash2 } from 'lucide-react';
import {
  globalSearch,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  getCategoryConfig,
  type SearchResult,
  type SearchCategory,
} from '@/lib/global-search';
import { Badge } from '@/components/ui/Badge';

// Group results by category, preserving order of categories
function groupByCategory(results: SearchResult[]): { category: SearchCategory; results: SearchResult[] }[] {
  const map = new Map<SearchCategory, SearchResult[]>();
  for (const r of results) {
    const list = map.get(r.category) || [];
    list.push(r);
    map.set(r.category, list);
  }
  // Return in a stable order
  const order: SearchCategory[] = ['spells', 'items', 'companions', 'quests', 'classes'];
  const grouped: { category: SearchCategory; results: SearchResult[] }[] = [];
  for (const cat of order) {
    const list = map.get(cat);
    if (list) grouped.push({ category: cat, results: list });
  }
  return grouped;
}

export default function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
    // Auto-focus
    inputRef.current?.focus();
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    const r = globalSearch(debouncedQuery);
    setResults(r);
  }, [debouncedQuery]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;
      saveRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
      // If there's exactly one result, navigate to it
      if (results.length === 1) {
        router.push(results[0].href);
      }
    },
    [query, results.length, router],
  );

  const handleResultClick = useCallback(
    (href: string) => {
      if (query.trim()) {
        saveRecentSearch(query.trim());
        setRecentSearches(getRecentSearches());
      }
      router.push(href);
    },
    [query, router],
  );

  const handleRecentClick = useCallback((term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  }, []);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }, []);

  const grouped = groupByCategory(results);
  const showRecent = !debouncedQuery.trim() && recentSearches.length > 0;
  const showNoResults = debouncedQuery.trim() && results.length === 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(10, 10, 15, 0.98)',
      }}
    >
      {/* Search input bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(18, 18, 26, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--gold-dim)',
            minWidth: 44,
            minHeight: 44,
            cursor: 'pointer',
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: 12,
                color: 'var(--text-dim)',
                pointerEvents: 'none',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search spells, items, companions..."
              autoFocus
              style={{
                width: '100%',
                minHeight: 44,
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text)',
                fontSize: '1rem',
                padding: '0 40px 0 40px',
                outline: 'none',
                caretColor: 'var(--gold)',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(198, 162, 85, 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  position: 'absolute',
                  right: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px 100px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Recent searches */}
        {showRecent && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} style={{ color: 'var(--text-dim)' }} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-dim)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Recent
                </span>
              </div>
              <button
                onClick={handleClearRecent}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                }}
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleRecentClick(term)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 20,
                    padding: '6px 14px',
                    color: 'var(--text)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(198, 162, 85, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(198, 162, 85, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results state */}
        {showNoResults && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              🔍
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 15, marginBottom: 4 }}>
              No results for &quot;{debouncedQuery}&quot;
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Try searching for spells, items, companions, quests, or classes
            </p>
          </div>
        )}

        {/* Grouped results */}
        {grouped.map((group, gIdx) => {
          const config = getCategoryConfig(group.category);
          return (
            <div
              key={group.category}
              style={{
                marginBottom: 20,
                animation: 'fade-up 0.3s ease-out both',
                animationDelay: `${gIdx * 0.05}s`,
              }}
            >
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                  padding: '0 2px',
                }}
              >
                <span style={{ fontSize: 14 }}>{config.icon}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: config.color,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {config.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    marginLeft: 'auto',
                  }}
                >
                  {group.results.length} result{group.results.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Result items */}
              {group.results.map((result, rIdx) => {
                const item = result.item;
                const name = item.name;
                const description = typeof item.description === 'string' ? item.description : '';
                const truncatedDesc =
                  description.length > 80 ? description.slice(0, 80) + '...' : description;

                // Show a subtitle based on category
                let subtitle = '';
                if (group.category === 'spells') {
                  const level = item.level as number;
                  const school = item.school as string;
                  subtitle = level === 0 ? `${school} Cantrip` : `${school} Level ${level}`;
                } else if (group.category === 'items') {
                  subtitle = `${(item.rarity as string) ?? ''} ${(item.type as string) ?? ''}`.trim();
                } else if (group.category === 'companions') {
                  subtitle = `${item.race ?? ''} ${item.class ?? ''}`.trim();
                } else if (group.category === 'quests') {
                  subtitle = `Act ${item.act}`;
                } else if (group.category === 'classes') {
                  subtitle = String(item.primaryAbility ?? '');
                }

                return (
                  <Link
                    key={`${group.category}-${result.href}-${rIdx}`}
                    href={result.href}
                    onClick={() => handleResultClick(result.href)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      marginBottom: 6,
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderLeft: `3px solid ${config.color}40`,
                      textDecoration: 'none',
                      transition:
                        'background-color 0.15s, border-color 0.15s, transform 0.15s',
                      animation: 'fade-in 0.25s ease-out both',
                      animationDelay: `${(gIdx * 0.05) + (rIdx * 0.03)}s`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(198, 162, 85, 0.05)';
                      e.currentTarget.style.borderLeftColor = config.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderLeftColor = `${config.color}40`;
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: 'var(--text)',
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </div>
                      {subtitle && (
                        <div
                          style={{
                            fontSize: 12,
                            color: config.color,
                            marginBottom: truncatedDesc ? 4 : 0,
                            fontWeight: 500,
                          }}
                        >
                          {subtitle}
                        </div>
                      )}
                      {truncatedDesc && (
                        <div
                          style={{
                            fontSize: 13,
                            color: 'var(--text-dim)',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {truncatedDesc}
                        </div>
                      )}
                    </div>
                    {group.category === 'items' && typeof item.rarity === 'string' && (
                      <Badge
                        label={item.rarity}
                        color={config.color}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* Search hint when no query */}
        {!debouncedQuery.trim() && !showRecent && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(198, 162, 85, 0.06)',
                border: '1px solid rgba(198, 162, 85, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={24} style={{ color: 'var(--gold-dim)' }} />
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: 15, marginBottom: 4 }}>
              Search everything
            </p>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Find spells, items, companions, quests, and classes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
