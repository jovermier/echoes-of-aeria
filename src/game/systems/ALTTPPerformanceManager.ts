/**
 * ALTTP Performance Manager - Ensures 60 FPS performance for ALTTP systems
 * Monitors and optimizes rendering performance for authentic ALTTP experience
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
  spriteCount: number;
  tileCount: number;
}

export interface PerformanceSettings {
  targetFPS: number;
  maxSpriteCache: number;
  maxTileCache: number;
  enableCulling: boolean;
  enableSpritePooling: boolean;
  maxConcurrentSounds: number;
  pixelPerfectMode: boolean;
}

export class ALTTPPerformanceManager {
  private static instance: ALTTPPerformanceManager;
  
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    renderTime: 0,
    updateTime: 0,
    spriteCount: 0,
    tileCount: 0
  };
  
  private settings: PerformanceSettings = {
    targetFPS: 60,
    maxSpriteCache: 256,
    maxTileCache: 512,
    enableCulling: true,
    enableSpritePooling: true,
    maxConcurrentSounds: 8,
    pixelPerfectMode: true
  };
  
  private frameTimeHistory: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;
  private renderStartTime = 0;
  private updateStartTime = 0;
  
  // Performance monitoring callbacks
  private onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
  private onPerformanceWarning?: (warning: string, metrics: PerformanceMetrics) => void;
  
  // Object pools for performance
  private spritePool: Map<string, HTMLCanvasElement[]> = new Map();
  private tileCache: Map<string, HTMLCanvasElement> = new Map();
  private activeSprites: Set<string> = new Set();

  private constructor() {
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): ALTTPPerformanceManager {
    if (!this.instance) {
      this.instance = new ALTTPPerformanceManager();
    }
    return this.instance;
  }

  private initializePerformanceMonitoring(): void {
    // Start performance monitoring loop
    const monitor = () => {
      this.updateFPS();
      this.updateMemoryUsage();
      this.checkPerformanceWarnings();
      requestAnimationFrame(monitor);
    };
    requestAnimationFrame(monitor);
  }

  public startFrameTiming(): void {
    this.renderStartTime = performance.now();
  }

  public startUpdateTiming(): void {
    this.updateStartTime = performance.now();
  }

  public endUpdateTiming(): void {
    this.metrics.updateTime = performance.now() - this.updateStartTime;
  }

  public endFrameTiming(): void {
    const currentTime = performance.now();
    this.metrics.renderTime = currentTime - this.renderStartTime;
    
    // Track frame time
    const frameTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    if (frameTime > 0) {
      this.frameTimeHistory.push(frameTime);
      if (this.frameTimeHistory.length > 60) {
        this.frameTimeHistory.shift();
      }
      this.metrics.frameTime = frameTime;
    }
  }

  private updateFPS(): void {
    const currentTime = performance.now();
    this.frameCount++;
    
    // Update FPS every second
    if (currentTime >= this.fpsUpdateTime + 1000) {
      this.metrics.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
      
      // Trigger update callback
      if (this.onPerformanceUpdate) {
        this.onPerformanceUpdate(this.metrics);
      }
    }
  }

  private updateMemoryUsage(): void {
    // Estimate memory usage from cached objects
    this.metrics.spriteCount = this.activeSprites.size;
    this.metrics.tileCount = this.tileCache.size;
    
    // Rough memory estimation (in MB)
    const spriteMemory = this.metrics.spriteCount * 0.004; // ~4KB per sprite
    const tileMemory = this.metrics.tileCount * 0.001;     // ~1KB per tile
    this.metrics.memoryUsage = spriteMemory + tileMemory;
  }

  private checkPerformanceWarnings(): void {
    const warnings: string[] = [];
    
    // Check FPS
    if (this.metrics.fps < this.settings.targetFPS * 0.8) {
      warnings.push(`Low FPS: ${this.metrics.fps}/${this.settings.targetFPS}`);
    }
    
    // Check frame time
    if (this.metrics.frameTime > 20) {
      warnings.push(`High frame time: ${this.metrics.frameTime.toFixed(2)}ms`);
    }
    
    // Check render time
    if (this.metrics.renderTime > 12) {
      warnings.push(`High render time: ${this.metrics.renderTime.toFixed(2)}ms`);
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > 50) {
      warnings.push(`High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`);
    }
    
    // Check sprite count
    if (this.metrics.spriteCount > this.settings.maxSpriteCache * 0.8) {
      warnings.push(`High sprite count: ${this.metrics.spriteCount}`);
    }
    
    // Emit warnings
    if (warnings.length > 0 && this.onPerformanceWarning) {
      this.onPerformanceWarning(warnings.join(', '), this.metrics);
    }
  }

  // Sprite pooling for performance
  public getSpriteFromPool(spriteKey: string): HTMLCanvasElement | null {
    if (!this.settings.enableSpritePooling) return null;
    
    const pool = this.spritePool.get(spriteKey);
    if (pool && pool.length > 0) {
      return pool.pop() || null;
    }
    return null;
  }

  public returnSpriteToPool(spriteKey: string, sprite: HTMLCanvasElement): void {
    if (!this.settings.enableSpritePooling) return;
    
    if (!this.spritePool.has(spriteKey)) {
      this.spritePool.set(spriteKey, []);
    }
    
    const pool = this.spritePool.get(spriteKey)!;
    if (pool.length < 10) { // Limit pool size
      pool.push(sprite);
    }
  }

  // Tile caching for performance
  public getTileFromCache(tileKey: string): HTMLCanvasElement | null {
    return this.tileCache.get(tileKey) || null;
  }

  public cacheTile(tileKey: string, tile: HTMLCanvasElement): void {
    // Check cache size limit
    if (this.tileCache.size >= this.settings.maxTileCache) {
      // Remove oldest cached tile (simple LRU)
      const firstKey = this.tileCache.keys().next().value;
      if (firstKey) {
        this.tileCache.delete(firstKey);
      }
    }
    
    this.tileCache.set(tileKey, tile);
  }

  // Active sprite tracking
  public registerActiveSprite(spriteId: string): void {
    this.activeSprites.add(spriteId);
  }

  public unregisterActiveSprite(spriteId: string): void {
    this.activeSprites.delete(spriteId);
  }

  // Viewport culling check
  public isSpriteInViewport(x: number, y: number, width: number, height: number, 
                           cameraX: number, cameraY: number, 
                           viewportWidth: number, viewportHeight: number): boolean {
    if (!this.settings.enableCulling) return true;
    
    const screenX = x - cameraX;
    const screenY = y - cameraY;
    
    return (
      screenX + width > -32 &&
      screenX < viewportWidth + 32 &&
      screenY + height > -32 &&
      screenY < viewportHeight + 32
    );
  }

  // Pixel-perfect rendering optimization
  public optimizeCanvasForPixelArt(canvas: HTMLCanvasElement): void {
    if (!this.settings.pixelPerfectMode) return;
    
    const ctx = canvas.getContext('2d')!;
    
    // Disable image smoothing for pixel-perfect rendering
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;
    (ctx as any).oImageSmoothingEnabled = false;
    
    // Set pixel art CSS properties
    canvas.style.imageRendering = 'pixelated';
    canvas.style.imageRendering = '-moz-crisp-edges';
    canvas.style.imageRendering = 'crisp-edges';
  }

  // Performance settings
  public updateSettings(newSettings: Partial<PerformanceSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Event callbacks
  public onPerformanceUpdateCallback(callback: (metrics: PerformanceMetrics) => void): void {
    this.onPerformanceUpdate = callback;
  }

  public onPerformanceWarningCallback(callback: (warning: string, metrics: PerformanceMetrics) => void): void {
    this.onPerformanceWarning = callback;
  }

  // Cleanup methods
  public clearSpritePool(): void {
    this.spritePool.clear();
  }

  public clearTileCache(): void {
    this.tileCache.clear();
  }

  public clearActiveSprites(): void {
    this.activeSprites.clear();
  }

  // Auto-optimization methods
  public autoOptimize(): void {
    const avgFPS = this.getAverageFPS();
    
    if (avgFPS < this.settings.targetFPS * 0.8) {
      console.warn('ALTTPPerformanceManager: Low FPS detected, auto-optimizing...');
      
      // Reduce sprite cache
      if (this.settings.maxSpriteCache > 64) {
        this.settings.maxSpriteCache *= 0.8;
        console.log(`Reduced sprite cache to ${this.settings.maxSpriteCache}`);
      }
      
      // Clear sprite pools to free memory
      this.clearSpritePool();
      
      // Force garbage collection if available
      if ((window as any).gc) {
        (window as any).gc();
      }
    } else if (avgFPS > this.settings.targetFPS * 0.95) {
      // Performance is good, we can increase cache sizes
      if (this.settings.maxSpriteCache < 512) {
        this.settings.maxSpriteCache = Math.min(512, this.settings.maxSpriteCache * 1.1);
      }
    }
  }

  private getAverageFPS(): number {
    if (this.frameTimeHistory.length === 0) return 60;
    
    const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
    return 1000 / avgFrameTime;
  }

  // Debug methods
  public getPerformanceReport(): string {
    return [
      `ALTTP Performance Report:`,
      `FPS: ${this.metrics.fps}/${this.settings.targetFPS}`,
      `Frame Time: ${this.metrics.frameTime.toFixed(2)}ms`,
      `Render Time: ${this.metrics.renderTime.toFixed(2)}ms`,
      `Update Time: ${this.metrics.updateTime.toFixed(2)}ms`,
      `Memory Usage: ${this.metrics.memoryUsage.toFixed(2)}MB`,
      `Sprites: ${this.metrics.spriteCount}`,
      `Cached Tiles: ${this.metrics.tileCount}`,
      `Settings: ${JSON.stringify(this.settings)}`
    ].join('\n');
  }
}

// Export singleton instance
export const altttpPerformanceManager = ALTTPPerformanceManager.getInstance();