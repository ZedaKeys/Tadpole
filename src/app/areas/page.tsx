'use client';


import { useState, useMemo, type CSSProperties } from 'react';
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
        className="bg3-card-premium premium-card-link touch-target stagger-in"
        style={{
          animationDelay: `${0.2 + index * 0.04}s`,
          '--item-color': AREA_ACCENT,
        } as CSSProperties}
      >
        <div
          className="card-inner premium-card-column-inner"
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge label={`Act ${area.act}`} color="var(--gold)" />
            <Badge
              label={`${area.pointsOfInterest.length} POIs`}
              color="var(--arcane)"
            />
          </div>
          <h3
            className="font-heading premium-card-title leading-tight mb-1"
          >
            {area.name}
          </h3>
          <p
            className="premium-card-description text-xs leading-snug mb-2"
          >
            {area.description}
          </p>
          {area.lockedAfter && (
            <p
              className="premium-card-note text-xs mb-2"
            >
              Locked after Act {area.lockedAfter}
            </p>
          )}
          <div className="premium-progress-track">
            <div className="premium-progress-fill" />
          </div>
        </div>
      </a>
    );
  }

  return (
    <AppShell title="Areas">
      {/* Count */}
      <p className="premium-count mb-3 stagger-in stagger-1">
        {filteredAreas.length} area{filteredAreas.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="filter-row mb-4 stagger-in stagger-2">
        <select
          value={actFilter}
          onChange={(e) => setActFilter(Number(e.target.value))}
          className="bg3-select"
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
      <div className="premium-search-shell mb-5 stagger-in stagger-3">
        <Search
          size={18}
          className="premium-search-icon"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search areas..."
          className="premium-search-input"
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
