'use client';

import type { GameState } from '@/types';
import { safeNum } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

// Render spell slot circles for a level
function renderLevel(level: number, max: number, filled: number) {
  return (
    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 18, fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 700 }}>{level}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12, height: 12, borderRadius: 999,
              border: '2px solid var(--accent)',
              background: i < filled ? 'var(--accent)' : 'transparent',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function SpellSlotsWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  const slots = host?.spellSlots as Record<string, { current: number; max: number }> | undefined;

  if (!slots || Object.keys(slots).length === 0) return null;

  return (
    <div className="widget-card">
      <h3 className="widget-title">Spell Slots</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(slots)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([level, { current, max }]) => renderLevel(parseInt(level), max, current))}
      </div>
    </div>
  );
}