'use client';

import Image from 'next/image';
import { usePWA } from '@/hooks/usePWA';

export default function InstallBanner() {
  const { canInstall, install } = usePWA();

  if (!canInstall) return null;

  return (
    <div className="pwa-install-banner safe-bottom">
      <div className="pwa-install-content">
        <Image
          src="/icons/icon-192.png"
          alt="Tadpole"
          width={40}
          height={40}
          className="pwa-install-icon"
        />
        <div className="pwa-install-text">
          <strong>Install Tadpole</strong>
          <span>Add to home screen for quick access</span>
        </div>
        <div className="pwa-install-actions">
          <button
            onClick={install}
            className="pwa-install-btn"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
