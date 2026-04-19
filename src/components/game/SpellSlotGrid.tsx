'use client';

import { memo } from 'react';
import type { GameCharacter } from '@/types';

interface SpellSlotGridProps {
  character: GameCharacter;
}

const SpellSlotRow = memo(function SpellSlotRow({ level, current, max }: { level: string; current: number; max: number }) {
  if (max <= 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: '#6b7280', width: 28, textAlign: 'right' }}>
        {level}
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < current;
          return (
            <div
              key={i}
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: filled ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                background: filled
                  ? 'linear-gradient(135deg, #c6a255, #e0c477)'
                  : 'rgba(255,255,255,0.03)',
                boxShadow: filled ? '0 0 6px rgba(198,162,85,0.3)' : 'none',
                transition: 'background 0.2s, border 0.2s',
              }}
            />
          );
        })}
      </div>
      <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>
        {current}/{max}
      </span>
    </div>
  );
});

export default function SpellSlotGrid({ character }: SpellSlotGridProps) {
  const slots = character.spellSlots;
  if (!slots || Object.keys(slots).length === 0) return null;

  const slotLevels = Object.keys(slots).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });

  const hasAnySlots = slotLevels.some((lvl) => (slots[lvl]?.max ?? 0) > 0);
  if (!hasAnySlots) return null;

  const levelLabels: Record<string, string> = {
    '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th', '6': '6th',
  };

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
      <span style={{ fontSize: 11, fontWeight: 600, color: '#c6a255', marginBottom: 8, display: 'block' }}>
        {character.name} — Spell Slots
      </span>
      {slotLevels.map((lvl) => (
        <SpellSlotRow
          key={lvl}
          level={levelLabels[lvl] || lvl}
          current={slots[lvl]?.current ?? 0}
          max={slots[lvl]?.max ?? 0}
        />
      ))}
    </div>
  );
}
