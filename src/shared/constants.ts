// Game-wide constants following agent specifications

// === DISPLAY CONSTANTS ===
export const TILE_SIZE = 16; // 16x16 tiles as specified in GDD
export const VIEWPORT_WIDTH = 50;  // tiles visible horizontally
export const VIEWPORT_HEIGHT = 37; // tiles visible vertically
export const WORLD_WIDTH = 256;    // total world width in tiles
export const WORLD_HEIGHT = 192;   // total world height in tiles

export const CANVAS_WIDTH = VIEWPORT_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = VIEWPORT_HEIGHT * TILE_SIZE;

// === GAME MECHANICS ===
export const PLAYER_SPEED = 80; // pixels per second
export const ATTACK_DURATION = 300; // milliseconds (300-350ms per Combat Engineer spec)
export const ROLL_DURATION = 450; // milliseconds
export const INVULNERABILITY_DURATION = 1000; // 1 second i-frames
export const INTERACTION_DISTANCE = 24; // pixels

// === PERFORMANCE TARGETS ===
export const TARGET_FPS = 60;
export const MAX_MEMORY_MB = 512;
export const MAX_INPUT_LATENCY_MS = 50;

// === AUDIO SETTINGS ===
export const AUDIO_FADE_DURATION = 1000; // milliseconds
export const MAX_CONCURRENT_SOUNDS = 8; // prevent audio chaos
export const PITCH_VARIATION_CENTS = 30; // ±30 cents for organic feel

// === WORLD REGIONS (from Game Design Document) ===
import type { Region } from './types.js';
import { TileType } from './types.js';

export const REGIONS: Region[] = [
  {
    name: "Verdant Lowlands",
    bounds: { x: 60, y: 90, width: 60, height: 50 },
    primaryTile: TileType.GRASS,
    enemies: ['sprig_stalker'],
    music: 'verdant_lowlands'
  },
  {
    name: "Riverlands & Waterworks", 
    bounds: { x: 120, y: 80, width: 80, height: 50 },
    primaryTile: TileType.WATER,
    enemies: ['mud_whelp', 'bog_serpent'],
    music: 'riverlands'
  },
  {
    name: "Moonwell Marsh",
    bounds: { x: 100, y: 130, width: 60, height: 50 },
    primaryTile: TileType.MARSH,
    enemies: ['bog_serpent', 'wisp_cluster'],
    music: 'moonwell_marsh'
  },
  {
    name: "Amber Dunes & Canyon",
    bounds: { x: 30, y: 140, width: 70, height: 52 },
    primaryTile: TileType.DESERT,
    enemies: ['sand_wraith', 'bandit_scrapper'],
    music: 'amber_dunes'
  },
  {
    name: "Whisperwood",
    bounds: { x: 20, y: 40, width: 60, height: 60 },
    primaryTile: TileType.FOREST,
    enemies: ['thorn_wolf', 'sprig_stalker'],
    music: 'whisperwood'
  },
  {
    name: "Frostpeak Tundra",
    bounds: { x: 140, y: 20, width: 80, height: 60 },
    primaryTile: TileType.SNOW,
    enemies: ['wisp_cluster', 'stone_sentinel'],
    music: 'frostpeak_tundra'
  },
  {
    name: "Obsidian Crater",
    bounds: { x: 200, y: 120, width: 56, height: 60 },
    primaryTile: TileType.VOLCANIC,
    enemies: ['rift_mote', 'stone_sentinel'],
    music: 'obsidian_crater'
  },
  {
    name: "Eldercrown Keep",
    bounds: { x: 110, y: 30, width: 40, height: 40 },
    primaryTile: TileType.WALL,
    enemies: ['stone_sentinel'],
    music: 'eldercrown_keep'
  }
];

