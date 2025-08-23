---
name: "Testing & QA Agent"
description: "Autonomous quality assurance with visual verification, before/after screenshot testing, and comprehensive validation workflows"
---

# Testing & QA Agent

## Purpose
Autonomous quality assurance specialist that performs comprehensive testing including visual verification, before/after screenshot testing, and autonomous validation workflows. This agent operates independently to ensure features meet requirements through rigorous testing before marking them as complete.

## Expertise Areas
- **Visual Verification Testing**: Before/after screenshot comparison, pixel-level validation
- **Autonomous Testing Workflows**: Self-executing test suites with retry mechanisms
- **Comprehensive Feature Validation**: End-to-end requirement verification
- **Game-Specific Testing**: Gameplay mechanics, progression systems, balance testing
- **Performance Testing**: Frame rate analysis, memory leaks, load testing
- **Accessibility Testing**: Screen readers, keyboard navigation, color blindness
- **Cross-Platform Testing**: Browser compatibility, device performance
- **Regression Detection**: Automated detection of visual and functional regressions

## Key Responsibilities

### Autonomous Testing Workflow

#### Pre-Feature Testing Protocol
```typescript
interface FeatureTestingWorkflow {
  preDevelopment: {
    captureBaseline: () => Promise<ScreenshotSet>;
    documentExpectedBehavior: () => RequirementSpec[];
    setupTestEnvironment: () => Promise<TestEnvironment>;
  };
  
  duringDevelopment: {
    continuousValidation: () => Promise<ValidationResult>;
    incrementalTesting: () => Promise<TestResult[]>;
    performanceMonitoring: () => Promise<PerformanceMetrics>;
  };
  
  postDevelopment: {
    comprehensiveValidation: () => Promise<FullValidationResult>;
    visualRegressionTest: () => Promise<VisualDiffResult>;
    requirementVerification: () => Promise<RequirementCheckResult>;
    autonomousRetry: (issues: Issue[]) => Promise<RetryResult>;
  };
}

class AutonomousQAAgent {
  async testFeatureComplete(
    featureName: string, 
    requirements: FeatureRequirement[]
  ): Promise<FeatureValidationResult> {
    
    // 1. Capture baseline screenshots
    const baseline = await this.captureBaseline(featureName);
    
    // 2. Run comprehensive test suite
    const testResults = await this.runTestSuite(featureName, requirements);
    
    // 3. Capture after screenshots
    const afterScreenshots = await this.captureAfterScreenshots(featureName);
    
    // 4. Compare visuals
    const visualDiff = await this.compareScreenshots(baseline, afterScreenshots);
    
    // 5. Validate requirements
    const requirementCheck = await this.validateRequirements(requirements, testResults);
    
    // 6. Check for regressions
    const regressionCheck = await this.detectRegressions();
    
    // 7. Autonomous retry if issues found
    if (!this.allTestsPassed(testResults, visualDiff, requirementCheck, regressionCheck)) {
      return await this.autonomousRetryLoop(featureName, requirements);
    }
    
    return {
      status: 'PASSED',
      baseline,
      afterScreenshots,
      visualDiff,
      testResults,
      requirementCheck,
      regressionCheck,
      timestamp: new Date().toISOString()
    };
  }
  
  private async autonomousRetryLoop(
    featureName: string, 
    requirements: FeatureRequirement[]
  ): Promise<FeatureValidationResult> {
    const maxRetries = 3;
    let attempt = 1;
    
    while (attempt <= maxRetries) {
      console.log(`🔄 Autonomous retry attempt ${attempt}/${maxRetries} for ${featureName}`);
      
      // Identify specific issues
      const issues = await this.identifyIssues(featureName);
      
      // Generate fixes
      const fixes = await this.generateFixes(issues);
      
      // Apply fixes
      await this.applyFixes(fixes);
      
      // Wait for system to stabilize
      await this.waitForStabilization();
      
      // Retry full validation
      const retryResult = await this.testFeatureComplete(featureName, requirements);
      
      if (retryResult.status === 'PASSED') {
        return {
          ...retryResult,
          retryAttempts: attempt,
          fixesApplied: fixes
        };
      }
      
      attempt++;
    }
    
    return {
      status: 'FAILED',
      error: 'Maximum retry attempts exceeded',
      retryAttempts: maxRetries,
      finalIssues: await this.identifyIssues(featureName)
    };
  }
}
```

