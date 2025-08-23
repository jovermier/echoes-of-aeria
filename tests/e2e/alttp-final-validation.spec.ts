import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive Final Validation for ALTTP Transformation
 * Tests performance, cross-browser compatibility, and production readiness
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
}

interface ValidationResults {
  performance: PerformanceMetrics;
  crossBrowserCompatible: boolean;
  loadTime: number;
  visualConsistency: boolean;
  productionReady: boolean;
  issues: string[];
}

class ALTTPValidator {
  private page: Page;
  private results: ValidationResults;

  constructor(page: Page) {
    this.page = page;
    this.results = {
      performance: { fps: 0, frameTime: 0, memoryUsage: 0, renderTime: 0, updateTime: 0 },
      crossBrowserCompatible: true,
      loadTime: 0,
      visualConsistency: true,
      productionReady: true,
      issues: []
    };
  }

  async measureGamePerformance(durationMs: number = 10000): Promise<PerformanceMetrics> {
    // Inject performance monitoring script
    await this.page.addInitScript(() => {
      (window as any).performanceMetrics = {
        frameCount: 0,
        totalFrameTime: 0,
        totalRenderTime: 0,
        totalUpdateTime: 0,
        startTime: performance.now(),
        lastFrameTime: 0
      };

      // Override requestAnimationFrame to track performance
      const originalRAF = window.requestAnimationFrame;
      (window as any).requestAnimationFrame = function(callback: FrameRequestCallback) {
        return originalRAF(function(time: number) {
          const metrics = (window as any).performanceMetrics;
          const frameStart = performance.now();
          
          // Call original callback
          callback(time);
          
          const frameEnd = performance.now();
          const frameTime = frameEnd - frameStart;
          
          metrics.frameCount++;
          metrics.totalFrameTime += frameTime;
          metrics.lastFrameTime = frameTime;
        });
      };
    });

    await this.page.goto('http://localhost:3000/enhanced-game.html');
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    
    // Wait for game to fully initialize
    await this.page.waitForTimeout(2000);

    // Start monitoring
    const startTime = Date.now();
    
    // Simulate active gameplay for performance measurement
    await this.simulateActiveGameplay(durationMs);
    
    // Collect performance metrics
    const metrics = await this.page.evaluate(() => {
      const perfMetrics = (window as any).performanceMetrics;
      const memoryInfo = (performance as any).memory;
      
      return {
        frameCount: perfMetrics.frameCount,
        totalFrameTime: perfMetrics.totalFrameTime,
        totalRenderTime: perfMetrics.totalRenderTime,
        totalUpdateTime: perfMetrics.totalUpdateTime,
        memoryUsed: memoryInfo ? memoryInfo.usedJSHeapSize : 0,
        duration: Date.now() - perfMetrics.startTime
      };
    });

    const avgFPS = (metrics.frameCount / (metrics.duration / 1000));
    const avgFrameTime = metrics.totalFrameTime / metrics.frameCount;

    return {
      fps: Math.round(avgFPS * 10) / 10,
      frameTime: Math.round(avgFrameTime * 100) / 100,
      memoryUsage: Math.round(metrics.memoryUsed / (1024 * 1024) * 100) / 100, // MB
      renderTime: Math.round((metrics.totalRenderTime / metrics.frameCount) * 100) / 100,
      updateTime: Math.round((metrics.totalUpdateTime / metrics.frameCount) * 100) / 100
    };
  }

