'use client';

import type { GameState } from '@/types';

interface WidgetProps { gameState: GameState; }

export default function StealthVisionWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  const stealthState = host?.stealthState;
  const vision = host?.vision;

  const sneaking = stealthState?.sneaking ?? false;
  const darkvision = vision?.darkvisionRange
    ? `${(vision.darkvisionRange / 30) | 0}00 ft`
    : 'Normal';

  return (
    <div className="widget-card">
      <h3 className="widget-title">Stealth & Vision</h3>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: sneaking ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
            {sneaking ? 'Sneaking' : 'Normal'}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 2 }}>Stealth</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{darkvision}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 2 }}>Darkvision</div>
        </div>
      </div>
    </div>
  );
}