'use client';

import { GameState } from '@/types';
import { Heart, Swords, MapPin, Coins } from 'lucide-react';

function HpBar({ current, max, name }: { current: number; max: number; name: string }) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color = pct > 60 ? 'var(--success)' : pct > 25 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium">{name}</span>
        <span className="text-xs font-mono-num" style={{ color }}>
          {current}/{max}
        </span>
      </div>
      <div
        className="rounded-full h-2"
        style={{ background: 'var(--surface-active)' }}
      >
        <div
          className="rounded-full h-2 transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function LiveDashboard({ state }: { state: GameState }) {
  const party = state.party || [];
  const host = state.host;

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderWidth: '1px' }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: 'var(--success)' }}
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
            LIVE
          </span>
        </div>
        {state.inCombat && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            COMBAT
          </span>
        )}
      </div>

      {/* Area & info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {state.area || 'Unknown'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coins size={14} style={{ color: 'var(--warning)' }} />
          <span className="text-xs font-mono-num">{state.gold}</span>
        </div>
      </div>

      {/* Host HP */}
      {host && (
        <HpBar current={host.hp} max={host.maxHp} name={host.name || 'Player'} />
      )}

      {/* Party HP */}
      {party.map((member, i) => (
        <HpBar key={i} current={member.hp} max={member.maxHp} name={member.name} />
      ))}

      {/* Combat indicator */}
      {state.inCombat && (
        <div
          className="mt-2 rounded-lg p-2 text-center"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}
        >
          <span className="text-xs" style={{ color: 'var(--danger)' }}>
            <Swords size={12} className="inline mr-1" />
            In Combat
          </span>
        </div>
      )}
    </div>
  );
}
