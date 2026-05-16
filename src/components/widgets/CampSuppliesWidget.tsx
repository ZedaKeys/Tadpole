'use client';

import type { GameState } from '@/types';
import { safeNum } from '@/lib/safe-cast';
import type { CampSupplies } from '@/types';

interface WidgetProps { gameState: GameState; }

export default function CampSuppliesWidget({ gameState }: WidgetProps) {
  const supplies = gameState.campSupplies as CampSupplies | undefined;
  const current = safeNum(supplies?.current ?? 0);
  const max = safeNum(supplies?.max ?? 0);

  return (
    <div className="widget-card">
      <h3 className="widget-title">Camp Supplies</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="widget-value-lg">{current}</span>
        <span className="widget-note">/ {max}</span>
      </div>
    </div>
  );
}