  private async simulateActiveGameplay(duration: number): Promise<void> {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      // Simulate player movement
      await this.page.keyboard.down('ArrowRight');
      await this.page.waitForTimeout(500);
      await this.page.keyboard.up('ArrowRight');
      
      await this.page.keyboard.down('ArrowDown');
      await this.page.waitForTimeout(300);
      await this.page.keyboard.up('ArrowDown');
      
      // Simulate combat
      await this.page.keyboard.press('Space');
      await this.page.waitForTimeout(200);
      
      // Simulate realm switching (if available)
      await this.page.keyboard.press('KeyE');
      await this.page.waitForTimeout(400);
      
      await this.page.keyboard.down('ArrowLeft');
      await this.page.waitForTimeout(400);
      await this.page.keyboard.up('ArrowLeft');
      
      await this.page.keyboard.down('ArrowUp');
      await this.page.waitForTimeout(300);
      await this.page.keyboard.up('ArrowUp');
    }
  }

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.goto('http://localhost:3000/enhanced-game.html');
    
    // Wait for canvas to appear and be ready
    await this.page.waitForSelector('canvas');
    
    // Wait for game to be fully loaded (check for game object)
    await this.page.waitForFunction(() => {
      return (window as any).game !== undefined;
    }, { timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    this.results.loadTime = loadTime;
    
    return loadTime;
  }

  async testVisualConsistency(): Promise<boolean> {
    try {
      // Test that canvas is rendering content
      const hasContent = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return false;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Check if canvas has non-transparent pixels
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 0) return true; // Found non-transparent pixel
        }
        return false;
      });

      if (!hasContent) {
        this.results.issues.push('Canvas appears to be empty or not rendering');
        return false;
      }

      // Check for pixel-perfect rendering
      const pixelPerfect = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        return ctx?.imageSmoothingEnabled === false;
      });

      if (!pixelPerfect) {
        this.results.issues.push('Canvas image smoothing is enabled (should be disabled for pixel-perfect ALTTP style)');
      }

      return hasContent && pixelPerfect;
    } catch (error) {
      this.results.issues.push(`Visual consistency test failed: ${error}`);
      return false;
    }
  }

  async checkProductionReadiness(): Promise<boolean> {
    const issues: string[] = [];

    try {
      // Check for console errors
      const logs: string[] = [];
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          logs.push(`Console Error: ${msg.text()}`);
        }
      });

      await this.page.waitForTimeout(5000); // Give time for any errors to appear

      if (logs.length > 0) {
        issues.push(...logs);
      }

      // Check for unhandled promise rejections
      this.page.on('pageerror', (error) => {
        issues.push(`Unhandled Error: ${error.message}`);
      });

      // Check game object is properly initialized
      const gameInitialized = await this.page.evaluate(() => {
        return (window as any).game && typeof (window as any).game === 'object';
      });

      if (!gameInitialized) {
        issues.push('Game object not properly initialized');
      }

      // Check that key game systems are working
      const systemsWorking = await this.page.evaluate(() => {
        const game = (window as any).game;
        if (!game) return false;
        
        // Check if player exists and has proper structure
        return game.player && 
               typeof game.player.position === 'object' &&
               typeof game.player.health === 'number';
      });

      if (!systemsWorking) {
        issues.push('Core game systems not functioning properly');
      }

      this.results.issues.push(...issues);
      return issues.length === 0;
    } catch (error) {
      issues.push(`Production readiness check failed: ${error}`);
      this.results.issues.push(...issues);
      return false;
    }
  }

  getResults(): ValidationResults {
    return this.results;
  }
}

test.describe('ALTTP Final Validation - Performance Impact Assessment', () => {
  test('should maintain 60 FPS target with all ALTTP systems active', async ({ page }) => {
    const validator = new ALTTPValidator(page);
    
    const performance = await validator.measureGamePerformance(15000); // 15 seconds
    
    console.log('Performance Metrics:', performance);
    
    // Validate 60 FPS target (allow some variance)
    expect(performance.fps).toBeGreaterThan(55);
    expect(performance.fps).toBeLessThan(65);
    
    // Frame time should be under 16.67ms for 60 FPS
    expect(performance.frameTime).toBeLessThan(20);
    
    // Memory usage should be reasonable (less than 100MB)
    expect(performance.memoryUsage).toBeLessThan(100);
    
    validator.results.performance = performance;
  });

  test('should handle extended gameplay without performance degradation', async ({ page }) => {
    const validator = new ALTTPValidator(page);
    
    // Measure performance in multiple intervals
    const shortTest = await validator.measureGamePerformance(5000);
    await page.waitForTimeout(2000);
    const longTest = await validator.measureGamePerformance(10000);
    
    console.log('Short test FPS:', shortTest.fps);
    console.log('Long test FPS:', longTest.fps);
    
    // Performance should not degrade significantly over time
    const performanceDrop = shortTest.fps - longTest.fps;
    expect(performanceDrop).toBeLessThan(10); // Less than 10 FPS drop
    
    // Memory usage should not increase dramatically
    const memoryIncrease = longTest.memoryUsage - shortTest.memoryUsage;
    expect(memoryIncrease).toBeLessThan(20); // Less than 20MB increase
  });

  test('should have acceptable load times', async ({ page }) => {
    const validator = new ALTTPValidator(page);
    
    const loadTime = await validator.measureLoadTime();
    
    console.log('Load time:', loadTime, 'ms');
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Should load within 3 seconds for good user experience
    if (loadTime > 3000) {
      console.warn('Load time exceeds 3 seconds - consider optimization');
    }
  });
});

