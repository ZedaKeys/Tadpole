'use client';


import { useState, useMemo, useRef, useCallback } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { lore } from '@/data/lore';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { LoreCategory } from '@/types';

const CATEGORIES: { value: LoreCategory | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'var(--gold)' },
  { value: 'world', label: 'World', color: '#3b82f6' },
  { value: 'history', label: 'History', color: '#8b5cf6' },
  { value: 'factions', label: 'Factions', color: '#f59e0b' },
  { value: 'gods', label: 'Gods', color: '#ec4899' },
  { value: 'races', label: 'Races', color: '#22c55e' },
  { value: 'magic', label: 'Magic', color: '#6366f1' },
];

const CATEGORY_COLORS: Record<string, string> = {
  world: '#3b82f6',
  history: '#8b5cf6',
  factions: '#f59e0b',
  gods: '#ec4899',
  races: '#22c55e',
  magic: '#6366f1',
};

export default function LorePage() {
  const [categoryFilter, setCategoryFilter] = useState<LoreCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredLore = useMemo(() => {
    let list = lore;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (entry) =>
          entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== 'all') {
      list = list.filter((entry) => entry.category === categoryFilter);
    }

    return list;
  }, [query, categoryFilter]);

  const scrollToEntry = useCallback((id: string) => {
    setExpandedId(id);
    setTimeout(() => {
      entryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  return (
    <AppShell title="Lore Vault">
      {/* Count */}
      <p
        className="mb-5 stagger-in"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', animationDelay: '0s' }}
      >
        {filteredLore.length} entr{filteredLore.length !== 1 ? 'ies' : 'y'}
      </p>

      {/* Category tabs */}
      <div className="filter-row mb-6 stagger-in" style={{ animationDelay: '0.06s' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`pill-btn pill-btn-ghost pill-sm whitespace-nowrap ${categoryFilter === cat.value ? 'pill-btn-ghost-active' : ''}`}
            style={categoryFilter === cat.value ? {
              background: `${cat.color}22`,
              color: cat.color,
              border: `1px solid ${cat.color}44`,
            } : undefined}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative mb-6 stagger-in" style={{ animationDelay: '0.12s' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gold-dim)',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lore..."
          className="w-full pl-10 pr-3 py-2.5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            padding: '10px 14px 10px 40px',
          }}
        />
      </div>

      {/* Lore entries */}
      {filteredLore.length === 0 ? (
        <EmptyState
          title="No lore found"
          description="Try adjusting your filters or search query."
          icon={<BookOpen size={40} />}
        />
      ) : (
        <div className="space-y-4">
          {filteredLore.map((entry, index) => {
            const isExpanded = expandedId === entry.id;
            const categoryColor = CATEGORY_COLORS[entry.category] ?? 'var(--gold)';

            return (
              <div
                key={entry.id}
                ref={(el) => { entryRefs.current[entry.id] = el; }}
                className="bg3-card-premium stagger-in"
                style={{
                  animationDelay: `${0.18 + index * 0.05}s`,
                }}
              >
                <div
                  className="card-inner"
                  style={{
                    background: `linear-gradient(160deg, ${categoryColor}0C, rgba(255,255,255,0.02))`,
                  }}
                >
                  {/* Header - clickable */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="touch-target w-full text-left px-2 py-1"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      minHeight: 44,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge label={entry.category} color={categoryColor} />
                      {entry.act && (
                        <Badge label={`Act ${entry.act}`} color="var(--gold)" />
                      )}
                    </div>
                    <h3
                      className="font-heading font-semibold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {entry.title}
                    </h3>
                    {!isExpanded && (
                      <p
                        className="text-xs mt-2 leading-snug"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {entry.content.slice(0, 120)}...
                      </p>
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div
                      className="px-2 pb-2"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <p
                        className="pt-4"
                        style={{
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          lineHeight: 1.8,
                        }}
                      >
                        {entry.content}
                      </p>

                      {/* Related entries */}
                      {entry.relatedEntries.length > 0 && (
                        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <p
                            className="text-xs font-semibold mb-3"
                            style={{ color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                          >
                            Related Entries
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {entry.relatedEntries.map((relatedId) => {
                              const relatedEntry = lore.find((l) => l.id === relatedId);
                              const isVisible = filteredLore.some((l) => l.id === relatedId);
                              return (
                                <button
                                  key={relatedId}
                                  onClick={() => scrollToEntry(relatedId)}
                                  className={`pill-btn pill-btn-ghost pill-sm ${isVisible ? 'pill-btn-ghost-active' : ''}`}
                                  style={isVisible ? {
                                    background: `${CATEGORY_COLORS[relatedEntry?.category ?? 'magic']}22`,
                                    color: CATEGORY_COLORS[relatedEntry?.category ?? 'magic'],
                                  } : undefined}
                                >
                                  {relatedEntry?.title ?? relatedId}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
