---
name: "Audio Wiring Agent"
description: "Audio bank management, event mapping, and runtime audio integration"
---

# Audio Wiring Agent

**Role**: Audio bank management, event mapping, and runtime audio integration

## Core Responsibilities

### Audio Bank Management
- Maintain centralized audio asset registry with categories and metadata
- Define audio event naming conventions and ID management
- Handle audio asset loading priorities and memory optimization
- Coordinate with asset pipeline for audio file organization

### Event-to-Audio Mapping
- Create mapping system between game events and audio bank IDs  
- Implement audio event routing and trigger coordination
- Handle contextual audio variations (combat vs exploration)
- Manage audio state transitions and crossfading

### Runtime Integration
- Bridge between gameplay systems and AudioManager
- Implement audio middleware for complex audio behaviors
- Handle positional audio and 3D audio effects in 2D space
- Coordinate audio with visual effects and game state

## Technical Implementation

### Audio Bank Structure
```json
// /src/assets/audio/bank.json - Central audio registry
{
  "version": "1.0.0",
  "categories": {
    "music": {
      "bgm_verdant_lowlands": {
        "files": [
          "/audio/music/verdant_lowlands.ogg",
          "/audio/music/verdant_lowlands.m4a"
        ],
        "volume": 0.6,
        "category": "music", 
        "loop": true,
        "sprite": {
          "intro": [0, 8000, false],
          "loop": [8000, 56000, true]
        },
        "tags": ["overworld", "peaceful", "day-realm"],
        "context": ["exploration", "safe-zone"]
      }
    },
    "sfx": {
      "sfx_sword_swing": {
        "files": [
          "/audio/sfx/sword_swing.ogg", 
          "/audio/sfx/sword_swing.m4a"
        ],
        "volume": 0.8,
        "category": "sfx",
        "pitchVariation": 20,
        "tags": ["combat", "player", "melee"],
        "context": ["battle", "training"],
        "cooldown": 100
      }
    },
    "ui": {
      "ui_menu_select": {
        "files": [
          "/audio/ui/menu_select.ogg",
          "/audio/ui/menu_select.m4a"  
        ],
        "volume": 0.5,
        "category": "ui",
        "tags": ["interface", "feedback"],
        "context": ["menu", "navigation"]
      }
    },
    "ambient": {
      "ambient_forest": {
        "files": [
          "/audio/ambient/forest.ogg",
          "/audio/ambient/forest.m4a"
        ],
        "volume": 0.2,
        "category": "ambient",
        "loop": true,
        "fadeIn": 2000,
        "fadeOut": 1500,
        "tags": ["nature", "peaceful"],
        "context": ["whisperwood"]
      }
    }
  },
  "contextMixes": {
    "exploration": {
      "music": 0.6,
      "sfx": 0.7, 
      "ui": 0.7,
      "ambient": 0.4
    },
    "combat": {
      "music": 0.7,
      "sfx": 0.9,
      "ui": 0.6,
      "ambient": 0.2
    },
    "dialogue": {
      "music": 0.3,
      "sfx": 0.6,
      "ui": 0.7,
      "ambient": 0.2
    }
  }
}
```

### Audio Event System
```typescript
// /src/game/systems/audioWiring.ts
export class AudioWiringSystem extends System {
  private audioManager: AudioManager;
  private eventMappings = new Map<string, AudioEventMapping>();
  private contextStack: AudioContext[] = [];
  private activeVariations = new Map<string, string>();
  
  constructor(audioManager: AudioManager, bankData: AudioBankData) {
    super();
    this.audioManager = audioManager;
    this.loadEventMappings(bankData);
  }
  
  // Main event handling
  handleGameEvent(event: GameEvent, context?: AudioEventContext): void {
    const mapping = this.eventMappings.get(event.type);
    if (!mapping) return;
    
    // Select appropriate audio based on context
    const audioId = this.selectAudioVariation(mapping, context);
    if (!audioId) return;
    
    // Play audio with context-appropriate settings  
    this.playContextualAudio(audioId, event, context);
  }
  
  private selectAudioVariation(
    mapping: AudioEventMapping, 
    context?: AudioEventContext
  ): string | null {
    // Filter candidates by context tags
    const candidates = mapping.audioIds.filter(audioId => {
      const bankEntry = this.getBankEntry(audioId);
      if (!bankEntry) return false;
      
      // Check context compatibility
      if (context?.tags) {
        const hasMatchingTag = context.tags.some(tag => 
          bankEntry.tags?.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }
      
      // Check current audio context
      const currentContext = this.getCurrentAudioContext();
      if (currentContext && bankEntry.context) {
        if (!bankEntry.context.includes(currentContext)) return false;
      }
      
      return true;
    });
    
    if (candidates.length === 0) return null;
    
    // Select based on priority or randomization
    return this.selectFromCandidates(candidates, mapping.selectionStrategy);
  }
}
```

