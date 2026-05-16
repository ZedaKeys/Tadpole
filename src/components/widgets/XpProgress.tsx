'use client';

import type { GameState } from '@/types';
import { safeNum } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

export default function XpProgress({ gameState }: WidgetProps) {
  const host = gameState.host;
  if (!host) return null;

  const xp = host.experienceDetail;
  if (!xp) return null;

  const totalXp = safeNum(xp.totalXp);
  const currentLevelXp = safeNum(xp.currentLevelXp);
  const nextLevelXp = safeNum(xp.nextLevelXp);
  const level = safeNum(host.level);

  const progressPct = nextLevelXp > 0 ? (currentLevelXp / nextLevelXp) * 100 : 100;

  return (
    <div className="widget-card">
      <h3 className="widget-title">XP Progress</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span className="widget-value-lg" style={{ color: 'var(--accent)' }}>{totalXp.toLocaleString()}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>XP</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginLeft: 4 }}>Level {level}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill progress-accent" style={{ width: `${Math.min(progressPct, 100)}%` }} />
      </div>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 6 }}>
        {nextLevelXp - currentLevelXp} XP to Level {level + 1}
      </p>
    </div>
  );
}
