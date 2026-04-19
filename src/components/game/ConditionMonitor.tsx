'use client';

import { memo } from 'react';
import type { GameCharacter } from '@/types';

// Simple heuristic: well-known positive/negative conditions
const POSITIVE_CONDITIONS = new Set([
  'blessed', 'hasted', 'shielded', 'bardic inspiration', 'heroism',
  'resistance', 'guidance', 'protection from evil', 'protection from good',
  'mage armor', 'stoneskin', 'mirror image', 'blur', 'invisibility',
  'enhance ability', 'greater invisibility', 'freedom of movement',
  'death ward', 'aura of protection', 'aura of courage', 'sanctuary',
  'spirit guardians', 'fly', 'expeditious retreat', 'longstrider',
]);

const NEGATIVE_CONDITIONS = new Set([
  'poisoned', 'blinded', 'deafened', 'paralyzed', 'petrified',
  'stunned', 'unconscious', 'restrained', 'grappled', 'prone',
  'frightened', 'charmed', 'exhausted', 'diseased', 'cursed',
  'slowed', 'weakened', 'acid', 'burning', 'frozen', 'shocked',
  'bleeding', 'crippled', 'blindness', 'deafness',
]);

function conditionColor(name: string): string {
  const lower = name.toLowerCase();
  if (POSITIVE_CONDITIONS.has(lower)) return '#52b788';
  if (NEGATIVE_CONDITIONS.has(lower)) return '#e76f51';
  return '#f4a261';
}

function conditionBg(name: string): string {
  const lower = name.toLowerCase();
  if (POSITIVE_CONDITIONS.has(lower)) return 'rgba(82,183,136,0.12)';
  if (NEGATIVE_CONDITIONS.has(lower)) return 'rgba(231,111,81,0.12)';
  return 'rgba(244,162,97,0.12)';
}

interface ConditionMonitorProps {
  character: GameCharacter;
}

const ConditionPill = memo(function ConditionPill({ name }: { name: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        color: conditionColor(name),
        background: conditionBg(name),
        border: `1px solid ${conditionColor(name)}33`,
        marginBottom: 4,
        marginRight: 4,
      }}
    >
      {name}
    </span>
  );
});

export default function ConditionMonitor({ character }: ConditionMonitorProps) {
  const conditions = character.conditions;
  if (!conditions || conditions.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, display: 'block' }}>
        {character.name} — Conditions
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {conditions.map((cond) => (
          <ConditionPill key={cond} name={cond} />
        ))}
      </div>
      {character.concentration && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#48bfe3' }}>Concentrating:</span>
          <span style={{ fontSize: 11, color: '#48bfe3', fontWeight: 600 }}>
            {character.concentration.spellId || 'Unknown Spell'}
          </span>
        </div>
      )}
    </div>
  );
}
