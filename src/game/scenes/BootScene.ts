// Boot Scene - Initial game setup and basic loading
// Following Game Architect specifications for proper initialization order

import Phaser from 'phaser';
import { gameEvents } from '@shared/events.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Skip loading UI assets for now - they don't exist yet
    // TODO: Load essential assets when available
    
    // Set up loading error handling
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Failed to load asset: ${file.key}`);
      gameEvents.emit({
        type: 'system.error',
        payload: { 
          error: new Error(`Failed to load ${file.key}`), 
          context: 'BootScene' 
        },
        timestamp: Date.now()
      });
    });
  }

  create(): void {
    // Basic setup
    this.setupRenderer();
    this.setupInput();
    this.setupAudio();
    
    console.log('Boot Scene: Initialization complete');
    
    // Proceed to preload scene
    this.scene.start('PreloadScene');
  }

  private setupRenderer(): void {
    // Configure pixel-perfect rendering for 16-bit art style
    this.cameras.main.setRoundPixels(true);
    
    // Set background color
    this.cameras.main.setBackgroundColor('#2c3e50');
  }

  private setupInput(): void {
    // Initialize cursor keys for immediate availability
    this.input.keyboard?.createCursorKeys();
    
    // Disable context menu on right-click
    this.input.mouse?.disableContextMenu();
    
    // Set up gamepad detection
    if (this.input.gamepad) {
      this.input.gamepad.on('connected', (gamepad: Phaser.Input.Gamepad.Gamepad) => {
        console.log(`Gamepad connected: ${gamepad.id}`);
      });
      
      this.input.gamepad.on('disconnected', (gamepad: Phaser.Input.Gamepad.Gamepad) => {
        console.log(`Gamepad disconnected: ${gamepad.id}`);
      });
    }
  }

  private setupAudio(): void {
    // Initialize audio context on user interaction
    const initAudio = () => {
      // Check if Web Audio API is available and sound context exists
      if (this.sound && 'context' in this.sound && this.sound.context) {
        const context = this.sound.context as AudioContext;
        if (context.state === 'suspended') {
          context.resume();
        }
      }
      
      // Remove listeners after first interaction
      this.input.off('pointerdown', initAudio);
      this.input.keyboard?.off('keydown', initAudio);
    };
    
    this.input.on('pointerdown', initAudio);
    this.input.keyboard?.on('keydown', initAudio);
  }
}