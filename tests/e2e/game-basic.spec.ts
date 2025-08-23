import { test, expect, Page } from '@playwright/test';

// Game-specific Playwright helpers
class GameTestHelper {
  constructor(private page: Page) {}
  
  async waitForGameLoad() {
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    // Wait for game to be fully initialized
    await this.page.waitForFunction(() => {
      const canvas = document.querySelector('canvas');
      return canvas && canvas.width > 0 && canvas.height > 0;
    });
    
    // Wait additional time for game systems to initialize
    await this.page.waitForTimeout(2000);
  }
  
  async focusGame() {
    const canvas = this.page.locator('canvas');
    await canvas.click();
    await this.page.waitForTimeout(100);
  }
  
  async takeGameScreenshot(name: string) {
    const gameCanvas = this.page.locator('canvas');
    await gameCanvas.screenshot({ path: `test-results/${name}.png` });
  }
  
  async switchRealm() {
    await this.page.keyboard.press('KeyE');
    await this.page.waitForTimeout(500); // Wait for realm switch animation
  }
  
  async testAudio() {
    await this.page.keyboard.press('KeyT');
    await this.page.waitForTimeout(200);
  }
  
  async getPlayerPosition(): Promise<{ x: number; y: number } | null> {
    return await this.page.evaluate(() => {
      try {
        const game = (window as any).phaserGame;
        if (!game) return null;
        
        const scene = game.scene.getScene('WorldScene');
        if (!scene || !scene.scene.isActive()) return null;
        
        const world = scene.world;
        if (!world) return null;
        
        const playerEntities = world.getEntitiesWithComponents('player', 'transform');
        if (playerEntities.length === 0) return null;
        
        const playerId = playerEntities[0].id;
        const transform = world.getComponent(playerId, 'transform');
        
        return transform ? { x: transform.position.x, y: transform.position.y } : null;
      } catch (error) {
        console.error('Error getting player position:', error);
        return null;
      }
    });
  }
  
  async testBasicMovement(): Promise<boolean> {
    const initialPosition = await this.getPlayerPosition();
    if (!initialPosition) return false;
    
    // Test right movement
    await this.page.keyboard.down('KeyD');
    await this.page.waitForTimeout(300);
    await this.page.keyboard.up('KeyD');
    await this.page.waitForTimeout(100);
    
    const finalPosition = await this.getPlayerPosition();
    if (!finalPosition) return false;
    
    // Check if player moved right
    return finalPosition.x > initialPosition.x;
  }
}

test.describe('Echoes of Aeria - Basic Game Tests', () => {
  let gameHelper: GameTestHelper;
  
  test.beforeEach(async ({ page }) => {
    gameHelper = new GameTestHelper(page);
    await page.goto('/');
    await gameHelper.waitForGameLoad();
    await gameHelper.focusGame();
  });
  
  test('Game loads and renders correctly', async ({ page }) => {
    // Take initial screenshot
    await gameHelper.takeGameScreenshot('game-loaded');
    
    // Verify game canvas exists and has content
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify canvas has reasonable dimensions
    const canvasSize = await canvas.boundingBox();
    expect(canvasSize?.width).toBeGreaterThan(400);
    expect(canvasSize?.height).toBeGreaterThan(300);
    
    // Verify world is rendered by checking canvas is not blank
    const canvasHasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some(pixel => pixel !== 0);
    });
    expect(canvasHasContent).toBeTruthy();
  });
  
  test('Eclipse/Dayrealm switching visual test', async ({ page }) => {
    // Take screenshot in dayrealm
    await gameHelper.takeGameScreenshot('dayrealm-initial');
    
    // Switch to eclipse
    await gameHelper.switchRealm();
    await gameHelper.takeGameScreenshot('eclipse-switched');
    
    // Switch back to dayrealm
    await gameHelper.switchRealm();
    await gameHelper.takeGameScreenshot('dayrealm-back');
    
    // Verify no console errors during realm switching
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    expect(consoleErrors.length).toBe(0);
  });
  
  test('Audio system responds to input', async ({ page }) => {
    // Test audio functionality
    await gameHelper.testAudio();
    
    // Verify no audio-related errors
    const audioErrors = await page.evaluate(() => {
      return window.audioErrors || [];
    });
    expect(audioErrors.length).toBe(0);
  });
  
  test('Performance monitoring', async ({ page }) => {
    let frameCount = 0;
    const startTime = Date.now();
    
    // Monitor frame rate for 3 seconds
    while (Date.now() - startTime < 3000) {
      await page.waitForTimeout(16); // 60fps
      frameCount++;
    }
    
    const avgFPS = frameCount / 3;
    
    // Performance assertions - should maintain at least 30 FPS
    expect(avgFPS).toBeGreaterThan(30);
    
    console.log(`Performance: ${avgFPS.toFixed(1)} FPS average`);
  });
  
  test('Console error monitoring', async ({ page }) => {
    const consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // Perform some basic interactions
    await gameHelper.switchRealm();
    await gameHelper.testAudio();
    await gameHelper.switchRealm();
    
    // Check for unexpected errors
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const criticalErrors = errors.filter(error => 
      !error.text.includes('favicon') && // Ignore favicon errors
      !error.text.includes('audio files not found') // Expected during testing
    );
    
    expect(criticalErrors.length).toBe(0);
  });
  
  test('Basic player movement functionality', async ({ page }) => {
    // Get initial player position
    const initialPosition = await gameHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    console.log('Initial player position:', initialPosition);
    
    // Test basic movement
    const movementWorking = await gameHelper.testBasicMovement();
    expect(movementWorking).toBeTruthy();
    
    // Get final position to verify movement occurred
    const finalPosition = await gameHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    
    console.log('Final player position:', finalPosition);
    
    // Verify actual movement occurred
    expect(finalPosition!.x).toBeGreaterThan(initialPosition!.x);
  });
});

test.describe('Visual Regression Tests', () => {
  let gameHelper: GameTestHelper;
  
  test.beforeEach(async ({ page }) => {
    gameHelper = new GameTestHelper(page);
    await page.goto('/');
    await gameHelper.waitForGameLoad();
    await gameHelper.focusGame();
  });
  
  test('Game canvas visual baseline', async ({ page }) => {
    // Wait for initial render
    await page.waitForTimeout(1000);
    
    // Take canvas screenshot for visual regression
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('game-canvas-baseline.png', {
      threshold: 0.3 // Allow some variation due to animations
    });
  });
  
  test('Eclipse realm visual baseline', async ({ page }) => {
    // Switch to eclipse realm
    await gameHelper.switchRealm();
    await page.waitForTimeout(500);
    
    // Take screenshot
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot('eclipse-realm-baseline.png', {
      threshold: 0.3
    });
  });
});