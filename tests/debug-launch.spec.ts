import { test, expect } from '@playwright/test';

test.describe('Debug Game Launch', () => {
  test('debug what is loaded', async ({ page }) => {
    // Capture console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Go to the game
    await page.goto('/');

    // Wait a bit for things to load
    await page.waitForTimeout(3000);

    // Check what's in the page
    const title = await page.title();
    console.log('Page title:', title);

    const bodyHTML = await page.locator('body').innerHTML();
    console.log('Body HTML length:', bodyHTML.length);

    // Look for specific elements
    const app = page.locator('#app');
    const appExists = await app.count() > 0;
    console.log('App element exists:', appExists);

    if (appExists) {
      const appContent = await app.innerHTML();
      console.log('App content length:', appContent.length);
      console.log('App content preview:', appContent.substring(0, 200));
    }

    // Look for canvas
    const canvas = page.locator('canvas');
    const canvasCount = await canvas.count();
    console.log('Canvas count:', canvasCount);

    // Look for any divs with game-related classes
    const gameCanvas = page.locator('.game-canvas');
    const gameCanvasExists = await gameCanvas.count() > 0;
    console.log('Game canvas div exists:', gameCanvasExists);

    // Print console messages
    console.log('Console messages:', consoleMessages);
    console.log('Errors:', errors);

    // Just check that the page loaded
    expect(title).toContain('Echoes of Aeria');
  });
});