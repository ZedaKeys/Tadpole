'use client';

import { useState, useCallback } from 'react';
import { areas } from '@/data/areas';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import type { Area } from '@/types';

// ── Layout config per act ──────────────────────────────────────────
interface MapNode {
  areaId: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

interface MapConnection {
  from: string;
  to: string;
}

interface ActLayout {
  nodes: MapNode[];
  connections: MapConnection[];
}

const ACT_LAYOUTS: Record<number, ActLayout> = {
  1: {
    nodes: [
      { areaId: 'ravaged-beach', x: 30, y: 12 },
      { areaId: 'emerald-grove', x: 22, y: 35 },
      { areaId: 'druid-grove', x: 12, y: 52 },
      { areaId: 'blighted-village', x: 52, y: 30 },
      { areaId: 'goblin-camp', x: 72, y: 22 },
      { areaId: 'underdark', x: 45, y: 58 },
      { areaId: 'grymforge', x: 62, y: 75 },
      { areaId: 'mountain-pass', x: 88, y: 45 },
    ],
    connections: [
      { from: 'ravaged-beach', to: 'emerald-grove' },
      { from: 'ravaged-beach', to: 'blighted-village' },
      { from: 'emerald-grove', to: 'druid-grove' },
      { from: 'blighted-village', to: 'goblin-camp' },
      { from: 'emerald-grove', to: 'blighted-village' },
      { from: 'blighted-village', to: 'underdark' },
      { from: 'underdark', to: 'grymforge' },
      { from: 'blighted-village', to: 'mountain-pass' },
      { from: 'goblin-camp', to: 'mountain-pass' },
    ],
  },
  2: {
    nodes: [
      { areaId: 'shadow-cursed-lands', x: 18, y: 35 },
      { areaId: 'last-light-inn', x: 50, y: 22 },
      { areaId: 'moonrise-towers', x: 78, y: 50 },
    ],
    connections: [
      { from: 'shadow-cursed-lands', to: 'last-light-inn' },
      { from: 'last-light-inn', to: 'moonrise-towers' },
      { from: 'shadow-cursed-lands', to: 'moonrise-towers' },
    ],
  },
  3: {
    nodes: [
      { areaId: 'rivington', x: 20, y: 80 },
      { areaId: 'wyrms-rock-fortress', x: 50, y: 55 },
      { areaId: 'baldurs-gate-lower-city', x: 30, y: 35 },
      { areaId: 'baldurs-gate-upper-city', x: 75, y: 20 },
    ],
    connections: [
      { from: 'rivington', to: 'wyrms-rock-fortress' },
      { from: 'wyrms-rock-fortress', to: 'baldurs-gate-lower-city' },
      { from: 'baldurs-gate-lower-city', to: 'baldurs-gate-upper-city' },
      { from: 'rivington', to: 'baldurs-gate-lower-city' },
    ],
  },
};

// ── Color coding based on accessibility ─────────────────────────────
type AccessStatus = 'accessible' | 'locked-after' | 'gone';

function getAccessStatus(area: Area, currentAct: number): AccessStatus {
  if (!area.lockedAfter) return 'accessible';
  if (currentAct < area.lockedAfter) return 'accessible';
  if (currentAct === area.lockedAfter) return 'locked-after';
  return 'gone';
}

function statusColor(status: AccessStatus): { node: string; border: string; glow: string; label: string } {
  switch (status) {
    case 'accessible':
      return { node: '#1a2e1a', border: '#52b788', glow: 'rgba(82,183,136,0.4)', label: 'Accessible' };
    case 'locked-after':
      return { node: '#2e2a1a', border: '#f4a261', glow: 'rgba(244,162,97,0.4)', label: 'Locked after this act' };
    case 'gone':
      return { node: '#2e1a1a', border: '#e76f51', glow: 'rgba(231,111,81,0.4)', label: 'No longer accessible' };
  }
}

// ── Quest name mapping for display ─────────────────────────────────
const QUEST_NAMES: Record<string, string> = {
  'escape-the-nautiloid': 'Escape the Nautiloid',
  'find-the-healer': 'Find the Healer',
  'the-pale-elf': 'The Pale Elf',
  'save-the-grove': 'Save the Grove',
  'wylls-pact': "Wyll's Pact",
  'halsins-quest': "Halsin's Quest",
  'avenge-the-ironhand': 'Avenge the Ironhand',
  'the-paranoid-stuffed-bear': 'The Paranoid Stuffed Bear',
  'help-the-hag-survivors': 'Help the Hag Survivors',
  'find-the-blood-of-lathander': 'Find the Blood of Lathander',
  'divergent-bloodlines': 'Divergent Bloodlines',
  'infiltrate-moonrise-towers': 'Infiltrate Moonrise Towers',
  'free-nightsong': 'Free Nightsong',
  'save-aylin': 'Save Aylin',
  'karlachs-infernal-engine': "Karlach's Infernal Engine",
  'the-grand-design': 'The Grand Design',
  'investigate-the-temples': 'Investigate the Temples',
  'the-heart-of-gale': "The Heart of Gale",
};

// ── Sub-components ──────────────────────────────────────────────────

function TabButton({ act, active, onClick }: { act: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        border: 'none',
        borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
        background: 'transparent',
        color: active ? 'var(--gold)' : 'var(--text-dim)',
        fontSize: '0.8125rem',
        fontWeight: active ? 700 : 500,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        transition: 'color 0.2s, border-color 0.2s',
        fontFamily: 'inherit',
      }}
    >
      Act {act}
    </button>
  );
}

