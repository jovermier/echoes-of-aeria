# Echoes of Aeria - Claude Development Guide

## Project Overview

**Echoes of Aeria** is a top-down action-adventure game inspired by 16-bit classics like The Legend of Zelda. Built with TypeScript, Vite, and modern web technologies, featuring a unique dual-world Eclipse/Dayrealm mechanic.

### Current Tech Stack

- **Engine**: TypeScript + HTML5 Canvas 2D
- **Build System**: Vite
- **Architecture**: Entity-Component System (partial)
- **Graphics**: 16x16 pixel art tiles
- **Audio**: Web Audio API (SNES quality chiptune style)

### Recommended Migration Path

- **Target Engine**: Phaser 3 + React (for UI)
- **UI Framework**: React for HUD/inventory/menus
- **Maps**: Tiled JSON tilemaps
- **Art Pipeline**: Aseprite (16×16 or 32×32 tiles)
- **State Management**: Zustand + localStorage/IndexedDB
- **Audio**: Howler.js for enhanced audio management

## Development Guidelines

### Code Quality Standards

#### TypeScript Best Practices

- Use strict type checking (`strict: true` in tsconfig.json)
- Define interfaces for all game entities and data structures
- Prefer composition over inheritance for game objects
- Use enums/const assertions for game constants
- Document complex game mechanics with TSDoc comments

#### Game Architecture Patterns

- **Entity-Component-System (ECS)**: For scalable game object management
- **State Machine**: For game states (playing, paused, dialogue, inventory)
- **Observer Pattern**: For event-driven mechanics (item collection, combat)
- **Command Pattern**: For player input handling and undo systems
- **Factory Pattern**: For enemy spawning and item creation

#### Performance Guidelines

- Implement object pooling for frequently created/destroyed entities
- Use viewport culling for rendering optimization
- Batch sprite rendering operations when possible
- Profile frame rates and memory usage regularly
- Implement spatial partitioning for collision detection in large worlds

### Game Development Best Practices

#### Level Design Principles

- Every screen should have: 1 main path + 1 curiosity path
- Secrets per region: 12-18 discoverable elements
- Follow "Teach → Test → Twist" pattern for new mechanics
- Preview dangerous mechanics safely before lethal encounters
- Eclipse overlays should reuse screens with 3-5 tile edits for new routes

#### Combat System Guidelines

- Maintain 60 FPS combat responsiveness
- Implement invincibility frames (i-frames) after damage
- Use visual feedback for all player actions (screen shake, particle effects)
- Balance timing: sword swing ~300-350ms, roll/dash ~450ms, i-frames ~1s
- Provide clear telegraphs for enemy attacks

#### Audio Design Standards

- Use authentic SNES-style audio with Howler.js + Web Audio API
- Implement intro->loop music structure for seamless playback
- Add organic pitch variation to SFX (±20-40 cents for life)
- Use music ducking for dialogue and impact moments
- Support OGG primary + M4A fallback for cross-browser compatibility
- Preload critical SFX for zero-latency response
- Apply concurrency limits to prevent audio chaos

## File Organization

### Recommended Structure (Migration Target)

```
src/
  game/
    game.ts               # Phaser.Game initialization
    scenes/
      Boot.ts             # Initial boot scene
      Preload.ts          # Asset loading
      World.ts            # Main gameplay
      UIOverlay.ts        # Phaser UI overlay (optional)
    systems/
      movement.ts         # Player/entity movement
      combat.ts           # Combat mechanics
      dialogue.ts         # NPC interaction system
      inventory.ts        # Item management
      quests.ts           # Quest tracking
      audio.ts            # Audio management
      save.ts             # Save/load system
    entities/
      Player.ts           # Player entity class
      Enemy.ts            # Base enemy class
      NPC.ts              # Non-player character class
      Item.ts             # Collectible items
    components/
      Transform.ts        # Position/rotation/scale
      Sprite.ts           # Visual representation
      Collider.ts         # Collision detection
      Health.ts           # HP/damage system
      Inventory.ts        # Item storage component
    utils/
      tilemap.ts          # Tilemap utilities
      collision.ts        # Collision detection helpers
      math.ts             # Math/vector utilities
      constants.ts        # Game constants
  ui/
    App.tsx               # React app root
    GameCanvas.tsx        # Phaser game mount point
    components/
      HUD.tsx             # Health, currency, minimaps
      Inventory.tsx       # Item management UI
      Dialogue.tsx        # Conversation interface
      PauseMenu.tsx       # Game pause overlay
      Settings.tsx        # Options/settings
  assets/
    sprites/              # Character and object sprites
    tilesets/             # Environment tiles
    audio/
      music/              # Background music
      sfx/                # Sound effects
    maps/                 # Tiled JSON exports
public/
  tilesets/               # Public tileset images
  maps/                   # Public map files
```

### Current Structure

```
src/
  echoes-main.ts          # Main game implementation
  style.css               # Basic styling
  (other Vite defaults)
```

## Game Design Implementation

### Core Systems Priority Order

1. **Movement & Camera System**

   - 8-directional player movement
   - Smooth camera following with lerp
   - World boundary constraints
   - Collision detection optimization

2. **Tilemap Integration**

   - Tiled JSON map loading
   - Layer-based rendering (Ground, Details, Collision, Overlay)
   - Dynamic tile property handling
   - Eclipse/Dayrealm world swapping

3. **Combat System**

   - Player attack mechanics (sword arc/projectile)
   - Enemy AI with pathfinding
   - Damage calculation and visual feedback
   - Knockback and invincibility frames

