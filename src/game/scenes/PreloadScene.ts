// Preload Scene - Asset loading with progress display
// Following Game Architect and Audio Designer specifications

import Phaser from 'phaser';
import { gameEvents } from '@shared/events.js';

export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Create loading UI
    this.createLoadingUI();
    
    // Set up loading event listeners
    this.setupLoadingEvents();
    
    // Skip asset loading for now - assets don't exist yet
    // TODO: Uncomment when assets are available
    // this.loadSprites();
    // this.loadTilemaps();
    // this.loadAudio();
    // this.loadUI();
  }

  create(): void {
    console.log('Preload Scene: All assets loaded');
    
    // Emit assets loaded event
    gameEvents.emit({
      type: 'world.map.loaded',
      payload: { mapId: 'preload', mapName: 'Assets Loaded' },
      timestamp: Date.now()
    });

    // Small delay to show completion
    this.time.delayedCall(500, () => {
      this.scene.start('WorldScene');
    });
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    
    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2c3e50);
    
    // Title
    this.add.text(width / 2, height / 2 - 100, 'ECHOES OF AERIA', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
    
    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
    
    // Progress bar background
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x444444);
    this.loadingBar.fillRect(width / 2 - 150, height / 2, 300, 20);
    
    // Progress bar fill
    this.progressBar = this.add.graphics();
    
    // Percentage text
    this.percentText = this.add.text(width / 2, height / 2 + 40, '0%', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);
  }

  private setupLoadingEvents(): void {
    this.load.on('progress', (value: number) => {
      const percentage = Math.round(value * 100);
      this.percentText.setText(`${percentage}%`);
      
      // Update progress bar
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00);
      this.progressBar.fillRect(this.cameras.main.width / 2 - 150, this.cameras.main.height / 2, 300 * value, 20);
    });

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.loadingText.setText(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Complete!');
      this.progressBar.clear();
      this.progressBar.fillStyle(0x00ff00);
      this.progressBar.fillRect(this.cameras.main.width / 2 - 150, this.cameras.main.height / 2, 300, 20);
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.error(`Error loading ${file.key}:`, file);
      this.loadingText.setText(`Error loading: ${file.key}`);
      this.loadingText.setColor('#ff0000');
    });
  }

  // TODO: Re-enable when assets are available
  // private loadSprites(): void { ... }

  // TODO: Re-enable when tilemaps are available
  // private loadTilemaps(): void { ... }

  // TODO: Re-enable when audio assets are available
  // private loadAudio(): void { ... }

  // TODO: Re-enable when UI assets are available
  // private loadUI(): void { ... }

  // TODO: Re-enable when needed for fallback asset colors
  // private getColorForAsset(key: string): number { ... }
}