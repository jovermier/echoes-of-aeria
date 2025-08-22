---
name: "Testing & QA Agent"
description: "Specializes in quality assurance, testing strategies, bug prevention, and automated testing for Echoes of Aeria"
---

# Testing & QA Agent

## Purpose
Specializes in quality assurance, testing strategies, bug prevention, and automated testing for Echoes of Aeria.

## Expertise Areas
- **Automated Testing**: Unit tests, integration tests, end-to-end testing
- **Game-Specific Testing**: Gameplay mechanics, progression systems, balance testing
- **Performance Testing**: Frame rate analysis, memory leaks, load testing
- **Accessibility Testing**: Screen readers, keyboard navigation, color blindness
- **Cross-Platform Testing**: Browser compatibility, device performance

## Key Responsibilities

### Testing Strategy Framework (Vitest-Based)

#### Modern Test Pyramid for Game Development
```typescript
// Unit Tests (70%) - Lightning fast with Vitest
// Integration Tests (20%) - System interactions  
// E2E Tests (10%) - Full user journeys

interface ModernTestStrategy {
  unitTests: {
    gameLogic: string[];      // Math, collision, state management
    utilities: string[];      // Helper functions, data structures  
    components: string[];     // React components with Testing Library
    audioSystem: string[];   // SNES-style audio with Howler mocks
  };
  integrationTests: {
    gameSystem: string[];     // Player + enemy interactions
    uiIntegration: string[];  // React + Phaser communication
    dataFlow: string[];       // Save/load, state synchronization
    audioFlow: string[];      // Audio transitions and ducking
  };
  e2eTests: {
    playerJourneys: string[]; // Complete gameplay scenarios
    progression: string[];    // Item acquisition, world unlocks
    performance: string[];    // Frame rate, memory usage
  };
}

// Vitest Benefits for Game Development:
// ✅ 10x faster than Jest (especially for TypeScript)
// ✅ Native Vite integration (same config, transforms, aliases)
// ✅ Hot Module Replacement for tests
// ✅ Better TypeScript support out-of-the-box
// ✅ Smart test running (only affected tests)
// ✅ Optional UI mode for visual test running
```

#### Testing Environment Setup
```typescript
// Jest configuration for game testing
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@game/(.*)$': '<rootDir>/src/game/$1'
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};

// Test setup for game-specific mocks
beforeEach(() => {
  // Mock Web Audio API
  global.AudioContext = jest.fn().mockImplementation(() => ({
    createOscillator: jest.fn(),
    createGain: jest.fn(),
    destination: {},
    currentTime: 0
  }));
  
  // Mock Canvas API
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn()
  });
  
  // Mock performance.now()
  global.performance.now = jest.fn(() => Date.now());
});
```

### Unit Testing for Game Logic

#### Movement System Tests
```typescript
describe('Player Movement System', () => {
  let player: Player;
  let world: WorldMap;
  
  beforeEach(() => {
    player = createTestPlayer({ x: 100, y: 100 });
    world = createTestWorld();
  });
  
  describe('Basic Movement', () => {
    test('should move player in 8 directions', () => {
      const directions = [
        { input: { up: true }, expected: { x: 100, y: 84 } },
        { input: { down: true }, expected: { x: 100, y: 116 } },
        { input: { left: true }, expected: { x: 84, y: 100 } },
        { input: { right: true }, expected: { x: 116, y: 100 } },
        { input: { up: true, right: true }, expected: { x: 111.31, y: 88.69 } }
      ];
      
      directions.forEach(({ input, expected }) => {
        player.position = { x: 100, y: 100 };
        updatePlayerMovement(player, input, 1.0); // 1 second delta
        
        expect(player.position.x).toBeCloseTo(expected.x, 1);
        expect(player.position.y).toBeCloseTo(expected.y, 1);
      });
    });
    
    test('should normalize diagonal movement speed', () => {
      const startPos = { x: 100, y: 100 };
      player.position = { ...startPos };
      
      // Move diagonally for 1 second
      updatePlayerMovement(player, { up: true, right: true }, 1.0);
      
      const distance = Math.hypot(
        player.position.x - startPos.x,
        player.position.y - startPos.y
      );
      
      // Should move at normal speed, not sqrt(2) * speed
      expect(distance).toBeCloseTo(player.speed, 1);
    });
  });
  
  describe('Collision Detection', () => {
    test('should prevent movement into walls', () => {
      // Place wall at (120, 100)
      world.setTile(120, 100, TileType.WALL);
      
      player.position = { x: 100, y: 100 };
      updatePlayerMovement(player, { right: true }, 1.0);
      
      // Player should stop before hitting wall
      expect(player.position.x).toBeLessThan(120 - player.size.x / 2);
    });
    
    test('should handle corner sliding', () => {
      // Create L-shaped wall configuration
      world.setTile(120, 100, TileType.WALL);
      world.setTile(120, 116, TileType.WALL);
      
      player.position = { x: 100, y: 108 };
      updatePlayerMovement(player, { right: true, up: true }, 1.0);
      
      // Player should slide along wall vertically
      expect(player.position.x).toBe(100); // No horizontal movement
      expect(player.position.y).toBeLessThan(108); // Vertical movement allowed
    });
  });
});
```

