'use client';

import { useState, useCallback } from 'react';
import { HeartPlus, Tent, Coins, Sparkles } from 'lucide-react';

interface QuickActionsBarProps {
  sendCommand: (command: { action: string; [key: string]: unknown }) => void;
}

export default function QuickActionsBar({ sendCommand }: QuickActionsBarProps) {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const actions = [
    { action: 'heal_party', label: 'Heal', icon: <HeartPlus size={16} />, color: '#52b788' },
    { action: 'short_rest', label: 'Short Rest', icon: <Tent size={16} />, color: '#48bfe3' },
    { action: 'long_rest', label: 'Long Rest', icon: <Sparkles size={16} />, color: '#c6a255' },
    { action: 'add_gold', label: '+500g', icon: <Coins size={16} />, color: '#f4a261', params: { amount: 500 } },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 56, // above BottomNav
        left: 0,
        right: 0,
        background: 'rgba(10,10,15,0.92)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        padding: '6px 12px',
        paddingBottom: 6,
        display: 'flex',
        gap: 6,
        justifyContent: 'space-around',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 999,
      }}
    >
      {actions.map(({ action, label, icon, color, params }) => {
        const active = lastAction === action;
        return (
          <button
            key={action}
            onClick={() => {
              sendCommand({ action, ...params });
              setLastAction(action);
              setTimeout(() => setLastAction(null), 1200);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 10,
              border: active ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.06)',
              background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
              color: active ? color : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              minWidth: 44,
              minHeight: 44,
              transition: 'all 0.2s ease',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {icon}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