// === TOWNS ===
export const TOWNS = {
  HEARTHMERE: { x: 80, y: 110, name: "Hearthmere" },
  RIVERGATE: { x: 140, y: 100, name: "Rivergate" },
  DUSTFALL_OUTPOST: { x: 60, y: 160, name: "Dustfall Outpost" },
  STARFALL_MONASTERY: { x: 50, y: 70, name: "Starfall Monastery" }
} as const;

// === TUTORIAL SETTINGS ===
export const TUTORIAL = {
  WELCOME_MESSAGE_DELAY: 2000, // Show welcome message after 2 seconds
  CONTROL_HINT_DELAY: 5000,    // Show control hints after 5 seconds
  NPC_HINT_DELAY: 8000,        // Show NPC interaction hint after 8 seconds
  REALM_SWITCH_HINT_DELAY: 12000 // Show realm switching hint after 12 seconds
} as const;

// === ECLIPSE/DAYREALM TRANSFORMATIONS ===
export const REALM_TRANSFORMATIONS: Record<TileType, TileType> = {
  [TileType.GRASS]: TileType.MARSH,     // Grass → Marsh areas
  [TileType.WATER]: TileType.BRIDGE,    // Water → Mystical bridges  
  [TileType.MOUNTAIN]: TileType.WALL,   // Mountains → Ancient walls
  [TileType.FOREST]: TileType.PATH,     // Trees → Secret paths
  [TileType.HOUSE]: TileType.SHRINE,    // Buildings → Ancient ruins
  [TileType.DESERT]: TileType.VOLCANIC, // Desert → Volcanic ash
  [TileType.SNOW]: TileType.MARSH,      // Snow → Mystical marsh
  [TileType.MARSH]: TileType.GRASS,     // Marsh → Verdant growth
  [TileType.VOLCANIC]: TileType.DESERT, // Volcanic → Cooled desert
  [TileType.WALL]: TileType.MOUNTAIN,   // Walls → Natural mountains
  [TileType.BRIDGE]: TileType.WATER,    // Bridges → Deep water
  [TileType.PATH]: TileType.FOREST,     // Paths → Overgrown forest
  [TileType.SHRINE]: TileType.HOUSE,    // Shrines → Normal buildings
  [TileType.DOOR]: TileType.DOOR,       // Doors remain doors
  [TileType.CHEST]: TileType.CHEST,     // Chests remain chests
  [TileType.FLOWER]: TileType.FLOWER    // Flowers remain flowers
};

// === INPUT MAPPINGS ===
export const INPUT_KEYS = {
  MOVEMENT: {
    UP: ['ArrowUp', 'KeyW'] as const,
    DOWN: ['ArrowDown', 'KeyS'] as const,
    LEFT: ['ArrowLeft', 'KeyA'] as const,
    RIGHT: ['ArrowRight', 'KeyD'] as const
  },
  ACTIONS: {
    ATTACK: ['Space', 'Enter'] as const,
    INTERACT: ['Space', 'Enter'] as const,
    INVENTORY: ['KeyI'] as const,
    PAUSE: ['Escape'] as const,
    DEBUG: ['F12'] as const
  }
} as const;

