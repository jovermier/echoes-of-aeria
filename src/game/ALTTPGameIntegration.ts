/**
 * ALTTP Game Integration - Final integration of all ALTTP systems
 * Connects all ALTTP components into a cohesive authentic experience
 */

import { spriteManager } from './systems/SpriteManager.js';
import { altttpPerformanceManager } from './systems/ALTTPPerformanceManager.js';
import { ALTTP_PALETTE, TILE_SIZE, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '@shared/constants.js';
import { gameEvents } from '@shared/events.js';
import type { GameState, PlayerData } from '@shared/types.js';

export interface ALTTPGameConfig {
  canvas: HTMLCanvasElement;
  enablePerformanceMonitoring: boolean;
  enablePixelPerfect: boolean;
  targetFPS: number;
}

export class ALTTPGameIntegration {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState = 'playing';
  private isInitialized = false;
  
  // Game state
  private player: PlayerData = {
    position: { x: 80 * TILE_SIZE, y: 110 * TILE_SIZE },
    health: 6,
    maxHealth: 6,
    direction: 'down',
    isMoving: false,
    isAttacking: false,
    inventory: {
      sunflame_lantern: true,
      gale_boots: false,
      riverfin_vest: false,
      aether_mirror: false,
      storm_disk: false,
      quake_maul: false,
      tide_hook: false,
      sunflame_prism: false,
      kingsbane_sigil: false,
      aether_shards: 0,
      keys: {},
      heart_pieces: 0,
      rumor_cards: 0
    },
    animationFrame: 0,
    animationTimer: 0,
    gleam: 0
  };
  
  private camera = { x: 0, y: 0 };
  private keys: Set<string> = new Set();
  private lastTime = 0;

  constructor(config: ALTTPGameConfig) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Configure canvas for pixel-perfect ALTTP rendering
    this.setupCanvas();
    
    // Configure performance monitoring
    if (config.enablePerformanceMonitoring) {
      this.setupPerformanceMonitoring();
    }
    
    // Configure ALTTP performance settings
    altttpPerformanceManager.updateSettings({
      targetFPS: config.targetFPS || 60,
      pixelPerfectMode: config.enablePixelPerfect !== false,
      enableCulling: true,
      enableSpritePooling: true,
      maxConcurrentSounds: 8
    });
  }

  private setupCanvas(): void {
    // Set canvas size for ALTTP viewport
    this.canvas.width = VIEWPORT_WIDTH * TILE_SIZE;
    this.canvas.height = VIEWPORT_HEIGHT * TILE_SIZE;
    
    // Apply pixel-perfect optimizations
    altttpPerformanceManager.optimizeCanvasForPixelArt(this.canvas);
    
    // Set canvas styles for ALTTP aesthetic
    this.canvas.style.background = ALTTP_PALETTE.BG_DARK;
    this.canvas.style.border = `2px solid ${ALTTP_PALETTE.BORDER_MEDIUM}`;
    this.canvas.style.boxShadow = `0 0 20px ${ALTTP_PALETTE.BORDER_DARK}`;
  }

  private setupPerformanceMonitoring(): void {
    // Performance update callback
    altttpPerformanceManager.onPerformanceUpdateCallback((metrics) => {
      gameEvents.emit({
        type: 'system.performance.update',
        payload: {
          fps: metrics.fps,
          frameTime: metrics.frameTime,
          memoryUsage: metrics.memoryUsage,
          renderTime: metrics.renderTime,
          updateTime: metrics.updateTime,
          spriteCount: metrics.spriteCount
        },
        timestamp: Date.now()
      });
    });

    // Performance warning callback
    altttpPerformanceManager.onPerformanceWarningCallback((warning, metrics) => {
      console.warn('ALTTP Performance Warning:', warning);
      gameEvents.emit({
        type: 'system.performance.warning',
        payload: { warning, metrics },
        timestamp: Date.now()
      });
      
      // Auto-optimize on performance issues
      altttpPerformanceManager.autoOptimize();
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing ALTTP Game Integration...');
    
    try {
      // Initialize sprite manager with ALTTP systems
      console.log('Loading ALTTP sprite systems...');
      await this.initializeALTTPSprites();
      
      // Setup input handling
      this.setupInputHandling();
      
      // Start game loop
      this.startGameLoop();
      
      this.isInitialized = true;
      console.log('ALTTP Game Integration initialized successfully');
      
      // Emit initialization complete event
      gameEvents.emit({
        type: 'game.initialized',
        payload: { system: 'ALTTP Integration' },
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Failed to initialize ALTTP Game Integration:', error);
      gameEvents.emit({
        type: 'system.error',
        payload: { error },
        timestamp: Date.now()
      });
      throw error;
    }
  }

  private async initializeALTTPSprites(): Promise<void> {
    // Initialize sprite manager animation states
    spriteManager.initializeAnimationState('player', 'player');
    
    // Register player sprite as active
    altttpPerformanceManager.registerActiveSprite('player');
    
    console.log('ALTTP sprite systems initialized');
  }

  private setupInputHandling(): void {
    // Keyboard input
    window.addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      
      // Handle special keys
      switch (event.code) {
        case 'Escape':
          this.togglePause();
          break;
        case 'KeyI':
          this.toggleInventory();
          break;
      }
      
      event.preventDefault();
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      event.preventDefault();
    });
    
    // Focus handling for input
    this.canvas.addEventListener('click', () => {
      this.canvas.focus();
    });
    
    this.canvas.tabIndex = 0; // Make canvas focusable
  }

  private startGameLoop(): void {
    const gameLoop = (currentTime: number) => {
      // Start performance timing
      altttpPerformanceManager.startFrameTiming();
      
      const deltaTime = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;
      
      // Update game
      altttpPerformanceManager.startUpdateTiming();
      this.update(deltaTime);
      altttpPerformanceManager.endUpdateTiming();
      
      // Render game
      this.render();
      
      // End performance timing
      altttpPerformanceManager.endFrameTiming();
      
      requestAnimationFrame(gameLoop);
    };
    
    requestAnimationFrame(gameLoop);
  }

  private update(deltaTime: number): void {
    if (this.gameState !== 'playing') return;
    
    this.updatePlayerMovement(deltaTime);
    this.updatePlayerAnimation(deltaTime);
    this.updateCamera();
  }

  private updatePlayerMovement(deltaTime: number): void {
    const speed = 80; // pixels per second
    const moveDistance = speed * deltaTime;
    
    let newX = this.player.position.x;
    let newY = this.player.position.y;
    let wasMoving = this.player.isMoving;
    this.player.isMoving = false;
    
    // Handle movement input
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) {
      newY -= moveDistance;
      this.player.direction = 'up';
      this.player.isMoving = true;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) {
      newY += moveDistance;
      this.player.direction = 'down';
      this.player.isMoving = true;
    }
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
      newX -= moveDistance;
      this.player.direction = 'left';
      this.player.isMoving = true;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
      newX += moveDistance;
      this.player.direction = 'right';
      this.player.isMoving = true;
    }
    
    // Handle attack input
    if (this.keys.has('Space') || this.keys.has('Enter')) {
      this.player.isAttacking = true;
    } else {
      this.player.isAttacking = false;
    }
    
    // Simple bounds checking (would be replaced with proper collision)
    const worldWidth = 256 * TILE_SIZE;
    const worldHeight = 192 * TILE_SIZE;
    
    newX = Math.max(TILE_SIZE, Math.min(newX, worldWidth - TILE_SIZE));
    newY = Math.max(TILE_SIZE, Math.min(newY, worldHeight - TILE_SIZE));
    
    this.player.position.x = newX;
    this.player.position.y = newY;
    
    // Emit movement events
    if (this.player.isMoving !== wasMoving) {
      gameEvents.emit({
        type: 'player.movement.changed',
        payload: { 
          position: this.player.position,
          direction: this.player.direction,
          isMoving: this.player.isMoving
        },
        timestamp: Date.now()
      });
    }
  }

  private updatePlayerAnimation(deltaTime: number): void {
    // Update sprite manager animation state
    spriteManager.updateAnimationState(
      'player',
      this.player.direction,
      this.player.isMoving,
      this.player.isAttacking,
      deltaTime * 1000 // Convert to milliseconds
    );
  }

  private updateCamera(): void {
    // Center camera on player
    this.camera.x = this.player.position.x - (this.canvas.width / 2);
    this.camera.y = this.player.position.y - (this.canvas.height / 2);
    
    // Clamp camera to world bounds
    const worldWidth = 256 * TILE_SIZE;
    const worldHeight = 192 * TILE_SIZE;
    
    this.camera.x = Math.max(0, Math.min(this.camera.x, worldWidth - this.canvas.width));
    this.camera.y = Math.max(0, Math.min(this.camera.y, worldHeight - this.canvas.height));
  }

  private render(): void {
    // Clear canvas with ALTTP background
    this.ctx.fillStyle = ALTTP_PALETTE.BG_DARK;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render world (simplified - would use proper tilemap)
    this.renderWorld();
    
    // Render player
    this.renderPlayer();
    
    // Render debug info if enabled
    this.renderDebugInfo();
  }

  private renderWorld(): void {
    // Simple grass background (would be replaced with proper tilemap rendering)
    const startTileX = Math.floor(this.camera.x / TILE_SIZE);
    const startTileY = Math.floor(this.camera.y / TILE_SIZE);
    const endTileX = Math.min(startTileX + VIEWPORT_WIDTH + 1, 256);
    const endTileY = Math.min(startTileY + VIEWPORT_HEIGHT + 1, 192);
    
    for (let y = Math.max(0, startTileY); y < endTileY; y++) {
      for (let x = Math.max(0, startTileX); x < endTileX; x++) {
        const screenX = x * TILE_SIZE - this.camera.x;
        const screenY = y * TILE_SIZE - this.camera.y;
        
        // Use cached tile or generate new one
        let grassTile = altttpPerformanceManager.getTileFromCache('grass');
        if (!grassTile) {
          grassTile = spriteManager.generateTile('grass', TILE_SIZE);
          altttpPerformanceManager.cacheTile('grass', grassTile);
        }
        
        this.ctx.drawImage(grassTile, screenX, screenY);
      }
    }
  }

  private renderPlayer(): void {
    const screenX = this.player.position.x - this.camera.x;
    const screenY = this.player.position.y - this.camera.y;
    
    // Get current animation frame from sprite manager
    const animationFrame = spriteManager.getCurrentAnimationFrame('player');
    if (animationFrame) {
      const playerSprite = spriteManager.getGeneratedSprite('player');
      if (playerSprite) {
        this.ctx.drawImage(
          playerSprite,
          animationFrame.x, animationFrame.y,
          animationFrame.width, animationFrame.height,
          screenX, screenY,
          TILE_SIZE, TILE_SIZE
        );
      }
    }
    
    // Draw attack effect if attacking
    if (this.player.isAttacking) {
      this.renderAttackEffect(screenX, screenY);
    }
  }

  private renderAttackEffect(x: number, y: number): void {
    // Simple sword slash effect using ALTTP colors
    this.ctx.strokeStyle = ALTTP_PALETTE.DAYREALM_GOLD;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.7;
    
    const centerX = x + TILE_SIZE / 2;
    const centerY = y + TILE_SIZE / 2;
    const radius = 12;
    
    this.ctx.beginPath();
    switch (this.player.direction) {
      case 'up':
        this.ctx.arc(centerX, centerY - 4, radius, Math.PI * 0.8, Math.PI * 0.2);
        break;
      case 'down':
        this.ctx.arc(centerX, centerY + 4, radius, Math.PI * 1.8, Math.PI * 1.2);
        break;
      case 'left':
        this.ctx.arc(centerX - 4, centerY, radius, Math.PI * 0.3, Math.PI * 1.7);
        break;
      case 'right':
        this.ctx.arc(centerX + 4, centerY, radius, Math.PI * 1.3, Math.PI * 0.7);
        break;
    }
    this.ctx.stroke();
    this.ctx.globalAlpha = 1.0;
  }

  private renderDebugInfo(): void {
    const metrics = altttpPerformanceManager.getMetrics();
    
    this.ctx.fillStyle = ALTTP_PALETTE.TEXT_WHITE;
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`FPS: ${metrics.fps}`, 10, 20);
    this.ctx.fillText(`Frame: ${metrics.frameTime.toFixed(1)}ms`, 10, 35);
    this.ctx.fillText(`Sprites: ${metrics.spriteCount}`, 10, 50);
    this.ctx.fillText(`Memory: ${metrics.memoryUsage.toFixed(1)}MB`, 10, 65);
  }

  private togglePause(): void {
    this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
    gameEvents.emit({
      type: 'game.state.changed',
      payload: { state: this.gameState },
      timestamp: Date.now()
    });
  }

  private toggleInventory(): void {
    const inventoryOpen = this.gameState === 'inventory';
    this.gameState = inventoryOpen ? 'playing' : 'inventory';
    gameEvents.emit({
      type: 'ui.inventory.toggle',
      payload: { open: !inventoryOpen },
      timestamp: Date.now()
    });
  }

  public getPlayerData(): PlayerData {
    return { ...this.player };
  }

  public getGameState(): GameState {
    return this.gameState;
  }

  public destroy(): void {
    console.log('Destroying ALTTP Game Integration...');
    
    // Cleanup performance manager
    altttpPerformanceManager.clearActiveSprites();
    altttpPerformanceManager.clearSpritePool();
    
    this.isInitialized = false;
  }
}