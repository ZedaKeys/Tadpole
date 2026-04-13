'use client';

import { useState, useMemo, useCallback } from 'react';
import { Dices } from 'lucide-react';
import { rollDice, calculateProbability, getDiceStatistics, parseDiceNotation } from '@/lib/dice';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';

type RollMode = 'normal' | 'advantage' | 'disadvantage';

interface Preset {
  label: string;
  notation: string;
}

const PRESETS: Preset[] = [
  { label: 'd20', notation: '1d20' },
  { label: '2d6', notation: '2d6' },
  { label: '1d8', notation: '1d8' },
  { label: '1d12', notation: '1d12' },
  { label: '4d6', notation: '4d6' },
];

function ProbabilityBar({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  let barColor = 'var(--danger)';
  if (pct >= 75) barColor = 'var(--success)';
  else if (pct >= 50) barColor = 'var(--warning)';
  else if (pct >= 25) barColor = 'var(--info)';

  return (
    <div className="w-full">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{
          height: 12,
          background: 'var(--surface-active)',
        }}
      >
        <div
          className="rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${pct}%`,
            height: '100%',
            background: barColor,
          }}
        />
      </div>
      <p
        className="text-center mt-1 font-mono-num"
        style={{ color: barColor, fontSize: '1.1rem', fontWeight: 700 }}
      >
        {pct}%
      </p>
    </div>
  );
}

export default function DicePage() {
  const [notation, setNotation] = useState('1d20');
  const [dc, setDc] = useState(10);
  const [modifier, setModifier] = useState(0);
  const [mode, setMode] = useState<RollMode>('normal');
  const [lastRoll, setLastRoll] = useState<number | null>(null);

  // Derive stats from notation
  const stats = useMemo(() => {
    try {
      const s = getDiceStatistics(notation);
      return s;
    } catch {
      return null;
    }
  }, [notation]);

  // Derive parse error from stats
  const parseError = useMemo(() => {
    return stats === null ? 'Invalid notation' : '';
  }, [stats]);

  const probability = useMemo(() => {
    if (!stats) return null;
    try {
      const dice = parseDiceNotation(notation);
      return calculateProbability(dice, dc, modifier, mode);
    } catch {
      return null;
    }
  }, [stats, notation, dc, modifier, mode]);

  const handleRoll = useCallback(() => {
    try {
      const result = rollDice(notation) + modifier;
      setLastRoll(result);
    } catch {
      // Error is shown via parseError derived from stats
    }
  }, [notation, modifier]);

  const handlePreset = useCallback((preset: Preset) => {
    setNotation(preset.notation);
    // Error will clear automatically when new notation is parsed
  }, []);

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    minHeight: 44,
    padding: '10px 14px',
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--text-secondary)',
    fontSize: '0.8rem',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <AppShell title="Dice Calculator">
      {/* Notation input */}
      <div className="mb-5 stagger-in" style={{ animationDelay: '0s' }}>
        <label style={labelStyle}>Dice Notation</label>
        <input
          type="text"
          value={notation}
          onChange={(e) => setNotation(e.target.value)}
          placeholder="e.g. 2d6+3"
          style={inputStyle}
        />
        {parseError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>
            {parseError}
          </p>
        )}
      </div>

      {/* Preset buttons */}
      <div className="flex gap-3 mb-5 flex-wrap stagger-in" style={{ animationDelay: '0.05s' }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset)}
            className="touch-compact rounded-lg px-3 py-1"
            style={{
              background: notation === preset.notation ? 'var(--gold)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${notation === preset.notation ? 'var(--gold)' : 'rgba(255,255,255,0.06)'}`,
              color: notation === preset.notation ? '#fff' : 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* DC and Modifier */}
      <div className="flex gap-4 mb-5 stagger-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex-1">
          <label style={labelStyle}>DC (Target)</label>
          <input
            type="number"
            value={dc}
            onChange={(e) => setDc(Number(e.target.value))}
            style={inputStyle}
            min={1}
          />
        </div>
        <div className="flex-1">
          <label style={labelStyle}>Modifier</label>
          <input
            type="number"
            value={modifier}
            onChange={(e) => setModifier(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Roll mode */}
      <div className="mb-6 stagger-in" style={{ animationDelay: '0.15s' }}>
        <label style={labelStyle}>Roll Mode</label>
        <div className="flex gap-3">
          {(['normal', 'advantage', 'disadvantage'] as RollMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="touch-compact rounded-lg px-2 py-1 flex-1 capitalize"
              style={{
                background: mode === m ? 'var(--gold)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${mode === m ? 'var(--gold)' : 'rgba(255,255,255,0.06)'}`,
                color: mode === m ? '#fff' : 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                minWidth: 0,
              }}
            >
              {m === 'disadvantage' ? 'Disadv' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div
          className="p-4 mb-5 stagger-in"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, animationDelay: '0.2s' }}
        >
          <h3
            className="font-heading font-semibold text-sm mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Statistics
          </h3>
          <div className="flex justify-between mb-4">
            <div className="text-center flex-1">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Min</div>
              <div className="font-mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                {stats.min + modifier}
              </div>
            </div>
            <div className="text-center flex-1">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Average</div>
              <div className="font-mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                {(stats.average + modifier).toFixed(1)}
              </div>
            </div>
            <div className="text-center flex-1">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Max</div>
              <div className="font-mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                {stats.max + modifier}
              </div>
            </div>
          </div>

          {/* Probability of meeting DC */}
          {probability !== null && (
            <div className="mt-5">
              <p
                className="text-center mb-3"
                style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}
              >
                Chance to meet DC {dc}
              </p>
              <ProbabilityBar probability={probability} />
            </div>
          )}
        </div>
      )}

      {/* Roll button & result */}
      <button
        onClick={handleRoll}
        disabled={!stats}
        className="touch-target w-full py-4 flex items-center justify-center gap-3 font-bold text-lg mb-5 stagger-in"
        style={{
          background: stats ? 'var(--gold)' : 'var(--surface-active)',
          color: stats ? '#fff' : 'var(--text-muted)',
          border: 'none',
          cursor: stats ? 'pointer' : 'not-allowed',
          borderRadius: 9999,
          padding: '12px 24px',
          animationDelay: '0.25s',
        }}
      >
        <Dices size={24} />
        Roll {notation}{modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}
      </button>

      {lastRoll !== null && (
        <div
          className="p-6 text-center mb-5 break-words"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 8 }}>
            Result
          </p>
          <p
            className="font-mono-num"
            style={{ color: 'var(--gold-bright)', fontSize: '3rem', fontWeight: 700, lineHeight: 1, textShadow: '0 0 20px rgba(198, 162, 85, 0.5), 0 0 40px rgba(198, 162, 85, 0.2)', marginBottom: 12 }}
          >
            {lastRoll}
          </p>
          {dc > 0 && (
            <Badge
              label={lastRoll >= dc ? 'Success!' : 'Failure'}
              color={lastRoll >= dc ? 'var(--success)' : 'var(--danger)'}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
