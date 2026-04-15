'use client';

import { memo } from 'react';
import { Skull } from 'lucide-react';
import type { GameCharacter } from '@/types';

interface DeathSaveTrackerProps {
  character: GameCharacter;
}

export default function DeathSaveTracker({ character }: DeathSaveTrackerProps) {
  const saves = character.deathSaves;
  if (!saves || !saves.isDead) return null;

  const successes = saves.successes ?? 0;
  const failures = saves.failures ?? 0;

  return (
    <div
      style={{
        background: 'rgba(231,111,81,0.06)',
        borderRadius: 12,
        padding: 14,
        border: '1px solid rgba(231,111,81,0.2)',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Skull size={14} style={{ color: '#e76f51' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e76f51' }}>
          {character.name} — Death Saves
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Successes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#52b788', fontWeight: 600 }}>Success</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={`s${i}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid #52b788',
                  background: i < successes ? '#52b788' : 'transparent',
                  transition: 'background 0.3s',
                  boxShadow: i < successes ? '0 0 8px rgba(82,183,136,0.4)' : 'none',
                }}
              />
            ))}
          </div>
        </div>

        {/* Failures */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#e76f51', fontWeight: 600 }}>Failure</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={`f${i}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '2px solid #e76f51',
                  background: i < failures ? '#e76f51' : 'transparent',
                  transition: 'background 0.3s',
                  boxShadow: i < failures ? '0 0 8px rgba(231,111,81,0.4)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280' }}>
        {successes >= 3
          ? 'Stabilized!'
          : failures >= 3
          ? 'Failed all death saves'
          : `${3 - successes} successes or ${3 - failures} failures remaining`}
      </div>
    </div>
  );
}
