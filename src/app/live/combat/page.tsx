'use client';


import { useState, useMemo, memo, useRef, useEffect } from 'react';
import {
  Swords,
  Shield,
  Heart,
  Skull,
  Activity,
  Wifi,
  WifiOff,
  Zap,
  Eye,
  EyeOff,
  Clock,
  ChevronDown,
  ChevronUp,
  Flame,
  Sparkles,
  Ghost,
  Footprints,
  Weight,
  MapPin,
  Bug,
  Star,
  Gauge,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import { useGameConnection } from '@/hooks/useGameConnection';
import type { GameCharacter, GameState, GameEvent } from '@/types';

// ── Helpers ──────────────────────────────────────────────────

function hpColor(ratio: number): string {
  if (ratio > 0.6) return '#52b788';
  if (ratio > 0.25) return '#f4a261';
  return '#e76f51';
}

function hpGradient(ratio: number): string {
  if (ratio > 0.6) return 'linear-gradient(90deg, #40916c, #52b788)';
  if (ratio > 0.25) return 'linear-gradient(90deg, #e09f3e, #f4a261)';
  return 'linear-gradient(90deg, #c1440e, #e76f51)';
}

function formatEventTime(ts: number): string {
  const now = Date.now() / 1000;
  const diff = now - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Condition color mapping
function conditionColor(name: string): { fg: string; bg: string } {
  const lower = name.toLowerCase();
  // Red / dangerous
  const RED_CONDITIONS = ['poisoned', 'blinded', 'deafened', 'paralyzed', 'petrified', 'stunned', 'unconscious', 'restrained', 'grappled', 'prone', 'frightened', 'charmed', 'exhausted', 'diseased', 'cursed', 'slowed', 'weakened', 'acid', 'burning', 'frozen', 'shocked', 'bleeding', 'crippled', 'blindness', 'deafness'];
  if (RED_CONDITIONS.includes(lower)) return { fg: '#e76f51', bg: 'rgba(231,111,81,0.12)' };
  // Gold / blessed
  const GOLD_CONDITIONS = ['blessed', 'heroism', 'bardic inspiration', 'resistance', 'guidance', 'protection from evil', 'protection from good', 'death ward', 'aura of protection', 'aura of courage', 'sanctuary'];
  if (GOLD_CONDITIONS.includes(lower)) return { fg: '#c6a255', bg: 'rgba(198,162,85,0.12)' };
  // Blue / magic
  const BLUE_CONDITIONS = ['hasted', 'shielded', 'mage armor', 'stoneskin', 'mirror image', 'blur', 'invisibility', 'enhance ability', 'greater invisibility', 'freedom of movement', 'spirit guardians', 'fly', 'expeditious retreat', 'longstrider'];
  if (BLUE_CONDITIONS.includes(lower)) return { fg: '#48bfe3', bg: 'rgba(72,191,227,0.12)' };
  // Default amber
  return { fg: '#f4a261', bg: 'rgba(244,162,97,0.12)' };
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_PARTY: GameCharacter[] = [
  {
    guid: 'mock-1',
    name: 'Tav',
    hp: 28,
    maxHp: 52,
    tempHp: 5,
    level: 8,
    armorClass: 17,
    position: { x: 0, y: 0, z: 0 },
    conditions: ['Hasted', 'Blessed'],
    concentration: { spellId: 'Bless', caster: 'Tav' },
    spellSlots: { '1': { current: 3, max: 4 }, '2': { current: 2, max: 3 }, '3': { current: 1, max: 2 } },
  },
  {
    guid: 'mock-2',
    name: 'Shadowheart',
    hp: 38,
    maxHp: 42,
    tempHp: 0,
    level: 8,
    armorClass: 15,
    position: { x: 0, y: 0, z: 0 },
    conditions: ['Spirit Guardians'],
    concentration: { spellId: 'Spirit Guardians', caster: 'Shadowheart' },
    spellSlots: { '1': { current: 4, max: 4 }, '2': { current: 3, max: 3 }, '3': { current: 2, max: 2 }, '4': { current: 1, max: 1 } },
  },
  {
    guid: 'mock-3',
    name: 'Karlach',
    hp: 6,
    maxHp: 60,
    tempHp: 8,
    level: 8,
    armorClass: 14,
    position: { x: 0, y: 0, z: 0 },
    conditions: ['Rage', 'Poisoned', 'Bleeding'],
  },
  {
    guid: 'mock-4',
    name: "Lae'zel",
    hp: 0,
    maxHp: 55,
    tempHp: 0,
    level: 8,
    armorClass: 18,
    position: { x: 0, y: 0, z: 0 },
    conditions: ['Prone'],
    deathSaves: { successes: 1, failures: 2, isDead: true },
    isDead: true,
  },
];

const MOCK_EVENTS: GameEvent[] = [
  { type: 'damage_dealt', timestamp: Date.now() / 1000 - 5, detail: 'Karlach hits Goblin Warlord for 18 slashing damage', area: 'Goblin Camp' },
  { type: 'spell_cast', timestamp: Date.now() / 1000 - 12, detail: 'Shadowheart casts Spirit Guardians', area: 'Goblin Camp' },
  { type: 'damage_taken', timestamp: Date.now() / 1000 - 20, detail: "Lae'zel takes 24 bludgeoning damage from War Drummer", area: 'Goblin Camp' },
  { type: 'condition_applied', timestamp: Date.now() / 1000 - 25, detail: 'Tav gains Hasted', area: 'Goblin Camp' },
  { type: 'damage_taken', timestamp: Date.now() / 1000 - 30, detail: "Lae'zel falls unconscious!", area: 'Goblin Camp' },
  { type: 'spell_cast', timestamp: Date.now() / 1000 - 40, detail: 'Tav casts Bless', area: 'Goblin Camp' },
  { type: 'damage_dealt', timestamp: Date.now() / 1000 - 50, detail: 'Tav hits Goblin Shaman for 12 fire damage', area: 'Goblin Camp' },
  { type: 'condition_applied', timestamp: Date.now() / 1000 - 55, detail: 'Karlach gains Rage', area: 'Goblin Camp' },
  { type: 'damage_taken', timestamp: Date.now() / 1000 - 65, detail: 'Shadowheart takes 8 necrotic damage', area: 'Goblin Camp' },
  { type: 'kill', timestamp: Date.now() / 1000 - 70, detail: 'Karlach slays Goblin Scout!', area: 'Goblin Camp' },
];

const MOCK_GAME_STATE: GameState = {
  timestamp: Date.now() / 1000,
  area: 'Goblin Camp',
  inCombat: true,
  party: MOCK_PARTY.slice(1),
  host: MOCK_PARTY[0],
  gold: 1234,
  events: MOCK_EVENTS,
};

// ── Sub-Components ──────────────────────────────────────────

const CombatStatusBanner = memo(function CombatStatusBanner({ inCombat }: { inCombat: boolean }) {
  return (
    <div
      className={inCombat ? 'animate-fade-in' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 12,
        background: inCombat
          ? 'linear-gradient(135deg, rgba(231,111,81,0.12), rgba(193,68,14,0.12))'
          : 'rgba(82,183,136,0.08)',
        border: inCombat
          ? '1px solid rgba(231,111,81,0.3)'
          : '1px solid rgba(82,183,136,0.2)',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {inCombat && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(231,111,81,0.04), transparent)',
          }}
        />
      )}
      {inCombat ? (
        <>
          <Swords size={18} style={{ color: '#e76f51' }} />
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#e76f51',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            In Combat
          </span>
          <div
            className="animate-pulse-live"
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#e76f51',
              boxShadow: '0 0 8px rgba(231,111,81,0.6)',
            }}
          />
        </>
      ) : (
        <>
          <Shield size={18} style={{ color: '#52b788' }} />
          <span
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#52b788',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Out of Combat
          </span>
        </>
      )}
    </div>
  );
});

