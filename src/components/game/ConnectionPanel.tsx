'use client';

import { useGameConnection } from '@/hooks/useGameConnection';
import { Wifi, WifiOff, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ConnectionPanel() {
  const {
    isConnected,
    connectionStatus,
    connectionDetail,
    isHttpsContext: isHttps,
    connect,
    disconnect,
    getLastHost,
  } = useGameConnection();
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

  const isMixedContent = connectionStatus === 'mixed-content-blocked';

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>
        Connect to Game
      </h3>

      {/* HTTPS Mixed Content Warning */}
      {isHttps && !isConnected && (
        <div
          className="rounded-lg p-3 mb-3 text-xs"
          style={{
            background: 'rgba(244, 162, 97, 0.1)',
            border: '1px solid rgba(244, 162, 97, 0.3)',
            color: '#f4a261',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <strong>HTTPS Security Warning</strong>
              <p className="mt-1" style={{ color: '#ccc' }}>
                This page is loaded over HTTPS, but the bridge server on your Steam Deck uses
                an unencrypted (ws://) connection. Browsers block this as &quot;mixed content.&quot;
              </p>
              <p className="mt-1" style={{ color: '#ccc' }}>
                To connect, open this app directly from your Steam Deck instead:
              </p>
              <div className="mt-1 font-mono" style={{ color: '#52b788' }}>
                http://{host || '192.168.1.136'}:3456/phone
              </div>
              <p className="mt-1" style={{ color: '#999' }}>
                Or, if the bridge server serves this app, bookmark the HTTP URL above.
              </p>
            </div>
          </div>
        </div>
      )}

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
          {/* Mixed content error after attempting connection */}
          {isMixedContent && (
            <div
              className="rounded-lg p-3 mt-3 text-xs"
              style={{
                background: 'rgba(231, 111, 81, 0.1)',
                border: '1px solid rgba(231, 111, 81, 0.3)',
                color: '#e76f51',
              }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Connection blocked by browser</strong>
                  <p className="mt-1" style={{ color: '#ccc' }}>
                    {connectionDetail || 'Mixed content: HTTPS page cannot open ws:// connections.'}
                  </p>
                  <a
                    href={`http://${host || '192.168.1.136'}:3456/phone`}
                    className="inline-flex items-center gap-1 mt-1 underline"
                    style={{ color: '#48bfe3' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink size={12} />
                    Open via HTTP instead
                  </a>
                </div>
              </div>
            </div>
          )}
          {/* Generic connection error */}
          {connectionStatus === 'error' && !isMixedContent && (
            <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>
              {connectionDetail || 'Connection failed. Make sure the bridge server is running.'}
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
