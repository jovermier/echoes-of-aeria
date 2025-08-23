import { test, expect, Page } from '@playwright/test';

/**
 * Debug test to understand why the game isn't loading
 */

test('Debug game loading issues', async ({ page }) => {
  const errors: string[] = [];
  const logs: string[] = [];
  
  // Capture console output
  page.on('console', (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });
  
  // Capture errors
  page.on('pageerror', (error) => {
    const errorMsg = `Page Error: ${error.message}`;
    errors.push(errorMsg);
    console.log(errorMsg);
  });
  
  // Navigate to enhanced game
  console.log('Navigating to enhanced game...');
  await page.goto('http://localhost:3000/enhanced-game.html');
  
  // Wait for initial loading
  await page.waitForTimeout(5000);
  
  // Check DOM structure
  const domInfo = await page.evaluate(() => {
    return {
      hasCanvas: !!document.querySelector('canvas'),
      canvasId: document.querySelector('canvas')?.id || 'none',
      canvasCount: document.querySelectorAll('canvas').length,
      scriptTags: document.querySelectorAll('script').length,
      gameObjectExists: typeof (window as any).game !== 'undefined',
      gameObjectType: typeof (window as any).game,
      windowKeys: Object.keys(window).filter(key => key.includes('game') || key.includes('Game'))
    };
  });
  
  console.log('DOM Info:', domInfo);
  
  // Check for module loading issues
  const moduleInfo = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return {
      moduleScripts: scripts.filter(s => s.type === 'module').length,
      srcScripts: scripts.filter(s => s.src).map(s => s.src),
      inlineScripts: scripts.filter(s => !s.src).length
    };
  });
  
  console.log('Module Info:', moduleInfo);
  
  // Try to manually check if modules are loading
  const moduleLoadTest = await page.evaluate(async () => {
    try {
      // Try to import the enhanced game module directly
      const module = await import('/src/echoes-enhanced.ts');
      return {
        success: true,
        exports: Object.keys(module)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });
  
  console.log('Module Load Test:', moduleLoadTest);
  
  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));
  
  console.log('\n=== ERRORS ===');
  errors.forEach(error => console.log(error));
  
  // The test should help us understand what's happening
  expect(domInfo.hasCanvas).toBe(true);
});