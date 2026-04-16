// Tadpole — TypeScript interfaces for all data types

// === Spells ===

export interface SpellDamage {
  type: string; // fire, necrotic, force, etc.
  dice: string; // 8d6, 1d10, etc.
}

export interface SpellSave {
  ability: string; // dexterity, wisdom, etc.
  effect: string; // half damage on success, etc.
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0-9 (BG3 caps at 6)
  school: string; // Abjuration, Conjuration, etc.
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higherLevels?: string;
  classes: string[];
  damage?: SpellDamage;
  saves?: SpellSave[];
}

// === Classes ===

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface Subclass {
  id: string;
  name: string;
  description: string;
  features: ClassFeature[];
}

export interface GameClass {
  id: string;
  name: string;
  hitDie: string; // d12, d10, d8, d6
  primaryAbility: string;
  savingThrows: string[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  description: string;
  features: ClassFeature[];
  subclasses: Subclass[];
}

// === Items ===

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'misc';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  location: string; // where to find it
  act: number; // 1, 2, or 3
  effects?: string[];
  requirements?: string; // e.g. "Requires attunement"
}

// === Companions ===

export type ApprovalLevel = 'hostile' | 'neutral' | 'friendly' | 'very friendly' | 'excellent';
export type RomanceStatus = 'none' | 'interested' | 'active' | 'committed';

export interface ApprovalTrigger {
  action: string;
  delta: number; // positive = approves, negative = disapproves
  context?: string;
  act?: number;
}

export interface RomanceKeyMoment {
  act: number;
  description: string;
}

export interface RomancePath {
  romanceable: boolean;
  requirements: string;
  keyMoments: RomanceKeyMoment[];
  endingType: string;
  tips: string;
}

export interface Companion {
  id: string;
  name: string;
  race: string;
  class: string;
  background: string;
  description: string;
  location: string; // where to recruit
  act: number;
  approvalTriggers: ApprovalTrigger[];
  romanceable: boolean;
  romance?: RomancePath;
  personalityTraits: string[];
  likes: string[];
  dislikes: string[];
}

// === Quests ===

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export interface QuestStep {
  description: string;
  spoilerLevel: number; // 0 = no spoiler, 1 = hint, 2 = full reveal
}

export interface QuestDecision {
  question: string;
  options: {
    label: string;
    consequence: string;
    spoilerLevel: number;
    companionReactions?: { companion: string; delta: number }[];
  }[];
}

export interface Quest {
  id: string;
  name: string;
  act: number;
  description: string;
  status: QuestStatus;
  steps: QuestStep[];
  decisions: QuestDecision[];
  relatedCompanions: string[];
  relatedAreas: string[];
}

// === Areas ===

export interface PointOfInterest {
  id: string;
  name: string;
  type: 'quest' | 'item' | 'npc' | 'chest' | 'secret' | 'waypoint';
  description: string;
  spoilerLevel: number;
}

export interface Area {
  id: string;
  name: string;
  act: number;
  description: string;
  pointsOfInterest: PointOfInterest[];
  lockedAfter?: number; // act number after which this area is inaccessible
  relatedQuests: string[];
}

// === Lore ===

export type LoreCategory = 'world' | 'history' | 'factions' | 'gods' | 'races' | 'magic';

export interface LoreEntry {
  id: string;
  title: string;
  category: LoreCategory;
  content: string;
  relatedEntries: string[];
  act?: number; // when this becomes relevant
}

// === Tours ===

export interface TourStep {
  description: string;
  area: string;
  spoilerLevel: number;
  tips?: string[];
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  act: number;
  steps: TourStep[];
  estimatedTime: string;
}

// === Mini-Games ===

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string;
}

// === User Data (stored in IndexedDB / localStorage) ===

export type SpoilerMode = 'none' | 'hints' | 'full';

export interface UserPreferences {
  spoilerMode: SpoilerMode;
  favoriteSpells: string[];
  favoriteItems: string[];
  favoriteCompanions: string[];
  checklistProgress: Record<string, string[]>; // areaId -> checked POI ids
  tourProgress: Record<string, number>; // tourId -> completed step index
}

// === Live Game State (Phase 2+) ===
// Shape matches the actual Lua mod (TadpoleCompanion.lua v0.17.0) output.

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface SpellSlots {
  [level: string]: { current: number; max: number };
}

export interface ConcentrationInfo {
  spellId: string;
  caster: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
  isDead: boolean;
}

export interface GameCharacter {
  guid: string;
  name: string;
  hp: number;
  maxHp: number;
  tempHp?: number;
  level: number;
  armorClass?: number;
  isInvulnerable?: boolean;
  isDead?: boolean;
  isSneaking?: boolean;
  position: { x: number; y: number; z: number };
  experience?: number;
  proficiencyBonus?: number;
  abilityScores?: AbilityScores;
  spellSlots?: SpellSlots;
  conditions?: string[];
  concentration?: ConcentrationInfo | null;
  deathSaves?: DeathSaves;
  approval?: number;
  approvalLevel?: ApprovalLevel;
}

export interface GameEvent {
  type: string;
  timestamp: number;
  area?: string;
  detail?: string;
}

/** Event detected by the bridge server (comparing state snapshots) */
export interface BridgeEvent {
  type: string;
  timestamp: number;
  detail?: string;
}

/** Approval change event emitted by the bridge */
export interface ApprovalEvent {
  type: 'approval_change';
  companionName: string;
  companionGuid: string;
  delta: number;
  approval: number;
  action?: string;
  timestamp: number;
}

/** Approval level for a companion in live game state */
export interface CompanionApproval {
  guid: string;
  name: string;
  approval: number;       // -100 to +100
  approvalLevel: ApprovalLevel;
}

export interface CampSupplies {
  current: number;
  max: number;
  canRest: boolean;
}

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

// === Build Planner ===

export type AbilityType =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export interface RaceSubrace {
  id: string;
  name: string;
  description: string;
  abilityBonuses: { ability: AbilityType; bonus: number }[];
  features: { name: string; description: string }[];
  proficiencies: string[];
}

export interface Race {
  id: string;
  name: string;
  description: string;
  abilityBonuses: { ability: AbilityType; bonus: number }[];
  features: { name: string; description: string }[];
  proficiencies: string[];
  subraces: RaceSubrace[];
  speed: number; // base movement speed in feet
  size: 'Small' | 'Medium';
}

export interface Feat {
  id: string;
  name: string;
  description: string;
  isHalfFeat: boolean; // grants +1 to an ability
  abilityOptions?: AbilityType[]; // which abilities the half-feat can boost
  prerequisites?: string; // e.g. "Spellcasting" or "Proficiency with martial weapons"
}

export interface Background {
  id: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  feature?: string; // background feature name
}

export interface SkillInfo {
  name: string;
  ability: AbilityType;
}

export interface SpellSlotRow {
  level: number; // character level
  slots: number[]; // [cantrips, 1st, 2nd, 3rd, 4th, 5th, 6th]
}

export interface BuildLevel {
  classId: string;
  subclassId?: string;
}

export interface FeatChoice {
  atLevel: number;
  featId: string; // feat id or 'asi'
  asiBoosts?: { ability: AbilityType; amount: number }[];
}

export interface BuildSpells {
  classId: string;
  cantrips: string[];
  spells: string[];
}

export interface SavedBuild {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  race: string;
  subrace?: string;
  background: string;
  baseScores: Record<AbilityType, number>;
  levels: BuildLevel[];
  featChoices: FeatChoice[];
  chosenSkills: string[];
  chosenSpells: BuildSpells[];
}
