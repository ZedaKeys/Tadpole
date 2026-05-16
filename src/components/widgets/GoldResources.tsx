'use client';

import type { GameState } from '@/types';
import { safeNum } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

export default function GoldResources({ gameState }: WidgetProps) {
  const gold = safeNum(gameState.gold);
  const supplies = gameState.campSupplies;
  const campCurrent = safeNum((supplies as any)?.current ?? 0);
  const campMax = safeNum((supplies as any)?.max ?? 0);

  return (
    <div className="widget-card">
      <h3 className="widget-title">Resources</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)', fontVariantNumeric: 'tabular-nums' }}>
            {gold.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>Gold</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {campCurrent}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 2 }}>Camp Supplies</div>
        </div>
      </div>
    </div>
  );
}