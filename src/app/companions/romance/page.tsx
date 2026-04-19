'use client';

import { useMemo } from 'react';
import { Heart, Sparkles, AlertTriangle, Smile } from 'lucide-react';
import { companions } from '@/data/companions';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { AppShell } from '@/components/layout/AppShell';
import type { Companion, RomancePath } from '@/types';

const COMPANION_ACCENT: Record<string, string> = {
  shadowheart: '#6366f1',
  laezel: '#ef4444',
  gale: '#3b82f6',
  astarion: '#ec4899',
  wyll: '#f59e0b',
  karlach: '#f97316',
  halsin: '#22c55e',
  minthara: '#a855f7',
};

function endingIcon(type: string) {
  switch (type) {
    case 'Happy':
      return <Smile size={14} style={{ color: '#4caf50' }} />;
    case 'Bittersweet':
      return <AlertTriangle size={14} style={{ color: '#ff9800' }} />;
    case 'Tragic':
      return <Heart size={14} style={{ color: '#f44336' }} />;
    default:
      return <Sparkles size={14} style={{ color: 'var(--gold)' }} />;
  }
}

function endingColor(type: string): string {
  switch (type) {
    case 'Happy': return '#4caf50';
    case 'Bittersweet': return '#ff9800';
    case 'Tragic': return '#f44336';
    default: return 'var(--gold)';
  }
}

export default function RomanceOverviewPage() {
  const romanceable = useMemo(
    () => companions.filter((c: Companion) => c.romanceable && c.romance),
    [],
  );

  return (
    <AppShell title="Romance Guide">
      {/* Header */}
      <div className="stagger-in mb-5" style={{ animationDelay: '0.05s' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
          {romanceable.length} romanceable companions across Acts 1–3.
          Each romance has unique story beats, requirements, and endings.
        </p>
      </div>

      {/* Legend */}
      <div
        className="stagger-in flex flex-wrap gap-3 mb-6"
        style={{ animationDelay: '0.1s' }}
      >
        <div className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Smile size={14} style={{ color: '#4caf50' }} /> Happy
        </div>
        <div className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <AlertTriangle size={14} style={{ color: '#ff9800' }} /> Bittersweet
        </div>
        <div className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Heart size={14} style={{ color: '#f44336' }} /> Tragic
        </div>
      </div>

      {/* Romance cards */}
      <div className="space-y-4">
        {romanceable.map((companion: Companion, idx: number) => {
          const romance: RomancePath = companion.romance!;
          const accent = COMPANION_ACCENT[companion.id] ?? 'var(--gold)';

          return (
            <div
              key={companion.id}
              className="stagger-in"
              style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
            >
              <div
                style={{
                  background: `linear-gradient(160deg, ${accent}0C, rgba(255,255,255,0.02))`,
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${accent}18`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Heart size={18} style={{ color: accent }} />
                    </div>
                    <div>
                      <h3
                        className="font-heading text-sm leading-tight"
                        style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {companion.name}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {companion.race} {companion.class}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {endingIcon(romance.endingType)}
                    <Badge label={romance.endingType} color={endingColor(romance.endingType)} />
                  </div>
                </div>

                {/* Requirements */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Requirements
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {romance.requirements}
                  </p>
                </div>

                {/* Key Moments */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Key Moments
                  </div>
                  <div className="space-y-3">
                    {romance.keyMoments.map((moment, mi) => (
                      <div key={mi} className="flex items-start gap-3">
                        <Badge label={`Act ${moment.act}`} color={accent} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', lineHeight: 1.6, flex: 1 }}>
                          {moment.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="px-4 py-3">
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Tips
                  </div>
                  <p style={{ color: 'var(--gold)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {romance.tips}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
