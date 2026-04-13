// Tadpole Decky Plugin — TypeScript interfaces
// These match the ACTUAL data produced by:
//   1. TadpoleCompanion.lua (writes to tadpole_state.json)
//   2. bridge/server.js (adds events, enriches state)

// ---------------------------------------------------------------------------
// Core game state — matches Lua mod output exactly
// ---------------------------------------------------------------------------

/** A character (host or party member) as reported by the Lua mod */
export interface GameCharacter {
  guid: string;
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  position: { x: number; y: number; z: number };
}

/** A game event from the Lua mod's Osiris listeners */
export interface GameEvent {
  type: string;
  timestamp: number;
  area?: string;
}

/** The full game state snapshot written by the Lua mod every ~2s */
export interface GameState {
  timestamp: number;
  area: string;
  inCombat: boolean;
  host: GameCharacter | null;
  party: GameCharacter[];
  gold: number;
  events: GameEvent[];
}

// ---------------------------------------------------------------------------
// Bridge-enriched event (bridge/server.js detectEvents output)
// ---------------------------------------------------------------------------

/** An event detected by the bridge by comparing state snapshots */
export interface BridgeEvent {
  type: string;
  timestamp: number;
  detail?: string;
}

// ---------------------------------------------------------------------------
// API response types (Decky callable return shapes)
// ---------------------------------------------------------------------------

export interface StatusResponse {
  bridge_running: boolean;
  bg3_running: boolean;
  ip: string;
  connected_clients: number;
  game_state: GameState | null;
  recent_events: BridgeEvent[];
  node_installed: boolean;
}

export interface HealthResponse {
  healthy: boolean;
}

export interface DiagnosticsResponse {
  node_installed: boolean;
  node_version: string | null;
  node_binary: string;
  bridge_found: boolean;
  bridge_path: string | null;
  lua_installed: boolean;
  bg3se_installed: boolean;
  bg3_install_dir: string | null;
  bg3_running: boolean;
  ip: string;
  bg3_mod_dir: string | null;
  ready: boolean;
  paths_checked: Record<string, { path: string; exists: boolean }>;
  plugin_version: string;
  home: string;
  decky_user_home: string;
}

export interface PluginSettings {
  port: number;
  autoStart: boolean;
  bridgeDir: string;
}

export interface InstallResult {
  success: boolean;
  results?: Record<string, boolean>;
  step?: string;
}

export interface UpdateInfo {
  update_available: boolean;
  current_version: string;
  latest_version: string;
  download_url?: string;
  error?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
}

export interface LogResponse {
  log: string;
}

/** Settings saved by the plugin, returned by get_settings callable */
export interface SavedSettings {
  port?: number;
  autoStart?: boolean;
  bridgeDir?: string;
}
