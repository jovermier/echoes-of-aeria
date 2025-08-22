/**
 * Typed event system for cross-system communication
 * Central registry for all game events with type safety
 */

// Game Event Constants - Used across systems
export const GAME_EVENTS = {
  // Player Events
  PLAYER_MOVED: 'player/moved',
  PLAYER_ATTACK_START: 'player/attackStart',
  PLAYER_ATTACK_HIT: 'player/attackHit',
  PLAYER_DAMAGED: 'player/damaged',
  PLAYER_DIED: 'player/died',
  PLAYER_RESPAWNED: 'player/respawned',
  PLAYER_STATE_CHANGED: 'player/stateChanged',

  // Combat Events
  COMBAT_HIT_DETECTED: 'combat/hitDetected',
  COMBAT_DAMAGE_DEALT: 'combat/damageDealt',
  COMBAT_KNOCKBACK_APPLIED: 'combat/knockbackApplied',
  COMBAT_INVINCIBILITY_START: 'combat/invincibilityStart',
  COMBAT_INVINCIBILITY_END: 'combat/invincibilityEnd',

  // Enemy Events
  ENEMY_SPAWNED: 'enemy/spawned',
  ENEMY_DAMAGED: 'enemy/damaged',
  ENEMY_DIED: 'enemy/died',
  ENEMY_STATE_CHANGED: 'enemy/stateChanged',
  ENEMY_AGGRO_START: 'enemy/aggroStart',
  ENEMY_AGGRO_END: 'enemy/aggroEnd',

  // World Events
  MAP_LOAD_START: 'world/mapLoadStart',
  MAP_LOADED: 'world/mapLoaded',
  MAP_UNLOADED: 'world/mapUnloaded',
  PORTAL_TRIGGERED: 'world/portalTriggered',
  REALM_SWITCH_START: 'world/realmSwitchStart',
  REALM_SWITCHED: 'world/realmSwitched',

  // Item & Collection Events
  ITEM_COLLECTED: 'item/collected',
  ITEM_DROPPED: 'item/dropped',
  INVENTORY_UPDATED: 'inventory/updated',
  EQUIPMENT_CHANGED: 'equipment/changed',

  // Interaction Events
  INTERACTABLE_HIGHLIGHTED: 'interaction/highlighted',
  INTERACTION_START: 'interaction/start',
  INTERACTION_END: 'interaction/end',

  // Audio Events
  AUDIO_CONTEXT_CHANGED: 'audio/contextChanged',
  MUSIC_TRACK_CHANGED: 'audio/musicTrackChanged',
  SFX_TRIGGERED: 'audio/sfxTriggered',

  // UI Events
  MENU_OPENED: 'ui/menuOpened',
  MENU_CLOSED: 'ui/menuClosed',
  MENU_NAVIGATE: 'ui/menuNavigate',
  INVENTORY_OPENED: 'ui/inventoryOpened',
  INVENTORY_CLOSED: 'ui/inventoryClosed',
  DIALOGUE_START: 'ui/dialogueStart',
  DIALOGUE_END: 'ui/dialogueEnd',
  DIALOGUE_CHOICE: 'ui/dialogueChoice',

  // System Events
  SAVE_GAME_START: 'system/saveStart',
  SAVE_GAME_COMPLETE: 'system/saveComplete',
  LOAD_GAME_START: 'system/loadStart',
  LOAD_GAME_COMPLETE: 'system/loadComplete',
  PERFORMANCE_WARNING: 'system/performanceWarning',
} as const;

// Event type derivation
export type GameEventType = (typeof GAME_EVENTS)[keyof typeof GAME_EVENTS];

// Base event interface
export interface BaseGameEvent {
  type: GameEventType;
  timestamp: number;
  source?: string;
}

// Specific event payload interfaces
export interface PlayerMovedEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.PLAYER_MOVED;
  position: Vector2;
  velocity: Vector2;
  direction: Direction8;
}

export interface PlayerAttackStartEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.PLAYER_ATTACK_START;
  position: Vector2;
  direction: Direction8;
  attackType: 'sword' | 'bow' | 'magic';
}

export interface CombatHitDetectedEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.COMBAT_HIT_DETECTED;
  attacker: EntityId;
  target: EntityId;
  position: Vector2;
  damage: number;
  knockback?: Vector2 | undefined;
  attackType: string;
}

export interface MapLoadedEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.MAP_LOADED;
  mapId: string;
  mapFile: string;
  realm: 'day' | 'eclipse';
  bounds: Rectangle;
}

export interface PortalTriggeredEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.PORTAL_TRIGGERED;
  portalId: string;
  sourceMap: string;
  targetMap: string;
  targetSpawn: string;
  transition: 'fade' | 'slide' | 'instant' | 'realm_switch';
}