function MapNodeComp({
  node,
  area,
  status,
  isSelected,
  onTap,
}: {
  node: MapNode;
  area: Area;
  status: AccessStatus;
  isSelected: boolean;
  onTap: () => void;
}) {
  const colors = statusColor(status);
  const poiCount = area.pointsOfInterest.length;
  const questCount = area.relatedQuests.length;

  return (
    <button
      onClick={onTap}
      style={{
        position: 'absolute',
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: 'translate(-50%, -50%)',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'inherit',
      }}
    >
      {/* Glow ring when selected */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.glow}, transparent 70%)`,
            animation: 'pulse-gold 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main circle */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${colors.node}, rgba(0,0,0,0.6))`,
          border: `2px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: isSelected ? `0 0 16px ${colors.glow}` : 'none',
          position: 'relative',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.12)';
          e.currentTarget.style.boxShadow = `0 0 20px ${colors.glow}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isSelected ? `0 0 16px ${colors.glow}` : 'none';
        }}
      >
        {/* POI count inside */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: colors.border,
            lineHeight: 1,
            fontFamily: "'SF Mono', 'Cascadia Code', ui-monospace, monospace",
          }}
        >
          {poiCount}
        </span>
      </div>

      {/* Name label below */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: 4,
          textAlign: 'center',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontSize: '0.625rem',
            fontWeight: 600,
            color: isSelected ? colors.border : 'var(--text)',
            letterSpacing: '0.02em',
            textShadow: '0 1px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)',
            background: 'rgba(10,10,15,0.7)',
            padding: '1px 5px',
            borderRadius: 3,
          }}
        >
          {area.name}
        </span>
      </div>
    </button>
  );
}

