'use client';

import { useState, memo } from 'react';
import { Shield, Eye, Heart, Zap } from 'lucide-react';
import type { GameCharacter } from '@/types';

function hpColor(ratio: number): string {
  if (ratio > 0.6) return '#52b788';
  if (ratio > 0.25) return '#f4a261';
  return '#e76f51';
}

interface HpBarProps {
  character: GameCharacter;
  expanded: boolean;
  onToggle: () => void;
}

const HpBarCard = memo(function HpBarCard({ character, expanded, onToggle }: HpBarProps) {
  const ratio = character.maxHp > 0 ? character.hp / character.maxHp : 0;
  const color = hpColor(ratio);
  const tempHp = character.tempHp ?? 0;
  const tempRatio = character.maxHp > 0 ? Math.min(tempHp / character.maxHp, 1 - ratio) : 0;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 8,
        transition: 'all 0.2s',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: 'inherit',
          minHeight: 44,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8' }}>
            {character.name}
          </span>
          {character.isInvulnerable && (
            <Shield size={14} style={{ color: '#48bfe3' }} />
          )}
          {character.isSneaking && (
            <Eye size={14} style={{ color: '#9ca3af' }} />
          )}
          {character.isDead && (
            <span style={{ fontSize: 10, color: '#e76f51', fontWeight: 700 }}>DEAD</span>
          )}
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Lv {character.level} · {character.hp}/{character.maxHp}
          {tempHp > 0 && (
            <span style={{ color: '#48bfe3', marginLeft: 4 }}>+{tempHp}</span>
          )}
        </span>
      </button>

      {/* HP bar with temp HP overlay */}
      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 6 }}>
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: `${Math.max(ratio * 100, 0)}%`,
            borderRadius: 4,
            background: color,
            transition: 'width 0.3s, background 0.3s',
          }}
        />
        {tempHp > 0 && (
          <div
            style={{
              position: 'absolute',
              height: '100%',
              left: `${ratio * 100}%`,
              width: `${tempRatio * 100}%`,
              borderRadius: 4,
              background: '#48bfe3',
              opacity: 0.7,
              transition: 'width 0.3s',
            }}
          />
        )}
      </div>

      {/* Expanded stats */}
      {expanded && (
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {character.armorClass != null && (
            <StatPill icon={<Shield size={11} />} label="AC" value={character.armorClass} color="#48bfe3" />
          )}
          {character.proficiencyBonus != null && (
            <StatPill icon={<Zap size={11} />} label="Prof" value={`+${character.proficiencyBonus}`} color="#c6a255" />
          )}
          {character.maxHp > 0 && (
            <StatPill icon={<Heart size={11} />} label="HP" value={`${character.hp}/${character.maxHp}`} color={color} />
          )}
          {character.tempHp != null && character.tempHp > 0 && (
            <StatPill icon={<Shield size={11} />} label="Temp" value={character.tempHp} color="#48bfe3" />
          )}
        </div>
      )}
    </div>
  );
});

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        fontSize: 11,
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ color: '#6b7280' }}>{label}</span>
      <span style={{ color, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

interface PartyHealthDashboardProps {
  host: GameCharacter | null;
  party: GameCharacter[];
}

export default function PartyHealthDashboard({ host, party }: PartyHealthDashboardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allChars = host ? [host, ...party] : party;

  return (
    <div style={{ marginBottom: 20 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#6b7280',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: 8,
          display: 'block',
        }}
      >
        Party Health
      </span>
      {allChars.map((c) => (
        <HpBarCard
          key={c.guid}
          character={c}
          expanded={expandedId === c.guid}
          onToggle={() => setExpandedId(expandedId === c.guid ? null : c.guid)}
        />
      ))}
    </div>
  );
}
