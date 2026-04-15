'use client';

import { Tent, Flame } from 'lucide-react';
import type { CampSupplies } from '@/types';

interface CampSupplyGaugeProps {
  supplies?: CampSupplies;
}

export default function CampSupplyGauge({ supplies }: CampSupplyGaugeProps) {
  if (!supplies) return null;

  const { current, max, canRest } = supplies;
  const ratio = max > 0 ? current / max : 0;

  let color: string;
  let bgColor: string;
  if (ratio <= 0 || current === 0) {
    color = '#e76f51';
    bgColor = 'rgba(231,111,81,0.08)';
  } else if (!canRest || ratio < 0.3) {
    color = '#f4a261';
    bgColor = 'rgba(244,162,97,0.08)';
  } else {
    color = '#52b788';
    bgColor = 'rgba(82,183,136,0.08)';
  }

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: 16,
        padding: '12px 16px',
        border: `1px solid ${color}22`,
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tent size={16} style={{ color }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e0d8' }}>Camp Supplies</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>
          {current}/{max}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.max(ratio * 100, 0)}%`,
            borderRadius: 4,
            background: color,
            transition: 'width 0.4s, background 0.3s',
            boxShadow: `0 0 8px ${color}44`,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        {canRest ? (
          <>
            <Flame size={11} style={{ color: '#52b788' }} />
            <span style={{ fontSize: 10, color: '#52b788', fontWeight: 600 }}>Can Long Rest</span>
          </>
        ) : (
          <span style={{ fontSize: 10, color: '#6b7280' }}>
            {current === 0 ? 'No supplies available' : 'Not enough to rest'}
          </span>
        )}
      </div>
    </div>
  );
}
