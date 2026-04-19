'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePWA } from '@/hooks/usePWA';

export default function UpdateNotification() {
  const { hasUpdate, applyUpdate } = usePWA();
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (hasUpdate) {
      // Small delay so it animates in
      const showTimer = setTimeout(() => setVisible(true), 300);

      // Auto-dismiss after 10 seconds
      const dismissTimer = setTimeout(() => {
        setDismissing(true);
        setTimeout(() => setVisible(false), 300);
      }, 10_000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [hasUpdate]);

  const handleUpdate = useCallback(() => {
    applyUpdate();
  }, [applyUpdate]);

  if (!visible || !hasUpdate) return null;

  return (
    <div className={`pwa-update-toast ${dismissing ? 'pwa-toast-dismissing' : ''}`}>
      <div className="pwa-update-content">
        <span className="pwa-update-icon">🔄</span>
        <span className="pwa-update-text">Update available</span>
        <button onClick={handleUpdate} className="pwa-update-btn">
          Update now
        </button>
      </div>
    </div>
  );
}
