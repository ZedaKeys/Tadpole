'use client';

import { useState } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import { Coins, Swords, Wifi, WifiOff, Shield } from 'lucide-react';

function hpColor(ratio: number): string {
  if (ratio > 0.6) return '#52b788';
  if (ratio > 0.3) return '#f4a261';
  return '#e76f51';
}

function HpBar({ name, hp, maxHp, level }: { name: string; hp: number; maxHp: number; level: number }) {
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  const color = hpColor(ratio);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8' }}>{name}</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>Lv {level} · {hp}/{maxHp}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(ratio * 100, 0)}%`, borderRadius: 4, background: color, transition: 'width 0.3s, background 0.3s' }} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { gameState, isConnected, connectionStatus, disconnect, connect, getLastHost } = useGameConnection();
  const [ip, setIp] = useState(() => getLastHost() || '');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    if (!ip.trim()) return;
    setConnecting(true);
    connect(ip.trim(), 3456);
    // connecting state will clear when isConnected changes
  };

  // Clear connecting flag once connected or on error (status changes)
  if (connecting && isConnected) setConnecting(false);

  // ── Connection Panel ──
  if (!isConnected || !gameState) {
    return (
      <main style={{ flex: 1, maxWidth: 480, margin: '0 auto', width: '100%', padding: '48px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Shield size={40} style={{ color: '#c6a255', marginBottom: 16 }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e0d8', letterSpacing: '0.04em' }}>Tadpole</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>BG3 Live Companion</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {isConnected ? <Wifi size={18} style={{ color: '#22c55e' }} /> : <WifiOff size={18} style={{ color: '#6b7280' }} />}
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              {isConnected ? 'Connected — waiting for data...' : connectionStatus === 'connecting' ? 'Connecting...' : 'Not connected'}
            </span>
          </div>

          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.x"
            style={{
              width: '100%',
              height: 44,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: '#e2e0d8',
              fontSize: 15,
              padding: '0 14px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />

          <button
            onClick={handleConnect}
            disabled={connecting || !ip.trim()}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 10,
              border: 'none',
              background: connecting || !ip.trim() ? 'rgba(198,162,85,0.3)' : '#c6a255',
              color: connecting || !ip.trim() ? '#888' : '#0d0c1d',
              fontSize: 15,
              fontWeight: 600,
              cursor: connecting || !ip.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (!connecting && ip.trim()) ? '0 0 16px rgba(198,162,85,0.3)' : 'none',
              transition: 'box-shadow 0.2s',
            }}
          >
            <Wifi size={16} />
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </main>
    );
  }

  // ── Live Dashboard ──
  const recentEvents = (gameState.events || []).slice(-5).reverse();

  return (
    <main style={{ flex: 1, maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 20px 32px' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52b788', boxShadow: '0 0 8px rgba(82,183,136,0.5)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#52b788', letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        <button
          onClick={disconnect}
          style={{
            height: 36,
            padding: '0 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#9ca3af',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      </div>

      {/* Area + Combat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#e2e0d8' }}>{gameState.area || 'Unknown'}</span>
        {gameState.inCombat && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(231,111,81,0.12)', color: '#e76f51', fontSize: 12, fontWeight: 600 }}>
            <Swords size={12} /> COMBAT
          </span>
        )}
      </div>

      {/* Gold */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, padding: '12px 16px', borderRadius: 16, background: 'rgba(198,162,85,0.06)', border: '1px solid rgba(198,162,85,0.1)', boxShadow: '0 0 12px rgba(198,162,85,0.08)' }}>
        <Coins size={16} style={{ color: '#c6a255' }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#c6a255' }}>{gameState.gold.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 2 }}>Gold</span>
      </div>

      {/* HP Bars */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Party Health</span>
        {gameState.host && <HpBar name={gameState.host.name} hp={gameState.host.hp} maxHp={gameState.host.maxHp} level={gameState.host.level} />}
        {gameState.party.map((c) => (
          <HpBar key={c.guid} name={c.name} hp={c.hp} maxHp={c.maxHp} level={c.level} />
        ))}
      </div>

      {/* Event Feed */}
      {recentEvents.length > 0 && (
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Recent Events</span>
          <div style={{ borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            {recentEvents.map((ev, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: i < recentEvents.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <span style={{ fontSize: 13, color: '#d1d5db' }}>{ev.type}</span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {ev.area || new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
