'use client';

export const metadata = { title: 'Quests — Tadpole' };

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
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

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  active: '#3b82f6',
  failed: '#ef4444',
  available: '#f59e0b',
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

  return (
    <AppShell title="Quests">
      {/* Count */}
      <p
        className="mb-3 stagger-in"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', animationDelay: '0.05s' }}
      >
        {filteredQuests.length} quest{filteredQuests.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4 stagger-in" style={{ paddingBottom: 4, animationDelay: '0.1s' }}>
        <select
          value={actFilter}
          onChange={(e) => setActFilter(Number(e.target.value))}
          className="bg3-select"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            minHeight: 32,
            paddingLeft: 10,
            paddingRight: 10,
            minWidth: 0,
          }}
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
      <div className="relative mb-5 stagger-in" style={{ animationDelay: '0.15s' }}>
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
          placeholder="Search quests..."
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

      {/* Quest list grouped by act */}
      {filteredQuests.length === 0 ? (
        <EmptyState
          title="No quests found"
          description="Try adjusting your filters or search query."
          icon={<Search size={40} />}
        />
      ) : actFilter > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredQuests.map((quest, i) => {
            const statusColor = STATUS_COLORS[quest.status] ?? '#6b7280';
            return (
              <a
                key={quest.id}
                href={`/quests/${quest.id}`}
                className="bg3-card-premium touch-target stagger-in"
                style={{
                  textDecoration: 'none',
                  display: 'block',
                  animationDelay: `${0.2 + i * 0.04}s`,
                }}
              >
                <div
                  className="card-inner"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    background: `linear-gradient(160deg, ${statusColor}0C, rgba(255,255,255,0.02))`,
                  }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge label={`Act ${quest.act}`} color="var(--gold)" />
                    <Badge label={quest.status} color={statusColor} />
                  </div>
                  <h3
                    className="font-heading font-semibold text-sm leading-tight mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {quest.name}
                  </h3>
                  <p
                    className="text-xs leading-snug mb-2 truncate-3"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {quest.description}
                  </p>
                  {quest.relatedCompanions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {quest.relatedCompanions.map((c) => (
                        <Badge
                          key={c}
                          label={c}
                          color={COMPANION_COLORS[c] ?? 'var(--gold)'}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByAct).map(([act, actQuests]) => (
            <Accordion key={act} title={`Act ${act} (${actQuests.length})`} defaultOpen={act === '1'}>
              <div className="grid grid-cols-1 gap-3">
                {actQuests.map((quest, i) => {
                  const statusColor = STATUS_COLORS[quest.status] ?? '#6b7280';
                  return (
                    <a
                      key={quest.id}
                      href={`/quests/${quest.id}`}
                      className="bg3-card-premium touch-target stagger-in"
                      style={{
                        textDecoration: 'none',
                        display: 'block',
                        animationDelay: `${0.2 + i * 0.04}s`,
                      }}
                    >
                      <div
                        className="card-inner"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          background: `linear-gradient(160deg, ${statusColor}0C, rgba(255,255,255,0.02))`,
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge label={quest.status} color={statusColor} />
                        </div>
                        <h3
                          className="font-heading font-semibold text-sm leading-tight mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {quest.name}
                        </h3>
                        <p
                          className="text-xs leading-snug mb-2 truncate-3"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {quest.description}
                        </p>
                        {quest.relatedCompanions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {quest.relatedCompanions.map((c) => (
                              <Badge
                                key={c}
                                label={c}
                                color={COMPANION_COLORS[c] ?? 'var(--gold)'}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </Accordion>
          ))}
        </div>
      )}
    </AppShell>
  );
}
