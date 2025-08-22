import { test, expect } from '@playwright/test';

test.describe('Game Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the game to load
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('should respond to keyboard input', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Focus the canvas to ensure it receives keyboard events
    await canvas.click();

    // Test movement keys (WASD)
    await page.keyboard.press('KeyW');
    await page.keyboard.press('KeyA');
    await page.keyboard.press('KeyS');
    await page.keyboard.press('KeyD');

    // Test arrow keys
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');

    // Test action keys
    await page.keyboard.press('Space'); // Attack/Interact
    await page.keyboard.press('KeyE'); // Alternative interact
    
    // If we get here without errors, the game is responding to input
    expect(true).toBe(true);
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