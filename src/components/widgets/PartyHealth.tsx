'use client';

import type { GameState } from '@/types';
import { safeStr, safeNum } from '@/lib/safe-cast';
import { Heart, Swords } from 'lucide-react';

interface WidgetProps { gameState: GameState; }

function hpColor(ratio: number): string {
  if (ratio > 0.6) return 'var(--success)';
  if (ratio > 0.25) return 'var(--warning)';
  return 'var(--danger)';
}

export default function PartyHealth({ gameState }: WidgetProps) {
  const party = gameState.party || [];
  if (!party.length) return <div className="widget-card widget-card-empty"><p>No party data</p></div>;

  return (
    <div className="widget-card">
      <h3 className="widget-title">Party Health</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {party.map((char) => {
          const hp = safeNum(char.hp);
          const maxHp = safeNum(char.maxHp);
          const pct = maxHp > 0 ? hp / maxHp : 0;
          const color = hpColor(pct);
          return (
            <div key={char.guid || safeStr(char.name)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                  {safeStr(char.name)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                  {hp}/{maxHp}
                </span>
              </div>
              <div className="progress-track progress-track-lg">
                <div style={{ width: `${Math.min(pct * 100, 100)}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.3s' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}