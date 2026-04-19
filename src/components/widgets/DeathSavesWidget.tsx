'use client';

import type { GameState, GameCharacter } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

function DeathSavesRow({ character }: { character: GameCharacter }) {
  const saves = character.deathSaves!;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: '#e8e8ef', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {character.name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#52b788', fontSize: 10, width: 32 }}>Success</span>
          {[0, 1, 2].map((i) => (
            <div
              key={`s-${i}`}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: `2px solid ${i < saves.successes ? '#52b788' : 'rgba(255,255,255,0.15)'}`,
                background: i < saves.successes ? '#52b788' : 'transparent',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#e76f51', fontSize: 10, width: 32 }}>Failure</span>
          {[0, 1, 2].map((i) => (
            <div
              key={`f-${i}`}
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                border: `2px solid ${i < saves.failures ? '#e76f51' : 'rgba(255,255,255,0.15)'}`,
                background: i < saves.failures ? '#e76f51' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DeathSavesWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  const party = gameState.party ?? [];
  const allChars = [host, ...party].filter((c): c is NonNullable<typeof c> => c != null);

  const dyingChars = allChars.filter(
    (c) => c.isDead || (c.deathSaves && (c.deathSaves.successes > 0 || c.deathSaves.failures > 0))
  );

  if (dyingChars.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <h4 style={{ color: '#e76f51', margin: '0 0 12px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Death Saves
      </h4>
      {dyingChars.map((c) => (
        <DeathSavesRow key={c.guid} character={c} />
      ))}
    </div>
  );
}
