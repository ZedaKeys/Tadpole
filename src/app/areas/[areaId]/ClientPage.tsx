'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, AlertTriangle } from 'lucide-react';
import { areas } from '@/data/areas';
import { quests } from '@/data/quests';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SpoilerText } from '@/components/ui/SpoilerText';
import { AppShell } from '@/components/layout/AppShell';
import { useChecklist } from '@/hooks/useChecklist';
import type { Area, PointOfInterest } from '@/types';

const POI_TYPE_COLORS: Record<string, string> = {
  quest: '#3b82f6',
  item: '#f59e0b',
  npc: '#22c55e',
  chest: '#f97316',
  secret: '#a855f7',
  waypoint: '#6b7280',
};
export default function AreaDetailClientPage({ params }: { params: { areaId: string } }) {
  const router = useRouter();
  const area: Area | undefined = areas.find((a) => a.id === params.areaId);
  const { isChecked, toggle, progress } = useChecklist(area?.id ?? '');

  if (!area) {
    return (
      <AppShell title="Area Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Area not found.
          </p>
          <button
            onClick={() => router.push('/areas')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Areas
          </button>
        </div>
      </AppShell>
    );
  }

  const prog = progress(area.pointsOfInterest.length);
  const relatedQuestsData = quests.filter((q) =>
    area.relatedQuests.includes(q.id),
  );

  return (
    <AppShell title={area.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/areas')}
        className="touch-target flex items-center gap-1 mb-4 rounded-lg stagger-in"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--gold)',
          fontSize: '0.875rem',
          animationDelay: '0s',
          padding: 0,
          minHeight: 44,
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Areas</span>
      </button>

      {/* Header */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={`Act ${area.act}`} color="var(--gold)" />
          <Badge
            label={`${area.pointsOfInterest.length} POIs`}
            color="#6366f1"
          />
        </div>
        <h2
          className="text-2xl font-bold font-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          {area.name}
        </h2>
      </div>

      {/* Locked after warning */}
      {area.lockedAfter && (
        <div
          className="flex items-center gap-2 rounded-xl p-3 mb-4 stagger-in"
          style={{
            background: '#f59e0b22',
            border: '1px solid #f59e0b44',
            animationDelay: '0.1s',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <p
            className="break-words"
            style={{
              color: '#f59e0b',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            This area becomes inaccessible after Act {area.lockedAfter}.
            Complete all points of interest before progressing.
          </p>
        </div>
      )}

      {/* Description */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0.15s' }}>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {area.description}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0.2s' }}>
        <ProgressBar
          current={prog.current}
          total={prog.total}
          label="Completion"
        />
      </div>

      {/* Points of Interest Checklist */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0.25s' }}>
        <Accordion
          title={`Points of Interest (${area.pointsOfInterest.length})`}
          defaultOpen={true}
        >
          <div className="space-y-3">
            {area.pointsOfInterest.map((poi) => (
              <div
                key={poi.id}
                className="flex items-start gap-3 rounded-lg p-3"
                style={{
                  background: 'var(--surface-hover)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  opacity: isChecked(poi.id) ? 0.7 : 1,
                  borderRadius: 12,
                }}
              >
                <button
                  onClick={() => toggle(poi.id)}
                  className="touch-target flex-shrink-0 flex items-center justify-center rounded-md"
                  style={{
                    width: 28,
                    height: 28,
                    background: isChecked(poi.id) ? 'var(--gold)' : 'transparent',
                    border: isChecked(poi.id) ? 'none' : '2px solid rgba(255,255,255,0.06)',
                    marginTop: 2,
                    cursor: 'pointer',
                    minHeight: 44,
                    minWidth: 44,
                  }}
                  aria-label={`Mark ${poi.name} as ${isChecked(poi.id) ? 'incomplete' : 'complete'}`}
                >
                  {isChecked(poi.id) && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2 7l3.5 3.5L12 4"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 overflow-hidden">
                    <span
                      className="font-semibold text-sm truncate"
                      style={{
                        color: 'var(--text-primary)',
                        textDecoration: isChecked(poi.id) ? 'line-through' : 'none',
                      }}
                    >
                      {poi.name}
                    </span>
                    <Badge
                      label={poi.type}
                      color={POI_TYPE_COLORS[poi.type] ?? 'var(--gold)'}
                    />
                  </div>
                  <SpoilerText
                    text={poi.description}
                    spoilerLevel={poi.spoilerLevel}
                  />
                </div>
              </div>
            ))}
          </div>
        </Accordion>
      </div>

      {/* Related Quests */}
      {relatedQuestsData.length > 0 && (
        <div className="mb-3 stagger-in" style={{ animationDelay: '0.3s' }}>
          <Accordion title={`Related Quests (${relatedQuestsData.length})`}>
            <div className="space-y-2">
              {relatedQuestsData.map((quest) => (
                <a
                  key={quest.id}
                  href={`/quests/${quest.id}`}
                  className="flex items-center gap-2 rounded-lg p-2 transition-colors overflow-hidden"
                  style={{
                    textDecoration: 'none',
                    background: 'var(--surface-hover)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                  }}
                >
                  <MapPin size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                  <span
                    className="text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {quest.name}
                  </span>
                  <Badge label={`Act ${quest.act}`} color="var(--gold)" />
                </a>
              ))}
            </div>
          </Accordion>
        </div>
      )}
    </AppShell>
  );
}