function ConnectionLine({ from, to }: { from: MapNode; to: MapNode }) {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <line
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${to.x}%`}
        y2={`${to.y}%`}
        stroke="rgba(198,162,85,0.15)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
    </svg>
  );
}

function AreaDetailDrawer({
  area,
  status,
  onClose,
}: {
  area: Area;
  status: AccessStatus;
  onClose: () => void;
}) {
  const colors = statusColor(status);
  const poiByType = area.pointsOfInterest.reduce<Record<string, typeof area.pointsOfInterest>>(
    (acc, poi) => {
      (acc[poi.type] ??= []).push(poi);
      return acc;
    },
    {}
  );

  const typeLabels: Record<string, string> = {
    quest: 'Quests',
    npc: 'NPCs',
    item: 'Items',
    chest: 'Chests',
    secret: 'Secrets',
    waypoint: 'Waypoints',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          animation: 'fade-in 0.2s ease-out',
        }}
      />

      {/* Drawer */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxHeight: '75vh',
          background: 'var(--surface)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'auto',
          animation: 'fade-up 0.3s ease-out',
          paddingBottom: 100,
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 0 4px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.12)',
            }}
          />
        </div>

        <div style={{ padding: '8px 20px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  letterSpacing: '0.02em',
                  margin: 0,
                }}
              >
                {area.name}
              </h2>
              <Badge label={`Act ${area.act}`} color="var(--gold)" />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge label={colors.label} color={colors.border} />
            </div>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              color: 'var(--text-dim)',
              margin: '0 0 16px',
            }}
          >
            {area.description}
          </p>

          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', fontFamily: "'SF Mono', ui-monospace, monospace" }}>
                {area.pointsOfInterest.length}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Points of Interest
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', fontFamily: "'SF Mono', ui-monospace, monospace" }}>
                {area.relatedQuests.length}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Related Quests
              </div>
            </div>
          </div>

          {/* Lock info */}
          {area.lockedAfter && (
            <div
              style={{
                background: status === 'accessible'
                  ? 'rgba(82,183,136,0.08)'
                  : status === 'locked-after'
                    ? 'rgba(244,162,97,0.08)'
                    : 'rgba(231,111,81,0.08)',
                border: `1px solid ${colors.border}30`,
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: '0.75rem', color: colors.border, fontWeight: 600 }}>
                {status === 'accessible'
                  ? `Accessible until end of Act ${area.lockedAfter}`
                  : status === 'locked-after'
                    ? `Becomes inaccessible after Act ${area.lockedAfter}`
                    : `No longer accessible (was locked after Act ${area.lockedAfter})`}
              </span>
            </div>
          )}

          {/* Points of Interest by type */}
          <div style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              Points of Interest
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(poiByType).map(([type, pois]) => (
                <div key={type}>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: 'var(--gold-dim)',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {typeLabels[type] || type} ({pois.length})
                  </div>
                  {pois.map((poi) => (
                    <div
                      key={poi.id}
                      style={{
                        padding: '8px 10px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 8,
                        marginBottom: 4,
                        borderLeft: `2px solid ${colors.border}40`,
                      }}
                    >
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
                        {poi.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4, marginTop: 2 }}>
                        {poi.description}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Related Quests */}
          {area.relatedQuests.length > 0 && (
            <div>
              <h3
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Related Quests
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {area.relatedQuests.map((qId) => (
                  <Badge
                    key={qId}
                    label={QUEST_NAMES[qId] || qId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    color="var(--accent)"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────────────
function Legend() {
  const items: { status: AccessStatus; label: string }[] = [
    { status: 'accessible', label: 'Accessible' },
    { status: 'locked-after', label: 'Locked after this act' },
    { status: 'gone', label: 'No longer accessible' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        marginTop: 8,
        marginBottom: 4,
      }}
    >
      {items.map((item) => {
        const c = statusColor(item.status);
        return (
          <div key={item.status} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: c.border,
                boxShadow: `0 0 4px ${c.glow}`,
              }}
            />
            <span style={{ fontSize: '0.5625rem', color: 'var(--text-dim)', fontWeight: 500 }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Act thematic backgrounds ────────────────────────────────────────
function getActTheme(act: number) {
  switch (act) {
    case 1:
      return {
        gradient: 'radial-gradient(ellipse at 30% 20%, rgba(82,183,136,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(198,162,85,0.04) 0%, transparent 50%)',
        label: 'Wilderness',
      };
    case 2:
      return {
        gradient: 'radial-gradient(ellipse at 50% 50%, rgba(103,58,183,0.08) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(231,111,81,0.05) 0%, transparent 50%)',
        label: 'Shadow-Cursed Lands',
      };
    case 3:
      return {
        gradient: 'radial-gradient(ellipse at 40% 30%, rgba(72,191,227,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(198,162,85,0.05) 0%, transparent 50%)',
        label: 'City of Baldur\'s Gate',
      };
    default:
      return { gradient: 'none', label: '' };
  }
}

// ── Main Page ───────────────────────────────────────────────────────
export default function WorldMapPage() {
  const [activeAct, setActiveAct] = useState(1);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const layout = ACT_LAYOUTS[activeAct];
  const theme = getActTheme(activeAct);

  const areaMap = areas.reduce<Record<string, Area>>((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {});

  const handleSelect = useCallback((areaId: string) => {
    setSelectedAreaId((prev) => (prev === areaId ? null : areaId));
  }, []);

  const selectedArea = selectedAreaId ? areaMap[selectedAreaId] : null;
  const selectedNode = selectedAreaId ? layout.nodes.find((n) => n.areaId === selectedAreaId) ?? null : null;

  return (
    <AppShell title="World Map">
      <BackButton label="Home" href="/" />

      {/* Act tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          marginBottom: 12,
          marginTop: 8,
        }}
      >
        {[1, 2, 3].map((act) => (
          <TabButton
            key={act}
            act={act}
            active={activeAct === act}
            onClick={() => {
              setActiveAct(act);
              setSelectedAreaId(null);
            }}
          />
        ))}
      </div>

      {/* Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {theme.label}
        </span>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
          {layout.nodes.length} areas
        </span>
      </div>

      {/* Legend */}
      <Legend />

      {/* Map viewport */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 3',
          background: theme.gradient,
          borderRadius: 16,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        {/* Connection lines */}
        {layout.connections.map((conn, i) => {
          const fromNode = layout.nodes.find((n) => n.areaId === conn.from);
          const toNode = layout.nodes.find((n) => n.areaId === conn.to);
          if (!fromNode || !toNode) return null;
          return <ConnectionLine key={i} from={fromNode} to={toNode} />;
        })}

        {/* Area nodes */}
        {layout.nodes.map((node) => {
          const area = areaMap[node.areaId];
          if (!area) return null;
          const status = getAccessStatus(area, activeAct);
          return (
            <MapNodeComp
              key={node.areaId}
              node={node}
              area={area}
              status={status}
              isSelected={selectedAreaId === node.areaId}
              onTap={() => handleSelect(node.areaId)}
            />
          );
        })}

        {/* Compass rose decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            fontSize: '0.5rem',
            color: 'rgba(198,162,85,0.25)',
            fontWeight: 700,
            letterSpacing: '0.1em',
          }}
        >
          N
        </div>
      </div>

      {/* Quick area list below the map */}
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Areas in Act {activeAct}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {layout.nodes.map((node) => {
            const area = areaMap[node.areaId];
            if (!area) return null;
            const status = getAccessStatus(area, activeAct);
            const colors = statusColor(status);
            return (
              <button
                key={node.areaId}
                onClick={() => handleSelect(node.areaId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: selectedAreaId === node.areaId ? `${colors.border}10` : 'rgba(255,255,255,0.02)',
                  border: selectedAreaId === node.areaId ? `1px solid ${colors.border}30` : '1px solid var(--border)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  color: 'var(--text)',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: colors.border,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${colors.glow}`,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{area.name}</div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--text-dim)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {area.pointsOfInterest.length} POIs · {area.relatedQuests.length} quests
                  </div>
                </div>
                <Badge label={colors.label} color={colors.border} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedArea && selectedNode && (
        <AreaDetailDrawer
          area={selectedArea}
          status={getAccessStatus(selectedArea, activeAct)}
          onClose={() => setSelectedAreaId(null)}
        />
      )}
    </AppShell>
  );
}
