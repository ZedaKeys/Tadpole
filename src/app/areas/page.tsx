'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import { areas } from '@/data/areas';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppShell } from '@/components/layout/AppShell';
import { Accordion } from '@/components/ui/Accordion';

const ACTS = [1, 2, 3] as const;

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

  function renderAreaCard(area: (typeof areas)[number]) {
    return (
      <a
        key={area.id}
        href={`/areas/${area.id}`}
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
          <Badge label={`Act ${area.act}`} color="var(--accent)" />
          <Badge
            label={`${area.pointsOfInterest.length} POIs`}
            color="#6366f1"
          />
        </div>
        <h3
          className="font-semibold text-sm leading-tight mb-1"
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
            style={{ color: '#f59e0b', fontStyle: 'italic' }}
          >
            Locked after Act {area.lockedAfter}
          </p>
        )}
        <div
          style={{
            background: 'var(--surface-active)',
            borderRadius: 4,
            height: 6,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'var(--accent)',
              height: '100%',
              width: '0%',
              borderRadius: 4,
            }}
          />
        </div>
      </a>
    );
  }

  return (
    <AppShell title="Areas">
      {/* Count */}
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {filteredAreas.length} area{filteredAreas.length !== 1 ? 's' : ''}
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
          placeholder="Search areas..."
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

      {/* Area list */}
      {filteredAreas.length === 0 ? (
        <EmptyState
          title="No areas found"
          description="Try adjusting your filters or search query."
          icon={<MapPin size={40} />}
        />
      ) : actFilter > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredAreas.map((area) => renderAreaCard(area))}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByAct).map(([act, actAreas]) => (
            <Accordion key={act} title={`Act ${act} (${actAreas.length})`} defaultOpen={act === '1'}>
              <div className="grid grid-cols-1 gap-3">
                {actAreas.map((area) => renderAreaCard(area))}
              </div>
            </Accordion>
          ))}
        </div>
      )}
    </AppShell>
  );
}
