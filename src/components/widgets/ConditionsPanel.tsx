'use client';

import type { GameState } from '@/types';
import { safeStr } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

const CONDITION_COLORS: Record<string, string> = {
  poisoned: 'var(--danger)',
  blinded: 'var(--danger)',
  paralyzed: 'var(--danger)',
  stunned: 'var(--danger)',
  charmed: 'var(--warning)',
  frightened: 'var(--warning)',
  restrained: 'var(--danger)',
  prone: 'var(--text-3)',
  haste: 'var(--accent)',
  invisibility: 'var(--accent)',
  blessed: 'var(--warning)',
};

function condColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(CONDITION_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'var(--text-2)';
}

export default function ConditionsPanel({ gameState }: WidgetProps) {
  const host = gameState.host;
  const conditions = host?.conditions || [];

  return (
    <div className="widget-card">
      <h3 className="widget-title">Conditions</h3>
      {conditions.length === 0
        ? <p className="widget-note">No active conditions</p>
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {conditions.map((cond) => (
              <span
                key={cond}
                style={{
                  padding: '3px 8px', borderRadius: 999, fontSize: '0.7rem',
                  fontWeight: 600, border: '1px solid',
                  borderColor: `${condColor(cond)}60`,
                  color: condColor(cond),
                  background: `${condColor(cond)}10`,
                }}
              >
                {safeStr(cond)}
              </span>
            ))}
          </div>
        )}
    </div>
  );
}