// === ALTTP AUTHENTIC COLOR PALETTE ===
// Colors extracted from authentic A Link to the Past sprite data
export const ALTTP_PALETTE = {
  // Link's authentic ALTTP colors (from original SNES palette)
  LINK_TUNIC_GREEN: '#00B800',      // Link's tunic green (#24 in ALTTP palette)
  LINK_TUNIC_DARK: '#006000',       // Tunic shadows (#20 in ALTTP palette)
  LINK_TUNIC_LIGHT: '#60E060',      // Tunic highlights (#28 in ALTTP palette)
  LINK_SKIN_TONE: '#F8C898',        // Skin tone (#E4 in ALTTP palette)
  LINK_SKIN_SHADOW: '#D09060',      // Skin shadows (#E0 in ALTTP palette)
  LINK_HAIR_BROWN: '#B06020',       // Hair brown (#D4 in ALTTP palette)
  LINK_CAP_GREEN: '#00A000',        // Cap green (#23 in ALTTP palette)
  LINK_BOOTS_BROWN: '#905030',      // Boots brown (#D2 in ALTTP palette)
  
  // Core system colors
  BLACK: '#000000',                 // True black (#00)
  WHITE: '#FFFFFF',                 // True white (#FF)
  TRANSPARENT: 'rgba(0,0,0,0)',     // Alpha transparency
  
  // NPC authentic colors
  ROBE_PURPLE: '#8040C0',           // Purple robe (#9A in ALTTP palette)
  ROBE_BLUE: '#2060E0',            // Blue robe (#66 in ALTTP palette)
  ROBE_RED: '#C02020',             // Red robe (#A2 in ALTTP palette)
  ROBE_GREEN: '#40A040',           // Green robe (#45 in ALTTP palette)
  ROBE_YELLOW: '#E0C040',          // Yellow robe (#CC in ALTTP palette)
  
  // Enemy authentic colors
  GOBLIN_GREEN: '#406040',         // Goblin base green (#44 in ALTTP palette)
  GOBLIN_DARK: '#204020',          // Goblin shadow green (#40 in ALTTP palette)
  GOBLIN_LIGHT: '#80A080',         // Goblin highlight green (#48 in ALTTP palette)
  ENEMY_RED_EYES: '#E00000',       // Bright red enemy eyes (#A0 in ALTTP palette)
  
  // Environment authentic colors (ALTTP overworld palette)
  GRASS_BASE: '#40A040',           // Rich ALTTP grass (#45)
  GRASS_DARK: '#206020',           // Dark grass shadows (#41)
  GRASS_LIGHT: '#80C080',          // Light grass highlights (#49)
  
  WATER_BLUE: '#0080E0',           // Deep ALTTP water blue (#65)
  WATER_LIGHT: '#40A0F0',          // Light water highlights (#69)
  WATER_DARK: '#004080',           // Dark water depths (#61)
  
  DIRT_BROWN: '#A06040',           // Dirt path brown (#D5)
  DIRT_DARK: '#604020',            // Dirt shadow brown (#D1)
  DIRT_LIGHT: '#C08060',           // Dirt highlight brown (#D9)
  
  STONE_GRAY: '#808080',           // Stone wall gray (#8F)
  STONE_DARK: '#404040',           // Stone shadow gray (#8B)
  STONE_LIGHT: '#C0C0C0',          // Stone highlight gray (#93)
  
  WOOD_BROWN: '#906040',           // Wooden structure brown (#D3)
  WOOD_DARK: '#603020',            // Wood shadow brown (#CF)
  WOOD_LIGHT: '#B08060',           // Wood highlight brown (#D7)
  
  // UI Panel colors (ALTTP interface authentic)
  UI_PANEL_BASE: '#606060',        // Base UI panel color (#8D)
  UI_PANEL_DARK: '#303030',        // UI panel shadows (#89)
  UI_PANEL_LIGHT: '#909090',       // UI panel highlights (#91)
  UI_PANEL_HIGHLIGHT: '#B0B0B0',   // UI bright highlights (#92)
  
  // Border colors (ALTTP UI borders)
  BORDER_DARK: '#202020',          // Dark border (#88)
  BORDER_MEDIUM: '#505050',        // Medium border (#8C)
  BORDER_LIGHT: '#A0A0A0',         // Light border (#90)
  
  // Background colors
  BG_DARK: '#101820',              // Dark background
  BG_MEDIUM: '#283040',            // Medium background  
  BG_LIGHT: '#404860',             // Light background
  
  // Text colors (ALTTP authentic)
  TEXT_WHITE: '#F8F8F8',           // White text (#FE)
  TEXT_YELLOW: '#F8F800',          // Yellow text (items/currency) (#FC)
  TEXT_BLUE: '#4080F8',            // Blue text (items/magic) (#6B)
  TEXT_RED: '#F84040',             // Red text (danger/health) (#A4)
  TEXT_GREEN: '#40F840',           // Green text (success) (#4C)
  TEXT_SHADOW: '#000000',          // Text shadow/outline
  
  // Health/Magic colors (ALTTP HUD authentic)
  HEART_FULL: '#F83800',           // Full heart red (#A3)
  HEART_HALF: '#F85800',           // Half heart orange (#A5)
  HEART_EMPTY: '#381800',          // Empty heart dark (#A7)
  HEART_OUTLINE: '#080808',        // Heart outline black
  
  MAGIC_FULL: '#00F800',           // Full magic green (#4F)
  MAGIC_HALF: '#80F800',           // Half magic yellow-green (#5F)
  MAGIC_EMPTY: '#003800',          // Empty magic dark (#43)
  
  // Rupee colors (ALTTP authentic gem colors)
  RUPEE_GREEN: '#00D800',          // Green rupee (1) (#4D)
  RUPEE_BLUE: '#0080F8',           // Blue rupee (5) (#67)
  RUPEE_RED: '#F80000',            // Red rupee (20) (#A1)
  RUPEE_YELLOW: '#F8D800',         // Yellow rupee (50) (#CB)
  RUPEE_SILVER: '#C0C0C0',         // Silver rupee (100) (#93)
  RUPEE_GOLD: '#F8C040',           // Gold rupee (300) (#C7)
  
  // Special effect colors
  AETHER_BLUE: '#40C0F8',          // Aether shard blue (#6F)
  MAGIC_PURPLE: '#C040F8',         // Magic purple (#BB)
  WARP_PINK: '#F840C0',            // Warp/teleport pink (#B7)
  POISON_GREEN: '#80F840',         // Poison/acid green (#5B)
  
  // Realm transformation colors
  ECLIPSE_PURPLE: '#6020A0',       // Eclipse realm purple (#97)
  ECLIPSE_DARK: '#301050',         // Eclipse shadows (#95)
  ECLIPSE_LIGHT: '#A060E0',        // Eclipse highlights (#9B)
  
  DAYREALM_GOLD: '#F8C040',        // Dayrealm gold light (#C7)
  DAYREALM_YELLOW: '#F8F840',      // Dayrealm yellow (#CD)
  DAYREALM_WHITE: '#F8F8F8'        // Dayrealm pure light (#FE)
} as const;

