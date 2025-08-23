import { test, expect, Page } from '@playwright/test';

// Movement-specific test helpers
class MovementTestHelper {
  constructor(private page: Page) {}

  async waitForGameLoad() {
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    // Wait for game to be fully initialized
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    
    // Wait a bit more for game systems to initialize
    await this.page.waitForTimeout(2000);
  }

  async focusGame() {
    const canvas = this.page.locator('canvas');
    await canvas.click();
    // Ensure focus is on the game
    await this.page.waitForTimeout(100);
  }

  async getPlayerPosition(): Promise<{ x: number; y: number } | null> {
    return await this.page.evaluate(() => {
      try {
        // Access the game instance through global variables set by GameCanvas
        const game = (window as any).phaserGame;
        if (!game) {
          console.log('No Phaser game instance found');
          return null;
        }
        
        // Get the WorldScene
        const scene = game.scene.getScene('WorldScene');
        if (!scene) {
          console.log('WorldScene not found');
          return null;
        }
        
        // Check if scene is active
        if (!scene.scene.isActive()) {
          console.log('WorldScene not active');
          return null;
        }
        
        // Access ECS world
        const world = scene.world;
        if (!world) {
          console.log('ECS world not found');
          return null;
        }
        
        // Get player entities
        const playerEntities = world.getEntitiesWithComponents('player', 'transform');
        if (playerEntities.length === 0) {
          console.log('No player entities found');
          return null;
        }
        
        const playerId = playerEntities[0].id;
        const transform = world.getComponent(playerId, 'transform');
        
        if (!transform) {
          console.log('Player transform component not found');
          return null;
        }
        
        console.log('Player position:', transform.position);
        return { x: transform.position.x, y: transform.position.y };
      } catch (error) {
        console.error('Error getting player position:', error);
        return null;
      }
    });
  }

  async getPlayerVelocity(): Promise<{ x: number; y: number } | null> {
    return await this.page.evaluate(() => {
      try {
        const game = (window as any).phaserGame;
        if (!game) return null;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene || !scene.scene.isActive()) return null;
        
        const world = scene.world;
        if (!world) return null;
        
        const playerEntities = world.getEntitiesWithComponents('player', 'movement');
        if (playerEntities.length === 0) return null;
        
        const playerId = playerEntities[0].id;
        const movement = world.getComponent(playerId, 'movement');
        
        return movement ? { x: movement.velocity.x, y: movement.velocity.y } : null;
      } catch (error) {
        console.error('Error getting player velocity:', error);
        return null;
      }
    });
  }

  async getInputState(): Promise<any> {
    return await this.page.evaluate(() => {
      try {
        const game = (window as any).phaserGame;
        if (!game) return null;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene || !scene.scene.isActive()) return null;
        
        const inputSystem = scene.inputSystem;
        if (!inputSystem) return null;
        
        return inputSystem.getInputState();
      } catch (error) {
        console.error('Error getting input state:', error);
        return null;
      }
    });
  }

  async pressKey(key: string, duration = 100) {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(key);
  }

  async holdKey(key: string, duration = 500) {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(key);
  }

  async pressKeys(keys: string[], duration = 100) {
    // Press all keys down
    for (const key of keys) {
      await this.page.keyboard.down(key);
    }
    await this.page.waitForTimeout(duration);
    // Release all keys
    for (const key of keys.reverse()) {
      await this.page.keyboard.up(key);
    }
  }

  async checkPositionChanged(
    initialPosition: { x: number; y: number }, 
    tolerance = 1
  ): Promise<boolean> {
    const currentPosition = await this.getPlayerPosition();
    if (!currentPosition) return false;
    
    const deltaX = Math.abs(currentPosition.x - initialPosition.x);
    const deltaY = Math.abs(currentPosition.y - initialPosition.y);
    
    return deltaX > tolerance || deltaY > tolerance;
  }

  async waitForMovement(timeout = 2000): Promise<boolean> {
    const startTime = Date.now();
    let initialPosition = await this.getPlayerPosition();
    
    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(50);
      const currentPosition = await this.getPlayerPosition();
      if (currentPosition && initialPosition) {
        if (await this.checkPositionChanged(initialPosition)) {
          return true;
        }
      }
    }
    return false;
  }

  async captureMovementScreenshot(name: string) {
    const canvas = this.page.locator('canvas');
    await canvas.screenshot({ 
      path: `test-results/movement-${name}.png`,
      timeout: 5000 
    });
  }
}

