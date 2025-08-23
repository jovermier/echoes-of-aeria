import { test, expect } from '@playwright/test';

test.describe('Movement Jump Debug', () => {
  test('should track initial movement behavior with debug info', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    // Go to the enhanced game
    await page.goto('/enhanced-game.html');
    
    // Wait for game to load
    await page.waitForSelector('#gameCanvas');
    await page.waitForTimeout(2000); // Let game initialize fully
    
    // Clear any existing debug logs
    await page.evaluate(() => {
      const game = (window as any).game;
      if (game) {
        game.clearDebugLog();
      }
    });
    
    // Get initial state
    const initialState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getDebugInfo() : null;
    });
    
    console.log('Initial state:', JSON.stringify(initialState, null, 2));
    
    // Press W and immediately check movement
    await page.keyboard.down('w');
    await page.waitForTimeout(50); // Hold briefly
    
    // Get movement data during key press
    const duringMovement = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getDebugInfo() : null;
    });
    
    await page.keyboard.up('w');
    await page.waitForTimeout(100);
    
    // Get final state
    const finalState = await page.evaluate(() => {
      const game = (window as any).game;
      return game ? game.getDebugInfo() : null;
    });
    
    console.log('During W press:', JSON.stringify(duringMovement, null, 2));
    console.log('Final state:', JSON.stringify(finalState, null, 2));
    
    // Analyze movement data
    if (finalState?.movementLog) {
      const firstMovement = finalState.movementLog[0];
      const subsequentMovements = finalState.movementLog.slice(1, 5);
      
      console.log('First movement:', firstMovement);
      console.log('Next 4 movements:', subsequentMovements);
      
      // Check if first movement has abnormal deltaTime or distance
      if (firstMovement) {
        const firstDistance = Math.abs(firstMovement.position.y);
        console.log(`First movement distance: ${firstDistance}`);
        
        if (subsequentMovements.length > 0) {
          const avgSubsequentDelta = subsequentMovements.reduce((sum, m) => sum + m.deltaTime, 0) / subsequentMovements.length;
          console.log(`First deltaTime: ${firstMovement.deltaTime}, Avg subsequent: ${avgSubsequentDelta}`);
          
          if (firstMovement.deltaTime > avgSubsequentDelta * 2) {
            console.log('🚨 FOUND THE ISSUE: First movement has abnormally large deltaTime!');
          }
        }
      }
    }
    
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });
  
  test('should measure frame timing and deltaTime', async ({ page }) => {
    await page.goto('/enhanced-game.html');
    await page.waitForSelector('#gameCanvas');
    
    // Inject debugging code to capture frame timing
    const frameTimings = await page.evaluate(() => {
      return new Promise((resolve) => {
        const timings: number[] = [];
        let frameCount = 0;
        let lastTime = 0;
        
        const measureFrames = (currentTime: number) => {
          if (lastTime > 0) {
            const deltaTime = currentTime - lastTime;
            timings.push(deltaTime);
          }
          lastTime = currentTime;
          frameCount++;
          
          if (frameCount < 60) { // Measure first 60 frames
            requestAnimationFrame(measureFrames);
          } else {
            resolve(timings);
          }
        };
        
        requestAnimationFrame(measureFrames);
      });
    });
    
    console.log('Frame timings (first 60 frames):', frameTimings);
    
    // Check if there's a large spike in the first few frames
    const firstFewFrames = (frameTimings as number[]).slice(0, 5);
    const avgFrameTime = (frameTimings as number[]).slice(5, 30).reduce((a, b) => a + b, 0) / 25;
    
    console.log('First 5 frame times:', firstFewFrames);
    console.log('Average frame time (frames 5-30):', avgFrameTime);
    
    // Identify if first frame is significantly larger
    const firstFrameSpike = firstFewFrames[0] > avgFrameTime * 3;
    console.log('First frame spike detected:', firstFrameSpike);
  });
  
  test('should test keyboard input responsiveness', async ({ page }) => {
    await page.goto('/enhanced-game.html');
    await page.waitForSelector('#gameCanvas');
    await page.waitForTimeout(500);
    
    // Test rapid key presses to see movement behavior
    const testSequence = async (key: string, description: string) => {
      console.log(`Testing ${description}:`);
      
      // Quick tap
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
      
      // Short hold
      await page.keyboard.down(key);
      await page.waitForTimeout(200);
      await page.keyboard.up(key);
      await page.waitForTimeout(100);
      
      // Another quick tap
      await page.keyboard.press(key);
      await page.waitForTimeout(50);
    };
    
    await testSequence('w', 'W key (up movement)');
    await testSequence('s', 'S key (down movement)');
    await testSequence('a', 'A key (left movement)');
    await testSequence('d', 'D key (right movement)');
    
    // Test arrow keys for comparison
    await testSequence('ArrowUp', 'Arrow Up');
    await testSequence('ArrowDown', 'Arrow Down');
    await testSequence('ArrowLeft', 'Arrow Left');
    await testSequence('ArrowRight', 'Arrow Right');
  });
  
  test('should capture visual movement for analysis', async ({ page }) => {
    await page.goto('/enhanced-game.html');
    await page.waitForSelector('#gameCanvas');
    await page.waitForTimeout(1000);
    
    // Take screenshot before movement
    await page.screenshot({ path: 'test-results/before-movement.png' });
    
    // Press W and immediately screenshot
    await page.keyboard.down('w');
    await page.waitForTimeout(16); // One frame at 60fps
    await page.screenshot({ path: 'test-results/first-frame-w.png' });
    
    await page.waitForTimeout(32); // Two more frames
    await page.screenshot({ path: 'test-results/third-frame-w.png' });
    
    await page.keyboard.up('w');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'test-results/after-w-release.png' });
    
    // Test other directions for comparison
    await page.keyboard.down('s');
    await page.waitForTimeout(16);
    await page.screenshot({ path: 'test-results/first-frame-s.png' });
    await page.keyboard.up('s');
    
    console.log('Screenshots saved for visual analysis');
  });
});