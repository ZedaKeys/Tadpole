'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { quests } from '@/data/quests';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { Accordion } from '@/components/ui/Accordion';

const ACTS = [1, 2, 3] as const;

const COMPANION_COLORS: Record<string, string> = {
  shadowheart: '#6366f1',
  laezel: '#ef4444',
  gale: '#3b82f6',
  astarion: '#ec4899',
  wyll: '#f59e0b',
  karlach: '#f97316',
  halsin: '#22c55e',
};

export default function QuestsPage() {
  const [actFilter, setActFilter] = useState<number>(0);
  const [query, setQuery] = useState('');

  const filteredQuests = useMemo(() => {
    let list = quests;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (quest) =>
          quest.name.toLowerCase().includes(q) ||
          quest.description.toLowerCase().includes(q),
      );
    }

    if (actFilter > 0) {
      list = list.filter((quest) => quest.act === actFilter);
    }

    return list;
  }, [query, actFilter]);

  const groupedByAct = useMemo(() => {
    const groups: Record<number, typeof filteredQuests> = {};
    for (const act of ACTS) {
      const actQuests = filteredQuests.filter((q) => q.act === act);
      if (actQuests.length > 0) {
        groups[act] = actQuests;
      }
    }
    return groups;
  }, [filteredQuests]);

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    minHeight: 36,
    paddingLeft: 8,
    paddingRight: 8,
    minWidth: 0,
  };

  return (
    <AppShell title="Quests">
      {/* Count */}
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {filteredQuests.length} quest{filteredQuests.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto" style={{ paddingBottom: 4 }}>
        <select
          value={actFilter}
          onChange={(e) => setActFilter(Number(e.target.value))}
          style={selectStyle}
        >
          <option value={0}>All Acts</option>
          {ACTS.map((a) => (
            <option key={a} value={a}>
              Act {a}
            </option>
          ))}
        </select>
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
          placeholder="Search quests..."
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

      {/* Quest list grouped by act */}
      {filteredQuests.length === 0 ? (
        <EmptyState
          title="No quests found"
          description="Try adjusting your filters or search query."
          icon={<Search size={40} />}
        />
      ) : actFilter > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredQuests.map((quest) => (
            <a
              key={quest.id}
              href={`/quests/${quest.id}`}
              className="touch-target rounded-xl p-4 flex flex-col transition-colors"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--surface-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'var(--surface)')
              }
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge label={`Act ${quest.act}`} color="var(--accent)" />
                <Badge
                  label={quest.status}
                  color={
                    quest.status === 'completed'
                      ? '#22c55e'
                      : quest.status === 'active'
                        ? '#3b82f6'
                        : quest.status === 'failed'
                          ? '#ef4444'
                          : '#f59e0b'
                  }
                />
              </div>
              <h3
                className="font-semibold text-sm leading-tight mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {quest.name}
              </h3>
              <p
                className="text-xs leading-snug mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {quest.description}
              </p>
              {quest.relatedCompanions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {quest.relatedCompanions.map((c) => (
                    <Badge
                      key={c}
                      label={c}
                      color={COMPANION_COLORS[c] ?? 'var(--accent)'}
                    />
                  ))}
                </div>
              )}
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByAct).map(([act, actQuests]) => (
            <Accordion key={act} title={`Act ${act} (${actQuests.length})`} defaultOpen={act === '1'}>
              <div className="grid grid-cols-1 gap-3">
                {actQuests.map((quest) => (
                  <a
                    key={quest.id}
                    href={`/quests/${quest.id}`}
                    className="touch-target rounded-xl p-4 flex flex-col transition-colors"
                    style={{
                      background: 'var(--surface-hover)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--surface)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-hover)')
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge
                        label={quest.status}
                        color={
                          quest.status === 'completed'
                            ? '#22c55e'
                            : quest.status === 'active'
                              ? '#3b82f6'
                              : quest.status === 'failed'
                                ? '#ef4444'
                                : '#f59e0b'
                        }
                      />
                    </div>
                    <h3
                      className="font-semibold text-sm leading-tight mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {quest.name}
                    </h3>
                    <p
                      className="text-xs leading-snug mb-2"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {quest.description}
                    </p>
                    {quest.relatedCompanions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {quest.relatedCompanions.map((c) => (
                          <Badge
                            key={c}
                            label={c}
                            color={COMPANION_COLORS[c] ?? 'var(--accent)'}
                          />
                        ))}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </Accordion>
          ))}
        </div>
      )}
    </AppShell>
  );
}