4. **Item & Progression Systems**

   - Item collection and inventory management
   - Equipment progression (Gale Boots, Aether Mirror, etc.)
   - Save/load state persistence
   - Quest flag tracking

5. **Audio & Polish**
   - Dynamic background music
   - Combat and interaction sound effects
   - Visual effects and screen shake
   - UI animations and transitions

### Eclipse/Dayrealm Mechanic Implementation

This is the core unique feature that should be prioritized:

```typescript
interface WorldState {
  currentRealm: 'dayrealm' | 'eclipse';
  aetherMirrorUnlocked: boolean;
  realmTransitions: {
    [key: string]: {
      dayrealmTile: TileType;
      eclipseTile: TileType;
      accessRequirement?: string;
    };
  };
}

// Example transformation rules
const REALM_TRANSFORMATIONS = {
  [TileType.GRASS]: TileType.MARSH, // Grass → Marsh areas
  [TileType.WATER]: TileType.BRIDGE, // Water → Mystical bridges
  [TileType.MOUNTAIN]: TileType.WALL, // Mountains → Ancient walls
  [TileType.FOREST]: TileType.PATH, // Trees → Secret paths
  [TileType.HOUSE]: TileType.SHRINE, // Buildings → Ancient ruins
};
```

## Testing Strategy

### Manual Testing Checklist

- [ ] Player movement in all 8 directions
- [ ] Collision detection with all tile types
- [ ] Attack system timing and hit detection
- [ ] Camera boundaries and following behavior
- [ ] Eclipse/Dayrealm transitions
- [ ] NPC dialogue progression
- [ ] Inventory system functionality
- [ ] Save/load state persistence
- [ ] Audio playback and volume controls
- [ ] Performance with large world areas

### Automated Testing (Future)

- Unit tests for game logic (math utilities, collision detection)
- Integration tests for save/load functionality
- Performance benchmarks for rendering and update loops
- Regression tests for core gameplay mechanics

## Build & Deployment

### Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting (when configured)
npm run lint
```

### Performance Optimization

- Enable Vite's production optimizations
- Implement code splitting for large assets
- Use Web Workers for heavy computations (pathfinding, procedural generation)
- Optimize asset loading with progressive loading strategies

## Debugging & Development Tools

### Browser DevTools Usage

- Use Performance tab for frame rate analysis
- Monitor Memory tab for garbage collection issues
- Utilize Console for game state debugging
- Enable Canvas inspection for rendering debug

### Game-Specific Debug Features

```typescript
// Debug mode configuration
interface DebugConfig {
  showCollisionBoxes: boolean;
  showTileGrid: boolean;
  showFPS: boolean;
  godMode: boolean;
  unlockAllItems: boolean;
  skipIntro: boolean;
}
```

## Asset Pipeline

### Sprite Creation Guidelines

- Use 16x16 or 32x32 pixel tiles consistently
- Maintain limited color palette for aesthetic cohesion
- Create sprite sheets with consistent frame sizes
- Export with proper transparency (PNG format)
- Use Aseprite or similar pixel art tools

### Audio Asset Guidelines

- Keep file sizes small (OGG/MP3 compression)
- Normalize audio levels across all tracks
- Use Web Audio API for real-time effects
- Implement audio streaming for longer music tracks

## Common Patterns & Solutions

### Entity Management

```typescript
class EntityManager {
  private entities: Map<string, Entity> = new Map();
  private components: Map<string, Map<string, Component>> = new Map();

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
  }

  addComponent(entityId: string, component: Component): void {
    if (!this.components.has(component.type)) {
      this.components.set(component.type, new Map());
    }
    this.components.get(component.type)!.set(entityId, component);
  }

  getEntitiesWithComponents(...componentTypes: string[]): Entity[] {
    // Return entities that have all specified components
  }
}
```

### Save System Pattern

```typescript
interface SaveData {
  version: string;
  timestamp: number;
  player: {
    position: Vector2;
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

class SaveSystem {
  save(data: SaveData): void {
    localStorage.setItem('echoes-save', JSON.stringify(data));
  }

  load(): SaveData | null {
    const saved = localStorage.getItem('echoes-save');
    return saved ? JSON.parse(saved) : null;
  }
}
```

## Known Issues & Limitations

### Current Implementation Issues

1. No proper ECS architecture (entities are mixed with systems)
2. Canvas-only rendering (limited scalability)
3. Basic collision detection (no spatial optimization)
4. Hardcoded game constants (should be configurable)
5. No asset management system
6. Limited audio capabilities

### Technical Debt Items

1. Refactor to Phaser 3 for better performance and features
2. Implement proper TypeScript strict mode
3. Add comprehensive error handling
4. Create automated testing suite
5. Optimize rendering pipeline
6. Implement proper asset loading system

## Security Considerations

### Client-Side Security

- Validate all user inputs (especially save data)
- Implement anti-cheat measures for progression
- Sanitize any user-generated content
- Use secure random number generation for procedural elements

### Save Data Integrity

- Implement save data checksums
- Validate save data structure before loading
- Handle corrupted save files gracefully
- Provide backup/restore functionality

## Documentation Requirements

### Code Documentation

- Document all public APIs with TSDoc
- Maintain up-to-date README files
- Create architectural decision records (ADRs)
- Document game design patterns and their usage

### Game Content Documentation

- Maintain current Game Design Document
- Update Game Mechanics Documentation
- Create asset creation guidelines
- Document quest and dialogue systems

---

This guide should be updated as the project evolves and new patterns emerge. All developers should follow these guidelines to maintain code quality and project consistency.
