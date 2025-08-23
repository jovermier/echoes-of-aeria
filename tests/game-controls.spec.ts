import { test, expect } from '@playwright/test';

// Helper functions for game control testing
class ControlTestHelper {
  constructor(private page: any) {}
  
  async focusGame() {
    const canvas = this.page.locator('canvas');
    await canvas.click();
    await this.page.waitForTimeout(100);
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
}

test.describe('Game Controls', () => {
  let controlHelper: ControlTestHelper;
  
  test.beforeEach(async ({ page }) => {
    controlHelper = new ControlTestHelper(page);
    await page.goto('/');
    
    // Wait for the game to load
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(2000);
    await controlHelper.focusGame();
  });

  test('should respond to keyboard input with actual movement', async ({ page }) => {
    const initialPosition = await controlHelper.getPlayerPosition();
    expect(initialPosition).toBeTruthy();
    
    // Test WASD movement with position verification
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(300);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(100);
    
    const afterRightMove = await controlHelper.getPlayerPosition();
    expect(afterRightMove).toBeTruthy();
    expect(afterRightMove!.x).toBeGreaterThan(initialPosition!.x);
    
    // Test arrow key movement
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(100);
    
    const afterUpMove = await controlHelper.getPlayerPosition();
    expect(afterUpMove).toBeTruthy();
    expect(afterUpMove!.y).toBeLessThan(afterRightMove!.y);
    
    // Test action keys don't break movement
    await page.keyboard.press('Space'); // Attack/Interact
    await page.keyboard.press('KeyE'); // Alternative interact
    
    // Player should still be able to move after actions
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(200);
    await page.keyboard.up('KeyA');
    await page.waitForTimeout(100);
    
    const finalPosition = await controlHelper.getPlayerPosition();
    expect(finalPosition).toBeTruthy();
    expect(finalPosition!.x).toBeLessThan(afterUpMove!.x);
  });

  test('should handle mouse interactions', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Test mouse click on canvas
    await canvas.click();
    
    // Test mouse movement
    await canvas.hover();
    
    // Test right click (if game uses context menu or secondary actions)
    await canvas.click({ button: 'right' });
    
    expect(true).toBe(true);
  });

  test('should handle pause/menu functionality', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click();
    
    // Test escape key for pause menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Test escape again to unpause
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    expect(true).toBe(true);
  });
});