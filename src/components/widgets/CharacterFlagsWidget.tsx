'use client';

import type { GameState } from '@/types';

interface WidgetProps { gameState: GameState; }

const FLAG_LABELS: Record<string, string> = {
  fightMode: 'Fight Mode',
  floating: 'Floating',
  invisible: 'Invisible',
  offStage: 'Off Stage',
  storyNPC: 'Story NPC',
  isPet: 'Pet',
  cannotDie: 'Cannot Die',
  cannotMove: 'Cannot Move',
  cannotRun: 'Cannot Run',
  isPlayer: 'Player',
  spotSneakers: 'Spot Sneakers',
};

export default function CharacterFlagsWidget({ gameState }: WidgetProps) {
  const flags = gameState.host?.characterFlags;
  if (!flags) return null;

  const activeFlags = Object.entries(flags)
    .filter(([, val]) => val === true)
    .map(([key]) => key);

  return (
    <div className="widget-card">
      <h3 className="widget-title">Character Flags</h3>
      {activeFlags.length === 0
        ? <p className="widget-note">No active flags</p>
        : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {activeFlags.map((flag) => (
              <span key={flag} style={{
                padding: '3px 8px', borderRadius: 999, fontSize: '0.7rem',
                border: '1px solid var(--border)', color: 'var(--text-2)',
              }}>
                {FLAG_LABELS[flag] || flag}
              </span>
            ))}
          </div>
        )}
    </div>
  );
}