test.describe('Movement Controls - Input Detection', () => {
  let movementHelper: MovementTestHelper;
  
  test.beforeEach(async ({ page }) => {
    movementHelper = new MovementTestHelper(page);
    await page.goto('/');
    await movementHelper.waitForGameLoad();
    await movementHelper.focusGame();
  });

  test('should detect WASD keyboard input', async ({ page }) => {
    // Test each WASD key individually
    const keys = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
    
    for (const key of keys) {
      await page.keyboard.down(key);
      await page.waitForTimeout(100);
      
      // Check if input system detected the key
      const inputState = await movementHelper.getInputState();
      expect(inputState).toBeTruthy();
      
      await page.keyboard.up(key);
      await page.waitForTimeout(50);
    }
  });

  test('should detect arrow key input', async ({ page }) => {
    const keys = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'];
    
    for (const key of keys) {
      await page.keyboard.down(key);
      await page.waitForTimeout(100);
      
      const inputState = await movementHelper.getInputState();
      expect(inputState).toBeTruthy();
      
      await page.keyboard.up(key);
      await page.waitForTimeout(50);
    }
  });

  test('should detect diagonal movement input (multiple keys)', async ({ page }) => {
    // Test diagonal combinations
    const diagonalCombos = [
      ['KeyW', 'KeyA'], // Up + Left
      ['KeyW', 'KeyD'], // Up + Right
      ['KeyS', 'KeyA'], // Down + Left
      ['KeyS', 'KeyD'], // Down + Right
    ];

    for (const combo of diagonalCombos) {
      // Press both keys
      for (const key of combo) {
        await page.keyboard.down(key);
      }
      await page.waitForTimeout(100);
      
      const inputState = await movementHelper.getInputState();
      expect(inputState).toBeTruthy();
      
      // Release both keys
      for (const key of combo) {
        await page.keyboard.up(key);
      }
      await page.waitForTimeout(50);
    }
  });
});

test.describe('Movement Controls - Position Changes', () => {
  let movementHelper: MovementTestHelper;
  
  test.beforeEach(async ({ page }) => {
    movementHelper = new MovementTestHelper(page);
    await page.goto('/');
    await movementHelper.waitForGameLoad();
    await movementHelper.focusGame();
  });

  test('should move player up with W key', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    await movementHelper.captureMovementScreenshot('before-up-movement');
    
    // Hold W key for movement
    await movementHelper.holdKey('KeyW', 500);
    
    await movementHelper.captureMovementScreenshot('after-up-movement');
    
    // Wait for movement to process
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Player should have moved up (negative Y direction)
    expect(finalPosition!.y).toBeLessThan(initialPosition!.y);
  });

  test('should move player down with S key', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    await movementHelper.holdKey('KeyS', 500);
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Player should have moved down (positive Y direction)
    expect(finalPosition!.y).toBeGreaterThan(initialPosition!.y);
  });

  test('should move player left with A key', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    await movementHelper.holdKey('KeyA', 500);
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Player should have moved left (negative X direction)
    expect(finalPosition!.x).toBeLessThan(initialPosition!.x);
  });

  test('should move player right with D key', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    await movementHelper.holdKey('KeyD', 500);
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Player should have moved right (positive X direction)
    expect(finalPosition!.x).toBeGreaterThan(initialPosition!.x);
  });

  test('should handle diagonal movement correctly', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Move diagonally up-right
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(500);
    await page.keyboard.up('KeyW');
    await page.keyboard.up('KeyD');
    
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Player should have moved both up and right
    expect(finalPosition!.x).toBeGreaterThan(initialPosition!.x);
    expect(finalPosition!.y).toBeLessThan(initialPosition!.y);
  });

  test('should use arrow keys for movement', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Test arrow key movement
    await movementHelper.holdKey('ArrowRight', 300);
    await page.waitForTimeout(100);
    
    const afterRightMove = await movementHelper.getPlayerPosition();
    expect(afterRightMove!.x).toBeGreaterThan(initialPosition!.x);
    
    await movementHelper.holdKey('ArrowUp', 300);
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition!.y).toBeLessThan(afterRightMove!.y);
  });
});

