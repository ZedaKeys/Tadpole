'use client';

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Brief delay before hiding for a smooth transition
      const timer = setTimeout(() => setShow(false), 500);
      return () => clearTimeout(timer);
    }
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
