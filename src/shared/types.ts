// Shared TypeScript types for Echoes of Aeria
// Following Spec Librarian standards for type definitions

export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameState = 'playing' | 'paused' | 'dialogue' | 'inventory' | 'menu';
export type Realm = 'dayrealm' | 'eclipse';

// Vector and Math Types
export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ECS Types
export interface Component {
  readonly type: string;
  entityId: string;
}

export interface Entity {
  readonly id: string;
  components: Map<string, Component>;
}

// Game Entity Components
export interface TransformComponent extends Component {
  type: 'transform';
  position: Vector2;
  rotation: number;
  scale: Vector2;
}

export interface SpriteComponent extends Component {
  type: 'sprite';
  texture: string;
  frame?: string | number;
  tint?: number;
  alpha?: number;
}

export interface MovementComponent extends Component {
  type: 'movement';
  velocity: Vector2;
  speed: number;
  direction: Direction;
}

export interface ColliderComponent extends Component {
  type: 'collider';
  bounds: Rectangle;
  solid: boolean;
  trigger: boolean;
}

export interface HealthComponent extends Component {
  type: 'health';
  current: number;
  maximum: number;
  invulnerable: boolean;
  invulnerabilityTimer: number;
}

export interface PlayerComponent extends Component {
  type: 'player';
  stamina: number;
  maxStamina: number;
  gleam: number;
  hearts: number;
  inventory: PlayerInventory;
}

export interface NPCComponent extends Component {
  type: 'npc';
  name: string;
  dialogue: string[];
  currentDialogue: number;
  questGiver: boolean;
  shopkeeper: boolean;
  interactable: boolean;
}

// Player Inventory following Game Design Document
export interface PlayerInventory {
  // Core progression items
  sunflame_lantern: boolean;
  gale_boots: boolean;
  riverfin_vest: boolean;
  aether_mirror: boolean;
  storm_disk: boolean;
  quake_maul: boolean;
  tide_hook: boolean;
  sunflame_prism: boolean;
  kingsbane_sigil: boolean;
  
  // Collectibles
  aether_shards: number;
  keys: Record<string, number>;
  heart_pieces: number;
  rumor_cards: number;
}

// Tile and World Types - Enhanced for 16-bit visual fidelity
export const TileType = {
  // Base terrain
  GRASS: 0,
  WATER: 1,
  FOREST: 2,
  MOUNTAIN: 3,
  DESERT: 4,
  SNOW: 5,
  MARSH: 6,
  VOLCANIC: 7,
  
  // Structures
  WALL: 8,
  DOOR: 9,
  BRIDGE: 10,
  PATH: 11,
  HOUSE: 12,
  SHRINE: 13,
  
  // Interactive objects
  CHEST: 14,
  FLOWER: 15,
  
  // Enhanced environmental details
  BUSH: 16,
  ROCK: 17,
  TREE: 18,
  TALL_GRASS: 19,
  MUSHROOM: 20,
  POND: 21,
  STONE_WALL: 22,
  WOODEN_FENCE: 23,
  DIRT_PATH: 24,
  COBBLESTONE: 25,
  
  // Decorative elements
  STATUE: 26,
  FOUNTAIN: 27,
  WELL: 28,
  SIGN: 29,
  TORCH: 30,
  LANTERN: 31,
  
  // Ground variations
  GRASS_DARK: 32,
  GRASS_LIGHT: 33,
  DIRT: 34,
  SAND: 35,
  STONE: 36,
  
  // Water variations
  WATER_DEEP: 37,
  WATER_SHALLOW: 38,
  WATERFALL: 39
} as const;

export type TileType = typeof TileType[keyof typeof TileType];

export interface Region {
  name: string;
  bounds: Rectangle;
  primaryTile: TileType;
  enemies: string[];
  music?: string;
  eclipseTransform?: Partial<Record<TileType, TileType>>;
}

export interface WorldState {
  currentRealm: Realm;
  aetherMirrorUnlocked: boolean;
  realmTransitions: Record<string, {
    dayrealmTile: TileType;
    eclipseTile: TileType;
    accessRequirement?: string;
  }>;
}

// Audio Types
export interface AudioConfig {
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export interface MusicTrack {
  id: string;
  src: string;
  intro?: string;
  loop: string;
  config: AudioConfig;
}

export interface SoundEffect {
  id: string;
  src: string;
  config: AudioConfig;
  variations?: string[];
}

// Save Data Structure
export interface SaveData {
  version: string;
  timestamp: number;
  player: {
    position: Vector2;
    realm: Realm;
    health: number;
    inventory: PlayerInventory;
  };
  world: {
    currentMap: string;
    flags: Record<string, boolean>;
    discoveredAreas: string[];
  };
  progress: {
    aetherShards: number;
    completedQuests: string[];
    unlockedAreas: string[];
  };
}

// Input Types
export interface InputState {
  movement: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  actions: {
    attack: boolean;
    interact: boolean;
    inventory: boolean;
    pause: boolean;
  };
}

// Performance Metrics
export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
}