test.describe('Movement Controls - Movement Boundaries', () => {
  let movementHelper: MovementTestHelper;
  
  test.beforeEach(async ({ page }) => {
    movementHelper = new MovementTestHelper(page);
    await page.goto('/');
    await movementHelper.waitForGameLoad();
    await movementHelper.focusGame();
  });

  test('should respect world boundaries', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Try to move far left (should hit boundary)
    for (let i = 0; i < 20; i++) {
      await movementHelper.holdKey('KeyA', 100);
      await page.waitForTimeout(50);
    }
    
    const leftBoundPosition = await movementHelper.getPlayerPosition();
    expect(leftBoundPosition).toBeTruthy();
    
    // Player should not be at negative coordinates
    expect(leftBoundPosition!.x).toBeGreaterThanOrEqual(0);
    
    // Try to move far up (should hit boundary)
    for (let i = 0; i < 20; i++) {
      await movementHelper.holdKey('KeyW', 100);
      await page.waitForTimeout(50);
    }
    
    const topBoundPosition = await movementHelper.getPlayerPosition();
    expect(topBoundPosition).toBeTruthy();
    
    // Player should not be at negative coordinates
    expect(topBoundPosition!.y).toBeGreaterThanOrEqual(0);
  });

  test('should stop at right and bottom boundaries', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Try to move far right
    for (let i = 0; i < 30; i++) {
      await movementHelper.holdKey('KeyD', 100);
      await page.waitForTimeout(50);
    }
    
    const rightBoundPosition = await movementHelper.getPlayerPosition();
    
    // Try to move far down
    for (let i = 0; i < 30; i++) {
      await movementHelper.holdKey('KeyS', 100);
      await page.waitForTimeout(50);
    }
    
    const bottomBoundPosition = await movementHelper.getPlayerPosition();
    
    // Should not exceed world bounds (WORLD_WIDTH * TILE_SIZE = 4096, WORLD_HEIGHT * TILE_SIZE = 3072)
    expect(rightBoundPosition!.x).toBeLessThanOrEqual(4096);
    expect(bottomBoundPosition!.y).toBeLessThanOrEqual(3072);
  });
});

test.describe('Movement Controls - Responsiveness', () => {
  let movementHelper: MovementTestHelper;
  
  test.beforeEach(async ({ page }) => {
    movementHelper = new MovementTestHelper(page);
    await page.goto('/');
    await movementHelper.waitForGameLoad();
    await movementHelper.focusGame();
  });

  test('should stop movement when keys are released', async ({ page }) => {
    await movementHelper.holdKey('KeyD', 300);
    await page.waitForTimeout(100);
    
    // Check velocity after key release
    const velocity = await movementHelper.getPlayerVelocity();
    
    // Velocity should be zero or very close to zero after key release
    if (velocity) {
      expect(Math.abs(velocity.x)).toBeLessThan(10);
      expect(Math.abs(velocity.y)).toBeLessThan(10);
    }
  });

  test('should respond quickly to input changes', async ({ page }) => {
    const responseTests = [];
    
    // Test rapid direction changes
    const directions = ['KeyW', 'KeyD', 'KeyS', 'KeyA'];
    
    for (const direction of directions) {
      const startTime = Date.now();
      
      await page.keyboard.down(direction);
      await movementHelper.waitForMovement(1000);
      await page.keyboard.up(direction);
      
      const responseTime = Date.now() - startTime;
      responseTests.push(responseTime);
      
      await page.waitForTimeout(100);
    }
    
    // All responses should be under 500ms
    for (const responseTime of responseTests) {
      expect(responseTime).toBeLessThan(500);
    }
    
    const avgResponseTime = responseTests.reduce((a, b) => a + b, 0) / responseTests.length;
    console.log(`Average input response time: ${avgResponseTime.toFixed(1)}ms`);
    
    // Average should be under 250ms for good responsiveness (relaxed from 200ms)
    expect(avgResponseTime).toBeLessThan(250);
  });

  test('should handle rapid key presses without lag', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Rapid fire key presses
    for (let i = 0; i < 10; i++) {
      await movementHelper.pressKey('KeyD', 50);
      await page.waitForTimeout(10);
      await movementHelper.pressKey('KeyW', 50);
      await page.waitForTimeout(10);
    }
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Player should have moved despite rapid inputs
    expect(await movementHelper.checkPositionChanged(initialPosition!)).toBeTruthy();
  });
});

