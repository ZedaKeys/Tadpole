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

export interface GameState {
  timestamp: number;
  player: {
    name: string;
    race: string;
    class: string;
    level: number;
    hp: { current: number; max: number };
    position: { x: number; y: number; z: number };
    area: string;
    act: number;
    gold: number;
    experience: number;
    inspiration: number;
  };
  party: {
    name: string;
    hp: { current: number; max: number };
    approval: number;
    romance: RomanceStatus;
  }[];
  quests: {
    active: { id: string; stage: number; description: string }[];
    completed: string[];
    failed: string[];
  };
  combat: null | {
    active: boolean;
    round: number;
    turn: string;
    enemies: { name: string; hp: { current: number; max: number }; type: string }[];
  };
  dialog: null | {
    active: boolean;
    speaker: string;
    optionsCount: number;
    hasApprovalStakes: boolean;
  };
}
