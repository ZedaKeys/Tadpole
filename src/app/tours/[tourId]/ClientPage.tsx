'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, MapPin, Lightbulb } from 'lucide-react';
import { tours } from '@/data/tours';
import { Badge } from '@/components/ui/Badge';
import { SpoilerText } from '@/components/ui/SpoilerText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppShell } from '@/components/layout/AppShell';
import { useChecklist } from '@/hooks/useChecklist';
import type { Tour } from '@/types';
export default function TourDetailClientPage({ params }: { params: { tourId: string } }) {
  const router = useRouter();
  const tour: Tour | undefined = tours.find((t) => t.id === params.tourId);

  const checklistId = tour ? `tour-${tour.id}` : '';
  const { isChecked, toggle, progress } = useChecklist(checklistId);

  if (!tour) {
    return (
      <AppShell title="Tour Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Tour not found.
          </p>
          <button
            onClick={() => router.push('/tours')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--gold)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Tours
          </button>
        </div>
      </AppShell>
    );
  }

  const prog = progress(tour.steps.length);

  return (
    <AppShell title={tour.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/tours')}
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
        <span>Back to Tours</span>
      </button>

      {/* Header */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0.05s' }}>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={`Act ${tour.act}`} color="var(--gold)" />
          <Badge label={`${tour.steps.length} steps`} color="#6366f1" />
        </div>
        <h2
          className="text-2xl font-bold mb-2 font-heading"
          style={{ color: 'var(--text-primary)' }}
        >
          {tour.name}
        </h2>
        <div
          className="flex items-center gap-1 mb-3"
          style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}
        >
          <Clock size={14} />
          <span>Estimated: {tour.estimatedTime}</span>
        </div>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {tour.description}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0.1s' }}>
        <ProgressBar
          current={prog.current}
          total={prog.total}
          label="Progress"
        />
      </div>

      {/* Steps checklist */}
      <div className="space-y-2 stagger-in" style={{ animationDelay: '0.15s' }}>
        {tour.steps.map((step, i) => {
          const stepId = `step-${i}`;
          const checked = isChecked(stepId);

          return (
            <div
              key={i}
              className="p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${checked ? 'var(--gold)' : 'rgba(255,255,255,0.06)'}`,
                opacity: checked ? 0.8 : 1,
                borderRadius: 16,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggle(stepId)}
                  className="touch-target touch-compact flex-shrink-0 flex items-center justify-center rounded-lg"
                  style={{
                    width: 28,
                    height: 28,
                    minWidth: 28,
                    background: checked ? 'var(--gold)' : 'transparent',
                    border: `2px solid ${checked ? 'var(--gold)' : 'var(--border)'}`,
                    color: checked ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                  aria-label={checked ? 'Uncheck step' : 'Check step'}
                >
                  {checked ? '✓' : i + 1}
                </button>

                <div className="flex-1">
                  {/* Area badge */}
                  <div className="flex items-center gap-1 mb-1">
                    <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {step.area.replace(/-/g, ' ')}
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed mb-2"
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: checked ? 'line-through' : 'none',
                    }}
                  >
                    <SpoilerText text={step.description} spoilerLevel={step.spoilerLevel} />
                  </p>

                  {/* Tips */}
                  {step.tips && step.tips.length > 0 && (
                    <div
                      className="rounded-lg p-4"
                      style={{
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        className="flex items-center gap-1 mb-2"
                        style={{ color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        <Lightbulb size={12} />
                        Tips
                      </div>
                      <ul className="space-y-1">
                        {step.tips.map((tip, ti) => (
                          <li
                            key={ti}
                            className="text-xs leading-relaxed break-words"
                            style={{ color: 'var(--text-secondary)', paddingLeft: 8 }}
                          >
                            • <SpoilerText text={tip} spoilerLevel={step.spoilerLevel} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