#### Combat System Tests
```typescript
describe('Combat System', () => {
  let player: Player;
  let enemy: Enemy;
  
  beforeEach(() => {
    player = createTestPlayer({ x: 100, y: 100 });
    enemy = createTestEnemy({ x: 120, y: 100 });
  });
  
  describe('Player Attack', () => {
    test('should create attack hitbox in correct direction', () => {
      player.direction = Direction.RIGHT;
      const hitbox = createAttackHitbox(player);
      
      expect(hitbox.x).toBeGreaterThan(player.position.x);
      expect(hitbox.y).toBeCloseTo(player.position.y, 1);
    });
    
    test('should damage enemy within hitbox', () => {
      player.direction = Direction.RIGHT;
      enemy.position = { x: 125, y: 100 }; // Within attack range
      
      const initialHealth = enemy.health;
      performAttack(player, [enemy]);
      
      expect(enemy.health).toBe(initialHealth - player.attackDamage);
    });
    
    test('should not damage same enemy multiple times per attack', () => {
      player.direction = Direction.RIGHT;
      enemy.position = { x: 125, y: 100 };
      
      const attack = new Attack(player);
      attack.update([enemy], 0.1); // First frame
      const healthAfterFirst = enemy.health;
      
      attack.update([enemy], 0.1); // Second frame
      expect(enemy.health).toBe(healthAfterFirst); // No additional damage
    });
  });
  
  describe('Enemy AI', () => {
    test('should detect player within range', () => {
      enemy.position = { x: 150, y: 100 }; // 50 pixels away
      enemy.detectionRange = 60;
      
      const canSeePlayer = enemyCanDetectPlayer(enemy, player);
      expect(canSeePlayer).toBe(true);
    });
    
    test('should move toward player when chasing', () => {
      enemy.position = { x: 150, y: 100 };
      enemy.state = AIState.CHASE;
      
      const initialDistance = distanceBetween(enemy.position, player.position);
      updateEnemyAI(enemy, player, 1.0);
      const finalDistance = distanceBetween(enemy.position, player.position);
      
      expect(finalDistance).toBeLessThan(initialDistance);
    });
  });
});
```

#### Eclipse/Dayrealm System Tests
```typescript
describe('Eclipse/Dayrealm System', () => {
  let worldState: WorldState;
  let transformationEngine: RealmTransformationEngine;
  
  beforeEach(() => {
    worldState = createTestWorldState();
    transformationEngine = new RealmTransformationEngine();
  });
  
  test('should transform tiles correctly when switching realms', () => {
    const grassTile = { x: 10, y: 10, type: TileType.GRASS };
    worldState.setTile(grassTile.x, grassTile.y, grassTile.type);
    
    transformationEngine.transformWorld('eclipse');
    
    const transformedTile = worldState.getTile(grassTile.x, grassTile.y);
    expect(transformedTile).toBe(TileType.MARSH);
  });
  
  test('should only allow transformation with Aether Mirror', () => {
    const player = createTestPlayer();
    player.inventory.aether_mirror = false;
    
    const canTransform = worldState.canTransformRealm(player);
    expect(canTransform).toBe(false);
    
    player.inventory.aether_mirror = true;
    expect(worldState.canTransformRealm(player)).toBe(true);
  });
  
  test('should preserve non-transformable tiles', () => {
    worldState.setTile(10, 10, TileType.HOUSE);
    
    transformationEngine.transformWorld('eclipse');
    
    // Some tiles might not transform
    const tile = worldState.getTile(10, 10);
    expect([TileType.HOUSE, TileType.SHRINE]).toContain(tile);
  });
});
```

### Integration Testing