// Quick party summary: "3/4 alive", avg HP
function PartySummary({ characters }: { characters: GameCharacter[] }) {
  const alive = characters.filter((c) => !c.isDead && !(c.deathSaves?.isDead)).length;
  const total = characters.length;
  const avgHpPct = total > 0
    ? Math.round(
        characters.reduce((sum, c) => {
          const ratio = c.maxHp > 0 ? c.hp / c.maxHp : 0;
          return sum + ratio;
        }, 0) / total * 100
      )
    : 0;

  const color = avgHpPct > 60 ? '#52b788' : avgHpPct > 25 ? '#f4a261' : '#e76f51';

  return (
    <div
      className="animate-fade-up"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
        marginBottom: 16,
      }}
    >
      <SummaryCard label="Alive" value={`${alive}/${total}`} color={alive === total ? '#52b788' : '#e76f51'} icon={<Heart size={12} />} />
      <SummaryCard label="Avg HP" value={`${avgHpPct}%`} color={color} icon={<Activity size={12} />} />
      <SummaryCard
        label="Conditions"
        value={`${characters.reduce((n, c) => n + (c.conditions?.length ?? 0), 0)}`}
        color="#f4a261"
        icon={<Eye size={12} />}
      />
    </div>
  );
}

function SummaryCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        padding: '10px 12px',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: '1.1rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
    </div>
  );
}

