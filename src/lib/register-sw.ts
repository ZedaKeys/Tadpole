/**
 * Service worker registration utility.
 * Graceful no-op if service workers are not supported.
 */

type UpdateCallback = () => void;

let updateCallback: UpdateCallback | null = null;

export function onUpdateAvailable(callback: UpdateCallback) {
  updateCallback = callback;
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    window.addEventListener('load', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Check for updates periodically
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content is available — there's a waiting SW
              console.log('[SW] New update available');
              if (updateCallback) {
                updateCallback();
              }
            } else {
              // First install — content is cached for offline use
              console.log('[SW] Content cached for offline use');
            }
          }
        });
      });

      // If there's already a waiting SW on load, notify immediately
      if (registration.waiting) {
        console.log('[SW] Update already waiting');
        if (updateCallback) {
          updateCallback();
        }
      }

      // Handle controller change (new SW took over)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  } catch (error) {
    console.warn('[SW] Registration failed:', error);
  }
}

/**
 * Send SKIP_WAITING message to the waiting service worker,
 * causing it to activate immediately.
 */
export function applyServiceWorkerUpdate(): void {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }).catch((err) => {
    console.warn('[SW] Failed to apply update:', err);
  });
}
