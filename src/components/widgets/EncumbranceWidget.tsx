'use client';

import type { GameState } from '@/types';
import { safeNum } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

export default function EncumbranceWidget({ gameState }: WidgetProps) {
  const enc = gameState.host?.encumbrance;
  if (!enc) return null;

  const weight = safeNum(enc.weight);
  const maxWeight = safeNum(enc.maxWeight);
  const pct = maxWeight > 0 ? weight / maxWeight : 0;
  const tone = pct > 0.9 ? 'danger' : pct > 0.7 ? 'warning' : 'success';

  return (
    <div className="widget-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 className="widget-title" style={{ margin: 0 }}>Encumbrance</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
          {weight} / {maxWeight}
        </span>
      </div>
      <div className="progress-track progress-track-lg">
        <div className={`progress-fill progress-${tone}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
      </div>
      {pct > 0.9 && <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 6 }}>Near capacity</p>}
    </div>
  );
}