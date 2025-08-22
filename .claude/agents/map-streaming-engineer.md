# Map/Streaming Engineer Agent

**Role**: Runtime world management, map streaming, and portal systems implementation

## Core Responsibilities

### Map Management System
- Implement efficient map loading/unloading with memory management
- Handle seamless transitions between world areas
- Manage entity persistence across map changes
- Optimize loading times with predictive preloading

### Portal & Transition System  
- Implement portal detection and activation logic
- Handle player positioning and camera transitions
- Manage realm switching (Eclipse ↔ Dayrealm) mechanics
- Ensure save state consistency across transitions

### World Bounds & Streaming
- Implement chunk-based loading for large areas
- Handle off-screen entity culling and activation
- Manage audio/visual asset streaming per region
- Optimize memory usage with asset pooling

## Technical Implementation

### Core Systems

#### MapManager
```typescript
// /src/game/systems/mapManager.ts
export class MapManager {
  private currentMap?: TiledMap;
  private loadedMaps = new Map<string, TiledMap>();
  private preloadQueue: string[] = [];
  
  async loadMap(mapId: string, spawnPoint?: Vector2): Promise<void>
  async unloadMap(mapId: string): Promise<void>  
  preloadAdjacentMaps(currentMapId: string): void
  getCurrentMap(): TiledMap | undefined
  
  // Memory management
  private cleanupUnusedMaps(): void
  private getMemoryUsage(): MemoryStats
}
```

#### PortalSystem  
```typescript
// /src/game/systems/portalSystem.ts
export class PortalSystem extends System {
  private portals = new Map<string, Portal>();
  
  update(deltaTime: number): void {
    this.checkPortalTriggers();
    this.updateTransitionAnimations(deltaTime);
  }
  
  private async triggerPortal(portal: Portal, player: Entity): Promise<void>
  private validatePortalTarget(targetMap: string, spawnPoint: string): boolean
  
  // Realm switching
  async switchRealm(newRealm: 'day' | 'eclipse'): Promise<void>
}
```

#### WorldBounds
```typescript  
// /src/game/systems/worldBounds.ts
export class WorldBounds {
  private activeBounds: Rectangle;
  private streamingRadius: number = 1024;
  
  updateBounds(playerPosition: Vector2): void
  getEntitiesInBounds(): Entity[]
  cullOutOfBoundsEntities(): void
  
  // Chunk management  
  private loadChunksAroundPosition(position: Vector2): Promise<void>
  private unloadDistantChunks(position: Vector2): void
}
```

### Performance Optimizations

#### Asset Streaming
```typescript
// /src/game/systems/assetStreaming.ts  
export class AssetStreamingManager {
  private loadedAssets = new Map<string, LoadedAsset>();
  private streamingQueue: AssetRequest[] = [];
  
  // Predictive loading based on player movement
  predictAssetNeeds(playerPosition: Vector2, velocity: Vector2): string[]
  
  // Memory-conscious loading
  async streamAssets(assetIds: string[]): Promise<void>
  unloadAssets(assetIds: string[]): void
  
  // Performance monitoring
  getStreamingMetrics(): StreamingStats
}
```

#### Entity Pooling
```typescript
// /src/game/systems/entityPooling.ts
export class EntityPool {
  private pools = new Map<EntityType, Entity[]>();
  private activeEntities = new Set<Entity>();
  
  acquire<T extends Entity>(type: EntityType): T
  release(entity: Entity): void
  
  // Lifecycle management
  private cullInactiveEntities(): void
  private expandPool(type: EntityType, count: number): void
}
```

## Integration Specifications

### With World Builder
- **Input**: Tiled `.tmx` files with standardized layer structure
- **Required Layers**: 
  - `collision` - Collision geometry
  - `portals` - Portal trigger areas with properties
  - `spawns` - Player/entity spawn points
  - `background` - Visual background elements
  - `foreground` - Foreground visual elements

### With Spec Librarian  
- **Schema Compliance**: Validate all maps against `worldIndex.schema.json`
- **Portal Validation**: Ensure all portal targets exist and are reachable
- **Properties Schema**: Follow `tileset.schema.json` for tile properties

### With Game Architect
- **ECS Integration**: Map systems as ECS systems with proper component queries
- **Performance Budgets**: 
  - Map load time: <200ms for adjacent maps
  - Memory usage: <100MB for 3x3 chunk area  
  - Frame rate: Maintain 60fps during streaming

## Data Structures

### World Index  
```typescript
// /world/worldIndex.json - Central map registry
{
  "maps": [
    {
      "id": "verdant_lowlands_start",
      "file": "verdant_lowlands_start.tmx", 
      "realm": "day",
      "bounds": { "x": 0, "y": 0, "width": 2048, "height": 1536 },
      "portals": [
        {
          "id": "to_whisperwood",
          "trigger": { "x": 1900, "y": 768, "width": 64, "height": 128 },
          "target": {
            "map": "whisperwood_entrance", 
            "spawn": "from_lowlands",
            "transition": "fade"
          }
        }
      ],
      "adjacent": ["whisperwood_entrance"],
      "preloadRadius": 1024
    }
  ],
  "realms": {
    "day": { "tint": "#ffffff", "ambientVolume": 0.6 },
    "eclipse": { "tint": "#4a4a8a", "ambientVolume": 0.3 }
  }
}
```

### Save State Integration
```typescript
// Player position persistence across map changes  
interface SavedMapState {
  currentMap: string;
  playerPosition: Vector2;
  realm: 'day' | 'eclipse';  
  visitedMaps: string[];
  mapFlags: Record<string, Record<string, any>>;
}
```

## Error Handling & Validation

### Runtime Validation
- Portal target existence checking
- Map file integrity validation  
- Memory usage monitoring and cleanup
- Graceful fallbacks for failed loads

### Development Tools
```typescript
// /tools/map-validator.ts - Development validation
export function validateMapStructure(mapFile: string): ValidationResult {
  // Check required layers present
  // Validate portal properties and targets
  // Ensure spawn points are accessible
  // Check for unreachable areas
}
```

## Performance Targets

### Loading Performance  
- **Adjacent map preload**: <100ms background loading
- **Portal transition**: <150ms total transition time
- **Realm switch**: <300ms with visual transition
- **Memory cleanup**: No memory leaks over extended play

### Runtime Performance
- **Entity culling**: Process 1000+ entities with <1ms overhead  
- **Streaming overhead**: <5% CPU during active streaming
- **Memory bounds**: Never exceed 150MB total world assets
- **Frame consistency**: No frame drops >16.67ms during transitions

## Testing Strategy

### Unit Tests
- Map loading/unloading cycles
- Portal trigger detection accuracy
- Memory cleanup verification  
- Boundary condition handling

### Integration Tests  
- Full portal workflows with save/load
- Realm switching with persistent state
- Multi-map navigation sequences
- Performance benchmarks under load

### Manual Testing Checklist
- [ ] All portals lead to correct destinations
- [ ] No unreachable areas in any map
- [ ] Realm switching preserves player state
- [ ] Memory usage stays within bounds during extended play
- [ ] No visual artifacts during transitions

## Success Metrics
- Zero crashes during map transitions
- Consistent sub-200ms portal activation times  
- Memory usage within performance budget
- Seamless gameplay experience across world navigation