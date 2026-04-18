'use client';

import { Tent } from 'lucide-react';
import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

export default function CampSuppliesWidget({ gameState }: WidgetProps) {
  const supplies = gameState.campSupplies;
  if (!supplies || supplies.max <= 0) return null;

  const pct = supplies.max > 0 ? (supplies.current / supplies.max) * 100 : 0;
  const barColor = supplies.canRest ? '#52b788' : '#f4a261';

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Tent size={16} color="#c6a255" />
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Camp Supplies
        </span>
        {supplies.canRest && (
          <span style={{
            color: '#52b788',
            fontSize: 11,
            background: 'rgba(82, 183, 136, 0.15)',
            padding: '2px 8px',
            borderRadius: 8,
            marginLeft: 'auto',
            fontWeight: 600,
          }}>
            CAN REST
          </span>
        )}
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
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ color: '#e8e8ef', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
        {supplies.current} / {supplies.max}
      </div>
    </div>
  );
}
