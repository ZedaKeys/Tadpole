1|'use client';

export const metadata = { title: 'World Map — Tadpole' };

import { useState, useCallback, useEffect } from 'react';
import { areas } from '@/data/areas';
import { resolveAreaSlug } from '@/data/areaMap';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import { useGameConnection } from '@/hooks/useGameConnection';
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

// ── Act map config: texture images and coordinate bounds ──────────
interface ActMapConfig {
  image: string;
  imageWidth: number;
  imageHeight: number;
  // Bounding box of game coordinates that map to this texture
  coordMinX: number;
  coordMinY: number;
  coordMaxX: number;
  coordMaxY: number;
  label: string;
  gradient: string;
}

const ACT_MAP_CONFIG: Record<number, ActMapConfig> = {
  1: {
    image: '/maps/act1-wilderness.webp',
    imageWidth: 600, imageHeight: 509,
    coordMinX: 0, coordMinY: 0,
    coordMaxX: 500, coordMaxY: 650,
    label: 'Wilderness',
    gradient: 'radial-gradient(ellipse at 30% 20%, rgba(82,183,136,0.06) 0%, transparent 60%)',
  },
  2: {
    image: '/maps/act2-shadow-cursed.webp',
    imageWidth: 600, imageHeight: 654,
    coordMinX: 0, coordMinY: 0,
    coordMaxX: 400, coordMaxY: 500,
    label: 'Shadow-Cursed Lands',
    gradient: 'radial-gradient(ellipse at 50% 50%, rgba(103,58,183,0.08) 0%, transparent 60%)',
  },
  3: {
    image: '/maps/act3-lower-city.webp',
    imageWidth: 600, imageHeight: 400,
    coordMinX: 0, coordMinY: 0,
    coordMaxX: 500, coordMaxY: 900,
    label: "City of Baldur's Gate",
    gradient: 'radial-gradient(ellipse at 40% 30%, rgba(72,191,227,0.06) 0%, transparent 60%)',
  },
};

