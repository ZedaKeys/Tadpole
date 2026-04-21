'use client';

import type { GameState } from '@/types';
import { safeStr, safeNum } from '@/lib/safe-cast';

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

export default function CharacterOverview({ gameState }: WidgetProps) {
  const host = gameState.host;

  if (!host) {
    return (
      <div style={{
        background: 'rgba(26, 26, 38, 0.8)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        padding: 20,
        textAlign: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: 14 }}>
          No character data
        </p>
      </div>
    );
  }

  const hp = safeNum(host.hp);
  const maxHp = safeNum(host.maxHp);
  const tempHp = safeNum(host.tempHp);
  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const hpColor = getHpColor(hp, maxHp);

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ color: '#e8e8ef', margin: 0, fontSize: 20, fontWeight: 700 }}>
          {safeStr(host.name)}
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {host.isSneaking && (
            <span style={{
              fontSize: 11,
              color: '#48bfe3',
              background: 'rgba(72, 191, 227, 0.15)',
              padding: '2px 8px',
              borderRadius: 8,
            }}>
              SNEAKING
            </span>
          )}
          <span style={{
            fontSize: 12,
            color: '#c6a255',
            background: 'rgba(198, 162, 85, 0.15)',
            padding: '3px 10px',
            borderRadius: 10,
            fontWeight: 600,
          }}>
            LVL {safeNum(host.level)}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
            HP {tempHp > 0 ? `(+${tempHp})` : ''}
          </span>
          <span style={{ color: '#e8e8ef', fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
            {hp} / {maxHp}
          </span>
        </div>
        <div style={{
          height: 10,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 5,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.min(hpPct, 100)}%`,
            height: '100%',
            background: hpColor,
            borderRadius: 5,
            transition: 'width 0.4s ease, background 0.4s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {host.armorClass != null && (
          <div style={{
            fontSize: 12,
            color: '#48bfe3',
            background: 'rgba(72, 191, 227, 0.12)',
            padding: '4px 10px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minWidth: 44,
            justifyContent: 'center',
          }}>
            AC {safeNum(host.armorClass)}
          </div>
        )}
        {host.isDead && (
          <div style={{
            fontSize: 12,
            color: '#e76f51',
            background: 'rgba(231, 111, 81, 0.15)',
            padding: '4px 10px',
            borderRadius: 10,
            minWidth: 44,
            textAlign: 'center',
          }}>
            DEAD
          </div>
        )}
        {host.isInvulnerable && (
          <div style={{
            fontSize: 12,
            color: '#c6a255',
            background: 'rgba(198, 162, 85, 0.15)',
            padding: '4px 10px',
            borderRadius: 10,
            minWidth: 44,
            textAlign: 'center',
          }}>
            INVULNERABLE
          </div>
        )}
        {host.proficiencyBonus != null && (
          <div style={{
            fontSize: 12,
            color: '#c6a255',
            background: 'rgba(198, 162, 85, 0.12)',
            padding: '4px 10px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minWidth: 44,
            justifyContent: 'center',
          }}>
            +{safeNum(host.proficiencyBonus)} PROF
          </div>
        )}
        {host.hasTadpole && (
          <div style={{
            fontSize: 12,
            color: '#b57edc',
            background: 'rgba(181, 126, 220, 0.15)',
            padding: '4px 10px',
            borderRadius: 10,
            minWidth: 44,
            textAlign: 'center',
          }}>
            🐛 TADPOLE
          </div>
        )}
      </div>

      {host.abilityScores && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 4,
          marginTop: 12,
        }}>
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ability) => {
            const score = host.abilityScores![ability];
            const mod = host.abilityModifiers?.[ability];
            const label = ability.toUpperCase();
            return (
              <div key={ability} style={{
                textAlign: 'center',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 8,
                padding: '6px 2px',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
                <div style={{ color: '#e8e8ef', fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{score}</div>
                {mod != null && (
                  <div style={{ color: mod >= 0 ? '#52b788' : '#e76f51', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {mod >= 0 ? '+' : ''}{mod}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {host.passives && host.passives.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Passives
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {host.passives.slice(0, 12).map((passive) => (
              <span key={passive} style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 7px',
                borderRadius: 6,
              }}>
                {passive}
              </span>
            ))}
            {host.passives.length > 12 && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '2px 4px' }}>
                +{host.passives.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
