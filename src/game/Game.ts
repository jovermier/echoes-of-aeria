// Main Phaser Game configuration and initialization
// Following Game Architect specifications for Phaser 3 + React integration

import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from '@shared/constants.js';
import { gameEvents } from '@shared/events.js';

// Scene imports
import { BootScene } from './scenes/BootScene.js';
import { PreloadScene } from './scenes/PreloadScene.js';
import { WorldScene } from './scenes/WorldScene.js';

// Game configuration
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#2c3e50',
  
  // Physics configuration
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Top-down game, no gravity
      debug: false, // Set to true for development debugging
      fps: TARGET_FPS
    }
  },

  // Performance settings
  fps: {
    target: TARGET_FPS,
    forceSetTimeOut: true
  },

  // Rendering settings
  render: {
    pixelArt: true, // Enable pixel-perfect rendering for 16-bit art style
    antialias: false,
    powerPreference: 'high-performance'
  },

  // Audio settings
  audio: {
    disableWebAudio: false
  },

  // Input settings
  input: {
    gamepad: true,
    keyboard: true,
    mouse: true,
    touch: true
  },

  // Scene configuration
  scene: [
    BootScene,
    PreloadScene,
    WorldScene
  ],

  // Scale manager for responsive design
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT
  }
};

// Game instance wrapper
export class EchoesGame {
  private game: Phaser.Game | null = null;
  private isInitialized = false;

  constructor() {
    // Bind methods to preserve context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
  }

  async initialize(container: HTMLElement): Promise<Phaser.Game> {
    if (this.isInitialized) {
      throw new Error('Game is already initialized');
    }

    // Set up container
    container.id = 'game-container';
    
    // Create game instance
    this.game = new Phaser.Game({
      ...gameConfig,
      parent: container
    });

    // Set up lifecycle handlers
    this.setupLifecycleHandlers();

    // Set up performance monitoring
    this.setupPerformanceMonitoring();

    this.isInitialized = true;
    return this.game;
  }

  private setupLifecycleHandlers(): void {
    if (!this.game) return;

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Handle page unload
    window.addEventListener('beforeunload', this.handleBeforeUnload);

    // Game-specific events
    this.game.events.on('ready', () => {
      console.log('Echoes of Aeria - Game Ready');
      gameEvents.emit({
        type: 'system.performance.update',
        payload: { fps: TARGET_FPS, memoryUsage: 0 },
        timestamp: Date.now()
      });
    });

    this.game.events.on('blur', () => {
      console.log('Game lost focus');
      this.pauseGame();
    });

    this.game.events.on('focus', () => {
      console.log('Game gained focus');
      this.resumeGame();
    });
  }

  private setupPerformanceMonitoring(): void {
    if (!this.game) return;

    // Monitor FPS and memory usage
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updatePerformanceMetrics = () => {
      frameCount++;
      const currentTime = performance.now();
      
      // Update every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const memoryUsage = this.getMemoryUsage();
        
        gameEvents.emit({
          type: 'system.performance.update',
          payload: { fps, memoryUsage },
          timestamp: Date.now()
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updatePerformanceMetrics);
    };
    
    requestAnimationFrame(updatePerformanceMetrics);
  }

  private getMemoryUsage(): number {
    // Get memory usage if available (Chrome/Edge)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return 0;
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.pauseGame();
    } else {
      this.resumeGame();
    }
  }

  private handleBeforeUnload(): void {
    this.saveGameState();
  }

  private pauseGame(): void {
    if (this.game && this.game.scene.isActive('WorldScene')) {
      this.game.scene.pause('WorldScene');
      gameEvents.emit({
        type: 'game.paused',
        payload: { paused: true },
        timestamp: Date.now()
      });
    }
  }

  private resumeGame(): void {
    if (this.game && this.game.scene.isPaused('WorldScene')) {
      this.game.scene.resume('WorldScene');
      gameEvents.emit({
        type: 'game.paused',
        payload: { paused: false },
        timestamp: Date.now()
      });
    }
  }

  private saveGameState(): void {
    // Trigger save system through events
    gameEvents.emit({
      type: 'save.game.saved',
      payload: { 
        saveSlot: 0, 
        saveData: {
          version: '1.0.0',
          timestamp: Date.now(),
          player: {
            position: { x: 0, y: 0 },
            realm: 'dayrealm' as const,
            health: 6,
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
            }
          },
          world: {
            currentMap: 'hearthmere',
            flags: {},
            discoveredAreas: []
          },
          progress: {
            aetherShards: 0,
            completedQuests: [],
            unlockedAreas: []
          }
        }
      },
      timestamp: Date.now()
    });
  }

  // Public API
  pause(): void {
    this.pauseGame();
  }

  resume(): void {
    this.resumeGame();
  }

  destroy(): void {
    if (!this.game) return;

    // Clean up event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);

    // Save state before destroying
    this.saveGameState();

    // Destroy game
    this.game.destroy(true);
    this.game = null;
    this.isInitialized = false;
  }

  getGame(): Phaser.Game | null {
    return this.game;
  }

  isReady(): boolean {
    return this.isInitialized && this.game !== null;
  }

  // Debug utilities
  getDebugInfo(): object {
    if (!this.game) return {};

    return {
      isInitialized: this.isInitialized,
      activeScenes: this.game.scene.getScenes(true).map(scene => scene.scene.key),
      gameSize: {
        width: this.game.config.width,
        height: this.game.config.height
      },
      fps: this.game.loop.actualFps,
      renderer: this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'
    };
  }
}

// Singleton instance
let gameInstance: EchoesGame | null = null;

export function getGameInstance(): EchoesGame {
  if (!gameInstance) {
    gameInstance = new EchoesGame();
  }
  return gameInstance;
}

export function createGame(container: HTMLElement): Promise<Phaser.Game> {
  const instance = getGameInstance();
  return instance.initialize(container);
}