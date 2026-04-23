1|'use client';

export const metadata = { title: 'Approval — Tadpole' };

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Heart, TrendingUp, TrendingDown, Minus, Wifi, WifiOff, Activity, ThumbsUp, ThumbsDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import { useGameConnection } from '@/hooks/useGameConnection';
import type { GameState, GameCharacter, ApprovalLevel, ApprovalEvent } from '@/types';

// ── Constants ──────────────────────────────────────────────────
const APPROVAL_MIN = -100;
const APPROVAL_MAX = 100;
const APPROVAL_RANGE = APPROVAL_MAX - APPROVAL_MIN;

const LEVEL_THRESHOLDS: { level: ApprovalLevel; min: number; color: string }[] = [
  { level: 'hostile', min: -100, color: '#e76f51' },
  { level: 'neutral', min: -30, color: '#9ca3af' },
  { level: 'friendly', min: 10, color: '#52b788' },
  { level: 'very friendly', min: 40, color: '#48bfe3' },
  { level: 'excellent', min: 75, color: '#c6a255' },
];

function getApprovalLevel(value: number): ApprovalLevel {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (value >= LEVEL_THRESHOLDS[i].min) return LEVEL_THRESHOLDS[i].level;
  }
  return 'hostile';
}

function getApprovalColor(value: number): string {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (value >= LEVEL_THRESHOLDS[i].min) return LEVEL_THRESHOLDS[i].color;
  }
  return '#e76f51';
}

function approvalPercent(value: number): number {
  return ((value - APPROVAL_MIN) / APPROVAL_RANGE) * 100;
}

// ── Placeholder data (demo mode) ──────────────────────────────
const PLACEHOLDER_COMPANIONS: GameCharacter[] = [
  { guid: 'demo-shadowheart', name: 'Shadowheart', hp: 42, maxHp: 42, level: 5, position: { x: 0, y: 0, z: 0 }, approval: 35, approvalLevel: 'friendly' },
  { guid: 'demo-gale', name: 'Gale', hp: 38, maxHp: 38, level: 5, position: { x: 0, y: 0, z: 0 }, approval: 60, approvalLevel: 'very friendly' },
  { guid: 'demo-astarion', name: 'Astarion', hp: 36, maxHp: 36, level: 5, position: { x: 0, y: 0, z: 0 }, approval: -10, approvalLevel: 'neutral' },
  { guid: 'demo-laezel', name: "Lae'zel", hp: 48, maxHp: 48, level: 5, position: { x: 0, y: 0, z: 0 }, approval: 20, approvalLevel: 'friendly' },
  { guid: 'demo-karlach', name: 'Karlach', hp: 52, maxHp: 52, level: 5, position: { x: 0, y: 0, z: 0 }, approval: 80, approvalLevel: 'excellent' },
  { guid: 'demo-wyll', name: 'Wyll', hp: 40, maxHp: 40, level: 5, position: { x: 0, y: 0, z: 0 }, approval: -50, approvalLevel: 'hostile' },
];

const PLACEHOLDER_EVENTS: ApprovalEvent[] = [
  { type: 'approval_change', companionName: 'Shadowheart', companionGuid: 'demo-shadowheart', delta: 5, approval: 35, action: 'Showed mercy to the tiefling refugees', timestamp: Date.now() / 1000 - 120 },
  { type: 'approval_change', companionName: 'Astarion', companionGuid: 'demo-astarion', delta: -3, approval: -10, action: 'Refused to help with his plan', timestamp: Date.now() / 1000 - 300 },
  { type: 'approval_change', companionName: 'Karlach', companionGuid: 'demo-karlach', delta: 10, approval: 80, action: "Defended Karlach against Anders' accusation", timestamp: Date.now() / 1000 - 600 },
  { type: 'approval_change', companionName: 'Wyll', companionGuid: 'demo-wyll', delta: -8, approval: -50, action: 'Made a deal with a devil', timestamp: Date.now() / 1000 - 900 },
  { type: 'approval_change', companionName: 'Gale', companionGuid: 'demo-gale', delta: 5, approval: 60, action: 'Shared magical knowledge', timestamp: Date.now() / 1000 - 1200 },
];

// ── Sub-components ──────────────────────────────────────────────

