'use client';

import { useGameConnection } from '@/hooks/useGameConnection';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ConnectionPanel() {
  const { isConnected, connect, disconnect, getLastHost } = useGameConnection();
  const [host, setHost] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    setHost(getLastHost());
  }, [getLastHost]);

  const handleConnect = () => {
    if (!host.trim()) return;
    setConnecting(true);
    connect(host.trim());
    setTimeout(() => setConnecting(false), 3000);
  };

  const handleDisconnect = () => {
    disconnect();
    setConnecting(false);
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>
        Connect to Game
      </h3>

      {!isConnected ? (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            Enter your PC&apos;s IP address. Make sure the bridge server is running.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="192.168.1.100"
              className="flex-1 rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                minHeight: '44px',
                fontSize: '16px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            />
            <button
              onClick={handleConnect}
              disabled={!host.trim() || connecting}
              className="touch-target rounded-lg px-4 flex items-center justify-center"
              style={{
                background: connecting ? 'var(--surface-active)' : 'var(--accent)',
                color: '#fff',
                opacity: !host.trim() || connecting ? 0.5 : 1,
              }}
            >
              {connecting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Wifi size={18} />
              )}
            </button>
          </div>
          {connecting && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Connecting...
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={16} style={{ color: 'var(--success)' }} />
            <span className="text-sm" style={{ color: 'var(--success)' }}>
              Connected to {host}
            </span>
          </div>
          <button
            onClick={handleDisconnect}
            className="touch-target rounded-lg px-3 py-1 text-xs flex items-center gap-1"
            style={{
              background: 'var(--surface-active)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
            }}
          >
            <WifiOff size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
