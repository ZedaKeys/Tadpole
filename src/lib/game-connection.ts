'use client';

import { GameState } from '@/types';

type StateCallback = (state: GameState) => void;
type EventCallback = (event: { type: string; timestamp: number; data?: unknown }) => void;

export class GameConnection {
  private ws: WebSocket | null = null;
  private url: string = '';
  private stateCallbacks: StateCallback[] = [];
  private eventCallbacks: EventCallback[] = [];
  private currentState: GameState | null = null;
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;

  connect(host: string, port: number = 3456) {
    this.disconnect();
    this.url = `ws://${host}:${port}/ws`;
    this.reconnectAttempts = 0;
    this.createConnection();
  }

  private createConnection() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'state_update' && data.state) {
            this.currentState = data.state as GameState;
            this.stateCallbacks.forEach(cb => cb(this.currentState!));
          } else if (data.type === 'event') {
            this.eventCallbacks.forEach(cb => cb(data));
          }
        } catch {}
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.connected = false;
      };
    } catch {
      this.connected = false;
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
  }

  onStateUpdate(callback: StateCallback) {
    this.stateCallbacks.push(callback);
  }

  onEvent(callback: EventCallback) {
    this.eventCallbacks.push(callback);
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
}

let instance: GameConnection | null = null;

export function getGameConnection(): GameConnection {
  if (!instance) {
    instance = new GameConnection();
  }
  return instance;
}
