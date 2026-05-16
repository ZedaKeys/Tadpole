'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { BackButton } from '@/components/ui/BackButton';
import { useGameConnection } from '@/hooks/useGameConnection';

// ── Map node positions per act (percentage-based, no game coord math needed) ──
const ACT_LAYOUTS: Record<number, { nodes: { areaId: string; x: number; y: number }[]; connections: { from: string; to: string }[] }> = {
  1: {
    nodes: [
      { areaId: 'ravaged-beach',   x: 52, y: 56 },
      { areaId: 'emerald-grove',   x: 49, y: 65 },
      { areaId: 'druid-grove',      x: 42, y: 77 },
      { areaId: 'blighted-village', x: 28, y: 38 },
      { areaId: 'goblin-camp',      x: 68, y: 98 },
      { areaId: 'underdark',        x: 58, y: 12 },
      { areaId: 'grymforge',        x: 32, y: 5 },
      { areaId: 'mountain-pass',    x: 97, y: 91 },
    ],
    connections: [
      { from: 'ravaged-beach',   to: 'emerald-grove' },
      { from: 'emerald-grove',   to: 'druid-grove' },
      { from: 'emerald-grove',   to: 'blighted-village' },
      { from: 'ravaged-beach',   to: 'blighted-village' },
      { from: 'blighted-village',to: 'goblin-camp' },
      { from: 'blighted-village',to: 'underdark' },
      { from: 'underdark',       to: 'grymforge' },
      { from: 'blighted-village',to: 'mountain-pass' },
      { from: 'goblin-camp',     to: 'mountain-pass' },
    ],
  },
  2: {
    nodes: [
      { areaId: 'shadow-cursed-lands', x: 30, y: 42 },
      { areaId: 'last-light-inn',      x: 55, y: 62 },
      { areaId: 'moonrise-towers',     x: 78, y: 38 },
    ],
    connections: [
      { from: 'shadow-cursed-lands', to: 'last-light-inn' },
      { from: 'last-light-inn',      to: 'moonrise-towers' },
      { from: 'shadow-cursed-lands', to: 'moonrise-towers' },
    ],
  },
  3: {
    nodes: [
      { areaId: 'rivington',               x: 18, y: 14 },
      { areaId: 'wyrms-rock-fortress',      x: 8,  y: 20 },
      { areaId: 'baldurs-gate-lower-city',  x: 38, y: 42 },
      { areaId: 'baldurs-gate-upper-city',  x: 60, y: 60 },
    ],
    connections: [
      { from: 'rivington',              to: 'wyrms-rock-fortress' },
      { from: 'wyrms-rock-fortress',   to: 'baldurs-gate-lower-city' },
      { from: 'baldurs-gate-lower-city',to: 'baldurs-gate-upper-city' },
      { from: 'rivington',             to: 'baldurs-gate-lower-city' },
    ],
  },
};

const ACT_LABELS: Record<number, string> = { 1: 'Act 1 — Wilderness', 2: 'Act 2 — Shadow-Cursed', 3: 'Act 3 — Baldur\'s Gate' };
const ACT_IMAGE_NAMES: Record<number, string> = { 1: 'act1-wilderness', 2: 'act2-shadow-cursed', 3: 'act3-lower-city' };

function nodeLabel(id: string): string {
  return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function MapPage() {
  const [activeAct, setActiveAct] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { isConnected } = useGameConnection();

  const layout = ACT_LAYOUTS[activeAct];
  const imageName = ACT_IMAGE_NAMES[activeAct];

  return (
    <AppShell title="World Map">
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 100px' }}>

        {/* Act tabs */}
        <div className="map-act-tabs">
          {[1, 2, 3].map((act) => (
            <button
              key={act}
              onClick={() => { setActiveAct(act); setSelectedNode(null); }}
              className={`map-act-tab${activeAct === act ? ' active' : ''}`}
            >
              {act}
            </button>
          ))}
        </div>

        {/* Map image */}
        <div className="map-container" style={{ position: 'relative', background: '#0a0a0e', minHeight: 200 }}>
          <img
            src={`/phone/maps/${imageName}.webp`}
            alt={ACT_LABELS[activeAct]}
            style={{ width: '100%', height: 'auto', display: 'block', opacity: 0.85 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* SVG overlay for connections and nodes */}
          <svg
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Connection lines */}
            {layout.connections.map(({ from, to }) => {
              const fromNode = layout.nodes.find(n => n.areaId === from);
              const toNode = layout.nodes.find(n => n.areaId === to);
              if (!fromNode || !toNode) return null;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={fromNode.x} y1={fromNode.y}
                  x2={toNode.x} y2={toNode.y}
                  className="map-connection-line"
                />
              );
            })}

            {/* Nodes */}
            {layout.nodes.map((node) => (
              <g
                key={node.areaId}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                onClick={() => setSelectedNode(selectedNode === node.areaId ? null : node.areaId)}
              >
                <circle
                  cx={node.x} cy={node.y} r={selectedNode === node.areaId ? 3 : 2}
                  fill={selectedNode === node.areaId ? 'var(--accent)' : 'rgba(255,255,255,0.7)'}
                  style={{ transition: 'all 0.15s' }}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Node detail */}
        {selectedNode && (
          <div style={{
            marginTop: 12,
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--surface)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1rem', color: 'var(--text)' }}>{nodeLabel(selectedNode)}</strong>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '1.1rem', padding: 4 }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {!isConnected && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: '4px 0 0' }}>
                Connect to live game to see current location
              </p>
            )}
          </div>
        )}

        {/* Node list */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {layout.nodes.map((node) => (
            <button
              key={node.areaId}
              onClick={() => setSelectedNode(node.areaId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                border: selectedNode === node.areaId ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 10,
                background: selectedNode === node.areaId ? 'rgba(91,138,255,0.06)' : 'var(--surface)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 999, flexShrink: 0,
                background: selectedNode === node.areaId ? 'var(--accent)' : 'var(--text-3)',
              }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                {nodeLabel(node.areaId)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}