function ConnectionBanner({ isConnected, connectionStatus }: { isConnected: boolean; connectionStatus: string }) {
  const connected = isConnected && connectionStatus === 'connected';
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: connected ? 'rgba(82, 183, 136, 0.08)' : 'rgba(231, 111, 81, 0.08)',
        border: `1px solid ${connected ? 'rgba(82, 183, 136, 0.2)' : 'rgba(231, 111, 81, 0.2)'}`,
        marginBottom: 16,
      }}
    >
      {connected ? (
        <Wifi size={16} style={{ color: 'var(--success)' }} />
      ) : (
        <WifiOff size={16} style={{ color: 'var(--danger)' }} />
      )}
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: connected ? 'var(--success)' : 'var(--danger)' }}>
        {connected ? 'Connected to Game' : 'Not Connected'}
      </span>
      {connected && (
        <div
          className="animate-pulse-live"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--success)',
            marginLeft: 'auto',
          }}
        />
      )}
    </div>
  );
}

// Animated approval bar for each companion
const CompanionApprovalCard = memo(function CompanionApprovalCard({
  character,
  isNew,
}: {
  character: GameCharacter;
  isNew: boolean;
}) {
  const approval = character.approval ?? 0;
  const level = character.approvalLevel ?? getApprovalLevel(approval);
  const color = getApprovalColor(approval);
  const pct = approvalPercent(approval);
  const staggerClass = isNew ? 'animate-fade-up' : '';

  return (
    <div
      className={staggerClass}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        padding: 14,
        borderLeft: `3px solid ${color}`,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `${color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={14} style={{ color }} />
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
            {character.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge
            label={level === 'very friendly' ? 'V.Friendly' : level}
            color={color}
          />
          <span
            data-numeric
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'inherit',
              minWidth: 32,
              textAlign: 'right' as const,
            }}
          >
            {approval > 0 ? '+' : ''}{approval}
          </span>
        </div>
      </div>

      {/* Approval meter bar */}
      <div style={{ position: 'relative', width: '100%', height: 12 }}>
        {/* Track */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 6,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Negative side marker (center line) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(255,255,255,0.1)',
              zIndex: 1,
            }}
          />
          {/* Fill */}
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 6,
              background: `linear-gradient(90deg, ${color}80, ${color})`,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease',
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
        </div>
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
          fontSize: '0.6rem',
          color: 'var(--text-dim)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span>-100</span>
        <span>0</span>
        <span>+100</span>
      </div>
    </div>
  );
});

// Single event in the feed
function ApprovalFeedItem({ event }: { event: ApprovalEvent }) {
  const isPositive = event.delta > 0;
  const color = isPositive ? '#52b788' : '#e76f51';
  const icon = isPositive ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />;
  const deltaStr = isPositive ? `+${event.delta}` : `${event.delta}`;
  const timeStr = formatEventTime(event.timestamp);

  return (
    <div
      className="animate-slide-in"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        background: `${color}06`,
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${color}15`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
            {event.companionName}
          </span>
          <span style={{ fontSize: '0.75rem', color }}>
            {isPositive ? 'approved' : 'disapproved'}
          </span>
          <span
            data-numeric
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: 'inherit',
            }}
          >
            ({deltaStr})
          </span>
        </div>
        {event.action && (
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {event.action}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-dim)',
          flexShrink: 0,
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {timeStr}
      </span>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

function formatEventTime(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Main Page ──────────────────────────────────────────────────

export default function ApprovalPage() {
  const { gameState, isConnected, connectionStatus } = useGameConnection();
  const [approvalEvents, setApprovalEvents] = useState<ApprovalEvent[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const prevPartyRef = useRef<Map<string, number>>(new Map());
  const feedRef = useRef<HTMLDivElement>(null);

  // Determine connected state
  const connected = isConnected && connectionStatus === 'connected';

  // Extract party companions with approval data
  const partyCompanions = gameState?.party ?? [];

  // Detect approval changes from game state diffs
  useEffect(() => {
    if (!gameState?.party) return;

    const currentMap = new Map<string, number>();
    for (const member of gameState.party) {
      if (member.approval !== undefined) {
        currentMap.set(member.guid, member.approval);
      }
    }

    const prevMap = prevPartyRef.current;
    const newEvents: ApprovalEvent[] = [];

    for (const [guid, approval] of currentMap) {
      const prev = prevMap.get(guid);
      if (prev !== undefined && prev !== approval) {
        const member = gameState.party.find((m) => m.guid === guid);
        const delta = approval - prev;
        newEvents.push({
          type: 'approval_change',
          companionName: member?.name ?? 'Unknown',
          companionGuid: guid,
          delta,
          approval,
          timestamp: gameState.timestamp ?? Date.now() / 1000,
        });
      }
    }

    if (newEvents.length > 0) {
      setApprovalEvents((prev) => [...newEvents, ...prev].slice(0, 100));
    }

    prevPartyRef.current = currentMap;
  }, [gameState]);

  // Listen for approval events from bridge (via BridgeEvent system)
  useEffect(() => {
    // The game connection's event callbacks already fire for state updates.
    // Bridge-emitted approval_change events are picked up via the state update
    // path above. If the bridge sends standalone approval events in the events
    // array, we handle those here too.
  }, []);

  // Determine which data to show
  const companions = connected && partyCompanions.length > 0
    ? partyCompanions
    : showDemo
      ? PLACEHOLDER_COMPANIONS
      : [];

  const events = connected && approvalEvents.length > 0
    ? approvalEvents
    : showDemo
      ? PLACEHOLDER_EVENTS
      : approvalEvents;

  // Summary stats
  const avgApproval = companions.length > 0
    ? Math.round(companions.reduce((sum, c) => sum + (c.approval ?? 0), 0) / companions.length)
    : 0;

  const highestApproval = companions.length > 0
    ? companions.reduce((best, c) => ((c.approval ?? 0) > (best.approval ?? 0) ? c : best))
    : null;

  const lowestApproval = companions.length > 0
    ? companions.reduce((worst, c) => ((c.approval ?? 0) < (worst.approval ?? 0) ? c : worst))
    : null;

  return (
    <AppShell title="Companion Approval">
      <BackButton href="/" label="Home" />

      {/* Connection status */}
      <ConnectionBanner isConnected={isConnected} connectionStatus={connectionStatus} />

      {/* Summary stats */}
      {companions.length > 0 && (
        <div className="animate-fade-up" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8,
            }}
          >
            <SummaryStat
              label="Average"
              value={avgApproval}
              color={getApprovalColor(avgApproval)}
            />
            {highestApproval && (
              <SummaryStat
                label="Highest"
                value={highestApproval.approval ?? 0}
                sublabel={highestApproval.name}
                color={getApprovalColor(highestApproval.approval ?? 0)}
              />
            )}
            {lowestApproval && (
              <SummaryStat
                label="Lowest"
                value={lowestApproval.approval ?? 0}
                sublabel={lowestApproval.name}
                color={getApprovalColor(lowestApproval.approval ?? 0)}
              />
            )}
          </div>
        </div>
      )}

      {/* Not connected prompt */}
      {!connected && !showDemo && (
        <div
          className="animate-fade-in"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(198, 162, 85, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Heart size={24} style={{ color: 'var(--gold)' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Companion Approval Tracker
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 20 }}>
            Connect to your game to see real-time approval changes for your party companions.
            Approval events will appear here as they happen in-game.
          </p>
          <button
            className="btn"
            onClick={() => setShowDemo(true)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--gold)',
              fontSize: '0.8rem',
            }}
          >
            <Activity size={14} />
            Preview with Demo Data
          </button>
        </div>
      )}

      {/* Demo mode indicator */}
      {showDemo && !connected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(198, 162, 85, 0.08)',
            border: '1px solid rgba(198, 162, 85, 0.15)',
          }}
        >
          <Activity size={12} style={{ color: 'var(--gold)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>
            Demo Mode — showing placeholder data
          </span>
        </div>
      )}

      {/* Companion approval cards */}
      {companions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          <SectionTitle icon={<Heart size={14} />} title="Party Approval" />
          {companions.map((companion, i) => (
            <CompanionApprovalCard
              key={companion.guid}
              character={companion}
              isNew={i < 6}
            />
          ))}
        </div>
      )}

      {/* Approval event feed */}
      {(events.length > 0 || connected) && (
        <div style={{ marginBottom: 24 }}>
          <SectionTitle icon={<TrendingUp size={14} />} title="Recent Approval Events" />
          {events.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 16px',
                color: 'var(--text-dim)',
                fontSize: '0.8rem',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              No approval events yet. They will appear here as you make choices in-game.
            </div>
          ) : (
            <div ref={feedRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.slice(0, 20).map((evt, i) => (
                <ApprovalFeedItem key={`${evt.companionGuid}-${evt.timestamp}-${i}`} event={evt} />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

// ── Small helper components ──────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
      }}
    >
      <span style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span
        style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--text)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </span>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        padding: '10px 12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        data-numeric
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'inherit',
        }}
      >
        {value > 0 ? '+' : ''}{value}
      </div>
      {sublabel && (
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 1 }}>{sublabel}</div>
      )}
    </div>
  );
}
