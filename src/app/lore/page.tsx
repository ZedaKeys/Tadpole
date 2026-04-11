'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { lore } from '@/data/lore';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { LoreCategory } from '@/types';

const CATEGORIES: { value: LoreCategory | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'var(--accent)' },
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
    // Small delay to ensure expansion renders
    setTimeout(() => {
      entryRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, []);

  return (
    <AppShell title="Lore Vault">
      {/* Count */}
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {filteredLore.length} entr{filteredLore.length !== 1 ? 'ies' : 'y'}
      </p>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto" style={{ paddingBottom: 4 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className="touch-target rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            style={{
              background:
                categoryFilter === cat.value ? `${cat.color}22` : 'var(--surface)',
              color: categoryFilter === cat.value ? cat.color : 'var(--text-secondary)',
              border:
                categoryFilter === cat.value
                  ? `1px solid ${cat.color}44`
                  : '1px solid var(--border)',
              minHeight: 36,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lore..."
          className="w-full rounded-lg pl-10 pr-3 py-2.5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            minHeight: 44,
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
        <div className="space-y-3">
          {filteredLore.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const categoryColor = CATEGORY_COLORS[entry.category] ?? 'var(--accent)';

            return (
              <div
                key={entry.id}
                ref={(el) => { entryRefs.current[entry.id] = el; }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Header - clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="touch-target w-full text-left px-4 py-3"
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
                      <Badge label={`Act ${entry.act}`} color="var(--accent)" />
                    )}
                  </div>
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {entry.title}
                  </h3>
                  {!isExpanded && (
                    <p
                      className="text-xs mt-1 leading-snug"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {entry.content.slice(0, 120)}...
                    </p>
                  )}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <p
                      className="pt-3"
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
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <p
                          className="text-xs font-semibold mb-2"
                          style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
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
                                className="touch-target rounded-full px-2.5 py-1 text-xs font-medium"
                                style={{
                                  background: isVisible ? `${CATEGORY_COLORS[relatedEntry?.category ?? 'magic']}22` : 'var(--surface-active)',
                                  color: isVisible ? (CATEGORY_COLORS[relatedEntry?.category ?? 'magic']) : 'var(--text-muted)',
                                  border: '1px solid var(--border)',
                                  cursor: 'pointer',
                                  minHeight: 36,
                                }}
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
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
