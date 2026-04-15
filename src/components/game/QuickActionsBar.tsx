'use client';

import { useState, useCallback } from 'react';
import { HeartPlus, Tent, Coins, Sparkles } from 'lucide-react';

interface QuickActionsBarProps {
  sendCommand: (command: { action: string; [key: string]: unknown }) => void;
}

export default function QuickActionsBar({ sendCommand }: QuickActionsBarProps) {
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = useCallback((action: string, label: string) => {
    sendCommand({ action });
    setLastAction(label);
    setTimeout(() => setLastAction(null), 1500);
  }, [sendCommand]);

  const actions = [
    { action: 'heal_party', label: 'Heal Party', icon: <HeartPlus size={16} />, color: '#52b788' },
    { action: 'short_rest', label: 'Short Rest', icon: <Tent size={16} />, color: '#48bfe3' },
    { action: 'long_rest', label: 'Long Rest', icon: <Sparkles size={16} />, color: '#c6a255' },
    { action: 'add_gold', label: '+500 Gold', icon: <Coins size={16} />, color: '#c6a255', params: { amount: 500 } },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,10,15,0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '8px 16px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex',
        gap: 8,
        justifyContent: 'space-around',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 100,
      }}
    >
      {actions.map(({ action, label, icon, color, params }) => (
        <button
          key={action}
          onClick={() => {
            sendCommand({ action, ...params });
            setLastAction(label);
            setTimeout(() => setLastAction(null), 1500);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 8px',
            borderRadius: 10,
            border: lastAction === label ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
            background: lastAction === label ? `${color}15` : 'rgba(255,255,255,0.03)',
            color,
            cursor: 'pointer',
            minWidth: 68,
            minHeight: 44,
            transition: 'all 0.2s',
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