// === TILE COLORS (16-bit Zelda-inspired palette) ===
export const TILE_COLORS: Record<TileType, string> = {
  // Base terrain - rich, vibrant colors
  [TileType.GRASS]: '#4A8B3B',          // Rich green like Zelda overworld
  [TileType.WATER]: '#1E5BB8',          // Deep blue water
  [TileType.FOREST]: '#2D5B2D',         // Dark forest green
  [TileType.MOUNTAIN]: '#6B5B73',       // Purple-grey mountains
  [TileType.DESERT]: '#E6C679',         // Sandy yellow
  [TileType.SNOW]: '#E8F4F8',           // Clean white-blue
  [TileType.MARSH]: '#5A7C47',          // Muddy green
  [TileType.VOLCANIC]: '#8B2635',       // Dark red volcanic
  
  // Structures - earth tones
  [TileType.WALL]: '#4A4A52',           // Stone grey
  [TileType.DOOR]: '#8B5A2B',           // Brown wood
  [TileType.BRIDGE]: '#A67C52',         // Light brown planks
  [TileType.PATH]: '#B8A082',           // Dirt path tan
  [TileType.HOUSE]: '#7C5A3A',          // House brown
  [TileType.SHRINE]: '#6B4A8B',         // Mystical purple
  
  // Interactive objects
  [TileType.CHEST]: '#D49C3D',          // Golden chest
  [TileType.FLOWER]: '#E84A5F',         // Pink flowers
  
  // Enhanced environmental details
  [TileType.BUSH]: '#3A6B2D',           // Dark bush green
  [TileType.ROCK]: '#7A7A82',           // Grey rock
  [TileType.TREE]: '#2D3D2D',           // Very dark tree
  [TileType.TALL_GRASS]: '#5BA052',     // Light grass
  [TileType.MUSHROOM]: '#B85A3A',       // Mushroom brown/red
  [TileType.POND]: '#4A8BCA',           // Pond blue
  [TileType.STONE_WALL]: '#5A5A63',     // Stone wall grey
  [TileType.WOODEN_FENCE]: '#9C6B39',   // Fence brown
  [TileType.DIRT_PATH]: '#A68B6B',      // Dirt brown
  [TileType.COBBLESTONE]: '#6B6B73',    // Cobble grey
  
  // Decorative elements
  [TileType.STATUE]: '#7A7A8B',         // Stone statue
  [TileType.FOUNTAIN]: '#5A8BCA',       // Water feature blue
  [TileType.WELL]: '#5A5A63',           // Stone well
  [TileType.SIGN]: '#8B6B3A',           // Wooden sign
  [TileType.TORCH]: '#D49C3D',          // Golden torch
  [TileType.LANTERN]: '#E6B55C',        // Lantern yellow
  
  // Ground variations
  [TileType.GRASS_DARK]: '#3A6B2D',     // Darker grass
  [TileType.GRASS_LIGHT]: '#6BAD5A',    // Lighter grass  
  [TileType.DIRT]: '#8B6B4A',           // Brown dirt
  [TileType.SAND]: '#E6C679',           // Sandy ground
  [TileType.STONE]: '#6B6B73',          // Stone ground
  
  // Water variations
  [TileType.WATER_DEEP]: '#1A4A9C',     // Deep water
  [TileType.WATER_SHALLOW]: '#4A7BCA',  // Shallow water
  [TileType.WATERFALL]: '#7ABFFF'       // Waterfall white-blue
};

