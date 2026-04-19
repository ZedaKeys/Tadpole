'use client';

import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

const FLAG_LABELS: Record<string, string> = {
  fightMode: 'Fight Mode',
  floating: 'Floating',
  invisible: 'Invisible',
  offStage: 'Off Stage',
  storyNPC: 'Story NPC',
  isCompanion: 'Companion',
  isPet: 'Pet',
  cannotDie: 'Cannot Die',
};

export default function CharacterFlagsWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  if (!host?.characterFlags && !host?.tadpoleState) return null;

  const flags = host.characterFlags;
  const activeFlags = flags
    ? Object.entries(flags)
        .filter(([, v]) => v === true)
        .map(([k]) => k)
    : [];
  const tadpole = host.tadpoleState;

  if (activeFlags.length === 0 && !tadpole) return null;

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <h4 style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0 10px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Flags
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {activeFlags.map((flag) => (
          <span key={flag} style={{
            fontSize: 11,
            color: '#e8e8ef',
            background: 'rgba(255,255,255,0.08)',
            padding: '4px 10px',
            borderRadius: 10,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            {FLAG_LABELS[flag] ?? flag}
          </span>
        ))}
        {tadpole != null && (
          <span style={{
            fontSize: 11,
            color: '#c6a255',
            background: 'rgba(198, 162, 85, 0.15)',
            padding: '4px 10px',
            borderRadius: 10,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            Tadpole: State {tadpole.state}
          </span>
        )}
      </div>
    </div>
  );
}
