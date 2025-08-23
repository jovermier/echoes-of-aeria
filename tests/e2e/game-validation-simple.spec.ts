import { test, expect, Page } from '@playwright/test';

/**
 * Simple validation test to check basic game functionality
 */

test.describe('Basic ALTTP Game Validation', () => {
  test('should load and initialize the enhanced game correctly', async ({ page }) => {
    // Navigate to the enhanced game
    await page.goto('http://localhost:3000/enhanced-game.html');
    
    // Wait for canvas to appear
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait a bit for initialization
    await page.waitForTimeout(3000);
    
    // Check if game object exists
    const gameExists = await page.evaluate(() => {
      return typeof (window as any).game !== 'undefined';
    });
    
    console.log('Game exists:', gameExists);
    
    // Check canvas content
    const canvasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return false;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Check if canvas has any non-black pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a > 0 && (r > 0 || g > 0 || b > 0)) {
          return true; // Found content
        }
      }
      return false;
    });
    
    console.log('Canvas has content:', canvasContent);
    
    // Check if image smoothing is disabled
    const pixelPerfect = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      return ctx?.imageSmoothingEnabled === false;
    });
    
    console.log('Pixel perfect rendering:', pixelPerfect);
    
    // Basic assertions
    expect(gameExists).toBe(true);
    expect(canvasContent).toBe(true);
    expect(pixelPerfect).toBe(true);
  });

  test('should respond to player input', async ({ page }) => {
    await page.goto('http://localhost:3000/enhanced-game.html');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    
    // Get initial player position
    const initialPos = await page.evaluate(() => {
      const game = (window as any).game;
      return game?.player?.position ? { ...game.player.position } : null;
    });
    
    console.log('Initial position:', initialPos);
    
    // Send movement input
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowRight');
    
    // Wait for movement to process
    await page.waitForTimeout(200);
    
    // Get new position
    const newPos = await page.evaluate(() => {
      const game = (window as any).game;
      return game?.player?.position ? { ...game.player.position } : null;
    });
    
    console.log('New position:', newPos);
    
    // Player should have moved right
    if (initialPos && newPos) {
      expect(newPos.x).toBeGreaterThan(initialPos.x);
    }
  });

  test('should maintain stable frame rate', async ({ page }) => {
    await page.goto('http://localhost:3000/enhanced-game.html');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    
    // Monitor frame rate for 5 seconds
    const frameData = await page.evaluate(async () => {
      let frameCount = 0;
      const startTime = performance.now();
      
      return new Promise((resolve) => {
        const countFrames = () => {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - startTime >= 5000) {
            const fps = (frameCount / ((currentTime - startTime) / 1000));
            resolve({ fps: Math.round(fps), frameCount, duration: currentTime - startTime });
          } else {
            requestAnimationFrame(countFrames);
          }
        };
        requestAnimationFrame(countFrames);
      });
    });
    
    console.log('Frame data:', frameData);
    
    // Should maintain reasonable frame rate (at least 30 FPS)
    expect((frameData as any).fps).toBeGreaterThan(30);
  });
});