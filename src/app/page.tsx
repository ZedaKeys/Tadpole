'use client';

import { useState, useEffect } from 'react';
import { useGameConnection } from '@/hooks/useGameConnection';
import { Swords, Wifi, WifiOff, Shield, MessageSquare, Cloud } from 'lucide-react';

import PartyHealthDashboard from '@/components/game/PartyHealthDashboard';
import CombatTracker from '@/components/game/CombatTrackerNew';
import SpellAndConditions from '@/components/game/SpellAndConditions';
import DeathSaveTracker from '@/components/game/DeathSaveTracker';
import SessionTimeline from '@/components/game/SessionTimeline';
import GoldXpTracker from '@/components/game/GoldXpTracker';
import CharacterSheetViewer from '@/components/game/CharacterSheetViewer';
import CampSupplyGauge from '@/components/game/CampSupplyGauge';
import QuickActionsBar from '@/components/game/QuickActionsBar';

export default function HomePage() {
  const { gameState, isConnected, connectionStatus, disconnect, connect, getLastHost, sendCommand } = useGameConnection();
  const [ip, setIp] = useState(() => getLastHost() || '');
  const [connecting, setConnecting] = useState(false);

  // Auto-connect to the host serving this page
  useEffect(() => {
    if (isConnected || connecting) return;

    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return;

    const savedHost = getLastHost();
    const autoConnectHost = (savedHost && savedHost === hostname) ? savedHost : hostname;

    if (autoConnectHost) {
      setIp(autoConnectHost);
      connect(autoConnectHost, 3456);
    }
  }, [isConnected, connecting, getLastHost, connect]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    if (!ip.trim()) return;
    setConnecting(true);
    connect(ip.trim(), 3456);
  };

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

          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.x or tadpole.local"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e0d8',
                fontSize: 15,
                padding: '0 14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={() => setIp('tadpole.local')}
              disabled={connecting}
              style={{
                height: 44,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid rgba(198,162,85,0.3)',
                background: 'transparent',
                color: '#c6a255',
                fontSize: 12,
                fontWeight: 600,
                cursor: connecting ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Auto
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, lineHeight: 1.4 }}>
            Enter your Steam Deck IP address, or tap &ldquo;Auto&rdquo; to discover via mDNS (tadpole.local)
          </p>

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
  const party = gameState.party || [];
  const host = gameState.host;
  const allChars = host ? [host, ...party] : party;

  return (
    <main style={{ flex: 1, maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 20px 100px' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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

      {/* Area + Combat + Dialog + Weather badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#e2e0d8' }}>{gameState.area || 'Unknown'}</span>
        {gameState.inCombat && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(231,111,81,0.12)', color: '#e76f51', fontSize: 12, fontWeight: 600 }}>
            <Swords size={12} /> COMBAT
          </span>
        )}
        {gameState.inDialog && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(198,162,85,0.12)', color: '#c6a255', fontSize: 12, fontWeight: 600 }}>
            <MessageSquare size={12} /> DIALOG
          </span>
        )}
        {gameState.weather && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: 'rgba(72,191,227,0.12)', color: '#48bfe3', fontSize: 12, fontWeight: 600 }}>
            <Cloud size={12} /> {gameState.weather}
          </span>
        )}
      </div>

      {/* Feature 7: Gold/XP Tracker */}
      <GoldXpTracker gameState={gameState} />

      {/* Feature 9: Camp Supply Gauge */}
      <CampSupplyGauge supplies={gameState.campSupplies} />

      {/* Feature 2: Combat Tracker (auto-shows in combat) */}
      <CombatTracker state={gameState} />

      {/* Feature 1: Party Health Dashboard */}
      <PartyHealthDashboard host={host} party={party} />

      {/* Feature 5: Death Save Trackers */}
      {allChars.some((c) => c.deathSaves?.isDead) && (
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
            Death Saves
          </span>
          {allChars.filter((c) => c.deathSaves?.isDead).map((c) => (
            <DeathSaveTracker key={c.guid} character={c} />
          ))}
        </div>
      )}

      {/* Features 3 & 4: Spell Slots + Conditions */}
      <SpellAndConditions host={host} party={party} />

      {/* Feature 8: Character Sheet Viewer */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
          Character Sheets
        </span>
        {allChars.map((c) => (
          <CharacterSheetViewer key={c.guid} character={c} />
        ))}
      </div>

      {/* Feature 6: Session Timeline */}
      <SessionTimeline events={gameState.events} />

      {/* Feature 10: Quick Actions Bar (fixed bottom) */}
      <QuickActionsBar sendCommand={sendCommand} />
    </main>
  );
}
