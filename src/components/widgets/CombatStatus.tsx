'use client';

import type { GameState } from '@/types';
import { Swords } from 'lucide-react';

interface WidgetProps { gameState: GameState; }

export default function CombatStatus({ gameState }: WidgetProps) {
  const inCombat = gameState.inCombat;
  const inDialog = gameState.inDialog;

  return (
    <div className="widget-card">
      <h3 className="widget-title">Combat Status</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {inCombat
            ? <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }} />
            : <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--success)' }} />
          }
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: inCombat ? 'var(--danger)' : 'var(--success)' }}>
            {inCombat ? 'In Combat' : 'Exploration'}
          </span>
        </div>

        {inDialog && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--accent)' }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>Dialogue active</span>
          </div>
        )}
      </div>
    </div>
  );
}