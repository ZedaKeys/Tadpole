'use client';

import type { GameState } from '@/types';
import { safeStr, safeNum } from '@/lib/safe-cast';

interface WidgetProps { gameState: GameState; }

function hpTone(hp: number, maxHp: number): 'success' | 'warning' | 'danger' {
  if (maxHp <= 0) return 'danger';
  const pct = hp / maxHp;
  if (pct > 0.6) return 'success';
  if (pct > 0.3) return 'warning';
  return 'danger';
}

export default function CharacterOverview({ gameState }: WidgetProps) {
  const host = gameState.host;
  if (!host) return <div className="widget-card widget-card-empty"><p>No character data</p></div>;

  const hp = safeNum(host.hp);
  const maxHp = safeNum(host.maxHp);
  const tempHp = safeNum(host.tempHp);
  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const tone = hpTone(hp, maxHp);

  return (
    <div className="widget-card">
      <div className="widget-row-between widget-mb-lg">
        <h3 className="widget-name">{safeStr(host.name)}</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
          {host.isSneaking && <span className="widget-chip widget-chip-accent">Sneaking</span>}
          <span className="widget-chip widget-chip-accent">LVL {safeNum(host.level)}</span>
        </div>
      </div>

      <div className="widget-mb-md">
        <div className="widget-row-between widget-mb-sm">
          <span className="widget-note">HP{tempHp > 0 ? ` (+${tempHp})` : ''}</span>
          <span className="widget-value">{hp} / {maxHp}</span>
        </div>
        <div className="progress-track progress-track-lg">
          <div className={`progress-fill progress-${tone}`} style={{ width: `${Math.min(hpPct, 100)}%` }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {host.armorClass != null && <span className="widget-chip widget-chip-accent">AC {safeNum(host.armorClass)}</span>}
        {host.isDead && <span className="widget-chip widget-chip-danger">Dead</span>}
        {host.isInvulnerable && <span className="widget-chip">Invulnerable</span>}
        {host.proficiencyBonus != null && <span className="widget-chip">+{safeNum(host.proficiencyBonus)} PROF</span>}
        {host.hasTadpole && <span className="widget-chip">🐛 Tadpole</span>}
      </div>

      {host.abilityScores && (
        <div className="widget-ability-grid">
          {(['str','dex','con','int','wis','cha'] as const).map((ability) => {
            const score = host.abilityScores![ability];
            const mod = host.abilityModifiers?.[ability];
            return (
              <div key={ability} className="widget-ability-cell">
                <div className="widget-ability-label">{ability.toUpperCase()}</div>
                <div className="widget-ability-score">{score}</div>
                {mod != null && (
                  <div className={`widget-ability-mod ${mod >= 0 ? '' : 'danger'}`} style={{ color: mod >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {mod >= 0 ? '+' : ''}{mod}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {host.passives && host.passives.length > 0 && (
        <div className="widget-section">
          <div className="widget-title">Passives</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {host.passives.slice(0, 12).map((p) => (
              <span key={p} style={{
                padding: '2px 7px', border: '1px solid var(--border)', borderRadius: 999,
                fontSize: '0.63rem', color: 'var(--text-2)',
              }}>{p}</span>
            ))}
            {host.passives.length > 12 && <span className="widget-note">+{host.passives.length - 12} more</span>}
          </div>
        </div>
      )}
    </div>
  );
}