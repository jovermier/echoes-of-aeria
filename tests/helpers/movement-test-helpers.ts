import { Page, expect } from '@playwright/test';

/**
 * Shared helper utilities for movement testing across all test files
 */
export class MovementTestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the game to fully load and initialize
   */
  async waitForGameReady(): Promise<void> {
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait for game to be fully initialized
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    
    // Wait for game systems to initialize
    await this.page.waitForTimeout(2000);
    
    // Focus the game canvas
    await this.focusGameCanvas();
  }

  /**
   * Focus the game canvas to ensure it receives keyboard events
   */
  async focusGameCanvas(): Promise<void> {
    const canvas = this.page.locator('canvas');
    await canvas.click();
    await this.page.waitForTimeout(100);
  }

  /**
   * Get the current player position from the game world
   */
  async getPlayerPosition(): Promise<{ x: number; y: number } | null> {
    return await this.page.evaluate(() => {
      try {
        const gameCanvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!gameCanvas) return null;
        
        const game = (window as any).game || (gameCanvas as any).game;
        if (!game) return null;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene) return null;
        
        const world = scene.world;
        if (!world) return null;
        
        const playerEntities = world.getEntitiesWithComponents('player', 'transform');
        if (playerEntities.length === 0) return null;
        
        const playerId = playerEntities[0].id;
        const transform = world.getComponent(playerId, 'transform');
        
        return transform ? { x: transform.position.x, y: transform.position.y } : null;
      } catch (error) {
        console.warn('Error getting player position:', error);
        return null;
      }
    });
  }

  /**
   * Get the current player velocity from the movement system
   */
  async getPlayerVelocity(): Promise<{ x: number; y: number } | null> {
    return await this.page.evaluate(() => {
      try {
        const gameCanvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!gameCanvas) return null;
        
        const game = (window as any).game || (gameCanvas as any).game;
        if (!game) return null;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene) return null;
        
        const world = scene.world;
        if (!world) return null;
        
        const playerEntities = world.getEntitiesWithComponents('player', 'movement');
        if (playerEntities.length === 0) return null;
        
        const playerId = playerEntities[0].id;
        const movement = world.getComponent(playerId, 'movement');
        
        return movement ? { x: movement.velocity.x, y: movement.velocity.y } : null;
      } catch (error) {
        console.warn('Error getting player velocity:', error);
        return null;
      }
    });
  }

  /**
   * Get the current input state from the input system
   */
  async getInputState(): Promise<any> {
    return await this.page.evaluate(() => {
      try {
        const gameCanvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!gameCanvas) return null;
        
        const game = (window as any).game || (gameCanvas as any).game;
        if (!game) return null;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene || !scene.inputSystem) return null;
        
        return scene.inputSystem.getInputState();
      } catch (error) {
        console.warn('Error getting input state:', error);
        return null;
      }
    });
  }

  /**
   * Press and hold a key for a specified duration
   */
  async holdKey(key: string, duration = 300): Promise<void> {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(key);
  }

  /**
   * Press multiple keys simultaneously for a duration
   */
  async holdKeys(keys: string[], duration = 300): Promise<void> {
    // Press all keys down
    for (const key of keys) {
      await this.page.keyboard.down(key);
      await this.page.waitForTimeout(10); // Small delay between key presses
    }
    
    await this.page.waitForTimeout(duration);
    
    // Release all keys in reverse order
    for (const key of keys.reverse()) {
      await this.page.keyboard.up(key);
      await this.page.waitForTimeout(10);
    }
  }

  /**
   * Quick key tap
   */
  async tapKey(key: string, duration = 50): Promise<void> {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(key);
  }

  /**
   * Check if the player position has changed beyond a tolerance
   */
  async hasPlayerMoved(
    initialPosition: { x: number; y: number }, 
    tolerance = 1
  ): Promise<boolean> {
    const currentPosition = await this.getPlayerPosition();
    if (!currentPosition) return false;
    
    const deltaX = Math.abs(currentPosition.x - initialPosition.x);
    const deltaY = Math.abs(currentPosition.y - initialPosition.y);
    
    return deltaX > tolerance || deltaY > tolerance;
  }

  /**
   * Wait for player movement to occur
   */
  async waitForMovement(timeout = 2000): Promise<boolean> {
    const startTime = Date.now();
    const initialPosition = await this.getPlayerPosition();
    if (!initialPosition) return false;
    
    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(50);
      if (await this.hasPlayerMoved(initialPosition)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Assert that movement occurred in a specific direction
   */
  async assertMovementDirection(
    initialPosition: { x: number; y: number },
    expectedDirection: 'up' | 'down' | 'left' | 'right',
    tolerance = 1
  ): Promise<void> {
    const finalPosition = await this.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    const deltaX = finalPosition!.x - initialPosition.x;
    const deltaY = finalPosition!.y - initialPosition.y;
    
    switch (expectedDirection) {
      case 'up':
        expect(deltaY).toBeLessThan(-tolerance);
        break;
      case 'down':
        expect(deltaY).toBeGreaterThan(tolerance);
        break;
      case 'left':
        expect(deltaX).toBeLessThan(-tolerance);
        break;
      case 'right':
        expect(deltaX).toBeGreaterThan(tolerance);
        break;
    }
  }

  /**
   * Test a complete movement sequence in all directions
   */
  async testAllDirections(): Promise<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  }> {
    const results = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    // Test up movement
    const initialPos = await this.getPlayerPosition();
    if (initialPos) {
      await this.holdKey('KeyW', 300);
      await this.page.waitForTimeout(100);
      const afterUp = await this.getPlayerPosition();
      if (afterUp) {
        results.up = afterUp.y < initialPos.y;
      }
    }

    // Reset and test right movement
    const resetPos = await this.getPlayerPosition();
    if (resetPos) {
      await this.holdKey('KeyD', 300);
      await this.page.waitForTimeout(100);
      const afterRight = await this.getPlayerPosition();
      if (afterRight) {
        results.right = afterRight.x > resetPos.x;
      }
    }

    // Test down movement
    const downPos = await this.getPlayerPosition();
    if (downPos) {
      await this.holdKey('KeyS', 300);
      await this.page.waitForTimeout(100);
      const afterDown = await this.getPlayerPosition();
      if (afterDown) {
        results.down = afterDown.y > downPos.y;
      }
    }

    // Test left movement
    const leftPos = await this.getPlayerPosition();
    if (leftPos) {
      await this.holdKey('KeyA', 300);
      await this.page.waitForTimeout(100);
      const afterLeft = await this.getPlayerPosition();
      if (afterLeft) {
        results.left = afterLeft.x < leftPos.x;
      }
    }

    return results;
  }

  /**
   * Capture a screenshot of the game canvas for debugging
   */
  async captureMovementScreenshot(name: string): Promise<void> {
    const canvas = this.page.locator('canvas');
    await canvas.screenshot({ 
      path: `test-results/movement-${name}-${Date.now()}.png`,
      timeout: 5000 
    });
  }

  /**
   * Monitor frame rate during movement
   */
  async measureMovementPerformance(duration = 1000): Promise<{
    avgFrameTime: number;
    minFrameTime: number;
    maxFrameTime: number;
    frameCount: number;
  }> {
    const frameTimes: number[] = [];
    const startTime = Date.now();
    
    await this.page.keyboard.down('KeyD'); // Start movement
    
    while (Date.now() - startTime < duration) {
      const frameStart = performance.now();
      await this.page.waitForTimeout(16); // Target 60fps
      const frameEnd = performance.now();
      frameTimes.push(frameEnd - frameStart);
    }
    
    await this.page.keyboard.up('KeyD'); // Stop movement
    
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const minFrameTime = Math.min(...frameTimes);
    const maxFrameTime = Math.max(...frameTimes);
    
    return {
      avgFrameTime,
      minFrameTime,
      maxFrameTime,
      frameCount: frameTimes.length
    };
  }

  /**
   * Test boundary collision detection
   */
  async testWorldBoundaries(): Promise<{
    hitLeftBoundary: boolean;
    hitRightBoundary: boolean;
    hitTopBoundary: boolean;
    hitBottomBoundary: boolean;
  }> {
    const results = {
      hitLeftBoundary: false,
      hitRightBoundary: false,
      hitTopBoundary: false,
      hitBottomBoundary: false
    };

    // Test left boundary
    for (let i = 0; i < 20; i++) {
      await this.holdKey('KeyA', 100);
      await this.page.waitForTimeout(50);
    }
    const leftPos = await this.getPlayerPosition();
    if (leftPos && leftPos.x <= 10) { // Close to boundary
      results.hitLeftBoundary = true;
    }

    // Test right boundary
    for (let i = 0; i < 40; i++) {
      await this.holdKey('KeyD', 100);
      await this.page.waitForTimeout(50);
    }
    const rightPos = await this.getPlayerPosition();
    if (rightPos && rightPos.x >= 750) { // Close to expected right boundary
      results.hitRightBoundary = true;
    }

    // Test top boundary
    for (let i = 0; i < 30; i++) {
      await this.holdKey('KeyW', 100);
      await this.page.waitForTimeout(50);
    }
    const topPos = await this.getPlayerPosition();
    if (topPos && topPos.y <= 10) { // Close to boundary
      results.hitTopBoundary = true;
    }

    // Test bottom boundary
    for (let i = 0; i < 40; i++) {
      await this.holdKey('KeyS', 100);
      await this.page.waitForTimeout(50);
    }
    const bottomPos = await this.getPlayerPosition();
    if (bottomPos && bottomPos.y >= 550) { // Close to expected bottom boundary
      results.hitBottomBoundary = true;
    }

    return results;
  }

  /**
   * Wait for game systems to be ready
   */
  async waitForSystemsReady(): Promise<boolean> {
    return await this.page.evaluate(() => {
      try {
        const game = (window as any).game;
        if (!game) return false;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene) return false;
        
        // Check if key systems are available
        const hasInputSystem = !!scene.inputSystem;
        const hasMovementSystem = !!scene.movementSystem;
        const hasWorld = !!scene.world;
        
        return hasInputSystem && hasMovementSystem && hasWorld;
      } catch (error) {
        return false;
      }
    });
  }
}

/**
 * Movement test constants
 */
export const MOVEMENT_TEST_CONFIG = {
  DEFAULT_HOLD_DURATION: 300,
  DEFAULT_TAP_DURATION: 50,
  MOVEMENT_TOLERANCE: 1,
  BOUNDARY_TOLERANCE: 10,
  RESPONSE_TIME_LIMIT: 500,
  FRAME_TIME_LIMIT: 20,
  SYSTEM_INIT_TIMEOUT: 10000,
} as const;

/**
 * Key mapping for movement tests
 */
export const MOVEMENT_KEYS = {
  WASD: {
    UP: 'KeyW',
    DOWN: 'KeyS',
    LEFT: 'KeyA',
    RIGHT: 'KeyD'
  },
  ARROWS: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight'
  }
} as const;

/**
 * Expected world boundaries (based on MovementSystem)
 */
export const WORLD_BOUNDARIES = {
  LEFT: 0,
  RIGHT: 800,
  TOP: 0,
  BOTTOM: 592
} as const;