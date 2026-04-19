'use client';

import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

export default function SpellSlotsWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  const slots = host?.spellSlots;

  if (!slots) return null;

  const entries = Object.entries(slots).filter(([, v]) => v.max > 0);
  if (entries.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <h4 style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0 12px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Spell Slots
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(([level, data]) => {
          const levelNum = parseInt(level.replace(/\D/g, ''), 10) || parseInt(level, 10);
          const circles = Array.from({ length: data.max }, (_, i) => i < data.current);
          return (
            <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                color: '#c6a255',
                fontSize: 12,
                fontWeight: 600,
                width: 24,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {levelNum}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {circles.map((filled, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      border: `2px solid ${filled ? '#48bfe3' : 'rgba(255,255,255,0.15)'}`,
                      background: filled ? '#48bfe3' : 'transparent',
                      transition: 'background 0.3s, border-color 0.3s',
                    }}
                  />
                ))}
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                {data.current}/{data.max}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
