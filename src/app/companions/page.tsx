'use client';


import { useState, useMemo } from 'react';
import { Users, Heart } from 'lucide-react';
import { companions } from '@/data/companions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppShell } from '@/components/layout/AppShell';
import type { Companion } from '@/types';

const COMPANION_ACCENT: Record<string, string> = {
  shadowheart: '#6366f1',
  laezel: '#ef4444',
  gale: '#3b82f6',
  astarion: '#ec4899',
  wyll: '#f59e0b',
  karlach: '#f97316',
  halsin: '#22c55e',
  minsc: '#10b981',
  jaheira: '#8b5cf6',
  minthara: '#a855f7',
};

export default function CompanionsPage() {
  const [actFilter, setActFilter] = useState<number>(0);

  const filteredCompanions = useMemo(() => {
    let list: Companion[] = companions;
    if (actFilter > 0) {
      list = list.filter((c) => c.act === actFilter);
    }
    return list;
  }, [actFilter]);

  return (
    <AppShell title="Companions">
      {/* Count */}
      <p className="premium-count stagger-in stagger-1 mb-5">
        {filteredCompanions.length} companion{filteredCompanions.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div className="filter-row stagger-in stagger-2 mb-6">
        <select
          value={actFilter}
          onChange={(e) => setActFilter(Number(e.target.value))}
          className="bg3-select"
        >
          <option value={0}>All Acts</option>
          <option value={1}>Act 1</option>
          <option value={2}>Act 2</option>
          <option value={3}>Act 3</option>
        </select>
      </div>

      {/* Romance overview link */}
      <div className="stagger-in stagger-3 mb-6">
        <a
          href="/companions/romance"
          className="premium-guide-link premium-guide-link-romance"
        >
          <Heart size={18} className="premium-guide-heart-icon" />
          <div>
            <div className="premium-guide-title premium-guide-title-romance">
              Romance Guide
            </div>
            <div className="premium-guide-subtitle">
              View all romance paths, key moments, and tips
            </div>
          </div>
        </a>
      </div>

      {/* Companion grid */}
      {filteredCompanions.length === 0 ? (
        <EmptyState
          title="No companions found"
          description="Try adjusting your filters."
          icon={<Users size={40} />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredCompanions.map((companion, i) => (
            <Card
              key={companion.id}
              title={companion.name}
              href={`/companions/${companion.id}`}
              description={`${companion.race} ${companion.class}`}
              accentColor={COMPANION_ACCENT[companion.id] ?? 'var(--gold)'}
              delay={i * 0.05}
              icon={
                <div className="flex flex-wrap gap-2">
                  <Badge
                    label={`Act ${companion.act}`}
                    color="var(--gold)"
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
