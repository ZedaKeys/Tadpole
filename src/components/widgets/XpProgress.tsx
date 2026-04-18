'use client';

import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

export default function XpProgress({ gameState }: WidgetProps) {
  const host = gameState.host;
  if (!host) return null;

  const detail = host.experienceDetail;
  const level = host.level;

  if (!detail || detail.nextLevelXp <= 0) {
    return (
      <div style={{
        background: 'rgba(26, 26, 38, 0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        minHeight: 44,
      }}>
        <span style={{ color: '#c6a255', fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {level}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Level</span>
      </div>
    );
  }

  const range = detail.nextLevelXp - detail.currentLevelXp;
  const progress = range > 0 ? detail.totalXp - detail.currentLevelXp : 0;
  const pct = range > 0 ? Math.min((progress / range) * 100, 100) : 0;

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ color: '#c6a255', fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {level}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>Level</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
          {progress.toLocaleString()} / {range.toLocaleString()} XP
        </span>
      </div>
      <div style={{
        height: 8,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #c6a255, #e0c080)',
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}