// Small stat pill for compact inline display
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

// Character HP card with all details
const CharacterHpCard = memo(function CharacterHpCard({
  character,
  index,
}: {
  character: GameCharacter;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const ratio = character.maxHp > 0 ? character.hp / character.maxHp : 0;
  const color = hpColor(ratio);
  const isDowned = character.isDead || (character.deathSaves?.isDead ?? false) || character.hp <= 0;
  const tempHp = character.tempHp ?? 0;
  const tempRatio = character.maxHp > 0 ? Math.min(tempHp / character.maxHp, 1 - ratio) : 0;

  const staggerClass = index < 6 ? `stagger-${index + 1}` : '';

  return (
    <div
      className={`animate-fade-up ${staggerClass}`}
      style={{
        background: isDowned
          ? 'rgba(231,111,81,0.04)'
          : 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 14,
        border: isDowned
          ? '1px solid rgba(231,111,81,0.25)'
          : expanded
            ? `1px solid ${color}30`
            : '1px solid rgba(255,255,255,0.06)',
        marginBottom: 10,
        transition: 'border-color 0.3s, box-shadow 0.3s',
        boxShadow: isDowned
          ? '0 0 12px rgba(231,111,81,0.1)'
          : expanded
            ? `0 0 12px ${color}10`
            : 'none',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
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
          fontFamily: 'inherit',
          minHeight: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status icon */}
          {isDowned ? (
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(231,111,81,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Skull size={14} style={{ color: '#e76f51' }} />
            </div>
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={14} style={{ color }} />
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: isDowned ? '#e76f51' : '#e2e0d8' }}>
                {character.name}
              </span>
              {character.isInvulnerable && (
                <Badge label="INVULN" color="#48bfe3" />
              )}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Lv {character.level}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* AC Badge */}
          {character.armorClass != null && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 8,
                background: 'rgba(72,191,227,0.08)',
                border: '1px solid rgba(72,191,227,0.15)',
              }}
            >
              <Shield size={10} style={{ color: '#48bfe3' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#48bfe3', fontVariantNumeric: 'tabular-nums' }}>
                {character.armorClass}
              </span>
            </div>
          )}
          {/* HP numbers */}
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 48,
              textAlign: 'right',
            }}
          >
            {character.hp}/{character.maxHp}
          </span>
          {expanded ? <ChevronUp size={14} style={{ color: 'var(--text-dim)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-dim)' }} />}
        </div>
      </button>

      {/* HP Bar with temp HP overlay */}
      <div
        style={{
          position: 'relative',
          height: 12,
          borderRadius: 6,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
          marginTop: 8,
        }}
      >
        {/* Main HP fill */}
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: `${Math.max(ratio * 100, 0)}%`,
            borderRadius: 6,
            background: isDowned ? '#e76f51' : hpGradient(ratio),
            transition: 'width 0.4s ease, background 0.3s ease',
            boxShadow: isDowned
              ? '0 0 8px rgba(231,111,81,0.5)'
              : `0 0 6px ${color}40`,
          }}
        />
        {/* Temp HP overlay (blue, starts after main HP) */}
        {tempHp > 0 && !isDowned && (
          <div
            style={{
              position: 'absolute',
              height: '100%',
              left: `${ratio * 100}%`,
              width: `${tempRatio * 100}%`,
              borderRadius: 6,
              background: 'linear-gradient(90deg, #48bfe3, #72d4ed)',
              opacity: 0.75,
              transition: 'width 0.4s ease',
            }}
          />
        )}
        {/* Temp HP label */}
        {tempHp > 0 && !isDowned && (
          <span
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.55rem',
              fontWeight: 700,
              color: '#48bfe3',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}
          >
            +{tempHp}
          </span>
        )}
      </div>

      {/* Death saves */}
      {isDowned && character.deathSaves && (
        <div style={{ marginTop: 10 }}>
          <DeathSaveDisplay saves={character.deathSaves} />
        </div>
      )}

      {/* Conditions */}
      {character.conditions && character.conditions.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {character.conditions.map((cond) => {
            const c = conditionColor(cond);
            return (
              <span
                key={cond}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: c.fg,
                  background: c.bg,
                  border: `1px solid ${c.fg}25`,
                }}
              >
                {cond}
              </span>
            );
          })}
        </div>
      )}

      {/* Concentration */}
      {character.concentration && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 8,
            background: 'rgba(72,191,227,0.06)',
            border: '1px solid rgba(72,191,227,0.12)',
          }}
        >
          <Sparkles size={12} style={{ color: '#48bfe3' }} />
          <span style={{ fontSize: '0.7rem', color: '#48bfe3', fontWeight: 600 }}>
            Concentrating: {character.concentration.spellId}
          </span>
        </div>
      )}

      {/* Expanded: Spell Slots */}
      {expanded && character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
        <div className="animate-fade-in" style={{ marginTop: 10 }}>
          <SpellSlotDisplay slots={character.spellSlots} />
        </div>
      )}

      {/* Expanded: Action Resources (Bardic, Ki, Sorcery, etc) */}
      {expanded && character.actionResources && character.actionResources.length > 0 && (
        <div className="animate-fade-in" style={{ marginTop: 8 }}>
          <ActionResourceDisplay resources={character.actionResources} />
        </div>
      )}

      {/* Expanded: XP Progress Bar */}
      {expanded && character.experienceDetail && (
        <div className="animate-fade-in" style={{ marginTop: 8 }}>
          <XpProgressBar detail={character.experienceDetail} level={character.level} />
        </div>
      )}

      {/* Expanded: Encumbrance */}
      {expanded && character.encumbrance && character.encumbrance.maxWeight > 0 && (
        <div className="animate-fade-in" style={{ marginTop: 8 }}>
          <EncumbranceBar enc={character.encumbrance} />
        </div>
      )}

      {/* Expanded: Stealth, Vision, Speed row */}
      {expanded && (character.stealthState || character.vision || character.movementSpeed != null) && (
        <div className="animate-fade-in" style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {character.stealthState && (
            <StatPill
              icon={character.stealthState.sneaking ? <EyeOff size={11} /> : <Eye size={11} />}
              label="Stealth"
              value={character.stealthState.sneaking ? `Hidden (${character.stealthState.obscurity}%)` : 'Visible'}
              color={character.stealthState.sneaking ? '#52b788' : '#9ca3af'}
            />
          )}
          {character.vision && (
            <StatPill
              icon={<MapPin size={11} />}
              label="Sight"
              value={character.vision.darkvisionRange > 0 ? `DV ${character.vision.darkvisionRange}m` : `${character.vision.sightRange}m`}
              color='#48bfe3'
            />
          )}
          {character.movementSpeed != null && (
            <StatPill
              icon={<Footprints size={11} />}
              label="Speed"
              value={character.movementSpeed}
              color='#c6a255'
            />
          )}
        </div>
      )}

      {/* Expanded: Combat Detail */}
      {expanded && character.combatDetail && (
        <div className="animate-fade-in" style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {character.combatDetail.initiativeRoll !== 0 && (
            <StatPill icon={<Gauge size={11} />} label="Init" value={character.combatDetail.initiativeRoll} color='#e76f51' />
          )}
        </div>
      )}

      {/* Expanded: Character Flags */}
      {expanded && character.characterFlags && (
        <div className="animate-fade-in" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {character.characterFlags.invisible && <Badge label="INVISIBLE" color="#48bfe3" />}
          {character.characterFlags.floating && <Badge label="FLOATING" color="#c6a255" />}
          {character.characterFlags.cannotDie && <Badge label="IMMORTAL" color="#52b788" />}
          {character.characterFlags.storyNPC && <Badge label="STORY NPC" color="#f4a261" />}
          {character.characterFlags.isPet && <Badge label="PET" color="#9ca3af" />}
        </div>
      )}

      {/* Expanded: Tadpole State */}
      {expanded && character.tadpoleState && character.tadpoleState.state !== 0 && (
        <div className="animate-fade-in" style={{ marginTop: 8 }}>
          <StatPill icon={<Bug size={11} />} label="Tadpole" value={`State ${character.tadpoleState.state}`} color="#c6a255" />
        </div>
      )}
    </div>
  );
});

