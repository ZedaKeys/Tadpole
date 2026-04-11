'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Swords,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  User,
  BookOpen,
} from 'lucide-react';
import { companions } from '@/data/companions';
import { Badge } from '@/components/ui/Badge';
import { Accordion } from '@/components/ui/Accordion';
import { AppShell } from '@/components/layout/AppShell';
import type { Companion, ApprovalTrigger } from '@/types';

function actBadgeColor(act: number): string {
  switch (act) {
    case 1: return '#4caf50';
    case 2: return '#ff9800';
    case 3: return '#f44336';
    default: return 'var(--accent)';
  }
}

function romanceLabel(romanceable: boolean): string {
  return romanceable ? 'Romanceable' : 'Not Romanceable';
}

function romanceColor(romanceable: boolean): string {
  return romanceable ? '#ec407a' : 'var(--text-muted)';
}

function deltaBadge(delta: number): { label: string; color: string } {
  if (delta > 0) return { label: `+${delta}`, color: '#4caf50' };
  return { label: `${delta}`, color: '#f44336' };
}

export default function CompanionDetailPage() {
  const params = useParams<{ companionId: string }>();
  const router = useRouter();
  const companion: Companion | undefined = companions.find(
    (c) => c.id === params.companionId,
  );

  if (!companion) {
    return (
      <AppShell title="Companion Not Found">
        <div className="flex flex-col items-center justify-center py-16">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Companion not found.
          </p>
          <button
            onClick={() => router.push('/companions')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
          >
            Back to Companions
          </button>
        </div>
      </AppShell>
    );
  }

  const likes = companion.approvalTriggers.filter((t) => t.delta > 0);
  const dislikes = companion.approvalTriggers.filter((t) => t.delta < 0);

  return (
    <AppShell title={companion.name}>
      {/* Back button */}
      <button
        onClick={() => router.push('/companions')}
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
        <span>Back to Companions</span>
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge label={`Act ${companion.act}`} color={actBadgeColor(companion.act)} />
          <Badge label={romanceLabel(companion.romanceable)} color={romanceColor(companion.romanceable)} />
        </div>
        <h2
          className="text-2xl font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {companion.name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {companion.race} {companion.class} · {companion.background}
        </p>
      </div>

      {/* Info rows */}
      <div className="mb-5" style={{ background: 'var(--surface)', borderRadius: 12, padding: '4px 16px', border: '1px solid var(--border)' }}>
        <div className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <MapPin size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Location
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              {companion.location}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3 py-2">
          <Swords size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Class
            </div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              {companion.class}
            </div>
          </div>
        </div>
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
          {companion.description}
        </p>
      </div>

      {/* Romance status */}
      <div className="mb-3">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <Heart
            size={20}
            style={{
              color: companion.romanceable ? '#ec407a' : 'var(--text-muted)',
            }}
          />
          <div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
              {companion.romanceable ? 'Romance Available' : 'Not Romanceable'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {companion.romanceable
                ? 'This companion can be romanced throughout the story.'
                : 'This companion is not available for romance.'}
            </div>
          </div>
        </div>
      </div>

      {/* Approval triggers - Likes */}
      {likes.length > 0 && (
        <div className="mb-3">
          <Accordion title={`Approves (${likes.length})`} defaultOpen={true}>
            <div className="space-y-2">
              {likes.map((trigger: ApprovalTrigger, idx: number) => {
                const d = deltaBadge(trigger.delta);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2"
                  >
                    <ThumbsUp size={14} style={{ color: d.color, flexShrink: 0, marginTop: 3 }} />
                    <div className="flex-1">
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {trigger.action}
                      </span>
                      {trigger.context && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: 2 }}>
                          {trigger.context}
                        </span>
                      )}
                    </div>
                    <Badge label={d.label} color={d.color} />
                  </div>
                );
              })}
            </div>
          </Accordion>
        </div>
      )}

      {/* Approval triggers - Dislikes */}
      {dislikes.length > 0 && (
        <div className="mb-3">
          <Accordion title={`Disapproves (${dislikes.length})`}>
            <div className="space-y-2">
              {dislikes.map((trigger: ApprovalTrigger, idx: number) => {
                const d = deltaBadge(trigger.delta);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-2"
                  >
                    <ThumbsDown size={14} style={{ color: d.color, flexShrink: 0, marginTop: 3 }} />
                    <div className="flex-1">
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {trigger.action}
                      </span>
                      {trigger.context && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: 2 }}>
                          {trigger.context}
                        </span>
                      )}
                    </div>
                    <Badge label={d.label} color={d.color} />
                  </div>
                );
              })}
            </div>
          </Accordion>
        </div>
      )}

      {/* Personality traits */}
      <div className="mb-3">
        <Accordion title="Personality Traits">
          <div className="flex flex-wrap gap-2">
            {companion.personalityTraits.map((trait) => (
              <Badge key={trait} label={trait} color="var(--accent)" />
            ))}
          </div>
        </Accordion>
      </div>

      {/* Likes */}
      <div className="mb-3">
        <Accordion title={`Likes (${companion.likes.length})`}>
          <div className="flex flex-wrap gap-2">
            {companion.likes.map((like) => (
              <Badge key={like} label={like} color="#4caf50" />
            ))}
          </div>
        </Accordion>
      </div>

      {/* Dislikes */}
      <div className="mb-3">
        <Accordion title={`Dislikes (${companion.dislikes.length})`}>
          <div className="flex flex-wrap gap-2">
            {companion.dislikes.map((dislike) => (
              <Badge key={dislike} label={dislike} color="#f44336" />
            ))}
          </div>
        </Accordion>
      </div>
    </AppShell>
  );
}
