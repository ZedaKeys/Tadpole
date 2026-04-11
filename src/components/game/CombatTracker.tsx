'use client';

import { GameState } from '@/types';
import { Heart, Swords } from 'lucide-react';

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
  if (!state.inCombat) return null;

  const party = state.party || [];
  const host = state.host;

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
      </div>

      {/* Allies */}
      {host && (
        <CombatHpBar current={host.hp} max={host.maxHp} name={host.name || 'Player'} />
      )}
      {party.map((member, i) => (
        <CombatHpBar key={i} current={member.hp} max={member.maxHp} name={member.name} />
      ))}
    </div>
  );
}
