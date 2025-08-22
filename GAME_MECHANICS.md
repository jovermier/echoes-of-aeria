# Echoes of Aeria - Game Mechanics Documentation

## Table of Contents
1. [Core Game Systems](#core-game-systems)
2. [Player Mechanics](#player-mechanics)
3. [Combat System](#combat-system)
4. [World & Exploration](#world--exploration)
5. [Enemy AI & Behavior](#enemy-ai--behavior)
6. [Audio System](#audio-system)
7. [Progression Systems](#progression-systems)
8. [Technical Specifications](#technical-specifications)

---

## Core Game Systems

### Game States
- **PLAYING**: Main gameplay state
- **PAUSED**: Game is paused
- **INVENTORY**: Inventory screen (planned feature)

### Canvas & Rendering
- **Canvas Size**: 800x600 pixels
- **Rendering**: HTML5 Canvas 2D with tile-based graphics
- **Camera System**: Smooth following camera with lerp interpolation
- **Coordinate System**: World coordinates with camera offset translation

---

## Player Mechanics

### Basic Stats
- **Health**: 3 hearts (visual display as hearts in UI)
- **Currency**: Rupees (collected from defeated enemies and items)
- **Starting Position**: Hearthmere region (29, 37 in tile coordinates)

### Movement
- **Speed**: 150 pixels per second
- **Animation**: 4-frame walking cycle (0.15s per frame)
- **Controls**: Arrow keys or WASD for movement
- **Collision**: Rectangle-based collision with world tiles and entities

### Inventory System
- **Starting Equipment**: Sword (always equipped)
- **Inventory Array**: Expandable string array for item storage
- **Planned Items**: Keys, potions, artifacts, tools

### Player Entity Structure
```typescript
interface Player extends Entity {
  attacking: boolean;           // Current attack state
  attackTimer: number;          // Attack animation timer
  attackCooldown: number;       // Time between attacks (0.5s)
  lastAttackTime: number;       // Timestamp of last attack
  hearts: number;               // Health points (3 max)
  rupees: number;               // Currency amount
  hasSword: boolean;            // Weapon availability
  inventory: string[];          // Item collection
  animationFrame: number;       // Current sprite frame
  animationTimer: number;       // Animation timing
  hitEnemies: Set<Enemy>;       // Prevents multi-hit per swing
}
```

---

## Combat System

### Player Combat
- **Attack Input**: Spacebar
- **Attack Cooldown**: 0.5 seconds between swings
- **Attack Duration**: 0.3 seconds animation
- **Damage Output**: 1 hit point per swing
- **Range**: Melee contact-based
- **Hit Prevention**: Each swing can only damage each enemy once

### Combat Mechanics
- **Knockback**: Enemies receive pushback when hit
- **Invincibility Frames**: No i-frames for player (immediate damage)
- **Multi-hit Prevention**: Set-based tracking prevents multiple hits per swing
- **Death System**: Enemies die after 2 hits, player death resets position

### Attack Timing
```typescript
// Player attack window
if (spacebar && hasSword && !attacking && 
    currentTime - lastAttackTime >= attackCooldown) {
  attacking = true;
  attackTimer = 0.3;
}
```

---

## World & Exploration

### World Structure
- **Tile Size**: 32x32 pixels
- **World Dimensions**: 80x60 tiles (2560x1920 pixels)
- **Tile Types**: 12 different terrain types (grass, stone, water, etc.)

### Fog of War System
- **Visibility Radius**: 5 tiles (160 pixels)
- **Revelation**: Circular area around player
- **Persistence**: Explored areas remain visible
- **Implementation**: 2D boolean array tracking revealed tiles

### Regions (Based on Echoes of Aeria)
1. **Hearthmere** (29, 37) - Starting village
2. **Whispering Woods** - Dense forest with secrets
3. **Crystal Caverns** - Underground crystal formations
4. **Sunken Ruins** - Flooded ancient structures
5. **Skyward Peaks** - Mountain regions
6. **Ember Wastes** - Desert/volcanic areas
7. **Frostfall Expanse** - Frozen northern territories
8. **The Nexus** - Central mystical area

### Terrain Rendering
- **High-Fidelity Graphics**: Detailed tile drawing functions
- **Multi-layer Rendering**: Base terrain + decorative elements
- **Animated Potential**: Framework for future animated tiles

---

## Enemy AI & Behavior

### Enemy Properties
```typescript
interface Enemy extends Entity {
  attackDamage: number;         // Damage dealt (1 point)
  moveTimer: number;            // Movement update frequency
  target: Vector2 | null;       // Player tracking
  animationFrame: number;       // Sprite animation
  animationTimer: number;       // Animation timing
  attackCooldown: number;       // Time between attacks (1.0s)
  lastAttackTime: number;       // Attack timing tracking
  attacking: boolean;           // Current attack state
  attackTimer: number;          // Attack animation (0.4s)
  hasHitPlayer: boolean;        // Prevents multi-hit per attack
}
```

### AI Behavior Patterns
- **Detection Range**: 120 pixels from player
- **Chase Speed**: Base speed + 20% when pursuing
- **Attack Range**: 50 pixels for immediate attack initiation
- **Pathfinding**: Direct line movement toward player
- **Attack Pattern**: Immediate attack when in range

### Combat AI
- **Attack Timing**: 0.15-0.35 second damage window
- **Cooldown**: 1.0 second between attacks
- **Movement Pause**: Stop within 45 pixels to focus on attacking
- **Visibility Requirement**: Only attack if in revealed areas

### Spawn System
- **Fixed Positions**: Predefined enemy locations per region
- **Respawn**: Enemies respawn on area revisit
- **Health**: 2 hit points per enemy
- **Rewards**: 5 rupees per defeated enemy

---

## Audio System

### 8-bit Chiptune Music
- **Technology**: Web Audio API with square wave synthesis
- **Master Volume**: 30% of system volume
- **Background Music**: Looping melodic sequences
- **Sound Effects**: Attack sounds, damage sounds, item collection

### Audio Implementation
- **Oscillator Type**: Square wave for authentic 8-bit sound
- **Frequency Range**: Multiple octaves for melody variation
- **Envelope**: Attack/decay shaping for note clarity
- **Browser Compatibility**: Graceful fallback if Web Audio unavailable

---

## Progression Systems

### Currency System
- **Rupees**: Primary currency from enemy defeats and item collection
- **Earning Rate**: 5 rupees per enemy defeated
- **Display**: Real-time UI counter
- **Future Use**: Shop purchases, upgrades, unlock requirements

### Item Collection
- **Heart Items**: Health restoration (planned)
- **Key Items**: Door/chest unlocking (planned)
- **Treasure Items**: Special artifacts and tools (planned)
- **Collection Feedback**: Visual/audio confirmation

### Future Progression
- **Experience Points**: Planned leveling system
- **Skill Trees**: Combat and exploration abilities
- **Equipment Upgrades**: Enhanced weapons and armor
- **Quest System**: Structured objectives and rewards

---

## Technical Specifications

### Performance Optimization
- **Culling**: Only render visible tiles within camera view
- **Entity Management**: Efficient collision detection and updates
- **Memory Management**: Proper cleanup of audio nodes and timers

### Coordinate Systems
- **World Coordinates**: Absolute positions in game world
- **Screen Coordinates**: Camera-relative rendering positions
- **Tile Coordinates**: Grid-based world positioning (divide by 32)

### Constants & Configuration
```typescript
const TILE_SIZE = 32;
const WORLD_WIDTH = 80;
const WORLD_HEIGHT = 60;
const VISIBILITY_RADIUS = 5;
const PLAYER_SPEED = 150;
const ENEMY_ATTACK_COOLDOWN = 1.0;
const PLAYER_ATTACK_COOLDOWN = 0.5;
```

### Development Architecture
- **TypeScript**: Type-safe development with interfaces
- **Vite**: Fast development server and build system
- **Canvas API**: Direct 2D graphics rendering
- **Modular Design**: Clear separation of game systems

---

## Future Development Guidelines

### Code Organization
- **Entity System**: Expand component-based architecture
- **State Management**: Implement proper game state machine
- **Save System**: Player progress persistence
- **Configuration**: External JSON for game balance

### Feature Expansion
1. **Dialogue System**: NPC interactions and story delivery
2. **Quest Management**: Structured objective tracking
3. **Magic System**: Spells and special abilities
4. **Equipment System**: Upgradeable gear and customization
5. **Multiplayer**: Cooperative gameplay support

### Performance Considerations
- **Spatial Partitioning**: Optimize collision detection for larger worlds
- **Asset Loading**: Implement proper sprite and audio asset management
- **Memory Pools**: Reuse objects to reduce garbage collection
- **WebGL Migration**: Consider GPU acceleration for complex effects

This document serves as the definitive reference for all current game mechanics and should be updated as new features are implemented.