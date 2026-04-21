'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGameConnection } from '@/lib/game-connection';

export interface GameNotification {
  type: string;
  timestamp: number;
  data?: unknown;
  id: number;
}

let notifId = 0;

export function useGameNotifications(maxNotifications: number = 50) {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  useEffect(() => {
    const conn = getGameConnection();
    const unsubscribe = conn.onEvent((event) => {
      setNotifications(prev => {
        const next = [...prev, { ...event, id: ++notifId }];
        return next.slice(-maxNotifications);
      });
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [maxNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, clearNotifications };
}