// XP progress bar
function XpProgressBar({ detail, level }: { detail: { currentLevelXp: number; nextLevelXp: number; totalXp: number }; level: number }) {
  const xpNeeded = detail.nextLevelXp - detail.currentLevelXp;
  const progress = xpNeeded > 0 ? Math.min(detail.currentLevelXp / detail.nextLevelXp, 1) : 0;

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(72,191,227,0.06)',
        border: '1px solid rgba(72,191,227,0.12)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <Star size={12} style={{ color: '#48bfe3' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#48bfe3' }}>XP Progress</span>
        <span style={{ fontSize: '0.6rem', color: '#9ca3af', marginLeft: 'auto' }}>
          {detail.totalXp.toLocaleString()} total
        </span>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #48bfe3, #72d4ed)',
            transition: 'width 0.4s ease',
            boxShadow: '0 0 6px rgba(72,191,227,0.3)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>
          {detail.currentLevelXp.toLocaleString()} / {detail.nextLevelXp.toLocaleString()}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#48bfe3' }}>
          Lv {level} → {level + 1}
        </span>
      </div>
    </div>
  );
}

// Encumbrance bar
function EncumbranceBar({ enc }: { enc: { weight: number; state: number; maxWeight: number; encumberedWeight: number; heavilyEncumberedWeight: number } }) {
  const pct = enc.maxWeight > 0 ? Math.min(enc.weight / enc.maxWeight, 1) : 0;
  let barColor = '#52b788';
  let stateLabel = 'Normal';
  if (enc.state === 2 || pct > (enc.heavilyEncumberedWeight / enc.maxWeight)) {
    barColor = '#e76f51';
    stateLabel = 'Heavily Encumbered';
  } else if (enc.state === 1 || pct > (enc.encumberedWeight / enc.maxWeight)) {
    barColor = '#f4a261';
    stateLabel = 'Encumbered';
  }

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <Weight size={12} style={{ color: barColor }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: barColor }}>Carry Weight</span>
        <span style={{ fontSize: '0.6rem', color: '#9ca3af', marginLeft: 'auto' }}>
          {stateLabel}
        </span>
      </div>
      <div style={{ position: 'relative', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {/* Encumbered threshold marker */}
        {enc.maxWeight > 0 && (
          <div style={{ position: 'absolute', left: `${(enc.encumberedWeight / enc.maxWeight) * 100}%`, top: 0, bottom: 0, width: 1, background: '#f4a26160' }} />
        )}
        {enc.maxWeight > 0 && (
          <div style={{ position: 'absolute', left: `${(enc.heavilyEncumberedWeight / enc.maxWeight) * 100}%`, top: 0, bottom: 0, width: 1, background: '#e76f5160' }} />
        )}
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: `${pct * 100}%`,
            borderRadius: 3,
            background: barColor,
            transition: 'width 0.3s ease, background 0.3s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>
          {enc.weight.toFixed(1)} / {enc.maxWeight.toFixed(1)} kg
        </span>
      </div>
    </div>
  );
}