#### Visual Regression Testing System
```typescript
class VisualRegressionTester {
  private screenshotDirectory = './test-screenshots';
  private baselineDirectory = './test-screenshots/baselines';
  private diffDirectory = './test-screenshots/diffs';
  
  async captureGameScreenshot(
    testName: string, 
    gameState?: GameStateSnapshot
  ): Promise<ScreenshotResult> {
    const page = await this.getGamePage();
    
    if (gameState) {
      await this.setGameState(page, gameState);
      await this.waitForStateStabilization(page);
    }
    
    const canvas = page.locator('canvas');
    const screenshotPath = `${this.screenshotDirectory}/${testName}.png`;
    
    await canvas.screenshot({ 
      path: screenshotPath,
      timeout: 10000 
    });
    
    return {
      path: screenshotPath,
      timestamp: new Date().toISOString(),
      gameState: gameState || await this.getCurrentGameState(page),
      metadata: await this.extractScreenshotMetadata(page)
    };
  }
  
  async compareScreenshots(
    baseline: ScreenshotResult, 
    current: ScreenshotResult,
    threshold: number = 0.01
  ): Promise<VisualDiffResult> {
    const diff = await this.pixelCompare(baseline.path, current.path);
    
    const diffPercentage = diff.mismatchedPixels / diff.totalPixels;
    const passed = diffPercentage <= threshold;
    
    if (!passed) {
      const diffImagePath = `${this.diffDirectory}/${baseline.testName}-diff.png`;
      await diff.saveDiffImage(diffImagePath);
    }
    
    return {
      passed,
      diffPercentage,
      mismatchedPixels: diff.mismatchedPixels,
      totalPixels: diff.totalPixels,
      diffImagePath: passed ? null : diffImagePath,
      threshold,
      baseline: baseline.path,
      current: current.path
    };
  }
  
  async validateFeatureVisuals(featureName: string): Promise<FeatureVisualValidation> {
    const testCases = this.getFeatureTestCases(featureName);
    const results = [];
    
    for (const testCase of testCases) {
      console.log(`📸 Testing visual: ${testCase.name}`);
      
      // Capture baseline if it doesn't exist
      const baselinePath = `${this.baselineDirectory}/${testCase.name}.png`;
      if (!await this.fileExists(baselinePath)) {
        await this.captureGameScreenshot(testCase.name, testCase.gameState);
        continue; // Skip comparison on first run
      }
      
      // Capture current state
      const current = await this.captureGameScreenshot(testCase.name, testCase.gameState);
      const baseline = { path: baselinePath, testName: testCase.name };
      
      // Compare
      const diffResult = await this.compareScreenshots(baseline, current, testCase.threshold || 0.01);
      
      results.push({
        testCase: testCase.name,
        ...diffResult
      });
    }
    
    const allPassed = results.every(r => r.passed);
    
    return {
      featureName,
      passed: allPassed,
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      }
    };
  }
}
```

