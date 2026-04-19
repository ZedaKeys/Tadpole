'use client';

import { Coins } from 'lucide-react';
import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

export default function GoldResources({ gameState }: WidgetProps) {
  const gold = gameState.gold;

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 44,
    }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'rgba(198, 162, 85, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Coins size={20} color="#c6a255" />
      </div>
      <div>
        {gold > 0 ? (
          <>
            <div style={{ color: '#c6a255', fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
              {gold.toLocaleString()}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>Gold</div>
          </>
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>No gold data</div>
        )}
      </div>
    </div>
  );
}