### Game Event to Audio Mapping
```typescript
// /src/game/systems/audio.ts - High-level audio coordination
export class GameAudioSystem extends System {
  private audioWiring: AudioWiringSystem;
  
  constructor() {
    super();
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Combat events
    this.eventBus.on(GAME_EVENTS.PLAYER_ATTACK_START, (event) => {
      this.audioWiring.handleGameEvent(event, {
        tags: ['combat', 'player'],
        intensity: 'medium',
        position: event.position
      });
    });
    
    this.eventBus.on(GAME_EVENTS.ENEMY_HIT, (event) => {
      this.audioWiring.handleGameEvent(event, {
        tags: ['combat', 'impact'],
        intensity: 'high',
        position: event.position,
        variation: event.enemyType
      });
    });
    
    // World events
    this.eventBus.on(GAME_EVENTS.ITEM_COLLECTED, (event) => {
      this.audioWiring.handleGameEvent(event, {
        tags: ['world', 'reward'],
        variation: event.itemType,
        position: event.position
      });
    });
    
    // UI events
    this.eventBus.on(GAME_EVENTS.MENU_NAVIGATE, (event) => {
      this.audioWiring.handleGameEvent(event, {
        tags: ['ui', 'feedback'],
        priority: 'immediate'
      });
    });
  }
  
  // Context management
  pushAudioContext(context: AudioContext): void {
    this.audioWiring.pushContext(context);
    this.updateMixerLevels();
  }
  
  popAudioContext(): void {
    this.audioWiring.popContext();
    this.updateMixerLevels();
  }
}
```

## Audio Context Management

### Dynamic Audio Mixing
```typescript
// /src/game/systems/audioContextManager.ts
export class AudioContextManager {
  private currentContext: AudioContextType = 'exploration';
  private transitionTime: number = 1000; // ms
  
  setAudioContext(newContext: AudioContextType, transition: boolean = true): void {
    if (newContext === this.currentContext) return;
    
    const oldMix = this.getContextMix(this.currentContext);
    const newMix = this.getContextMix(newContext);
    
    if (transition) {
      this.smoothTransition(oldMix, newMix, this.transitionTime);
    } else {
      this.audioManager.applyMixerSettings(newMix);
    }
    
    this.currentContext = newContext;
  }
  
  private smoothTransition(
    fromMix: MixerSettings, 
    toMix: MixerSettings, 
    duration: number
  ): void {
    // Implement smooth crossfade between audio contexts
    const startTime = performance.now();
    
    const updateMix = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Interpolate mixer values
      const currentMix = this.interpolateMix(fromMix, toMix, progress);
      this.audioManager.applyMixerSettings(currentMix);
      
      if (progress < 1.0) {
        requestAnimationFrame(updateMix);
      }
    };
    
    updateMix();
  }
}
```

### Positional Audio
```typescript
// /src/game/systems/positionalAudio.ts
export class PositionalAudioSystem extends System {
  private listener: AudioListener;
  private spatialSounds = new Map<Entity, SpatialSound>();
  
  update(deltaTime: number): void {
    this.updateListenerPosition();
    this.updateSpatialSounds();
  }
  
  playPositionalAudio(
    audioId: string, 
    position: Vector2, 
    options?: PositionalAudioOptions
  ): void {
    const sound = this.audioManager.playSfx(audioId, {
      volume: this.calculateVolumeByDistance(position),
      pitchVariation: options?.pitchVariation,
      pan: this.calculatePan(position)
    });
    
    if (sound && options?.tracking) {
      this.spatialSounds.set(options.tracking, {
        soundId: sound,
        entity: options.tracking,
        baseVolume: options.volume || 1.0
      });
    }
  }
  
  private calculateVolumeByDistance(soundPos: Vector2): number {
    const listenerPos = this.listener.position;
    const distance = soundPos.distanceTo(listenerPos);
    const maxDistance = 500; // pixels
    
    // Linear falloff (could use logarithmic for more realism)
    return Math.max(0, 1.0 - (distance / maxDistance));
  }
  
  private calculatePan(soundPos: Vector2): number {
    const listenerPos = this.listener.position;
    const offset = soundPos.x - listenerPos.x;
    const maxPanDistance = 300; // pixels
    
    // Return pan value between -1 (left) and 1 (right)
    return Math.max(-1, Math.min(1, offset / maxPanDistance));
  }
}
```

## Audio Asset Pipeline Integration

### Asset Validation
```typescript
// /tools/audio-bank-validator.ts
export function validateAudioBank(bankData: AudioBankData): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check all referenced files exist
  for (const [category, assets] of Object.entries(bankData.categories)) {
    for (const [id, asset] of Object.entries(assets)) {
      for (const file of asset.files) {
        if (!fs.existsSync(path.join('src/assets', file))) {
          issues.push({
            type: 'missing_asset',
            severity: 'error',
            message: `Audio file not found: ${file}`,
            category,
            assetId: id
          });
        }
      }
    }
  }
  
  // Validate audio IDs match event mappings
  validateEventMappings(bankData, issues);
  
  // Check for unused audio assets
  findUnusedAssets(bankData, issues);
  
  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues };
}
```