#### Game State Integration
```typescript
describe('Game State Integration', () => {
  let gameInstance: EchoesOfAeria;
  
  beforeEach(() => {
    gameInstance = new EchoesOfAeria();
    gameInstance.init();
  });
  
  afterEach(() => {
    gameInstance.destroy();
  });
  
  test('should handle player death correctly', async () => {
    const player = gameInstance.getPlayer();
    const initialPosition = { ...player.position };
    
    // Damage player to death
    player.takeDamage(player.health);
    
    // Wait for death sequence
    await waitForGameState(gameInstance, 'player_respawning');
    
    // Check respawn
    expect(player.health).toBe(player.maxHealth);
    expect(player.position).toEqual(initialPosition);
  });
  
  test('should save and load game state correctly', () => {
    const player = gameInstance.getPlayer();
    
    // Modify player state
    player.position = { x: 200, y: 300 };
    player.inventory.gale_boots = true;
    player.currency = 150;
    
    // Save game
    const saveData = gameInstance.createSaveData();
    
    // Reset and load
    gameInstance.reset();
    gameInstance.loadSaveData(saveData);
    
    const loadedPlayer = gameInstance.getPlayer();
    expect(loadedPlayer.position).toEqual({ x: 200, y: 300 });
    expect(loadedPlayer.inventory.gale_boots).toBe(true);
    expect(loadedPlayer.currency).toBe(150);
  });
});
```

#### React + Phaser Integration
```typescript
describe('React + Phaser Integration', () => {
  let renderResult: RenderResult;
  let gameInstance: EchoesOfAeria;
  
  beforeEach(() => {
    renderResult = render(<GameUI />);
    gameInstance = getGameInstance();
  });
  
  test('should update UI when game state changes', async () => {
    const player = gameInstance.getPlayer();
    
    // Change player health
    act(() => {
      player.takeDamage(2);
    });
    
    // Check UI reflects change
    await waitFor(() => {
      const healthDisplay = renderResult.getByTestId('health-display');
      expect(healthDisplay).toHaveTextContent('1/3'); // 1 heart remaining
    });
  });
  
  test('should handle inventory toggle', async () => {
    const inventoryButton = renderResult.getByTestId('inventory-button');
    
    fireEvent.click(inventoryButton);
    
    await waitFor(() => {
      expect(renderResult.getByTestId('inventory-screen')).toBeVisible();
    });
  });
});
```

### End-to-End Testing

#### Gameplay Scenarios
```typescript
describe('E2E Gameplay Scenarios', () => {
  test('new player tutorial flow', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    
    // Start new game
    await page.click('[data-testid="new-game-button"]');
    
    // Should be in Hearthmere
    await page.waitForSelector('[data-testid="region-display"]');
    const regionText = await page.textContent('[data-testid="region-display"]');
    expect(regionText).toContain('Hearthmere');
    
    // Talk to Keeper Elowen
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press(' '); // Interact
    
    // Should show dialogue
    await page.waitForSelector('[data-testid="dialogue-box"]');
    const dialogueText = await page.textContent('[data-testid="dialogue-text"]');
    expect(dialogueText).toContain('Welcome to Hearthmere');
    
    // Complete dialogue
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press(' ');
      await page.waitForTimeout(100);
    }
    
    // Check inventory for Sunflame Lantern
    await page.keyboard.press('i');
    await page.waitForSelector('[data-testid="inventory-screen"]');
    const hasLantern = await page.isVisible('[data-testid="item-sunflame-lantern"]');
    expect(hasLantern).toBe(true);
  });
  
  test('combat and progression', async () => {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000?skipIntro=true');
    
    // Move to area with enemies
    await navigateToRegion(page, 'Verdant Lowlands');
    
    // Find and fight enemy
    const initialCurrency = await getCurrencyCount(page);
    await attackNearestEnemy(page);
    
    // Wait for enemy defeat
    await page.waitForTimeout(500);
    const newCurrency = await getCurrencyCount(page);
    expect(newCurrency).toBeGreaterThan(initialCurrency);
  });
});
```

### Performance Testing

#### Frame Rate Monitoring
```typescript
class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fpsHistory: number[] = [];
  
  startMonitoring() {
    const measureFrame = (currentTime: number) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        const fps = this.frameCount;
        this.fpsHistory.push(fps);
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  }
  
  getAverageFPS(): number {
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }
  
  getMinFPS(): number {
    return Math.min(...this.fpsHistory);
  }
  
  hasPerformanceIssues(): boolean {
    return this.getMinFPS() < 50 || this.getAverageFPS() < 55;
  }
}

describe('Performance Tests', () => {
  test('should maintain 60 FPS during normal gameplay', async () => {
    const monitor = new PerformanceMonitor();
    const game = new EchoesOfAeria();
    
    monitor.startMonitoring();
    
    // Simulate 10 seconds of gameplay
    await simulateGameplay(game, 10000);
    
    expect(monitor.getAverageFPS()).toBeGreaterThan(55);
    expect(monitor.getMinFPS()).toBeGreaterThan(50);
  });
  
  test('should handle large numbers of entities', () => {
    const game = new EchoesOfAeria();
    const startTime = performance.now();
    
    // Spawn many entities
    for (let i = 0; i < 100; i++) {
      game.spawnEnemy('sprig_stalker', { x: i * 32, y: i * 32 });
    }
    
    // Update game loop
    game.update(0.016); // 60 FPS frame
    
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    // Should complete frame in under 16.67ms (60 FPS)
    expect(frameTime).toBeLessThan(16.67);
  });
});
```

