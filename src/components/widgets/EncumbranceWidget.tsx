'use client';

import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

export default function EncumbranceWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  if (!host?.encumbrance || host.encumbrance.maxWeight <= 0) return null;

  const enc = host.encumbrance;
  const pct = enc.maxWeight > 0 ? (enc.weight / enc.maxWeight) * 100 : 0;

  let barColor = '#52b788';
  let label = 'Normal';
  if (enc.state >= 2) {
    barColor = '#e76f51';
    label = 'Heavily Encumbered';
  } else if (enc.state >= 1) {
    barColor = '#f4a261';
    label = 'Encumbered';
  }

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Carry Weight
        </span>
        <span style={{ color: barColor, fontSize: 12, fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{
        height: 8,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 6,
      }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`,
          height: '100%',
          background: barColor,
          borderRadius: 4,
          transition: 'width 0.4s ease, background 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#e8e8ef', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {enc.weight} / {enc.maxWeight}
        </span>
      </div>
    </div>
  );
}
