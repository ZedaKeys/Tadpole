'use client';

import { memo } from 'react';
import type { GameCharacter } from '@/types';

interface ActionResourcesPanelProps {
  character: GameCharacter;
}

const ResourceRow = memo(function ResourceRow({ name, current, max }: { name: string; current: number; max: number }) {
  if (max <= 0) return null;

  const pct = max > 0 ? current / max : 0;
  const barColor = pct > 0.5 ? '#48bfe3' : pct > 0.25 ? '#f4a261' : '#e76f51';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: '#9ca3af', width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, flexShrink: 0 }}>
        {name}
      </span>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, background: barColor, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: '#d1d5db', width: 30, textAlign: 'right', flexShrink: 0 }}>
        {current}/{max}
      </span>
    </div>
  );
});

export default function ActionResourcesPanel({ character }: ActionResourcesPanelProps) {
  const resources = character.actionResources;
  if (!resources || resources.length === 0) return null;

  // Flatten nested resources into display items
  const items = resources.flatMap((r) =>
    r.slots.map((slot, i) => ({
      key: `${r.name}-${i}`,
      name: r.slots.length > 1 ? `${r.name} Lvl ${slot.level}` : r.name,
      current: slot.amount,
      max: slot.maxAmount,
    }))
  ).filter((item) => item.max > 0);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: '#48bfe3', marginBottom: 8, display: 'block' }}>
        {character.name} — Class Resources
      </span>
      {items.map((r) => (
        <ResourceRow
          key={r.key}
          name={r.name}
          current={r.current}
          max={r.max}
        />
      ))}
    </div>
  );
}