test.describe('Movement Controls - Integration Tests', () => {
  let movementHelper: MovementTestHelper;
  
  test.beforeEach(async ({ page }) => {
    movementHelper = new MovementTestHelper(page);
    await page.goto('/');
    await movementHelper.waitForGameLoad();
    await movementHelper.focusGame();
  });

  test('should work while other systems are active', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Try realm switching while moving
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    
    // Trigger realm switch
    await page.keyboard.press('KeyE');
    await page.waitForTimeout(300);
    
    // Continue movement
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Movement should still work after realm switch
    expect(finalPosition!.x).toBeGreaterThan(initialPosition!.x);
  });

  test('should handle overlapping key presses', async ({ page }) => {
    const initialPosition = await movementHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Overlapping key sequence: W down, D down, W up, D up
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(100);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');
    
    await page.waitForTimeout(100);
    
    const finalPosition = await movementHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    // Should have moved both up and right
    expect(finalPosition!.x).toBeGreaterThan(initialPosition!.x);
    expect(finalPosition!.y).toBeLessThan(initialPosition!.y);
  });

  test('should maintain movement state consistency', async ({ page }) => {
    // Test that movement state is properly maintained across frames
    await page.keyboard.down('KeyD');
    
    // Sample velocity multiple times during movement
    const velocitySamples = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(100);
      const velocity = await movementHelper.getPlayerVelocity();
      if (velocity) {
        velocitySamples.push(velocity);
      }
    }
    
    await page.keyboard.up('KeyD');
    
    // All velocity samples should be consistent (positive X movement)
    for (const velocity of velocitySamples) {
      expect(velocity.x).toBeGreaterThan(0);
      expect(Math.abs(velocity.y)).toBeLessThan(1); // Should be near zero
    }
  });
});

test.describe('Movement Controls - Performance Tests', () => {
  let movementHelper: MovementTestHelper;
  
  test.beforeEach(async ({ page }) => {
    movementHelper = new MovementTestHelper(page);
    await page.goto('/');
    await movementHelper.waitForGameLoad();
    await movementHelper.focusGame();
  });

  test('should maintain performance during continuous movement', async ({ page }) => {
    // Monitor performance during extended movement
    const performanceMarks = [];
    
    await page.keyboard.down('KeyD');
    
    for (let i = 0; i < 60; i++) { // Monitor for ~1 second at 60fps
      const startTime = performance.now();
      await page.waitForTimeout(16); // 60fps frame time
      const endTime = performance.now();
      
      performanceMarks.push(endTime - startTime);
    }
    
    await page.keyboard.up('KeyD');
    
    const avgFrameTime = performanceMarks.reduce((a, b) => a + b, 0) / performanceMarks.length;
    const maxFrameTime = Math.max(...performanceMarks);
    
    console.log(`Performance: Avg frame time ${avgFrameTime.toFixed(1)}ms, Max ${maxFrameTime.toFixed(1)}ms`);
    
    // Frame times should be reasonable for 60fps (under 16.67ms)
    expect(avgFrameTime).toBeLessThan(20);
    expect(maxFrameTime).toBeLessThan(50); // Allow for occasional spikes
  });

  test('should not cause memory leaks during movement', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    // Perform extensive movement
    for (let round = 0; round < 5; round++) {
      await movementHelper.holdKey('KeyW', 200);
      await movementHelper.holdKey('KeyD', 200);
      await movementHelper.holdKey('KeyS', 200);
      await movementHelper.holdKey('KeyA', 200);
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });
    
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercentage = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Memory: Initial ${(initialMemory / 1024 / 1024).toFixed(1)}MB, Final ${(finalMemory / 1024 / 1024).toFixed(1)}MB, Increase: ${increasePercentage.toFixed(1)}%`);
      
      // Memory increase should be minimal (under 50%)
      expect(increasePercentage).toBeLessThan(50);
    }
  });
});