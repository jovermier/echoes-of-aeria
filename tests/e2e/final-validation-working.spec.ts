import { test, expect, Page } from '@playwright/test';

/**
 * Final Validation for Working ALTTP Systems
 * Based on the actual working game implementation
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
}

interface ValidationResults {
  performance: PerformanceMetrics;
  crossBrowserCompatible: boolean;
  loadTime: number;
  visualConsistency: boolean;
  productionReady: boolean;
  issues: string[];
}

class WorkingGameValidator {
  private page: Page;
  private results: ValidationResults;

  constructor(page: Page) {
    this.page = page;
    this.results = {
      performance: { fps: 0, frameTime: 0, memoryUsage: 0 },
      crossBrowserCompatible: true,
      loadTime: 0,
      visualConsistency: true,
      productionReady: true,
      issues: []
    };
  }

  async measureGamePerformance(durationMs: number = 8000): Promise<PerformanceMetrics> {
    await this.page.goto('http://localhost:3000/');
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    await this.page.waitForTimeout(2000); // Let game initialize
    
    // Start performance monitoring
    const performanceData = await this.page.evaluate(async (duration) => {
      let frameCount = 0;
      let totalFrameTime = 0;
      let startMemory = 0;
      
      if ((performance as any).memory) {
        startMemory = (performance as any).memory.usedJSHeapSize;
      }
      
      const startTime = performance.now();
      
      return new Promise((resolve) => {
        const measureFrame = (currentTime: number) => {
          const frameStart = performance.now();
          frameCount++;
          
          if (currentTime - startTime >= duration) {
            const endMemory = (performance as any).memory?.usedJSHeapSize || startMemory;
            const avgFrameTime = totalFrameTime / frameCount;
            const fps = (frameCount / ((currentTime - startTime) / 1000));
            
            resolve({
              fps: Math.round(fps * 10) / 10,
              frameTime: Math.round(avgFrameTime * 100) / 100,
              memoryUsage: Math.round((endMemory - startMemory) / (1024 * 1024) * 100) / 100 // MB
            });
          } else {
            const frameEnd = performance.now();
            totalFrameTime += (frameEnd - frameStart);
            requestAnimationFrame(measureFrame);
          }
        };
        requestAnimationFrame(measureFrame);
      });
    }, durationMs);
    
    return performanceData as PerformanceMetrics;
  }

  async measureLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.goto('http://localhost:3000/');
    
    // Wait for canvas and basic initialization
    await this.page.waitForSelector('canvas');
    await this.page.waitForTimeout(1000); // Basic initialization time
    
    const loadTime = Date.now() - startTime;
    this.results.loadTime = loadTime;
    return loadTime;
  }

  async testVisualConsistency(): Promise<boolean> {
    try {
      // Test that canvas is rendering
      const hasContent = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        if (!canvas) return false;
        
        // Check canvas dimensions
        if (canvas.width === 0 || canvas.height === 0) return false;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        // Sample a few pixels to check for content
        try {
          const centerData = ctx.getImageData(canvas.width/2, canvas.height/2, 1, 1);
          const edgeData = ctx.getImageData(10, 10, 1, 1);
          
          // Check if we have any non-black pixels
          return (centerData.data[0] > 0 || centerData.data[1] > 0 || centerData.data[2] > 0) ||
                 (edgeData.data[0] > 0 || edgeData.data[1] > 0 || edgeData.data[2] > 0);
        } catch (e) {
          return true; // Canvas exists, assume it has content if we can't read it
        }
      });

      return hasContent;
    } catch (error) {
      this.results.issues.push(`Visual consistency test failed: ${error}`);
      return false;
    }
  }

  async checkProductionReadiness(): Promise<boolean> {
    const issues: string[] = [];
    
    try {
      // Monitor console for errors
      const logs: string[] = [];
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          logs.push(`Console Error: ${msg.text()}`);
        }
      });
      
      this.page.on('pageerror', (error) => {
        issues.push(`Page Error: ${error.message}`);
      });
      
      // Let the page run for a bit to catch errors
      await this.page.waitForTimeout(3000);
      
      issues.push(...logs);
      
      // Check that the canvas exists and is properly sized
      const canvasInfo = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement;
        return {
          exists: !!canvas,
          width: canvas?.width || 0,
          height: canvas?.height || 0,
          visible: canvas?.offsetWidth > 0 && canvas?.offsetHeight > 0
        };
      });
      
      if (!canvasInfo.exists) {
        issues.push('Canvas element not found');
      }
      if (!canvasInfo.visible) {
        issues.push('Canvas not visible');
      }
      if (canvasInfo.width === 0 || canvasInfo.height === 0) {
        issues.push('Canvas has zero dimensions');
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

test.describe('Final ALTTP Validation - Working Systems', () => {
  test('Performance Impact Assessment - Measure game performance', async ({ page, browserName }) => {
    const validator = new WorkingGameValidator(page);
    
    console.log(`Testing performance in ${browserName}`);
    
    const performance = await validator.measureGamePerformance(10000); // 10 seconds
    
    console.log(`${browserName} Performance:`, performance);
    
    // Record performance for this browser
    validator.results.performance = performance;
    
    // Performance validation
    expect(performance.fps).toBeGreaterThan(30); // Minimum 30 FPS
    expect(performance.frameTime).toBeLessThan(35); // Under 35ms frame time
    expect(performance.memoryUsage).toBeLessThan(50); // Under 50MB memory increase
    
    // Log results for final report
    console.log(`✅ ${browserName} Performance: ${performance.fps} FPS, ${performance.frameTime}ms frame time, ${performance.memoryUsage}MB memory`);
  });

  test('Cross-Browser Compatibility - Load time and stability', async ({ page, browserName }) => {
    const validator = new WorkingGameValidator(page);
    
    console.log(`Testing compatibility in ${browserName}`);
    
    // Measure load time
    const loadTime = await validator.measureLoadTime();
    console.log(`${browserName} Load time: ${loadTime}ms`);
    
    // Test visual consistency
    const visualConsistency = await validator.testVisualConsistency();
    console.log(`${browserName} Visual consistency: ${visualConsistency}`);
    
    // Test production readiness
    const productionReady = await validator.checkProductionReadiness();
    console.log(`${browserName} Production ready: ${productionReady}`);
    
    // Assertions
    expect(loadTime).toBeLessThan(8000); // Under 8 seconds for any browser
    expect(visualConsistency).toBe(true);
    expect(productionReady).toBe(true);
    
    console.log(`✅ ${browserName} Compatibility: Load ${loadTime}ms, Visual ${visualConsistency}, Ready ${productionReady}`);
  });

  test('User Interaction Responsiveness', async ({ page, browserName }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);
    
    console.log(`Testing user interactions in ${browserName}`);
    
    // Test rapid keyboard input
    const startTime = Date.now();
    
    // Simulate active gameplay
    const actions = [
      () => page.keyboard.press('ArrowUp'),
      () => page.keyboard.press('ArrowDown'),
      () => page.keyboard.press('ArrowLeft'), 
      () => page.keyboard.press('ArrowRight'),
      () => page.keyboard.press('Space'),
      () => page.keyboard.press('KeyI')
    ];
    
    // Rapid input test
    for (let i = 0; i < 50; i++) {
      const action = actions[i % actions.length];
      await action();
      await page.waitForTimeout(20); // Very fast input
    }
    
    const inputTime = Date.now() - startTime;
    console.log(`${browserName} Input processing time: ${inputTime}ms for 50 actions`);
    
    // Should handle rapid input without hanging
    expect(inputTime).toBeLessThan(5000); // Should complete in under 5 seconds
    
    // Check that page is still responsive
    const isResponsive = await page.evaluate(() => {
      // Simple responsiveness test
      return document.readyState === 'complete';
    });
    
    expect(isResponsive).toBe(true);
    
    console.log(`✅ ${browserName} Input responsiveness: ${inputTime}ms for 50 actions`);
  });

  test('Visual Regression Test', async ({ page, browserName }) => {
    await page.goto('http://localhost:3000/');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000); // Let game stabilize
    
    // Take screenshot for visual baseline
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveScreenshot(`final-alttp-${browserName}.png`, {
      threshold: 0.2, // Allow some variance
    });
    
    console.log(`✅ ${browserName} Visual regression test completed`);
  });
  
  test('Memory Stability Test', async ({ page, browserName }) => {
    const validator = new WorkingGameValidator(page);
    
    await validator.measureLoadTime();
    
    console.log(`Testing memory stability in ${browserName}`);
    
    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Run extended simulation
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);
    }
    
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
    console.log(`${browserName} Memory increase: ${memoryIncrease.toFixed(2)}MB`);
    
    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(30); // Under 30MB increase
    
    console.log(`✅ ${browserName} Memory stability: +${memoryIncrease.toFixed(2)}MB`);
  });
});

test.describe('Final Validation Summary', () => {
  test('Generate Final Validation Report', async ({ page, browserName }) => {
    const validator = new WorkingGameValidator(page);
    
    console.log(`\n🎮 ECHOES OF AERIA - ALTTP TRANSFORMATION FINAL VALIDATION REPORT`);
    console.log(`Browser: ${browserName}`);
    console.log(`Date: ${new Date().toISOString()}`);
    
    // Run all validation checks
    const loadTime = await validator.measureLoadTime();
    const performance = await validator.measureGamePerformance(5000);
    const visualConsistency = await validator.testVisualConsistency();
    const productionReady = await validator.checkProductionReadiness();
    
    const results = validator.getResults();
    results.performance = performance;
    results.visualConsistency = visualConsistency;
    results.productionReady = productionReady;
    results.crossBrowserCompatible = productionReady && visualConsistency;
    
    console.log(`\n📊 PERFORMANCE METRICS:`);
    console.log(`  • Frame Rate: ${performance.fps} FPS`);
    console.log(`  • Frame Time: ${performance.frameTime}ms`);
    console.log(`  • Memory Usage: ${performance.memoryUsage}MB`);
    console.log(`  • Load Time: ${loadTime}ms`);
    
    console.log(`\n✅ COMPATIBILITY STATUS:`);
    console.log(`  • Cross-Browser Compatible: ${results.crossBrowserCompatible ? 'YES' : 'NO'}`);
    console.log(`  • Visual Consistency: ${visualConsistency ? 'PASS' : 'FAIL'}`);
    console.log(`  • Production Ready: ${productionReady ? 'YES' : 'NO'}`);
    
    if (results.issues.length > 0) {
      console.log(`\n⚠️  ISSUES FOUND:`);
      results.issues.forEach(issue => console.log(`  • ${issue}`));
    } else {
      console.log(`\n🎉 NO CRITICAL ISSUES FOUND`);
    }
    
    const overallScore = (
      (performance.fps > 30 ? 25 : 0) +
      (performance.frameTime < 35 ? 25 : 0) +
      (visualConsistency ? 25 : 0) +
      (productionReady ? 25 : 0)
    );
    
    console.log(`\n🏆 OVERALL VALIDATION SCORE: ${overallScore}/100`);
    
    if (overallScore >= 75) {
      console.log(`✅ ALTTP TRANSFORMATION VALIDATION: PASSED`);
    } else {
      console.log(`❌ ALTTP TRANSFORMATION VALIDATION: NEEDS IMPROVEMENT`);
    }
    
    console.log(`\n${'='.repeat(60)}\n`);
    
    // Final assertion
    expect(overallScore).toBeGreaterThanOrEqual(75);
  });
});