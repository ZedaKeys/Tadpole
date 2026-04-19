'use client';

import { Eye, Footprints, Moon } from 'lucide-react';
import type { GameState } from '@/types';

interface WidgetProps {
  gameState: GameState;
}

export default function StealthVisionWidget({ gameState }: WidgetProps) {
  const host = gameState.host;
  if (!host) return null;

  const stealth = host.stealthState;
  const vision = host.vision;
  const speed = host.movementSpeed;

  const hasStealth = stealth != null;
  const hasVision = vision != null && (vision.darkvisionRange > 0 || vision.sightRange > 0);
  const hasSpeed = speed != null && speed > 0;

  if (!hasStealth && !hasVision && !hasSpeed) return null;

  return (
    <div style={{
      background: 'rgba(26, 26, 38, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 20,
      padding: 16,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hasStealth && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {stealth.sneaking ? (
              <span style={{
                fontSize: 11,
                color: '#48bfe3',
                background: 'rgba(72, 191, 227, 0.15)',
                padding: '3px 10px',
                borderRadius: 8,
                fontWeight: 600,
              }}>
                SNEAKING
              </span>
            ) : (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Not sneaking</span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
              Obscurity: {stealth.obscurity}
            </span>
          </div>
        )}

        {hasVision && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye size={14} color="#c6a255" />
            {vision.darkvisionRange > 0 && (
              <span style={{ color: '#48bfe3', fontSize: 12 }}>
                Darkvision {vision.darkvisionRange}m
              </span>
            )}
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
              Sight {vision.sightRange}m
            </span>
          </div>
        )}

        {hasSpeed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Footprints size={14} color="#c6a255" />
            <span style={{ color: '#e8e8ef', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
              {speed}m
            </span>
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Speed</span>
          </div>
        )}
      </div>
    </div>
  );
}
