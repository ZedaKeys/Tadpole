// Tadpole Decky Plugin — TypeScript interfaces
// These match the ACTUAL data produced by:
//   1. BootstrapServer.lua v0.18.0 (writes TadpoleState.json via Ext.IO.SaveFile)
//   2. bridge/server.js (adds events, enriches state)

// ---------------------------------------------------------------------------
// Core game state — matches Lua mod output exactly
// ---------------------------------------------------------------------------

/** A class resource (Bardic Inspiration, Sorcery Points, Ki, Rages, etc) */
export interface ActionResource {
  id: string;
  name: string;
  current: number;
  max: number;
}

/** Ability scores (STR/DEX/CON/INT/WIS/CHA) */
export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

/** Concentration info */
export interface ConcentrationInfo {
  spellId: string;
  caster: string;
}

/** Death saves tracker */
export interface DeathSaves {
  successes: number;
  failures: number;
  isDead: boolean;
}

/** Spell slots per level */
export interface SpellSlots {
  [level: string]: { current: number; max: number };
}

/** A character (host or party member) as reported by the Lua mod */
export interface GameCharacter {
  guid: string;
  name: string;
  hp: number;
  maxHp: number;
  tempHp?: number;
  level: number;
  armorClass?: number;
  isDead?: boolean;
  isInvulnerable?: boolean;
  isSneaking?: boolean;
  position: { x: number; y: number; z: number };
  experience?: number;
  proficiencyBonus?: number;
  abilityScores?: AbilityScores;
  spellSlots?: SpellSlots;
  actionResources?: ActionResource[];
  conditions?: string[];
  concentration?: ConcentrationInfo | null;
  deathSaves?: DeathSaves;
  /** Initiative bonus from Stats component */
  initiative?: number;
  /** Detailed XP breakdown from Experience component */
  experienceDetail?: { currentLevelXp: number; nextLevelXp: number; totalXp: number };
  /** Carry weight and encumbrance state */
  encumbrance?: { weight: number; weightDisplay: number; state: number; maxWeight: number; encumberedWeight: number; heavilyEncumberedWeight: number };
  /** Stealth state and obscurity level */
  stealthState?: { sneaking: boolean; obscurity: number };
  /** Vision ranges */
  vision?: { darkvisionRange: number; sightRange: number; fov: number };
  /** Current movement speed */
  movementSpeed?: number;
  /** Combat-specific data */
  combatDetail?: { initiativeRoll: number; combatGroupId: string };
  /** Character state flags */
  characterFlags?: { fightMode: boolean; floating: boolean; invisible: boolean; offStage: boolean; storyNPC: boolean; isCompanion: boolean; isPet: boolean; cannotDie: boolean };
  /** Illithid tadpole tree state */
  tadpoleState?: { state: number };
  /** Race/Background/Origin IDs */
  raceAndBackground?: { raceId?: string; backgroundId?: string; origin?: string };
  /** Passive ability IDs */
  passives?: string[];
  /** Entity tags */
  tags?: string[];
}

/** A game event from the Lua mod's Osiris listeners */
export interface GameEvent {
  type: string;
  timestamp: number;
  area?: string;
  detail?: string;
}

/** Camp supplies info */
export interface CampSupplies {
  current: number;
  max: number;
  canRest: boolean;
}

/** The full game state snapshot written by the Lua mod */
export interface GameState {
  timestamp: number;
  area: string;
  inCombat: boolean;
  inDialog?: boolean;
  weather?: string;
  host: GameCharacter | null;
  party: GameCharacter[];
  gold: number;
  events: GameEvent[];
  campSupplies?: CampSupplies;
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
