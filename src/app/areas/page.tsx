'use client';

export const metadata = { title: 'Areas — Tadpole' };

import { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { areas } from '@/data/areas';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import { Accordion } from '@/components/ui/Accordion';

const ACTS = [1, 2, 3] as const;

const AREA_ACCENT = '#c6a255'; // gold for areas

export default function AreasPage() {
  const [actFilter, setActFilter] = useState<number>(0);
  const [query, setQuery] = useState('');

  const filteredAreas = useMemo(() => {
    let list = areas;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (area) =>
          area.name.toLowerCase().includes(q) ||
          area.description.toLowerCase().includes(q),
      );
    }

    if (actFilter > 0) {
      list = list.filter((area) => area.act === actFilter);
    }

    return list;
  }, [query, actFilter]);

  const groupedByAct = useMemo(() => {
    const groups: Record<number, typeof filteredAreas> = {};
    for (const act of ACTS) {
      const actAreas = filteredAreas.filter((a) => a.act === act);
      if (actAreas.length > 0) {
        groups[act] = actAreas;
      }
    }
    return groups;
  }, [filteredAreas]);

  function renderAreaCard(area: (typeof areas)[number], index: number) {
    return (
      <a
        key={area.id}
        href={`/areas/${area.id}`}
        className="bg3-card-premium touch-target stagger-in"
        style={{
          textDecoration: 'none',
          display: 'block',
          animationDelay: `${0.2 + index * 0.04}s`,
        }}
      >
        <div
          className="card-inner"
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: `linear-gradient(160deg, ${AREA_ACCENT}0C, rgba(255,255,255,0.02))`,
          }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge label={`Act ${area.act}`} color="var(--gold)" />
            <Badge
              label={`${area.pointsOfInterest.length} POIs`}
              color="var(--arcane)"
            />
          </div>
          <h3
            className="font-heading font-semibold text-sm leading-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {area.name}
          </h3>
          <p
            className="text-xs leading-snug mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {area.description}
          </p>
          {area.lockedAfter && (
            <p
              className="text-xs mb-2"
              style={{ color: 'var(--gold)', fontStyle: 'italic' }}
            >
              Locked after Act {area.lockedAfter}
            </p>
          )}
          <div
            style={{
              background: 'var(--parchment)',
              borderRadius: 4,
              height: 6,
              width: '100%',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright))',
                height: '100%',
                width: '0%',
                borderRadius: 4,
                boxShadow: '0 0 6px rgba(198,162,85,0.4)',
              }}
            />
          </div>
        </div>
      </a>
    );
  }

  return (
    <AppShell title="Areas">
      {/* Count */}
      <p
        className="mb-3 stagger-in"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', animationDelay: '0.05s' }}
      >
        {filteredAreas.length} area{filteredAreas.length !== 1 ? 's' : ''}
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
          placeholder="Search areas..."
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

      {/* Area list */}
      {filteredAreas.length === 0 ? (
        <EmptyState
          title="No areas found"
          description="Try adjusting your filters or search query."
          icon={<MapPin size={40} />}
        />
      ) : actFilter > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredAreas.map((area, i) => renderAreaCard(area, i))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByAct).map(([act, actAreas]) => (
            <Accordion key={act} title={`Act ${act} (${actAreas.length})`} defaultOpen={act === '1'}>
              <div className="grid grid-cols-1 gap-3">
                {actAreas.map((area, i) => renderAreaCard(area, i))}
              </div>
            </Accordion>
          ))}
        </div>
      )}
    </AppShell>
  );
}