#### Memory Leak Detection
```typescript
describe('Memory Leak Tests', () => {
  test('should not leak memory during scene transitions', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    // Perform multiple scene transitions
    for (let i = 0; i < 10; i++) {
      const game = new EchoesOfAeria();
      await game.loadScene('test-scene');
      await game.unloadScene('test-scene');
      game.destroy();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

### Accessibility Testing

#### Screen Reader Compatibility
```typescript
describe('Accessibility Tests', () => {
  test('should provide screen reader accessible UI', async () => {
    const { container } = render(<GameUI />);
    
    // Check for ARIA labels
    const healthDisplay = container.querySelector('[aria-label="Player health"]');
    expect(healthDisplay).toBeInTheDocument();
    
    const inventoryButton = container.querySelector('[aria-label="Open inventory"]');
    expect(inventoryButton).toBeInTheDocument();
    
    // Check for proper focus management
    const firstFocusable = container.querySelector('[tabindex="0"]');
    expect(firstFocusable).toBeInTheDocument();
  });
  
  test('should support keyboard navigation', async () => {
    render(<InventoryScreen />);
    
    // Tab through inventory items
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toHaveAttribute('data-testid', 'inventory-item-0');
    
    // Arrow keys for grid navigation
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(document.activeElement).toHaveAttribute('data-testid', 'inventory-item-1');
  });
  
  test('should meet color contrast requirements', () => {
    const { container } = render(<HUDOverlay playerData={mockPlayerData} />);
    
    const textElements = container.querySelectorAll('*');
    textElements.forEach(element => {
      const styles = getComputedStyle(element);
      const contrast = calculateContrastRatio(
        styles.color,
        styles.backgroundColor
      );
      
      if (element.textContent?.trim()) {
        expect(contrast).toBeGreaterThan(4.5); // WCAG AA standard
      }
    });
  });
});
```

### Test Utilities and Helpers

#### Game Test Factory
```typescript
export const createTestPlayer = (position: Vector2 = { x: 0, y: 0 }): Player => ({
  position: { ...position },
  size: { x: 12, y: 12 },
  direction: Direction.DOWN,
  speed: 80,
  health: 6,
  maxHealth: 6,
  attacking: false,
  attackTimer: 0,
  lastAttackTime: 0,
  inventory: {
    sunflame_lantern: true,
    gale_boots: false,
    riverfin_vest: false,
    aether_mirror: false,
    storm_disk: false,
    quake_maul: false,
    tide_hook: false,
    sunflame_prism: false,
    kingsbane_sigil: false,
    aether_shards: 0,
    keys: {},
    heart_pieces: 0,
    rumor_cards: 0
  }
});

export const createTestEnemy = (position: Vector2 = { x: 0, y: 0 }): Enemy => ({
  position: { ...position },
  size: { x: 12, y: 12 },
  direction: Direction.DOWN,
  speed: 60,
  health: 2,
  maxHealth: 2,
  attackDamage: 1,
  detectionRange: 120,
  state: AIState.IDLE
});

export const simulateGameplay = async (game: EchoesOfAeria, duration: number) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration) {
    game.update(0.016); // 60 FPS
    await new Promise(resolve => setTimeout(resolve, 16));
  }
};
```

#### Test Data Builders
```typescript
export class PlayerDataBuilder {
  private data: Partial<PlayerData> = {};
  
  withPosition(x: number, y: number): this {
    this.data.position = { x, y };
    return this;
  }
  
  withHealth(health: number, maxHealth: number = health): this {
    this.data.health = health;
    this.data.maxHealth = maxHealth;
    return this;
  }
  
  withInventoryItem(item: keyof PlayerInventory, value: any): this {
    this.data.inventory = { ...this.data.inventory, [item]: value };
    return this;
  }
  
  build(): PlayerData {
    return {
      ...createTestPlayer(),
      ...this.data
    };
  }
}

// Usage in tests
const playerWithGaleBoots = new PlayerDataBuilder()
  .withPosition(100, 100)
  .withInventoryItem('gale_boots', true)
  .build();
```

This agent ensures comprehensive testing coverage that catches bugs early, maintains game quality, and provides confidence for releases and updates.