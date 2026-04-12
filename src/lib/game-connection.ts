'use client';

import { GameState } from '@/types';

type StateCallback = (state: GameState) => void;
type EventCallback = (event: { type: string; timestamp: number; data?: unknown }) => void;

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'mixed-content-blocked'
  | 'error';

export type StatusCallback = (status: ConnectionStatus, detail?: string) => void;

/**
 * Detect if the page is loaded over HTTPS (which would block ws:// connections).
 * Returns true if the current page protocol is https: and the user is NOT on localhost.
 */
export function isHttpsContext(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
}

export class GameConnection {
  private ws: WebSocket | null = null;
  private url: string = '';
  private stateCallbacks: StateCallback[] = [];
  private eventCallbacks: EventCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  private currentState: GameState | null = null;
  private connected = false;
  private status: ConnectionStatus = 'idle';
  private statusDetail: string = '';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private mixedContentDetected = false;

  connect(host: string, port: number = 3456) {
    this.disconnect();
    this.url = `ws://${host}:${port}/ws`;
    this.reconnectAttempts = 0;
    this.mixedContentDetected = false;

    // Check for mixed content blocking BEFORE attempting connection
    if (isHttpsContext()) {
      // The page is served over HTTPS but we're trying ws:// (not wss://).
      // Browsers will block this as mixed content.
      this.setStatus('mixed-content-blocked',
        `This page is loaded over HTTPS but the bridge server uses ws:// (unencrypted). ` +
        `Browsers block this for security. Use the HTTP version instead: ` +
        `http://${host}:${port}`
      );
      // Still attempt the connection — some environments (e.g. with browser flags)
      // might allow it, and we want to surface the real error.
    }

    this.setStatus('connecting');
    this.createConnection();
  }

  private setStatus(status: ConnectionStatus, detail?: string) {
    this.status = status;
    this.statusDetail = detail || '';
    this.statusCallbacks.forEach(cb => cb(status, detail));
  }

  private createConnection() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.mixedContentDetected = false;
        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state' && data.data) {
            this.currentState = data.data as GameState;
            this.stateCallbacks.forEach(cb => cb(this.currentState!));
          } else if (data.type === 'event') {
            this.eventCallbacks.forEach(cb => cb(data));
          }
        } catch {}
      };

      this.ws.onclose = (event) => {
        this.connected = false;
        // If we were in HTTPS context and never successfully connected,
        // this is likely mixed content blocking
        if (isHttpsContext() && this.status === 'connecting') {
          this.mixedContentDetected = true;
          this.setStatus('mixed-content-blocked',
            'Connection blocked — HTTPS page cannot open ws:// connections. ' +
            'Access the app via HTTP on your Steam Deck\'s IP address instead.'
          );
        } else {
          this.setStatus('disconnected');
        }
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
        if (isHttpsContext() && !this.mixedContentDetected) {
          this.mixedContentDetected = true;
          this.setStatus('mixed-content-blocked',
            'WebSocket error on HTTPS page — likely mixed content blocking. ' +
            'Use the HTTP URL to access the app.'
          );
        } else if (this.status !== 'mixed-content-blocked') {
          this.setStatus('error', 'Connection failed. Check that the bridge server is running.');
        }
      };
    } catch (err) {
      this.connected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.setStatus('error', msg);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.reconnectAttempts = 0;
    this.mixedContentDetected = false;
    this.setStatus('idle');
  }

  onStateUpdate(callback: StateCallback): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      const idx = this.stateCallbacks.indexOf(callback);
      if (idx !== -1) this.stateCallbacks.splice(idx, 1);
    };
  }

  removeStateCallback(callback: StateCallback) {
    const idx = this.stateCallbacks.indexOf(callback);
    if (idx !== -1) this.stateCallbacks.splice(idx, 1);
  }

  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      const idx = this.eventCallbacks.indexOf(callback);
      if (idx !== -1) this.eventCallbacks.splice(idx, 1);
    };
  }

  removeEventCallback(callback: EventCallback) {
    const idx = this.eventCallbacks.indexOf(callback);
    if (idx !== -1) this.eventCallbacks.splice(idx, 1);
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    // Immediately fire with current status
    callback(this.status, this.statusDetail);
    return () => {
      const idx = this.statusCallbacks.indexOf(callback);
      if (idx !== -1) this.statusCallbacks.splice(idx, 1);
    };
  }

  sendCommand(command: { action: string; [key: string]: unknown }) {
    try {
      if (this.ws && this.connected) {
        this.ws.send(JSON.stringify(command));
      }
    } catch {}
  }

  getState(): GameState | null {
    return this.currentState;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getStatusDetail(): string {
    return this.statusDetail;
  }
}

let instance: GameConnection | null = null;

export function getGameConnection(): GameConnection {
  if (!instance) {
    instance = new GameConnection();
  }
  return instance;
}

// ISSUE 9: Allow singleton to be nulled when no longer needed
export function resetGameConnection() {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
}