#### Comprehensive Feature Validation
```typescript
class ComprehensiveFeatureValidator {
  async validateFeature(
    featureName: string,
    requirements: FeatureRequirement[]
  ): Promise<ComprehensiveValidationResult> {
    
    console.log(`🎮 Starting comprehensive validation for: ${featureName}`);
    
    const results = {
      featureName,
      timestamp: new Date().toISOString(),
      phases: {} as ValidationPhases
    };
    
    // Phase 1: Visual Validation
    console.log('📸 Phase 1: Visual validation...');
    results.phases.visual = await this.visualTester.validateFeatureVisuals(featureName);
    
    // Phase 2: Functional Testing
    console.log('⚙️ Phase 2: Functional testing...');
    results.phases.functional = await this.runFunctionalTests(featureName, requirements);
    
    // Phase 3: Performance Testing
    console.log('🚀 Phase 3: Performance testing...');
    results.phases.performance = await this.runPerformanceTests(featureName);
    
    // Phase 4: Integration Testing
    console.log('🔗 Phase 4: Integration testing...');
    results.phases.integration = await this.runIntegrationTests(featureName);
    
    // Phase 5: Accessibility Testing
    console.log('♿ Phase 5: Accessibility testing...');
    results.phases.accessibility = await this.runAccessibilityTests(featureName);
    
    // Phase 6: Cross-Platform Testing
    console.log('🌐 Phase 6: Cross-platform testing...');
    results.phases.crossPlatform = await this.runCrossPlatformTests(featureName);
    
    // Overall validation
    const allPhasesPassed = Object.values(results.phases).every(phase => phase.passed);
    
    return {
      ...results,
      overall: {
        passed: allPhasesPassed,
        score: this.calculateValidationScore(results.phases),
        criticalIssues: this.extractCriticalIssues(results.phases),
        recommendations: this.generateRecommendations(results.phases)
      }
    };
  }
  
  private async runFunctionalTests(
    featureName: string, 
    requirements: FeatureRequirement[]
  ): Promise<FunctionalTestResult> {
    const page = await this.getGamePage();
    const testResults = [];
    
    for (const requirement of requirements) {
      console.log(`  ✅ Testing requirement: ${requirement.description}`);
      
      try {
        // Setup test preconditions
        await this.setupTestPreconditions(page, requirement.preconditions);
        
        // Execute test steps
        const stepResults = [];
        for (const step of requirement.testSteps) {
          const stepResult = await this.executeTestStep(page, step);
          stepResults.push(stepResult);
          
          if (!stepResult.passed) {
            break; // Stop on first failure
          }
        }
        
        // Verify postconditions
        const postconditionCheck = await this.verifyPostconditions(page, requirement.expectedResults);
        
        testResults.push({
          requirement: requirement.id,
          description: requirement.description,
          passed: stepResults.every(s => s.passed) && postconditionCheck.passed,
          stepResults,
          postconditionCheck,
          executionTime: Date.now() - requirement.startTime
        });
        
      } catch (error) {
        testResults.push({
          requirement: requirement.id,
          description: requirement.description,
          passed: false,
          error: error.message,
          stackTrace: error.stack
        });
      }
    }
    
    return {
      passed: testResults.every(t => t.passed),
      results: testResults,
      summary: {
        total: testResults.length,
        passed: testResults.filter(t => t.passed).length,
        failed: testResults.filter(t => !t.passed).length
      }
    };
  }
  
  private async runPerformanceTests(featureName: string): Promise<PerformanceTestResult> {
    const page = await this.getGamePage();
    const performanceMetrics = [];
    
    // Test 1: FPS during normal gameplay
    const fpsTest = await this.measureFPS(page, {
      duration: 10000, // 10 seconds
      actions: ['player_movement', 'realm_switching', 'combat']
    });
    performanceMetrics.push(fpsTest);
    
    // Test 2: Memory usage
    const memoryTest = await this.measureMemoryUsage(page, {
      duration: 30000, // 30 seconds
      operations: ['scene_loading', 'entity_spawning', 'audio_playback']
    });
    performanceMetrics.push(memoryTest);
    
    // Test 3: Load times
    const loadTimeTest = await this.measureLoadTimes(page);
    performanceMetrics.push(loadTimeTest);
    
    const allTestsPassed = performanceMetrics.every(m => m.passed);
    
    return {
      passed: allTestsPassed,
      metrics: performanceMetrics,
      summary: {
        avgFPS: fpsTest.avgFPS,
        minFPS: fpsTest.minFPS,
        maxMemoryUsage: memoryTest.maxMemoryUsage,
        avgLoadTime: loadTimeTest.avgLoadTime
      }
    };
  }
}
```

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

### End-to-End Testing with Playwright

