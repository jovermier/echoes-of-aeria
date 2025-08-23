import { Howl, Howler, type HowlOptions } from 'howler';

export interface AudioAsset {
  id: string;
  src: string[];  // ['.ogg', '.m4a'] for cross-browser support
  volume: number;
  loop?: boolean;
  sprite?: Record<string, [number, number, boolean]>; // [start_ms, duration_ms, loop]
  category: 'music' | 'sfx' | 'ui' | 'ambient';
}

export interface MixerSettings {
  master: number;
  music: number;
  sfx: number;
  ui: number;
  ambient: number;
}

/**
 * SNES-style Audio Manager with Howler.js
 * Implements authentic 16-bit audio patterns with modern web audio
 */
export class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private currentMusic?: { sound: Howl; id?: number } | undefined;
  private mixer: MixerSettings = {
    master: 0.7,
    music: 0.6,
    sfx: 0.8,
    ui: 0.7,
    ambient: 0.4
  };
  
  // SNES-style concurrency limits to prevent audio chaos
  private sfxConcurrency: Map<string, number> = new Map();
  private readonly sfxCooldown = 100; // ms between same SFX
  
  private constructor() {
    this.setupAudioContext();
  }
  
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }
  
  /**
   * Initialize audio context and handle mobile unlock
   */
  private setupAudioContext(): void {
    // Mobile audio unlock - required for iOS/Android
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('click', unlockAudio);
    };
    
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('click', unlockAudio);
  }
  
  /**
   * Load audio assets with SNES-optimized settings
   */
  public loadAudio(assets: AudioAsset[]): Promise<void[]> {
    const loadPromises = assets.map(asset => this.loadSingleAsset(asset));
    return Promise.all(loadPromises);
  }
  
  private loadSingleAsset(asset: AudioAsset): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if this is a generated audio file
      let audioSrc = asset.src;
      
      if (Array.isArray(asset.src)) {
        // Check each URL in the array for generated audio
        for (const url of asset.src) {
          const filename = url.split('/').pop() || '';
          const category = url.includes('/music/') ? 'music' : 'sfx';
          
          if ((window as any).generatedAudioFiles) {
            const audioFiles = (window as any).generatedAudioFiles;
            if (audioFiles[category] && audioFiles[category][filename]) {
              audioSrc = [audioFiles[category][filename]];
              console.log(`🎵 Using generated audio for ${asset.key}: ${filename}`);
              break;
            }
          }
        }
      } else {
        // Single URL
        const filename = asset.src.split('/').pop() || '';
        const category = asset.src.includes('/music/') ? 'music' : 'sfx';
        
        if ((window as any).generatedAudioFiles) {
          const audioFiles = (window as any).generatedAudioFiles;
          if (audioFiles[category] && audioFiles[category][filename]) {
            audioSrc = audioFiles[category][filename];
            console.log(`🎵 Using generated audio for ${asset.key}: ${filename}`);
          }
        }
      }
      
      const howlOptions: HowlOptions = {
        src: audioSrc,
        volume: asset.volume * this.mixer[asset.category],
        loop: asset.loop || false,
        html5: false, // Use Web Audio API for precise control
        preload: true,
        onload: () => resolve(),
        onloaderror: (_id, error) => reject(error)
      };

      if (asset.sprite) {
        howlOptions.sprite = asset.sprite;
      }

      const howl = new Howl(howlOptions);
      
      this.sounds.set(asset.id, howl);
    });
  }
  
  /**
   * Play background music with intro->loop pattern (SNES style)
   */
  public playMusic(trackId: string, fadeInTime: number = 1000): void {
    this.stopMusic(500); // Quick fade out current music
    
    setTimeout(() => {
      const sound = this.sounds.get(trackId);
      if (!sound) {
        console.warn(`Music track "${trackId}" not found`);
        return;
      }
      
      // Check if track has intro/loop sprites
      const sprites = (sound as any)._sprite;
      if (sprites && sprites.intro && sprites.loop) {
        // Play intro, then seamlessly loop
        const introId = sound.play('intro');
        sound.once('end', () => {
          const loopId = sound.play('loop');
          this.currentMusic = { sound, id: loopId };
        }, introId);
      } else {
        // Simple loop
        const id = sound.play();
        this.currentMusic = { sound, id };
      }
      
      // Fade in
      sound.fade(0, sound.volume(), fadeInTime);
    }, 500);
  }
  
  /**
   * Stop current music with fade out
   */
  public stopMusic(fadeOutTime: number = 1000): void {
    if (this.currentMusic) {
      const { sound, id } = this.currentMusic;
      sound.fade(sound.volume(), 0, fadeOutTime);
      
      setTimeout(() => {
        if (id !== undefined) sound.stop(id);
        else sound.stop();
      }, fadeOutTime);
      
      this.currentMusic = undefined;
    }
  }
  
  /**
   * Play SFX with SNES-style pitch variation and concurrency limits
   */
  public playSfx(sfxId: string, options: {
    pitchVariation?: number; // ±cents (40 = subtle, 100 = noticeable)
    volume?: number;
    interrupt?: boolean; // Stop other instances
  } = {}): number | null {
    const sound = this.sounds.get(sfxId);
    if (!sound) {
      console.warn(`SFX "${sfxId}" not found`);
      return null;
    }
    
    // Check concurrency limits
    if (!this.canPlaySfx(sfxId)) {
      return null;
    }
    
    // Play sound
    const id = sound.play();
    
    // Apply SNES-style pitch variation for organic feel
    if (options.pitchVariation && id !== null) {
      const pitchCents = (Math.random() * 2 - 1) * options.pitchVariation;
      const soundNode = (sound as any)._soundById(id);
      if (soundNode?._node?.detune) {
        soundNode._node.detune.value = pitchCents;
      }
    }
    
    // Apply volume override
    if (options.volume !== undefined && id !== null) {
      sound.volume(options.volume * this.mixer.sfx, id);
    }
    
    // Track concurrency
    this.trackSfxUsage(sfxId);
    
    return id;
  }
  
  /**
   * Music ducking for dialogue/important events (SNES style)
   */
  public duckMusic(duckLevel: number = 0.3, duration: number = 300): void {
    if (this.currentMusic) {
      const { sound } = this.currentMusic;
      const originalVolume = sound.volume();
      
      // Duck down
      sound.fade(originalVolume, originalVolume * duckLevel, duration);
      
      // Return to normal after event
      setTimeout(() => {
        sound.fade(sound.volume(), originalVolume, duration);
      }, duration * 2);
    }
  }
  
  /**
   * Set mixer levels for different audio categories
   */
  public setMixerLevel(category: keyof MixerSettings, level: number): void {
    this.mixer[category] = Math.max(0, Math.min(1, level));
    
    // Update all sounds in this category
    this.sounds.forEach((sound, id) => {
      // Find asset category (would be better to store this metadata)
      const isMusicTrack = id.includes('bgm_') || id.includes('music_');
      const isUi = id.includes('ui_');
      const isAmbient = id.includes('ambient_');
      
      let targetCategory: keyof MixerSettings = 'sfx'; // default
      if (isMusicTrack) targetCategory = 'music';
      else if (isUi) targetCategory = 'ui';
      else if (isAmbient) targetCategory = 'ambient';
      
      if (targetCategory === category) {
        // Update volume for this category
        const baseVolume = (sound as any)._volume || 1;
        sound.volume(baseVolume * this.mixer[category]);
      }
    });
  }
  
  /**
   * Preload critical audio assets
   */
  public async preloadCriticalAudio(): Promise<void> {
    const criticalAssets: AudioAsset[] = [
      // Core SFX that need zero latency
      {
        id: 'sfx_sword_swing',
        src: ['/audio/sfx/sword_swing.ogg', '/audio/sfx/sword_swing.m4a'],
        volume: 0.8,
        category: 'sfx'
      },
      {
        id: 'sfx_enemy_hit',
        src: ['/audio/sfx/enemy_hit.ogg', '/audio/sfx/enemy_hit.m4a'],
        volume: 0.7,
        category: 'sfx'
      },
      {
        id: 'sfx_item_collect',
        src: ['/audio/sfx/item_collect.ogg', '/audio/sfx/item_collect.m4a'],
        volume: 0.6,
        category: 'sfx'
      },
      // UI sounds for immediate feedback
      {
        id: 'ui_menu_select',
        src: ['/audio/ui/menu_select.ogg', '/audio/ui/menu_select.m4a'],
        volume: 0.5,
        category: 'ui'
      }
    ];
    
    await this.loadAudio(criticalAssets);
  }
  
  /**
   * Load region-specific music with intro/loop sprites
   */
  public async loadRegionMusic(regionId: string): Promise<void> {
    const musicAssets: AudioAsset[] = [
      {
        id: `bgm_${regionId}`,
        src: [`/audio/music/${regionId}.ogg`, `/audio/music/${regionId}.m4a`],
        volume: 0.6,
        category: 'music',
        sprite: {
          // Example: 8-second intro, then 64-second loop
          intro: [0, 8000, false],
          loop: [8000, 64000, true]
        }
      }
    ];
    
    await this.loadAudio(musicAssets);
  }
  
  /**
   * Concurrency management for SFX
   */
  private canPlaySfx(sfxId: string): boolean {
    const now = Date.now();
    const lastPlayed = this.sfxConcurrency.get(sfxId) || 0;
    
    return (now - lastPlayed) > this.sfxCooldown;
  }
  
  private trackSfxUsage(sfxId: string): void {
    this.sfxConcurrency.set(sfxId, Date.now());
  }
  
  /**
   * Get current mixer settings for UI
   */
  public getMixerSettings(): MixerSettings {
    return { ...this.mixer };
  }
  
  /**
   * Cleanup and dispose
   */
  public dispose(): void {
    this.sounds.forEach(sound => sound.unload());
    this.sounds.clear();
    this.currentMusic = undefined;
  }
}

// Singleton instance
export const audioManager = AudioManager.getInstance();