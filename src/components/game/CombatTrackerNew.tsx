'use client';

import { memo } from 'react';
import { Swords, Heart, Skull } from 'lucide-react';
import type { GameCharacter, GameState } from '@/types';

function hpColor(ratio: number): string {
  if (ratio > 0.6) return '#52b788';
  if (ratio > 0.25) return '#f4a261';
  return '#e76f51';
}

interface CombatHpBarProps {
  character: GameCharacter;
}

const CombatHpBar = memo(function CombatHpBar({ character }: CombatHpBarProps) {
  const ratio = character.maxHp > 0 ? character.hp / character.maxHp : 0;
  const color = hpColor(ratio);
  const isDowned = character.isDead || (character.deathSaves?.isDead ?? false);

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isDowned ? (
            <Skull size={12} style={{ color: '#e76f51' }} />
          ) : (
            <Heart size={12} style={{ color }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: isDowned ? '#e76f51' : '#e2e0d8' }}>
            {character.name}
          </span>
          {character.isInvulnerable && (
            <span style={{ fontSize: 9, color: '#48bfe3', background: 'rgba(72,191,227,0.1)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>INVULN</span>
          )}
        </div>
        <span style={{ fontSize: 11, color, fontFamily: 'monospace' }}>
          {character.hp}/{character.maxHp}
        </span>
      </div>

      <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.max(ratio * 100, 0)}%`,
            borderRadius: 5,
            background: isDowned ? '#e76f51' : color,
            transition: 'width 0.3s, background 0.3s',
            boxShadow: isDowned ? '0 0 8px rgba(231,111,81,0.5)' : 'none',
          }}
        />
      </div>

      {/* Death saves overlay */}
      {isDowned && character.deathSaves && (
        <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#6b7280' }}>Death Saves:</span>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={`s${i}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '1.5px solid #52b788',
                  background: i < (character.deathSaves?.successes ?? 0) ? '#52b788' : 'transparent',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={`f${i}`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '1.5px solid #e76f51',
                  background: i < (character.deathSaves?.failures ?? 0) ? '#e76f51' : 'transparent',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

interface CombatTrackerProps {
  state: GameState;
}

export default function CombatTracker({ state }: CombatTrackerProps) {
  if (!state.inCombat) return null;

  const party = state.party || [];
  const host = state.host;
  const allChars = host ? [host, ...party] : party;

  return (
    <div
      style={{
        background: 'rgba(231,111,81,0.04)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(231,111,81,0.2)',
        marginBottom: 20,
        transition: 'all 0.3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Swords size={16} style={{ color: '#e76f51' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e76f51', letterSpacing: '0.04em' }}>
          COMBAT
        </span>
        <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 'auto' }}>Active</span>
      </div>

      {allChars.map((c) => (
        <CombatHpBar key={c.guid} character={c} />
      ))}
    </div>
  );
}
