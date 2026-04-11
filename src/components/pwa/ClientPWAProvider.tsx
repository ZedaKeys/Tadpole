'use client';

import dynamic from 'next/dynamic';
import { PWAProvider } from '@/hooks/usePWA';

// Dynamic imports to avoid SSR issues — these are client-only components
const InstallBanner = dynamic(() => import('./InstallBanner'), { ssr: false });
const UpdateNotification = dynamic(() => import('./UpdateNotification'), { ssr: false });
const OfflineIndicator = dynamic(() => import('./OfflineIndicator'), { ssr: false });

export default function ClientPWAProvider() {
  return (
    <PWAProvider>
      <InstallBanner />
      <UpdateNotification />
      <OfflineIndicator />
    </PWAProvider>
  );
}
