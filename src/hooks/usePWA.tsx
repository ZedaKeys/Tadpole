'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  registerServiceWorker,
  onUpdateAvailable,
  applyServiceWorkerUpdate,
} from '@/lib/register-sw';

// ── Types ────────────────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextValue {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  hasUpdate: boolean;
  install: () => Promise<void>;
  applyUpdate: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const PWAContext = createContext<PWAContextValue | null>(null);

export function usePWA(): PWAContextValue {
  const ctx = useContext(PWAContext);
  if (!ctx) {
    // Return safe defaults if used outside provider (shouldn't happen)
    return {
      isInstalled: false,
      isOnline: true,
      canInstall: false,
      hasUpdate: false,
      install: async () => {},
      applyUpdate: () => {},
    };
  }
  return ctx;
}

const INSTALL_DISMISSED_KEY = 'tadpole-install-dismissed';

// ── Provider ─────────────────────────────────────────────────────────────────

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [canInstall, setCanInstall] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Detect installed state + initial online
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone: boolean }).standalone === true;

    setIsInstalled(standalone);
    setIsOnline(navigator.onLine);
  }, []);

  // Register service worker + listen for updates
  useEffect(() => {
    onUpdateAvailable(() => {
      setHasUpdate(true);
    });
    registerServiceWorker();
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInstalled) return;

    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isInstalled]);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Actions
  const install = useCallback(async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
      }
      setInstallPrompt(null);
    } catch (err) {
      console.warn('[PWA] Install prompt failed:', err);
    }
  }, [installPrompt]);

  const applyUpdate = useCallback(() => {
    applyServiceWorkerUpdate();
  }, []);

  return (
    <PWAContext.Provider
      value={{ isInstalled, isOnline, canInstall, hasUpdate, install, applyUpdate }}
    >
      {children}
    </PWAContext.Provider>
  );
}
