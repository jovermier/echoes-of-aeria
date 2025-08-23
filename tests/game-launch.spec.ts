import { test, expect } from '@playwright/test';

test.describe('Game Launch', () => {
  test('should load the game without errors', async ({ page }) => {
    // Go to the game
    await page.goto('/');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Echoes of Aeria/);

    // Wait for the game to load - check for React app container
    const app = page.locator('#app');
    await expect(app).toBeVisible();
    
    // Wait for game canvas to be created by Phaser
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Check that no console errors occurred during load
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit for the game to initialize
    await page.waitForTimeout(2000);

    // Assert no critical console errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('DevTools') // Ignore DevTools warnings
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should display game canvas with correct dimensions', async ({ page }) => {
    await page.goto('/');

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check canvas has reasonable dimensions
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(0);
    expect(canvasBox?.height).toBeGreaterThan(0);
  });
});