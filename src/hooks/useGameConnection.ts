'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getGameConnection, isHttpsContext, ConnectionStatus } from '@/lib/game-connection';
import { GameState } from '@/types';
import { safeGet, safeSet } from '@/lib/storage';

const LAST_HOST_KEY = 'tadpole_last_host';

export function useGameConnection() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionDetail, setConnectionDetail] = useState('');
  const [httpsContext] = useState(() => isHttpsContext());
  const connRef = useRef<ReturnType<typeof getGameConnection> | null>(null);

  useEffect(() => {
    const conn = getGameConnection();
    connRef.current = conn;

    const unsubscribeState = conn.onStateUpdate((state) => {
      setGameState(state);
    });

    const unsubscribeStatus = conn.onStatusChange((status, detail) => {
      setConnectionStatus(status);
      setConnectionDetail(detail || '');
    });

    // Set initial connection state from WebSocket (external system sync)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsConnected(conn.isConnected());

    // Poll connection status
    const interval = setInterval(() => {
      setIsConnected(conn.isConnected());
    }, 1000);

    return () => {
      clearInterval(interval);
      unsubscribeState();
      unsubscribeStatus();
      // Do NOT disconnect or reset -- keep the singleton alive across tab changes
    };
  }, []);

  const connect = useCallback((host: string, port: number = 3456) => {
    try { safeSet(LAST_HOST_KEY, host); } catch {}
    connRef.current?.connect(host, port);
  }, []);

  const disconnect = useCallback(() => {
    connRef.current?.disconnect();
    setGameState(null);
    setIsConnected(false);
  }, []);

  const sendCommand = useCallback((command: { action: string; [key: string]: unknown }) => {
    connRef.current?.sendCommand(command);
  }, []);

  const getLastHost = useCallback((): string => {
    return safeGet(LAST_HOST_KEY) as string || '';
  }, []);

  return {
    gameState,
    isConnected,
    connectionStatus,
    connectionDetail,
    isHttpsContext: httpsContext,
    connect,
    disconnect,
    sendCommand,
    getLastHost,
  };
}