// Death saves tracker
function DeathSaveDisplay({ saves }: { saves: { successes: number; failures: number; isDead: boolean } }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(231,111,81,0.06)',
        border: '1px solid rgba(231,111,81,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Successes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.65rem', color: '#52b788', fontWeight: 600 }}>PASS</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={`s${i}`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid #52b788',
                  background: i < saves.successes ? '#52b788' : 'transparent',
                  boxShadow: i < saves.successes ? '0 0 6px rgba(82,183,136,0.4)' : 'none',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
        </div>
        {/* Failures */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={`f${i}`}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid #e76f51',
                  background: i < saves.failures ? '#e76f51' : 'transparent',
                  boxShadow: i < saves.failures ? '0 0 6px rgba(231,111,81,0.4)' : 'none',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.65rem', color: '#e76f51', fontWeight: 600 }}>FAIL</span>
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: '0.65rem', color: '#6b7280', textAlign: 'center' }}>
        {saves.successes >= 3
          ? 'Stabilized!'
          : saves.failures >= 3
            ? 'Perished'
            : `${3 - saves.successes} successes or ${3 - saves.failures} failures to go`}
      </div>
    </div>
  );
}

// Spell slot display
function SpellSlotDisplay({ slots }: { slots: Record<string, { current: number; max: number }> }) {
  const levelLabels: Record<string, string> = {
    '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th', '6': '6th',
  };
  const levels = Object.keys(slots).sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return na - nb;
  });

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <Flame size={12} style={{ color: '#c6a255' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#c6a255' }}>Spell Slots</span>
      </div>
      {levels.map((lvl) => {
        const slot = slots[lvl];
        if (!slot || slot.max <= 0) return null;
        return (
          <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: '0.65rem', color: '#6b7280', width: 24, textAlign: 'right' }}>
              {levelLabels[lvl] || lvl}
            </span>
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: slot.max }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: i < slot.current ? 'none' : '1.5px solid rgba(255,255,255,0.12)',
                    background: i < slot.current
                      ? 'linear-gradient(135deg, #c6a255, #e0c477)'
                      : 'rgba(255,255,255,0.03)',
                    boxShadow: i < slot.current ? '0 0 4px rgba(198,162,85,0.3)' : 'none',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Action Resources display (Bardic, Ki, Sorcery, Rages, etc)
function ActionResourceDisplay({ resources }: { resources: { name: string; slots: { amount: number; maxAmount: number; level: number }[] }[] }) {
  // Flatten nested resources into display items
  const items = resources.flatMap((r) =>
    r.slots.map((slot, i) => ({
      key: `${r.name}-${i}`,
      name: r.slots.length > 1 ? `${r.name} Lvl ${slot.level}` : r.name,
      current: slot.amount,
      max: slot.maxAmount,
    }))
  ).filter((item) => item.max > 0);
  if (items.length === 0) return null;

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
        <Zap size={12} style={{ color: '#48bfe3' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#48bfe3' }}>Class Resources</span>
      </div>
      {items.map((r) => {
        const pct = r.max > 0 ? r.current / r.max : 0;
        const barColor = pct > 0.5 ? '#48bfe3' : pct > 0.25 ? '#f4a261' : '#e76f51';
        return (
          <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: '0.65rem', color: '#9ca3af', width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.name}
            </span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, background: barColor, transition: 'width 0.3s ease' }} />
            </div>
            <span style={{ fontSize: '0.6rem', color: '#d1d5db', width: 28, textAlign: 'right' }}>
              {r.current}/{r.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Concentration tracker
function ConcentrationTracker({ characters }: { characters: GameCharacter[] }) {
  const concentrating = characters.filter((c) => c.concentration);
  if (concentrating.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Sparkles size={12} style={{ color: '#48bfe3' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#48bfe3', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Concentration
        </span>
      </div>
      {concentrating.map((c) => (
        <div
          key={c.guid}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'rgba(72,191,227,0.06)',
            border: '1px solid rgba(72,191,227,0.12)',
            marginBottom: 6,
          }}
        >
          <Sparkles size={14} style={{ color: '#48bfe3' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e0d8' }}>{c.name}</span>
          <span style={{ fontSize: '0.7rem', color: '#48bfe3' }}>—</span>
          <span style={{ fontSize: '0.75rem', color: '#48bfe3', fontWeight: 600 }}>{c.concentration!.spellId}</span>
        </div>
      ))}
    </div>
  );
}

// Spell slot summary for all casters
function PartySpellSlotSummary({ characters }: { characters: GameCharacter[] }) {
  const casters = characters.filter((c) => c.spellSlots && Object.keys(c.spellSlots).length > 0);
  if (casters.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Flame size={12} style={{ color: '#c6a255' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#c6a255', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Spell Slots
        </span>
      </div>
      {casters.map((c) => (
        <div
          key={c.guid}
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e0d8', marginBottom: 6, display: 'block' }}>
            {c.name}
          </span>
          <SpellSlotDisplay slots={c.spellSlots!} />
        </div>
      ))}
    </div>
  );
}

// Combat log
const CombatLogItem = memo(function CombatLogItem({ event, index }: { event: GameEvent; index: number }) {
  const typeStyle = getEventTypeStyle(event.type);

  return (
    <div
      className={`animate-slide-in`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 12px',
        background: typeStyle.bg,
        borderRadius: 10,
        border: `1px solid ${typeStyle.borderColor}`,
        borderLeft: `3px solid ${typeStyle.accent}`,
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: `${typeStyle.accent}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <span style={{ color: typeStyle.accent }}>{typeStyle.icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.4 }}>
          {event.detail || event.type}
        </span>
      </div>
      <span
        style={{
          fontSize: '0.6rem',
          color: 'var(--text-dim)',
          flexShrink: 0,
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatEventTime(event.timestamp)}
      </span>
    </div>
  );
});

function getEventTypeStyle(type: string): { accent: string; bg: string; borderColor: string; icon: React.ReactNode } {
  switch (type) {
    case 'damage_dealt':
      return { accent: '#52b788', bg: 'rgba(82,183,136,0.04)', borderColor: 'rgba(82,183,136,0.1)', icon: <Swords size={11} /> };
    case 'damage_taken':
      return { accent: '#e76f51', bg: 'rgba(231,111,81,0.04)', borderColor: 'rgba(231,111,81,0.1)', icon: <Heart size={11} /> };
    case 'spell_cast':
      return { accent: '#48bfe3', bg: 'rgba(72,191,227,0.04)', borderColor: 'rgba(72,191,227,0.1)', icon: <Sparkles size={11} /> };
    case 'condition_applied':
    case 'condition_removed':
      return { accent: '#c6a255', bg: 'rgba(198,162,85,0.04)', borderColor: 'rgba(198,162,85,0.1)', icon: <Zap size={11} /> };
    case 'kill':
      return { accent: '#e76f51', bg: 'rgba(231,111,81,0.04)', borderColor: 'rgba(231,111,81,0.1)', icon: <Skull size={11} /> };
    default:
      return { accent: '#9ca3af', bg: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', icon: <Activity size={11} /> };
  }
}

// Connection banner (reuse pattern from approval page)
function ConnectionBanner({ isConnected, connectionStatus }: { isConnected: boolean; connectionStatus: string }) {
  const connected = isConnected && connectionStatus === 'connected';
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        background: connected ? 'rgba(82, 183, 136, 0.08)' : 'rgba(231, 111, 81, 0.08)',
        border: `1px solid ${connected ? 'rgba(82, 183, 136, 0.2)' : 'rgba(231, 111, 81, 0.2)'}`,
        marginBottom: 16,
      }}
    >
      {connected ? (
        <Wifi size={16} style={{ color: 'var(--success)' }} />
      ) : (
        <WifiOff size={16} style={{ color: 'var(--danger)' }} />
      )}
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: connected ? 'var(--success)' : 'var(--danger)' }}>
        {connected ? 'Connected to Game' : 'Not Connected'}
      </span>
      {connected && (
        <div
          className="animate-pulse-live"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--success)',
            marginLeft: 'auto',
          }}
        />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function CombatOverlayPage() {
  const { gameState, isConnected, connectionStatus } = useGameConnection();
  const [showDemo, setShowDemo] = useState(false);

  const connected = isConnected && connectionStatus === 'connected';

  // Determine which data to show
  const activeState = connected && gameState ? gameState : showDemo ? MOCK_GAME_STATE : null;
  const party = activeState?.party ?? [];
  const host = activeState?.host ?? null;
  const allChars = useMemo(() => (host ? [host, ...party] : party), [host, party]);

  const events = activeState?.events ?? [];

  return (
    <AppShell title="Combat Overlay">
      <BackButton href="/" label="Home" />

      <ConnectionBanner isConnected={isConnected} connectionStatus={connectionStatus} />

      {/* Not connected prompt */}
      {!connected && !showDemo && (
        <div
          className="animate-fade-in"
          style={{
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(231, 111, 81, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Swords size={24} style={{ color: '#e76f51' }} />
          </div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            Combat Overlay
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 20 }}>
            Connect to your game to see real-time combat information including HP bars,
            conditions, spell slots, and a live combat log.
          </p>
          <button
            className="btn"
            onClick={() => setShowDemo(true)}
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: '#e76f51',
              fontSize: '0.8rem',
            }}
          >
            <Activity size={14} />
            Preview with Demo Data
          </button>
        </div>
      )}

      {/* Demo mode indicator */}
      {showDemo && !connected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(198,162,85,0.08)',
            border: '1px solid rgba(198,162,85,0.15)',
            marginBottom: 12,
            fontSize: '0.7rem',
            color: '#c6a255',
            fontWeight: 600,
          }}
        >
          <Ghost size={12} />
          Demo Mode — showing sample data
        </div>
      )}

      {/* Combat content */}
      {activeState && (
        <>
          {/* Combat status banner */}
          <CombatStatusBanner inCombat={activeState.inCombat} />

          {/* Area name */}
          {activeState.area && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Location:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e0d8' }}>{activeState.areaName || activeState.area}</span>
            </div>
          )}

          {/* Party summary */}
          <PartySummary characters={allChars} />

          {/* Concentration tracker */}
          <ConcentrationTracker characters={allChars} />

          {/* Party HP bars */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Heart size={12} style={{ color: '#e76f51' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Party Health
              </span>
            </div>
            {allChars.map((c, i) => (
              <CharacterHpCard key={c.guid} character={c} index={i} />
            ))}
          </div>

          {/* Spell slot summary */}
          <PartySpellSlotSummary characters={allChars} />

          {/* Combat log */}
          {events.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Clock size={12} style={{ color: '#9ca3af' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Combat Log
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                  {events.length} events
                </span>
              </div>
              {events.slice(0, 50).map((event, i) => (
                <CombatLogItem key={`${event.timestamp}-${i}`} event={event} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
