'use client';

import type { GameState } from '@/types';

interface WidgetProps { gameState: GameState; }

export default function DeathSavesWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  const deaths = host?.deathSaves;
  if (!deaths) return null;

  const { successes = 0, failures = 0 } = deaths;

  return (
    <div className="widget-card">
      <h3 className="widget-title">Death Saves</h3>
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Successes */}
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 6px' }}>Success</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 18, height: 18, borderRadius: 999, border: '2px solid var(--success)',
                  background: i < successes ? 'var(--success)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
        {/* Failures */}
        <div>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '0 0 6px' }}>Failure</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 18, height: 18, borderRadius: 999, border: '2px solid var(--danger)',
                  background: i < failures ? 'var(--danger)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}