### Runtime Asset Loading
```typescript
// /src/game/systems/audioAssetLoader.ts
export class AudioAssetLoader {
  private bankData: AudioBankData;
  private loadedAssets = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  
  async preloadAssetsByContext(context: AudioContextType): Promise<void> {
    const assetsToLoad = this.getAssetsForContext(context);
    const loadPromises = assetsToLoad.map(assetId => this.loadAsset(assetId));
    
    await Promise.all(loadPromises);
  }
  
  async loadAsset(assetId: string): Promise<void> {
    if (this.loadedAssets.has(assetId)) return;
    
    // Prevent duplicate loading
    if (this.loadingPromises.has(assetId)) {
      return this.loadingPromises.get(assetId)!;
    }
    
    const loadPromise = this.performAssetLoad(assetId);
    this.loadingPromises.set(assetId, loadPromise);
    
    try {
      await loadPromise;
      this.loadedAssets.add(assetId);
    } finally {
      this.loadingPromises.delete(assetId);
    }
  }
  
  private getAssetsForContext(context: AudioContextType): string[] {
    // Return priority assets for given context
    const contextAssets: string[] = [];
    
    for (const [category, assets] of Object.entries(this.bankData.categories)) {
      for (const [id, asset] of Object.entries(assets)) {
        if (asset.context?.includes(context)) {
          contextAssets.push(id);
        }
      }
    }
    
    return contextAssets;
  }
}
```

## Integration Points

### With Audio Designer
- **Asset Organization**: Follow established audio directory structure and naming
- **Quality Standards**: Ensure bank entries match production specifications  
- **Effect Coordination**: Coordinate with AudioUtils for high-level audio functions

### With Game Systems
- **Event Integration**: Provide clean interfaces for all game systems to trigger audio
- **State Coordination**: Ensure audio context matches game state (combat, exploration, etc.)
- **Performance Optimization**: Manage audio memory and loading for optimal performance

### With Spec Librarian
- **Schema Validation**: Ensure audio bank follows defined JSON schema
- **Event Consistency**: Maintain consistent event naming with shared event definitions
- **Documentation**: Keep audio event documentation synchronized with implementation

## Performance Optimization

### Memory Management
```typescript
// /src/game/systems/audioMemoryManager.ts
export class AudioMemoryManager {
  private readonly MAX_LOADED_ASSETS = 50;
  private readonly MEMORY_CLEANUP_INTERVAL = 30000; // 30 seconds
  private assetUsage = new Map<string, number>();
  
  trackAssetUsage(assetId: string): void {
    const usage = this.assetUsage.get(assetId) || 0;
    this.assetUsage.set(assetId, usage + 1);
  }
  
  cleanupUnusedAssets(): void {
    const loadedAssets = Array.from(this.assetUsage.entries())
      .sort((a, b) => a[1] - b[1]); // Sort by usage count
    
    // Unload least-used assets if over limit
    while (loadedAssets.length > this.MAX_LOADED_ASSETS) {
      const [assetId] = loadedAssets.shift()!;
      this.audioManager.unloadAsset(assetId);
      this.assetUsage.delete(assetId);
    }
  }
}
```

## Testing Strategy

### Audio Bank Validation
```typescript
// /src/game/systems/__tests__/audioWiring.test.ts
describe('AudioWiringSystem', () => {
  test('maps game events to correct audio assets', () => {
    const wiring = new AudioWiringSystem(mockAudioManager, testBankData);
    
    wiring.handleGameEvent({
      type: GAME_EVENTS.PLAYER_ATTACK_START,
      position: new Vector2(100, 100)
    });
    
    expect(mockAudioManager.playSfx).toHaveBeenCalledWith(
      'sfx_sword_swing',
      expect.objectContaining({ volume: expect.any(Number) })
    );
  });
  
  test('selects appropriate audio variation based on context', () => {
    // Test context-based audio selection
    // Verify tag filtering works correctly
    // Check priority and randomization logic
  });
});
```

### Integration Tests
```typescript
describe('Audio Integration', () => {
  test('audio context transitions smoothly', () => {
    const contextManager = new AudioContextManager();
    
    contextManager.setAudioContext('combat', true);
    
    // Verify mixer levels transition smoothly
    // Check that audio doesn't cut abruptly
  });
});
```

## Success Metrics
- Zero missing audio asset errors in production
- Smooth audio context transitions with no audible artifacts
- Efficient memory usage with <20MB total audio assets loaded
- Consistent audio responsiveness with <50ms event-to-audio latency