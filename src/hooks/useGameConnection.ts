'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getGameConnection } from '@/lib/game-connection';
import { GameState } from '@/types';
import { safeGet, safeSet } from '@/lib/storage';

const LAST_HOST_KEY = 'tadpole_last_host';

export function useGameConnection() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connRef = useRef<ReturnType<typeof getGameConnection> | null>(null);

  useEffect(() => {
    const conn = getGameConnection();
    connRef.current = conn;

    conn.onStateUpdate((state) => {
      setGameState(state);
    });

    // Poll connection status
    const interval = setInterval(() => {
      setIsConnected(conn.isConnected());
    }, 1000);

    return () => {
      clearInterval(interval);
      conn.disconnect();
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

  return { gameState, isConnected, connect, disconnect, sendCommand, getLastHost };
}
