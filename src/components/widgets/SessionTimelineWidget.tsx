'use client';

import { useState, useEffect } from 'react';
import type { GameState } from '@/types';
import {
  Swords, Heart, Zap, Target, Flame, ShieldCheck,
  Dices, Timer, TrendingUp,
} from 'lucide-react';

interface WidgetProps {
  gameState: GameState;
}

interface StatPill {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function formatStatValue(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function SessionTimelineWidget({ gameState }: WidgetProps) {
  const stats = gameState.sessionStats;
  const events = gameState.events ?? [];
  const [now, setNow] = useState(Date.now());

  // Tick every second for "last updated" freshness
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Build stat pills from sessionStats
  const pills: StatPill[] = stats
    ? [
        { label: 'Dmg Dealt', value: stats.damageDealt, icon: <Swords size={13} />, color: '#e76f51', bgColor: 'rgba(231,111,81,0.1)' },
        { label: 'Dmg Taken', value: stats.damageTaken, icon: <Flame size={13} />, color: '#f4a261', bgColor: 'rgba(244,162,97,0.1)' },
        { label: 'Healing', value: stats.healingDone, icon: <Heart size={13} />, color: '#52b788', bgColor: 'rgba(82,183,136,0.1)' },
        { label: 'Spells', value: stats.spellsCast, icon: <Zap size={13} />, color: '#48bfe3', bgColor: 'rgba(72,191,227,0.1)' },
        { label: 'Kills', value: stats.kills, icon: <Target size={13} />, color: '#e76f51', bgColor: 'rgba(231,111,81,0.1)' },
        { label: 'Crits', value: stats.criticalHits, icon: <Flame size={13} />, color: '#c6a255', bgColor: 'rgba(198,162,85,0.1)' },
        { label: 'Saves', value: stats.savingThrows, icon: <ShieldCheck size={13} />, color: '#48bfe3', bgColor: 'rgba(72,191,227,0.1)' },
        { label: 'Turns', value: stats.turnsTaken, icon: <Dices size={13} />, color: 'rgba(255,255,255,0.6)', bgColor: 'rgba(255,255,255,0.04)' },
      ]
    : [];

  // "Last updated" from latest event or gamestate timestamp
  const lastTimestamp = events.length > 0
    ? events[events.length - 1].timestamp
    : gameState.timestamp;
  const lastUpdatedSec = lastTimestamp > 0
    ? Math.max(0, Math.floor((now - lastTimestamp) / 1000))
    : 0;

  const hasStats = pills.length > 0 && pills.some(p => p.value > 0);

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: hasStats ? 12 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} style={{ color: '#c6a255' }} />
          <span style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          }}>
            Session Stats
          </span>
        </div>
        {lastTimestamp > 0 && (
          <span style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            Updated {lastUpdatedSec < 5 ? 'now' : `${lastUpdatedSec}s ago`}
          </span>
        )}
      </div>

      {/* Stats pill grid */}
      {hasStats ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
        }}>
          {pills.map((pill) => (
            <div
              key={pill.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 4px',
                borderRadius: 12,
                background: pill.bgColor,
                minHeight: 44,
                justifyContent: 'center',
              }}
            >
              <div style={{ color: pill.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {pill.icon}
              </div>
              <span style={{
                fontSize: 16,
                fontWeight: 700,
                color: '#e8e8ef',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatStatValue(pill.value)}
              </span>
              <span style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.35)',
                lineHeight: 1,
              }}>
                {pill.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{
          color: 'rgba(255,255,255,0.3)',
          margin: 0,
          fontSize: 13,
          textAlign: 'center',
          padding: '12px 0',
        }}>
          {stats ? 'No combat activity yet' : 'Session stats will appear when connected'}
        </p>
      )}
    </div>
  );
}
