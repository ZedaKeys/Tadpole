'use client';

import { GameState } from '@/types';
import { Heart, Swords, Shield } from 'lucide-react';

function CombatHpBar({ current, max, name, isEnemy }: { current: number; max: number; name: string; isEnemy?: boolean }) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color = isEnemy
    ? 'var(--danger)'
    : pct > 60 ? 'var(--success)' : pct > 25 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs flex items-center gap-1">
          {isEnemy ? <Swords size={12} style={{ color: 'var(--danger)' }} /> : <Heart size={12} style={{ color }} />}
          {name}
        </span>
        <span className="text-xs font-mono-num" style={{ color }}>
          {current}/{max}
        </span>
      </div>
      <div className="rounded-full h-2.5" style={{ background: 'var(--surface-active)' }}>
        <div className="rounded-full h-2.5 transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function CombatTracker({ state }: { state: GameState }) {
  if (!state.combat?.active) return null;

  const party = state.party || [];
  const enemies = state.combat.enemies || [];

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--danger)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--danger)' }}>
          <Swords size={16} />
          Combat
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          Round {state.combat.round}
        </span>
      </div>

      {/* Current turn */}
      <div className="text-center mb-3 py-2 rounded-lg" style={{ background: 'var(--surface-hover)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Turn:</span>
        <span className="text-sm font-semibold ml-1">{state.combat.turn}</span>
      </div>

      {/* Allies */}
      {state.player && (
        <CombatHpBar current={state.player.hp.current} max={state.player.hp.max} name={state.player.name || 'Player'} />
      )}
      {party.map((member, i) => (
        <CombatHpBar key={i} current={member.hp.current} max={member.hp.max} name={member.name} />
      ))}

      {/* Enemies */}
      {enemies.length > 0 && (
        <>
          <div className="mt-3 mb-1 text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            Enemies
          </div>
          {enemies.map((enemy, i) => (
            <CombatHpBar key={i} current={enemy.hp.current} max={enemy.hp.max} name={enemy.name} isEnemy />
          ))}
        </>
      )}
    </div>
  );
}
