'use client';

import { useState, useEffect } from 'react';

import { useGameConnection } from '@/hooks/useGameConnection';
import { Swords, Wifi, WifiOff, Shield, MessageSquare, Cloud, Search, Map, Activity, Heart } from 'lucide-react';
import Link from 'next/link';

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

  // Sync connecting state when connection is established
  useEffect(() => {
    if (connecting && isConnected) setConnecting(false);
  }, [connecting, isConnected]);

  // ── Connection Panel ──
  if (!isConnected || !gameState) {
    const isConnecting = connectionStatus === 'connecting' || connecting;
    return (
      <main style={{
        flex: 1, maxWidth: 480, margin: '0 auto', width: '100%',
        padding: '0 24px 32px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        minHeight: '100dvh',
      }}>
        {/* BG3-themed hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }} className="animate-fade-up">
          {/* Floating tadpole icon with glow ring */}
          <div style={{
            width: 80, height: 80,
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(198,162,85,0.15), rgba(198,162,85,0.03))',
            border: '2px solid rgba(198,162,85,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }} className="animate-float animate-glow-ring">
            <Shield size={36} style={{ color: '#c6a255', filter: 'drop-shadow(0 0 8px rgba(198,162,85,0.4))' }} />
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 700, color: '#e2e0d8',
            letterSpacing: '0.04em', marginBottom: 4,
            textShadow: '0 0 20px rgba(198,162,85,0.2)',
          }}>
            Tadpole
          </h1>

          <p style={{
            color: '#9ca3af', fontSize: 13, fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Baldur&apos;s Gate 3 Companion
          </p>

          {/* Decorative line */}
          <div style={{
            width: 60, height: 2, margin: '16px auto 0',
            background: 'linear-gradient(90deg, transparent, rgba(198,162,85,0.4), transparent)',
            borderRadius: 1,
          }} />

          {/* Quick links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <Link
              href="/map"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 20,
                background: 'rgba(198,162,85,0.06)',
                border: '1px solid rgba(198,162,85,0.15)',
                color: '#c6a255',
                fontSize: 13,
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
            >
              <Map size={14} />
              World Map
            </Link>
            <Link
              href="/search"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-dim)',
                fontSize: 13,
                textDecoration: 'none',
                transition: 'background-color 0.2s, border-color 0.2s',
              }}
            >
              <Search size={14} />
              Search
            </Link>
          </div>
        </div>

        {/* Connection card */}
        <div
          className="animate-fade-up stagger-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 20,
            padding: 24,
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Status indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
            padding: '8px 12px', borderRadius: 10,
            background: isConnecting ? 'rgba(198,162,85,0.08)' : isConnected ? 'rgba(82,183,136,0.08)' : 'rgba(255,255,255,0.02)',
          }}>
            {isConnecting ? (
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid rgba(198,162,85,0.3)',
                borderTopColor: '#c6a255',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : isConnected ? (
              <Wifi size={18} style={{ color: '#52b788' }} />
            ) : (
              <WifiOff size={18} style={{ color: '#6b7280' }} />
            )}
            <span style={{ fontSize: 13, color: isConnecting ? '#c6a255' : '#9ca3af', fontWeight: 500 }}>
              {isConnecting ? 'Establishing link...' : isConnected ? 'Connected — awaiting data' : 'Not connected'}
            </span>
          </div>

          {/* IP input row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.x"
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
                color: '#e2e0d8',
                fontSize: 15,
                padding: '0 16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(198,162,85,0.3)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={() => setIp('tadpole.local')}
              disabled={connecting}
              style={{
                height: 48,
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid rgba(198,162,85,0.2)',
                background: 'rgba(198,162,85,0.06)',
                color: '#c6a255',
                fontSize: 12,
                fontWeight: 600,
                cursor: connecting ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              Auto
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16, lineHeight: 1.4 }}>
            Enter your Steam Deck IP or tap Auto to discover via mDNS
          </p>

          {/* Connect button */}
          <button
            onClick={handleConnect}
            disabled={connecting || !ip.trim()}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 12,
              border: 'none',
              background: connecting || !ip.trim()
                ? 'rgba(198,162,85,0.15)'
                : 'linear-gradient(135deg, #c6a255 0%, #d4b56a 50%, #c6a255 100%)',
              color: connecting || !ip.trim() ? '#666' : '#0d0c1d',
              fontSize: 15,
              fontWeight: 700,
              cursor: connecting || !ip.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: (!connecting && ip.trim()) ? '0 4px 20px rgba(198,162,85,0.25)' : 'none',
              transition: 'all 0.3s ease',
              letterSpacing: '0.02em',
            }}
          >
            <Wifi size={16} />
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>

        {/* Bottom decorative text */}
        <p
          className="animate-fade-in stagger-4"
          style={{
            textAlign: 'center', marginTop: 24,
            fontSize: 11, color: '#4b5563',
            letterSpacing: '0.03em',
          }}
        >
          Steam Deck + BG3 Script Extender required
        </p>
      </main>
    );
  }

  // ── Live Dashboard ──
  const party = gameState.party || [];
  const host = gameState.host;
  const allChars = host ? [host, ...party] : party;

  return (
    <main style={{ flex: 1, maxWidth: 480, margin: '0 auto', width: '100%', padding: '16px 20px 140px' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }} className="animate-fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#52b788',
          }} className="animate-pulse-live" />
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

      {/* Combat Overlay link */}
      <Link
        href="/live/combat"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(231,111,81,0.06)',
          border: '1px solid rgba(231,111,81,0.15)',
          marginBottom: 16,
          textDecoration: 'none',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(231,111,81,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Swords size={18} style={{ color: '#e76f51' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8' }}>Combat Overlay</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>HP bars, conditions, combat log</div>
        </div>
        <Activity size={16} style={{ color: '#e76f51' }} />
      </Link>

      {/* Approval Tracker link */}
      <Link
        href="/live/approval"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(198,162,85,0.06)',
          border: '1px solid rgba(198,162,85,0.15)',
          marginBottom: 16,
          textDecoration: 'none',
          transition: 'background 0.2s, border-color 0.2s',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(198,162,85,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Heart size={18} style={{ color: '#c6a255' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e0d8' }}>Approval Tracker</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Companion approval changes</div>
        </div>
      </Link>

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
