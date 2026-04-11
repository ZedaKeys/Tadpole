'use client';

import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { companions } from '@/data/companions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { Companion } from '@/types';

function actBadgeColor(act: number): string {
  switch (act) {
    case 1: return '#4caf50';
    case 2: return '#ff9800';
    case 3: return '#f44336';
    default: return 'var(--accent)';
  }
}

export default function CompanionsPage() {
  const [actFilter, setActFilter] = useState<number>(0);

  const filteredCompanions = useMemo(() => {
    let list: Companion[] = companions;
    if (actFilter > 0) {
      list = list.filter((c) => c.act === actFilter);
    }
    return list;
  }, [actFilter]);

  const selectStyle: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    minHeight: 36,
    paddingLeft: 8,
    paddingRight: 8,
  };

  return (
    <AppShell title="Companions">
      {/* Count */}
      <p
        className="mb-3"
        style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}
      >
        {filteredCompanions.length} companion{filteredCompanions.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        <select
          value={actFilter}
          onChange={(e) => setActFilter(Number(e.target.value))}
          style={selectStyle}
        >
          <option value={0}>All Acts</option>
          <option value={1}>Act 1</option>
          <option value={2}>Act 2</option>
          <option value={3}>Act 3</option>
        </select>
      </div>

      {/* Companion grid */}
      {filteredCompanions.length === 0 ? (
        <EmptyState
          title="No companions found"
          description="Try adjusting your filters."
          icon={<Users size={40} />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredCompanions.map((companion) => (
            <Card
              key={companion.id}
              title={companion.name}
              href={`/companions/${companion.id}`}
              description={`${companion.race} ${companion.class}`}
              icon={
                <div className="flex flex-wrap gap-1">
                  <Badge
                    label={`Act ${companion.act}`}
                    color={actBadgeColor(companion.act)}
                  />
                  {companion.romanceable && (
                    <Badge label="Romance" color="#ec407a" />
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
