import { test, expect } from '@playwright/test';

test.describe('Game Initialization', () => {
  test('should initialize Phaser game successfully', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture network errors
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Go to the game
    await page.goto('/');

    // Wait for React app to load
    const app = page.locator('#app');
    await expect(app).toBeVisible();

    // Wait longer for Phaser to initialize
    await page.waitForTimeout(8000);

    // Check for canvas or loading state
    const canvas = page.locator('canvas');
    const loadingDiv = page.locator('.game-loading');
    const errorDiv = page.locator('.game-error');

    const canvasExists = await canvas.count() > 0;
    const loadingExists = await loadingDiv.count() > 0;
    const errorExists = await errorDiv.count() > 0;

    console.log('Canvas exists:', canvasExists);
    console.log('Loading exists:', loadingExists);
    console.log('Error exists:', errorExists);

    if (errorExists) {
      const errorText = await errorDiv.textContent();
      console.log('Error text:', errorText);
    }

    // Print recent console messages
    const recentMessages = consoleMessages.slice(-15);
    console.log('Recent console messages:', recentMessages);

    // Print network errors
    console.log('Network errors:', networkErrors);

    // Check game container
    const gameContainer = page.locator('.game-canvas');
    const gameContainerExists = await gameContainer.count() > 0;
    console.log('Game container exists:', gameContainerExists);

    if (gameContainerExists) {
      const containerContent = await gameContainer.innerHTML();
      console.log('Container content length:', containerContent.length);
      console.log('Container content preview:', containerContent.substring(0, 200));
    }

    // Check page title
    await expect(page).toHaveTitle(/Echoes of Aeria/);

    // Either canvas should exist or we should be in loading state (not error)
    expect(canvasExists || (loadingExists && !errorExists)).toBe(true);
  });
});