test.describe('ALTTP Final Validation - Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach((browserName) => {
    test(`should work correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
      test.skip(currentBrowser !== browserName, `Skipping ${browserName} test`);
      
      const validator = new ALTTPValidator(page);
      
      // Test load time
      const loadTime = await validator.measureLoadTime();
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for any browser
      
      // Test visual consistency
      const visualConsistency = await validator.testVisualConsistency();
      expect(visualConsistency).toBe(true);
      
      // Test basic performance
      const performance = await validator.measureGamePerformance(5000);
      expect(performance.fps).toBeGreaterThan(30); // Minimum acceptable FPS
      
      // Test production readiness
      const productionReady = await validator.checkProductionReadiness();
      expect(productionReady).toBe(true);
      
      console.log(`${browserName} Results:`, validator.getResults());
    });
  });

  test('should have consistent visual rendering across browsers', async ({ page }) => {
    const validator = new ALTTPValidator(page);
    
    await validator.measureLoadTime();
    await page.waitForTimeout(3000); // Let game stabilize
    
    // Take screenshot for visual consistency check
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot(`alttp-final-${test.info().project.name}.png`, {
      threshold: 0.3, // Allow some browser differences
    });
  });
});

test.describe('ALTTP Final Validation - Production Readiness', () => {
  test('should pass all production readiness checks', async ({ page }) => {
    const validator = new ALTTPValidator(page);
    
    // Load the game
    await validator.measureLoadTime();
    
    // Run comprehensive checks
    const visualConsistency = await validator.testVisualConsistency();
    const productionReady = await validator.checkProductionReadiness();
    const performance = await validator.measureGamePerformance(8000);
    
    // Validate all systems
    expect(visualConsistency).toBe(true);
    expect(productionReady).toBe(true);
    expect(performance.fps).toBeGreaterThan(50);
    
    const results = validator.getResults();
    
    // Log comprehensive results
    console.log('=== ALTTP FINAL VALIDATION RESULTS ===');
    console.log('Performance:', results.performance);
    console.log('Load Time:', results.loadTime, 'ms');
    console.log('Visual Consistency:', results.visualConsistency);
    console.log('Production Ready:', results.productionReady);
    
    if (results.issues.length > 0) {
      console.log('Issues Found:');
      results.issues.forEach(issue => console.log('  -', issue));
    } else {
      console.log('✅ No issues found - ALTTP transformation validation PASSED');
    }
    
    // Final assertion
    expect(results.issues.length).toBe(0);
  });

  test('should handle user interactions smoothly', async ({ page }) => {
    await page.goto('http://localhost:3000/enhanced-game.html');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);
    
    // Test rapid key presses don't cause issues
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(20);
    }
    
    // Test simultaneous key presses
    await page.keyboard.down('ArrowUp');
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('Space');
    await page.waitForTimeout(500);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.up('ArrowRight');
    await page.keyboard.up('Space');
    
    // Verify game is still responsive
    const gameResponsive = await page.evaluate(() => {
      return (window as any).game && typeof (window as any).game.frameCount === 'number';
    });
    
    expect(gameResponsive).toBe(true);
  });
});

test.describe('ALTTP Final Validation - Memory and Resource Management', () => {
  test('should not have memory leaks during extended play', async ({ page }) => {
    const validator = new ALTTPValidator(page);
    
    await validator.measureLoadTime();
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Simulate extended gameplay
    await validator.simulateActiveGameplay(20000); // 20 seconds
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Get final memory
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB
    
    console.log('Memory increase:', memoryIncrease, 'MB');
    
    // Memory increase should be minimal (less than 50MB for extended play)
    expect(memoryIncrease).toBeLessThan(50);
  });

  test('should efficiently manage canvas operations', async ({ page }) => {
    await page.goto('http://localhost:3000/enhanced-game.html');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);
    
    const canvasEfficiency = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return false;
      
      // Check that image smoothing is disabled for pixel perfect rendering
      return ctx.imageSmoothingEnabled === false;
    });
    
    expect(canvasEfficiency).toBe(true);
  });
});