// ── Waypoint data with game coordinates ─────────────────────────
// Key waypoints with known in-game coordinates from bg3.wiki
// Coordinates are (x, y) in game world space
const WAYPOINT_MARKERS: Record<number, Array<{
  id: string; name: string; x: number; y: number; slug: string;
}>> = {
  1: [
    { id: 'wp-nautiloid-wreck', name: 'Nautiloid Wreck', x: 260, y: 285, slug: 'ravaged-beach' },
    { id: 'wp-overgrown-ruins', name: 'Overgrown Ruins', x: 276, y: 298, slug: 'overgrown-ruins' },
    { id: 'wp-roadside-cliffs', name: 'Roadside Cliffs', x: 222, y: 326, slug: 'ravaged-beach' },
    { id: 'wp-emerald-grove', name: 'Emerald Grove', x: 246, y: 423, slug: 'emerald-grove' },
    { id: 'wp-the-hollow', name: 'The Hollow', x: 204, y: 501, slug: 'druid-grove' },
    { id: 'wp-sacred-pool', name: 'Sacred Pool', x: 210, y: 490, slug: 'druid-grove' },
    { id: 'wp-inner-sanctum', name: 'Inner Sanctum', x: 223, y: 525, slug: 'druid-grove' },
    { id: 'wp-secluded-cove', name: 'Secluded Cove', x: 275, y: 523, slug: 'wilderness' },
    { id: 'wp-ug-passage', name: 'Underground Passage', x: 167, y: 418, slug: 'emerald-grove' },
    { id: 'wp-forest', name: 'Forest', x: 86, y: 448, slug: 'wilderness' },
    { id: 'wp-owlbear', name: 'Owlbear Nest', x: 82, y: 450, slug: 'wilderness' },
    { id: 'wp-blighted-village', name: 'Blighted Village', x: 34, y: 394, slug: 'blighted-village' },
    { id: 'wp-apothecary', name: "Apothecary's Cellar", x: 32, y: 379, slug: 'blighted-village' },
    { id: 'wp-whispering-depths', name: 'Whispering Depths', x: 24, y: 401, slug: 'blighted-village' },
    { id: 'wp-risen-road', name: 'The Risen Road', x: 78, y: 489, slug: 'wilderness' },
    { id: 'wp-sunlit-wetlands', name: 'Sunlit Wetlands', x: 47, y: 315, slug: 'sunlit-wetlands' },
    { id: 'wp-shattered-sanctum', name: 'Shattered Sanctum', x: 338, y: 14, slug: 'goblin-camp' },
    { id: 'wp-defiled-temple', name: 'Defiled Temple', x: 389, y: 44, slug: 'goblin-camp' },
    { id: 'wp-campsite', name: 'Campsite', x: 363, y: 51, slug: 'camp' },
  ],
  2: [
    { id: 'wp-ruined-battlefield', name: 'Ruined Battlefield', x: 121, y: 229, slug: 'shadow-cursed-lands' },
    { id: 'wp-shadowed-battlefield', name: 'Shadowed Battlefield', x: 276, y: 297, slug: 'shadow-cursed-lands' },
    { id: 'wp-rosymorn', name: 'Rosymorn Monastery', x: 17, y: 23, slug: 'mountain-pass' },
  ],
  3: [
    { id: 'wp-rivington', name: 'Rivington', x: 30, y: 29, slug: 'rivington' },
    { id: 'wp-open-hand', name: 'Open Hand Temple', x: 5, y: 74, slug: 'rivington' },
    { id: 'wp-south-span', name: 'South Span Checkpoint', x: 34, y: 47, slug: 'rivington' },
    { id: 'wp-western-beach', name: 'Western Beach', x: 58, y: 48, slug: 'rivington' },
    { id: 'wp-wyrms-crossing', name: "Wyrm's Crossing", x: 34, y: 47, slug: 'wyrms-crossing' },
    { id: 'wp-wyrms-rock', name: "Wyrm's Rock Fortress", x: 27, y: 158, slug: 'wyrms-rock-fortress' },
    { id: 'wp-basilisk-gate', name: 'Basilisk Gate', x: 123, y: 4, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-elfsong', name: 'Elfsong Tavern', x: 76, y: 1, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-candulhallow', name: 'Candulhallow', x: 87, y: 15, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-graveyard', name: 'Graveyard', x: 21, y: 13, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-forge-nine', name: 'Forge of the Nine', x: 391, y: 370, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-devils-fee', name: "Devil's Fee", x: 391, y: 770, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-guildhall', name: 'Guildhall', x: 38, y: 784, slug: 'baldurs-gate-lower-city' },
    { id: 'wp-high-hall', name: 'High Hall', x: 258, y: 33, slug: 'baldurs-gate-upper-city' },
    { id: 'wp-dragons-sanctum', name: "Dragon's Sanctum", x: 636, y: 964, slug: 'wyrms-rock-fortress' },
  ],
};

// ── Convert game coords to percentage within map ────────────────
function coordToPercent(
  x: number, y: number,
  config: ActMapConfig
): { left: number; top: number } {
  const rangeX = config.coordMaxX - config.coordMinX || 1;
  const rangeY = config.coordMaxY - config.coordMinY || 1;
  const left = ((x - config.coordMinX) / rangeX) * 100;
  const top = ((y - config.coordMinY) / rangeY) * 100;
  // Clamp to 2-98% to keep markers visible
  return {
    left: Math.max(2, Math.min(98, left)),
    top: Math.max(2, Math.min(98, top)),
  };
}

// ── Sub-components ──────────────────────────────────────────────────
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

// ── Access status helpers ─────────────────────────────────────────────
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
  isCurrentLocation,
  onTap,
}: {
  node: MapNode;
  area: Area;
  status: AccessStatus;
  isSelected: boolean;
  isCurrentLocation?: boolean;
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

      {/* "You are here" pulse indicator */}
      {isCurrentLocation && (
        <>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '2px solid var(--accent)',
              opacity: 0.6,
              animation: 'pulse-live 2s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: -4,
              transform: 'translateX(-50%)',
              fontSize: '0.5rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              textShadow: '0 0 8px rgba(72,191,227,0.6)',
              pointerEvents: 'none',
            }}
          >
            YOU
          </div>
        </>
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
          boxShadow: isSelected ? `0 0 16px ${colors.glow}` : isCurrentLocation ? '0 0 12px rgba(72,191,227,0.5)' : 'none',
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

// ── Main Page ───────────────────────────────────────────────────────
export default function WorldMapPage() {
  const [activeAct, setActiveAct] = useState(1);
  const [selectedWp, setSelectedWp] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const { gameState, isConnected } = useGameConnection();

  const mapConfig = ACT_MAP_CONFIG[activeAct];
  const markers = WAYPOINT_MARKERS[activeAct] || [];

  // Resolve current area slug from live game state
  const currentAreaSlug = gameState?.areaSlug || (gameState?.area ? resolveAreaSlug(gameState.area) : '');
  const currentAct = gameState?.areaAct || 0;

  // Auto-switch to the player's current act when connected
  useEffect(() => {
    if (isConnected && currentAct >= 1 && currentAct <= 3 && currentAct !== activeAct) {
      setActiveAct(currentAct);
      setSelectedWp(null);
    }
  }, [isConnected, currentAct]);

  const areaMap = areas.reduce<Record<string, Area>>((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {});

  const selectedMarker = selectedWp ? markers.find((m) => m.id === selectedWp) : null;
  const selectedArea = selectedMarker ? areaMap[selectedMarker.slug] : null;

  // Calculate aspect ratio from image dimensions
  const aspectRatio = mapConfig.imageWidth / mapConfig.imageHeight;

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
              setSelectedWp(null);
            }}
          />
        ))}
      </div>

      {/* Subtitle + controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {mapConfig.label}
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isConnected && currentAreaSlug && (
            <span style={{ fontSize: '0.5625rem', color: 'var(--accent)', fontWeight: 600 }}>
              LIVE
            </span>
          )}
          <button
            onClick={() => setShowLabels(!showLabels)}
            style={{
              fontSize: '0.625rem',
              padding: '3px 8px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: showLabels ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
        </div>
      </div>

      {/* Map viewport with terrain texture */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${aspectRatio}`,
          borderRadius: 16,
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginTop: 8,
          marginBottom: 16,
          background: '#0a0a0f',
        }}
      >
        {/* Terrain texture image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mapConfig.image}
          alt={`${mapConfig.label} terrain map`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.85,
            filter: 'brightness(0.85) contrast(1.15) saturate(1.1)',
          }}
        />

        {/* Dark overlay for readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,10,15,0.1) 0%, rgba(10,10,15,0.35) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Waypoint markers */}
        {markers.map((marker) => {
          const pos = coordToPercent(marker.x, marker.y, mapConfig);
          const isHere = currentAreaSlug === marker.slug;
          const isSelected = selectedWp === marker.id;

          return (
            <button
              key={marker.id}
              onClick={() => setSelectedWp(isSelected ? null : marker.id)}
              style={{
                position: 'absolute',
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                transform: 'translate(-50%, -50%)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
                zIndex: isSelected ? 10 : isHere ? 5 : 2,
              }}
            >
              {/* "You are here" pulse ring */}
              {isHere && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '2px solid var(--accent)',
                    animation: 'pulse-live 2s ease-in-out infinite',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Dot */}
              <div
                style={{
                  width: isHere ? 14 : isSelected ? 12 : 10,
                  height: isHere ? 14 : isSelected ? 12 : 10,
                  borderRadius: '50%',
                  background: isHere ? 'var(--accent)' : isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.8)',
                  border: isHere ? '2px solid rgba(72,191,227,0.6)' : isSelected ? '2px solid rgba(198,162,85,0.5)' : '1.5px solid rgba(255,255,255,0.3)',
                  boxShadow: isHere
                    ? '0 0 8px rgba(72,191,227,0.6), 0 0 16px rgba(72,191,227,0.3)'
                    : isSelected
                      ? '0 0 6px rgba(198,162,85,0.4)'
                      : '0 0 3px rgba(0,0,0,0.5)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              />

              {/* Label */}
              {(showLabels || isHere || isSelected) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: 3,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: isHere ? '0.5625rem' : '0.5rem',
                      fontWeight: isHere ? 700 : 600,
                      color: isHere ? 'var(--accent)' : isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.7)',
                      textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)',
                      background: 'rgba(10,10,15,0.75)',
                      padding: '1px 4px',
                      borderRadius: 3,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {marker.name}
                  </span>
                </div>
              )}
            </button>
          );
        })}

        {/* Compass rose */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            fontSize: '0.5rem',
            color: 'rgba(198,162,85,0.3)',
            fontWeight: 700,
            letterSpacing: '0.1em',
            pointerEvents: 'none',
          }}
        >
          N
        </div>
      </div>

      {/* Selected waypoint detail */}
      {selectedMarker && selectedArea && (
        <AreaDetailDrawer
          area={selectedArea}
          status={selectedArea.lockedAfter && activeAct > selectedArea.lockedAfter ? 'gone' : selectedArea.lockedAfter && activeAct === selectedArea.lockedAfter ? 'locked-after' : 'accessible'}
          onClose={() => setSelectedWp(null)}
        />
      )}

      {/* Waypoint list below the map */}
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
          Waypoints ({markers.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {markers.map((marker) => {
            const area = areaMap[marker.slug];
            const isHere = currentAreaSlug === marker.slug;
            return (
              <button
                key={marker.id}
                onClick={() => setSelectedWp(selectedWp === marker.id ? null : marker.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: selectedWp === marker.id ? 'rgba(198,162,85,0.08)' : isHere ? 'rgba(72,191,227,0.06)' : 'rgba(255,255,255,0.02)',
                  border: selectedWp === marker.id ? '1px solid rgba(198,162,85,0.2)' : isHere ? '1px solid rgba(72,191,227,0.15)' : '1px solid var(--border)',
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
                    background: isHere ? 'var(--accent)' : area ? 'var(--gold)' : 'rgba(255,255,255,0.5)',
                    flexShrink: 0,
                    boxShadow: isHere ? '0 0 6px rgba(72,191,227,0.5)' : '0 0 4px rgba(198,162,85,0.3)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {marker.name}
                    {isHere && (
                      <span style={{
                        fontSize: '0.5rem',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        background: 'rgba(72,191,227,0.15)',
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}>
                        HERE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                    {area ? `${area.pointsOfInterest.length} POIs · ${area.relatedQuests.length} quests` : marker.slug}
                  </div>
                </div>
                {area && <Badge label={`Act ${area.act}`} color="var(--gold)" />}
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
