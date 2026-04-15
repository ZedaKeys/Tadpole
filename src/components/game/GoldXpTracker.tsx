'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Coins, TrendingUp, TrendingDown, Star } from 'lucide-react';
import type { GameState } from '@/types';

interface GoldXpTrackerProps {
  gameState: GameState;
}

export default function GoldXpTracker({ gameState }: GoldXpTrackerProps) {
  const prevGoldRef = useRef(gameState.gold);
  const prevXpRef = useRef(0);
  const [goldDelta, setGoldDelta] = useState<number | null>(null);
  const [xpDelta, setXpDelta] = useState<number | null>(null);

  useEffect(() => {
    const currentGold = gameState.gold;
    const prevGold = prevGoldRef.current;

    if (prevGold !== 0 && currentGold !== prevGold) {
      const delta = currentGold - prevGold;
      setGoldDelta(delta);
      const timer = setTimeout(() => setGoldDelta(null), 3000);
      prevGoldRef.current = currentGold;
      return () => clearTimeout(timer);
    }

    prevGoldRef.current = currentGold;
  }, [gameState.gold]);

  // Track XP from host
  useEffect(() => {
    const host = gameState.host;
    if (!host?.experience) return;

    const currentXp = host.experience;
    const prevXp = prevXpRef.current;

    if (prevXp !== 0 && currentXp !== prevXp) {
      const delta = currentXp - prevXp;
      setXpDelta(delta);
      const timer = setTimeout(() => setXpDelta(null), 3000);
      prevXpRef.current = currentXp;
      return () => clearTimeout(timer);
    }

    prevXpRef.current = currentXp;
  }, [gameState.host?.experience]);

  const host = gameState.host;
  const xp = host?.experience;
  const level = host?.level;

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
      }}
    >
      {/* Gold */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: 16,
          background: 'rgba(198,162,85,0.06)',
          border: '1px solid rgba(198,162,85,0.1)',
          boxShadow: '0 0 12px rgba(198,162,85,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Coins size={16} style={{ color: '#c6a255', flexShrink: 0 }} />
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#c6a255' }}>
              {gameState.gold.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Gold</span>
          </div>
          {goldDelta !== null && goldDelta !== 0 && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: goldDelta > 0 ? '#52b788' : '#e76f51',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                animation: 'fadeIn 0.3s',
              }}
            >
              {goldDelta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {goldDelta > 0 ? '+' : ''}{goldDelta.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* XP */}
      {xp != null && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderRadius: 16,
            background: 'rgba(72,191,227,0.06)',
            border: '1px solid rgba(72,191,227,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Star size={16} style={{ color: '#48bfe3', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#48bfe3' }}>
                {xp.toLocaleString()}
              </span>
              {level != null && (
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Lv {level}</span>
              )}
            </div>
            {xpDelta !== null && xpDelta !== 0 && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#52b788',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <TrendingUp size={10} />
                +{xpDelta.toLocaleString()} XP
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