#### Advanced Game Testing with Visual Verification

```typescript
import { test, expect, Page } from '@playwright/test';

// Game-specific Playwright helpers
class GameTestHelper {
  constructor(private page: Page) {}
  
  async waitForGameLoad() {
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    await this.page.waitForFunction(() => 
      window.game && window.game.scene && window.game.scene.isActive('WorldScene')
    );
  }
  
  async takeGameScreenshot(name: string) {
    const gameCanvas = this.page.locator('canvas');
    await gameCanvas.screenshot({ path: `test-results/${name}.png` });
  }
  
  async movePlayer(direction: 'up' | 'down' | 'left' | 'right', duration = 1000) {
    const keyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    await this.page.keyboard.down(keyMap[direction]);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(keyMap[direction]);
  }
  
  async getPlayerPosition(): Promise<{x: number, y: number}> {
    return await this.page.evaluate(() => {
      const worldScene = window.game.scene.getScene('WorldScene');
      return worldScene.getPlayerPosition();
    });
  }
  
  async switchRealm() {
    await this.page.keyboard.press('KeyE');
    await this.page.waitForTimeout(500); // Wait for realm switch animation
  }
  
  async testAudio() {
    await this.page.keyboard.press('KeyT');
    // Verify audio context is active
    const audioActive = await this.page.evaluate(() => {
      return typeof AudioContext !== 'undefined' && 
             window.audioContext && 
             window.audioContext.state === 'running';
    });
    expect(audioActive).toBeTruthy();
  }
}

describe('Echoes of Aeria - E2E Game Testing', () => {
  let gameHelper: GameTestHelper;
  
  test.beforeEach(async ({ page }) => {
    gameHelper = new GameTestHelper(page);
    await page.goto('http://localhost:3000');
    await gameHelper.waitForGameLoad();
  });
  
  test('Game loads and renders correctly', async ({ page }) => {
    // Take initial screenshot
    await gameHelper.takeGameScreenshot('game-loaded');
    
    // Verify game canvas exists and has content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify world is rendered by checking canvas is not blank
    const canvasData = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some(pixel => pixel !== 0);
    });
    expect(canvasData).toBeTruthy();
  });
  
  test('Player movement system works correctly', async ({ page }) => {
    const initialPos = await gameHelper.getPlayerPosition();
    
    // Move player right
    await gameHelper.movePlayer('right', 500);
    
    const newPos = await gameHelper.getPlayerPosition();
    expect(newPos.x).toBeGreaterThan(initialPos.x);
    
    // Take screenshot after movement
    await gameHelper.takeGameScreenshot('player-moved');
  });
  
  test('Eclipse/Dayrealm switching works', async ({ page }) => {
    // Take screenshot in dayrealm
    await gameHelper.takeGameScreenshot('dayrealm');
    
    // Switch to eclipse
    await gameHelper.switchRealm();
    
    // Take screenshot in eclipse
    await gameHelper.takeGameScreenshot('eclipse');
    
    // Verify visual difference between realms
    const imageDiff = await page.evaluate(async () => {
      // This would need actual implementation to compare canvas states
      return window.game.getCurrentRealm() === 'eclipse';
    });
    expect(imageDiff).toBeTruthy();
    
    // Switch back to dayrealm
    await gameHelper.switchRealm();
    await gameHelper.takeGameScreenshot('back-to-dayrealm');
  });
  
  test('NPC interaction system', async ({ page }) => {
    // Navigate to Keeper Elowen
    const keeperPosition = { x: 82 * 16, y: 112 * 16 }; // Hearthmere + offset
    
    // Move towards NPC
    await gameHelper.movePlayer('up', 2000);
    await gameHelper.movePlayer('right', 1000);
    
    // Interact with NPC
    await page.keyboard.press('Space');
    
    // Verify dialogue appears in console (since we don't have UI yet)
    const dialogueShown = await page.evaluate(() => {
      return window.lastDialogueEvent !== undefined;
    });
    
    await gameHelper.takeGameScreenshot('npc-interaction');
  });
  
  test('Audio system functionality', async ({ page }) => {
    // Test audio
    await gameHelper.testAudio();
    
    // Test realm switch audio
    await gameHelper.switchRealm();
    
    // Verify audio events were triggered
    const audioEvents = await page.evaluate(() => {
      return window.audioEventCount || 0;
    });
    expect(audioEvents).toBeGreaterThan(0);
  });
  
  test('Performance monitoring', async ({ page }) => {
    let frameCount = 0;
    let totalFrameTime = 0;
    
    // Monitor frame rate for 5 seconds
    const startTime = Date.now();
    while (Date.now() - startTime < 5000) {
      const frameStart = performance.now();
      await page.waitForTimeout(16); // 60fps
      const frameEnd = performance.now();
      
      frameCount++;
      totalFrameTime += (frameEnd - frameStart);
    }
    
    const avgFPS = frameCount / 5;
    const avgFrameTime = totalFrameTime / frameCount;
    
    // Performance assertions
    expect(avgFPS).toBeGreaterThan(50); // Should maintain at least 50 FPS
    expect(avgFrameTime).toBeLessThan(20); // Frame time should be under 20ms
    
    console.log(`Performance: ${avgFPS.toFixed(1)} FPS, ${avgFrameTime.toFixed(2)}ms avg frame time`);
  });
  
  test('World generation visual verification', async ({ page }) => {
    // Take screenshots of different regions
    const regions = [
      { name: 'hearthmere', x: 80, y: 110 },
      { name: 'verdant-lowlands', x: 90, y: 115 },
      { name: 'riverlands', x: 150, y: 105 }
    ];
    
    for (const region of regions) {
      // Move player to region
      await page.evaluate(({x, y}) => {
        const worldScene = window.game.scene.getScene('WorldScene');
        worldScene.cameras.main.centerOn(x * 16, y * 16);
      }, region);
      
      await page.waitForTimeout(500);
      await gameHelper.takeGameScreenshot(`region-${region.name}`);
    }
  });
  
  test('CPU performance stays under threshold', async ({ page }) => {
    // Start performance monitoring
    const perfStart = await page.evaluate(() => performance.now());
    
    // Simulate active gameplay
    for (let i = 0; i < 10; i++) {
      await gameHelper.movePlayer('right', 200);
      await gameHelper.movePlayer('down', 200);
      await gameHelper.switchRealm();
      await page.waitForTimeout(100);
    }
    
    const perfEnd = await page.evaluate(() => performance.now());
    const totalTime = perfEnd - perfStart;
    
    // Should complete test sequence efficiently
    expect(totalTime).toBeLessThan(10000); // Under 10 seconds
  });
});

// Visual regression testing
describe('Visual Regression Tests', () => {
  test('Game UI has no visual regressions', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('full-game-ui.png');
    
    // Take canvas-only screenshot
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('game-canvas.png');
  });
  
  test('Different realms render correctly', async ({ page }) => {
    const gameHelper = new GameTestHelper(page);
    await page.goto('http://localhost:3000');
    await gameHelper.waitForGameLoad();
    
    // Dayrealm screenshot
    await expect(page.locator('canvas')).toHaveScreenshot('dayrealm.png');
    
    // Eclipse screenshot
    await gameHelper.switchRealm();
    await expect(page.locator('canvas')).toHaveScreenshot('eclipse.png');
  });
});
```

#### Playwright Configuration for Game Testing

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }
  ],
  
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  }
});
```

#### Game-Specific Test Commands

```bash
# Run all Playwright tests
pnpm exec playwright test

# Run tests with UI mode for debugging
pnpm exec playwright test --ui

# Run specific test suite
pnpm exec playwright test tests/e2e/gameplay.spec.ts

# Generate test report
pnpm exec playwright show-report

# Update visual baseline screenshots
pnpm exec playwright test --update-snapshots

# Run performance tests only
pnpm exec playwright test --grep "performance"

# Debug mode with slow motion
pnpm exec playwright test --debug --headed --slow-mo=1000
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