export interface ItemCollectedEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.ITEM_COLLECTED;
  itemId: string;
  itemType: string;
  position: Vector2;
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AudioContextChangedEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.AUDIO_CONTEXT_CHANGED;
  previousContext: AudioContextType;
  newContext: AudioContextType;
  transitionTime: number;
}

export interface MenuOpenedEvent extends BaseGameEvent {
  type: typeof GAME_EVENTS.MENU_OPENED;
  menuType: 'main' | 'pause' | 'inventory' | 'settings' | 'dialogue';
  source: 'keyboard' | 'gamepad' | 'mouse' | 'touch';
}

// Union type of all possible events
export type GameEvent =
  | PlayerMovedEvent
  | PlayerAttackStartEvent
  | CombatHitDetectedEvent
  | MapLoadedEvent
  | PortalTriggeredEvent
  | ItemCollectedEvent
  | AudioContextChangedEvent
  | MenuOpenedEvent
  | BaseGameEvent; // Fallback for events without specific payload

// Event handler function type
export type EventHandler<T extends BaseGameEvent = GameEvent> = (event: T) => void;

// Event bus interface for dependency injection
export interface EventBus {
  emit<T extends BaseGameEvent>(event: T): void;
  on<T extends BaseGameEvent>(eventType: T['type'], handler: EventHandler<T>): () => void; // Returns unsubscribe function
  off<T extends BaseGameEvent>(eventType: T['type'], handler: EventHandler<T>): void;
  once<T extends BaseGameEvent>(eventType: T['type'], handler: EventHandler<T>): void;
}

// Supporting types
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

export type Direction8 =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';

export type EntityId = string;

export type AudioContextType = 'exploration' | 'combat' | 'dialogue' | 'menu';

// Event priority for processing order
export const EventPriority = {
  IMMEDIATE: 0, // Process this frame (input, critical systems)
  HIGH: 1, // Process next frame (combat, movement)
  NORMAL: 2, // Process within a few frames (UI, audio)
  LOW: 3, // Process when convenient (analytics, logging)
} as const;

export type EventPriority = typeof EventPriority[keyof typeof EventPriority];

// Event with priority metadata
export interface PriorityEvent extends BaseGameEvent {
  priority: EventPriority;
}

// Helper functions for creating typed events
export const createEvent = {
  playerMoved: (position: Vector2, velocity: Vector2, direction: Direction8): PlayerMovedEvent => ({
    type: GAME_EVENTS.PLAYER_MOVED,
    timestamp: performance.now(),
    position,
    velocity,
    direction,
  }),

  combatHit: (
    attacker: EntityId,
    target: EntityId,
    position: Vector2,
    damage: number,
    attackType: string,
    knockback?: Vector2,
  ): CombatHitDetectedEvent => {
    const event: CombatHitDetectedEvent = {
      type: GAME_EVENTS.COMBAT_HIT_DETECTED,
      timestamp: performance.now(),
      attacker,
      target,
      position,
      damage,
      attackType,
    };
    if (knockback !== undefined) {
      event.knockback = knockback;
    }
    return event;
  },

  mapLoaded: (
    mapId: string,
    mapFile: string,
    realm: 'day' | 'eclipse',
    bounds: Rectangle,
  ): MapLoadedEvent => ({
    type: GAME_EVENTS.MAP_LOADED,
    timestamp: performance.now(),
    mapId,
    mapFile,
    realm,
    bounds,
  }),

  itemCollected: (
    itemId: string,
    itemType: string,
    position: Vector2,
    quantity: number = 1,
    rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common',
  ): ItemCollectedEvent => ({
    type: GAME_EVENTS.ITEM_COLLECTED,
    timestamp: performance.now(),
    itemId,
    itemType,
    position,
    quantity,
    rarity,
  }),
};

// Event validation helpers
export const validateEvent = (event: any): event is GameEvent => {
  return (
    typeof event === 'object' &&
    event !== null &&
    typeof event.type === 'string' &&
    typeof event.timestamp === 'number' &&
    Object.values(GAME_EVENTS).includes(event.type)
  );
};

// Event debugging utilities
export const EventDebug = {
  logEvent: (event: GameEvent, context?: string): void => {
    if (process.env.NODE_ENV === 'development') {
      const prefix = context ? `[${context}]` : '[EVENT]';
      console.log(`${prefix} ${event.type}`, event);
    }
  },

  logEventCounts: (events: GameEvent[]): void => {
    if (process.env.NODE_ENV === 'development') {
      const counts = events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.table(counts);
    }
  },
};
