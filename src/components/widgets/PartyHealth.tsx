'use client';

import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

function getHpColor(hp: number, maxHp: number): string {
  if (maxHp <= 0) return '#e76f51';
  const pct = hp / maxHp;
  if (pct > 0.6) return '#52b788';
  if (pct > 0.3) return '#f4a261';
  return '#e76f51';
}

export default function PartyHealth({ gameState }: WidgetProps) {
  const party = gameState.party ?? [];

  if (party.length === 0) {
    return (
      <div style={{
        background: 'rgba(26, 26, 38, 0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 20,
        textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: 14 }}>
          No party members yet
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <h4 style={{ color: 'rgba(255,255,255,0.45)', margin: '0 0 12px 0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Party
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {party.map((member) => {
          const pct = member.maxHp > 0 ? (member.hp / member.maxHp) * 100 : 0;
          const color = getHpColor(member.hp, member.maxHp);
          return (
            <div key={member.guid}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: '#e8e8ef', fontSize: 14, fontWeight: 500 }}>
                  {member.name}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                  {member.hp}/{member.maxHp}
                  {member.isDead && <span style={{ color: '#e76f51', marginLeft: 4 }}>DEAD</span>}
                </span>
              </div>
              <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(pct, 100)}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.4s ease, background 0.4s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
