'use client';

export const metadata = { title: 'Companions — Tadpole' };

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

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    minHeight: 32,
    paddingLeft: 10,
    paddingRight: 10,
  };

  return (
    <AppShell title="Companions">
      {/* Count */}
      <p
        className="stagger-in mb-5"
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          animationDelay: '0.05s',
        }}
      >
        {filteredCompanions.length} companion{filteredCompanions.length !== 1 ? 's' : ''}
      </p>

      {/* Filter bar */}
      <div
        className="stagger-in flex gap-3 mb-6"
        style={{ animationDelay: '0.1s' }}
      >
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

      {/* Romance overview link */}
      <div className="stagger-in mb-6" style={{ animationDelay: '0.12s' }}>
        <a
          href="/companions/romance"
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(236, 64, 122, 0.08)',
            border: '1px solid rgba(236, 64, 122, 0.2)',
            textDecoration: 'none',
          }}
        >
          <Heart size={18} style={{ color: '#ec407a', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#ec407a', fontSize: '0.875rem', fontWeight: 600 }}>
              Romance Guide
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
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
