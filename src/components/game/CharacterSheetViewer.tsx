'use client';

import { useState, memo } from 'react';
import { ChevronDown, ChevronUp, Shield, Zap, Heart } from 'lucide-react';
import type { GameCharacter } from '@/types';

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

interface CharacterSheetViewerProps {
  character: GameCharacter;
}

const AbilityScore = memo(function AbilityScore({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 4px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        minWidth: 52,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em' }}>
        {label}
      </span>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#e2e0d8', marginTop: 2 }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: '#c6a255', fontWeight: 600 }}>
        {mod(value)}
      </span>
    </div>
  );
});

export default function CharacterSheetViewer({ character }: CharacterSheetViewerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          minHeight: 44,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8' }}>
          {character.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Lv {character.level}</span>
          {expanded ? (
            <ChevronUp size={16} style={{ color: '#6b7280' }} />
          ) : (
            <ChevronDown size={16} style={{ color: '#6b7280' }} />
          )}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 14px 14px' }}>
          {/* Quick stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {character.armorClass != null && (
              <QuickStat icon={<Shield size={12} />} label="AC" value={character.armorClass} color="#48bfe3" />
            )}
            <QuickStat
              icon={<Heart size={12} />}
              label="HP"
              value={`${character.hp}/${character.maxHp}`}
              color={character.hp / (character.maxHp || 1) > 0.5 ? '#52b788' : '#e76f51'}
            />
            {character.proficiencyBonus != null && (
              <QuickStat icon={<Zap size={12} />} label="Prof" value={`+${character.proficiencyBonus}`} color="#c6a255" />
            )}
            {character.tempHp != null && character.tempHp > 0 && (
              <QuickStat icon={<Shield size={12} />} label="Temp" value={character.tempHp} color="#48bfe3" />
            )}
          </div>

          {/* Ability Scores */}
          {character.abilityScores && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginBottom: 12 }}>
              <AbilityScore label="STR" value={character.abilityScores.str ?? 10} />
              <AbilityScore label="DEX" value={character.abilityScores.dex ?? 10} />
              <AbilityScore label="CON" value={character.abilityScores.con ?? 10} />
              <AbilityScore label="INT" value={character.abilityScores.int ?? 10} />
              <AbilityScore label="WIS" value={character.abilityScores.wis ?? 10} />
              <AbilityScore label="CHA" value={character.abilityScores.cha ?? 10} />
            </div>
          )}

          {/* Conditions */}
          {character.conditions && character.conditions.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', marginBottom: 4, display: 'block' }}>
                Active Conditions
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {character.conditions.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.06)',
                      color: '#9ca3af',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Concentration */}
          {character.concentration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#48bfe3', fontWeight: 600 }}>Concentrating:</span>
              <span style={{ fontSize: 11, color: '#48bfe3' }}>{character.concentration.spellId}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        fontSize: 12,
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ color: '#6b7280', fontSize: 10 }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