// === SAVE DATA VERSION ===
export const SAVE_VERSION = '1.0.0';

// === TILE WALKABILITY DEFINITIONS ===
export const WALKABLE_TILES = new Set([
  // Base walkable terrain
  TileType.GRASS,
  TileType.PATH,
  TileType.BRIDGE,
  TileType.FLOWER,
  TileType.DOOR,
  
  // Ground variations
  TileType.GRASS_DARK,
  TileType.GRASS_LIGHT,
  TileType.DIRT,
  TileType.SAND,
  TileType.DIRT_PATH,
  TileType.COBBLESTONE,
  
  // Shallow water areas
  TileType.WATER_SHALLOW,
  
  // Walkable decorative elements
  TileType.TALL_GRASS,
  TileType.MUSHROOM
]);

export const NON_WALKABLE_TILES = new Set([
  // Terrain obstacles
  TileType.WATER,
  TileType.WATER_DEEP,
  TileType.MOUNTAIN,
  TileType.WALL,
  TileType.STONE_WALL,
  TileType.HOUSE,
  TileType.SHRINE,
  TileType.VOLCANIC,
  TileType.WATERFALL,
  
  // Environmental obstacles
  TileType.BUSH,
  TileType.ROCK,
  TileType.TREE,
  TileType.POND,
  TileType.WOODEN_FENCE,
  TileType.STATUE,
  TileType.FOUNTAIN,
  TileType.WELL,
  
  // Fixed decorations
  TileType.SIGN,
  TileType.TORCH,
  TileType.LANTERN
]);

// Interactive tiles - walkable but may trigger events
export const INTERACTIVE_TILES = new Set([
  TileType.CHEST,
  TileType.DOOR,
  TileType.SHRINE,
  TileType.WELL,
  TileType.SIGN
]);

// === DEBUG FLAGS ===
export const DEBUG = {
  SHOW_COLLISION_BOXES: false,
  SHOW_TILE_GRID: false,
  SHOW_FPS: false,
  GOD_MODE: false,
  UNLOCK_ALL_ITEMS: false,
  SKIP_INTRO: false,
  SHOW_TILE_COLLISION: false  // Show collision debug info
} as const;