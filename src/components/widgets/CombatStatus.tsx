'use client';

import { Swords, TreePine } from 'lucide-react';
import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

const CONDITION_COLORS: Record<string, string> = {
  Blessed: '#52b788',
  Poisoned: '#e76f51',
  Burning: '#e76f51',
  Hasted: '#48bfe3',
  Shielded: '#48bfe3',
  Protected: '#48bfe3',
  Invisible: '#48bfe3',
  Blinded: '#e76f51',
  Charmed: '#c6a255',
  Deafened: '#e76f51',
  Frightened: '#e76f51',
  Grappled: '#e76f51',
  Paralyzed: '#e76f51',
  Petrified: '#e76f51',
  Prone: '#f4a261',
  Restrained: '#e76f51',
  Stunned: '#e76f51',
  Unconscious: '#e76f51',
  Guided: '#52b788',
  Rage: '#e76f51',
  'Blessed (heat)': '#52b788',
  Encumbered: '#f4a261',
  'Heavily Encumbered': '#e76f51',
};

function getConditionColor(condition: string): string {
  return CONDITION_COLORS[condition] ?? 'rgba(255,255,255,0.35)';
}

export default function CombatStatus({ gameState }: WidgetProps) {
  const host = gameState.host;
  const conditions = host?.conditions ?? [];

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {gameState.inCombat ? (
          <>
            <div style={{
              width: 10, height: 10, borderRadius: 5,
              background: '#e76f51',
              boxShadow: '0 0 8px rgba(231, 111, 81, 0.6)',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#e76f51', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              In Combat
            </span>
            {host?.combatDetail && (
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                Init: {typeof host.combatDetail.initiativeRoll === 'number' ? host.combatDetail.initiativeRoll : '?'}
              </span>
            )}
          </>
        ) : (
          <>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: '#52b788' }} />
            <span style={{ color: '#52b788', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Exploring
            </span>
          </>
        )}
      </div>

      {conditions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {conditions.map((cond) => {
            const color = getConditionColor(cond);
            return (
              <span key={cond} style={{
                fontSize: 11,
                color,
                background: `${color}22`,
                padding: '4px 10px',
                borderRadius: 10,
                fontWeight: 500,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
              }}>
                {cond}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
