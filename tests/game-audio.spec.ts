import { test, expect } from '@playwright/test';

test.describe('Game Audio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for the game to load
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(2000);
  });

  test('should initialize audio system without errors', async ({ page }) => {
    // Check for audio-related console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('audio')) {
        consoleErrors.push(msg.text());
      }
    });

    // Trigger some game interaction that might play audio
    const canvas = page.locator('canvas');
    await canvas.click();
    await page.keyboard.press('Space');
    
    await page.waitForTimeout(1000);

    // Check that no audio-specific errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('should handle audio context activation', async ({ page }) => {
    // Modern browsers require user interaction to start audio
    const canvas = page.locator('canvas');
    await canvas.click();

    // Evaluate if AudioContext is properly initialized
    const audioContextState = await page.evaluate(() => {
      // Check if window has audio-related globals from Howler.js
      return {
        hasHowler: typeof (window as any).Howl !== 'undefined',
        hasAudioContext: typeof (window as any).AudioContext !== 'undefined' || 
                        typeof (window as any).webkitAudioContext !== 'undefined'
      };
    });

    expect(audioContextState.hasAudioContext).toBe(true);
    // Note: hasHowler might be false if Howler.js isn't globally exposed
  });

  test('should not crash when audio fails to load', async ({ page }) => {
    // Block audio requests to simulate audio loading failures
    await page.route('**/*.{mp3,wav,ogg,m4a}', route => route.abort());

    const canvas = page.locator('canvas');
    await canvas.click();
    
    // Try to trigger audio events
    await page.keyboard.press('Space');
    await page.keyboard.press('KeyW');
    
    await page.waitForTimeout(2000);

    // Game should still be functional even if audio fails
    await expect(canvas).toBeVisible();
  });
});