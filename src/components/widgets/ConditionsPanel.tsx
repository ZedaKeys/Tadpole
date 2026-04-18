'use client';

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
  Rage: '#e76f51',
  Encumbered: '#f4a261',
};

function getConditionColor(cond: string): string {
  return CONDITION_COLORS[cond] ?? 'rgba(255,255,255,0.35)';
}

export default function ConditionsPanel({ gameState }: WidgetProps) {
  const host = gameState.host;
  const party = gameState.party ?? [];
  const allChars = [host, ...party].filter((c): c is NonNullable<typeof c> => c != null);
  const charsWConditions = allChars.filter((c) => c.conditions && c.conditions.length > 0);

  if (charsWConditions.length === 0) {
    return (
      <div style={{
        background: 'rgba(26, 26, 38, 0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 20,
        textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: 14 }}>
          No active conditions
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <h4 style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0 12px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Conditions
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {charsWConditions.map((char) => (
          <div key={char.guid}>
            <div style={{ color: '#e8e8ef', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {char.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {char.conditions!.map((cond) => {
                const color = getConditionColor(cond);
                return (
                  <span key={cond} style={{
                    fontSize: 11,
                    color,
                    background: `${color}22`,
                    padding: '3px 9px',
                    borderRadius: 9,
                    fontWeight: 500,
                  }}>
                    {cond}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
