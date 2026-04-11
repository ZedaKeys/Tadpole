'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, GitBranch, Users, MapPin } from 'lucide-react';
import { quests } from '@/data/quests';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { SpoilerText } from '@/components/ui/SpoilerText';
import { AppShell } from '@/components/layout/AppShell';
import type { Quest } from '@/types';

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

function StepRow({ index, step }: { index: number; step: Quest['steps'][number] }) {
  return (
    <div
      className="flex items-start gap-3 py-2"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 24,
          height: 24,
          background: 'var(--accent)',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        {index + 1}
      </div>
      <div className="flex-1">
        <SpoilerText
          text={step.description}
          spoilerLevel={step.spoilerLevel}
        />
      </div>
    </div>
  );
}

export default function QuestDetailPage() {
  const params = useParams<{ questId: string }>();
  const router = useRouter();
  const quest: Quest | undefined = quests.find((q) => q.id === params.questId);

  if (!quest) {
    return (
      <AppShell title="Quest Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Quest not found.
          </p>
          <button
            onClick={() => router.push('/quests')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Quests
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={quest.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/quests')}
        className="touch-target flex items-center gap-1 mb-4 rounded-lg"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--accent)',
          fontSize: '0.875rem',
          padding: 0,
          minHeight: 44,
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Quests</span>
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={`Act ${quest.act}`} color="var(--accent)" />
          <Badge label={quest.status} color={STATUS_COLORS[quest.status] ?? '#6b7280'} />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {quest.name}
        </h2>
      </div>

      {/* Description */}
      <div className="mb-5">
        <h3
          className="font-semibold text-sm mb-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <BookOpen size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          Description
        </h3>
        <p
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
          }}
        >
          {quest.description}
        </p>
      </div>

      {/* Steps */}
      <div className="mb-5">
        <Accordion title={`Quest Steps (${quest.steps.length})`} defaultOpen={true}>
          <div style={{ background: 'transparent', padding: 0 }}>
            {quest.steps.map((step, i) => (
              <StepRow key={i} index={i} step={step} />
            ))}
          </div>
        </Accordion>
      </div>

      {/* Decisions */}
      {quest.decisions.length > 0 && (
        <div className="mb-5">
          <h3
            className="font-semibold text-sm mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            <GitBranch size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Decisions
          </h3>
          <div className="space-y-3">
            {quest.decisions.map((decision, di) => (
              <div
                key={di}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <p
                  className="font-semibold text-sm mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {decision.question}
                </p>
                <div className="space-y-3">
                  {decision.options.map((option, oi) => (
                    <div
                      key={oi}
                      className="rounded-lg p-3"
                      style={{
                        background: 'var(--surface-hover)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge label={option.label} color="var(--accent)" />
                      </div>
                      <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Consequence: </span>
                        <SpoilerText
                          text={option.consequence}
                          spoilerLevel={option.spoilerLevel}
                        />
                      </div>
                      {option.companionReactions && option.companionReactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {option.companionReactions.map((reaction) => (
                            <Badge
                              key={reaction.companion}
                              label={`${reaction.companion} ${reaction.delta > 0 ? '+' : ''}${reaction.delta}`}
                              color={reaction.delta > 0 ? '#22c55e' : '#ef4444'}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Companions */}
      {quest.relatedCompanions.length > 0 && (
        <div className="mb-3">
          <Accordion title={`Related Companions (${quest.relatedCompanions.length})`}>
            <div className="flex flex-wrap gap-2">
              {quest.relatedCompanions.map((companionId) => (
                <a
                  key={companionId}
                  href={`/companions/${companionId}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Badge
                    label={companionId}
                    color={COMPANION_COLORS[companionId] ?? 'var(--accent)'}
                  />
                </a>
              ))}
            </div>
          </Accordion>
        </div>
      )}

      {/* Related Areas */}
      {quest.relatedAreas.length > 0 && (
        <div className="mb-3">
          <Accordion title={`Related Areas (${quest.relatedAreas.length})`}>
            <div className="flex flex-wrap gap-2">
              {quest.relatedAreas.map((areaId) => (
                <a
                  key={areaId}
                  href={`/areas/${areaId}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Badge label={areaId} color="#6366f1" />
                </a>
              ))}
            </div>
          </Accordion>
        </div>
      )}
    </AppShell>
  );
}
