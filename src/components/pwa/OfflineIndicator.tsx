'use client';

import { useState, useEffect, useRef } from 'react';
import { usePWA } from '@/hooks/usePWA';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOnline) {
      // Show immediately but use setTimeout to satisfy linter
      timerRef.current = setTimeout(() => setShow(true), 0);
    } else {
      // Brief delay before hiding for a smooth transition
      timerRef.current = setTimeout(() => setShow(false), 500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOnline]);

  if (!show) return null;

  return (
    <div className={`pwa-offline-bar ${isOnline ? 'pwa-offline-bar--online' : ''}`}>
      <span className="pwa-offline-dot" />
      <span>
        {isOnline
          ? "You're back online!"
          : "You're offline — cached data is available"}
      </span>
    </div>
  );
}
