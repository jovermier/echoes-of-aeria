import { audioManager } from '../systems/AudioManager';

/**
 * SNES-style audio utilities and presets
 */

// SNES-authentic pitch variation presets
export const PITCH_VARIATIONS = {
  SUBTLE: 20,     // ±20 cents - barely noticeable
  MODERATE: 40,   // ±40 cents - adds life without being obvious
  NOTICEABLE: 80, // ±80 cents - clearly varied
  EXTREME: 120    // ±120 cents - cartoonish/exaggerated
} as const;

// Audio timing constants (SNES-typical)
export const AUDIO_TIMING = {
  QUICK_FADE: 150,
  NORMAL_FADE: 300,
  SLOW_FADE: 600,
  DUCK_DURATION: 200,
  MUSIC_CROSSFADE: 1000
} as const;

/**
 * Combat audio with authentic SNES feel
 */
export class CombatAudio {
  
  /**
   * Play sword swing with subtle pitch variation
   */
  static playSwordSwing(): void {
    audioManager.playSfx('sfx_sword_swing', {
      pitchVariation: PITCH_VARIATIONS.SUBTLE,
      volume: 0.8
    });
  }
  
  /**
   * Play enemy hit with moderate pitch variation
   */
  static playEnemyHit(): void {
    audioManager.playSfx('sfx_enemy_hit', {
      pitchVariation: PITCH_VARIATIONS.MODERATE,
      volume: 0.7
    });
  }
  
  /**
   * Play player damage sound with ducking
   */
  static playPlayerDamage(): void {
    // Duck music momentarily for impact
    audioManager.duckMusic(0.2, AUDIO_TIMING.DUCK_DURATION);
    
    audioManager.playSfx('sfx_player_damage', {
      pitchVariation: PITCH_VARIATIONS.SUBTLE,
      volume: 0.9
    });
  }
  
  /**
   * Play boss hit with heavy impact
   */
  static playBossHit(): void {
    audioManager.duckMusic(0.1, AUDIO_TIMING.DUCK_DURATION * 2);
    
    audioManager.playSfx('sfx_boss_hit', {
      pitchVariation: PITCH_VARIATIONS.NOTICEABLE,
      volume: 1.0
    });
  }
}

/**
 * UI audio with consistent feedback
 */
export class UIAudio {
  
  static playMenuSelect(): void {
    audioManager.playSfx('ui_menu_select', {
      pitchVariation: PITCH_VARIATIONS.SUBTLE
    });
  }
  
  static playMenuConfirm(): void {
    audioManager.playSfx('ui_menu_confirm', {
      volume: 0.6
    });
  }
  
  static playMenuCancel(): void {
    audioManager.playSfx('ui_menu_cancel', {
      volume: 0.5
    });
  }
  
  static playInventoryOpen(): void {
    audioManager.duckMusic(0.4, AUDIO_TIMING.NORMAL_FADE);
    audioManager.playSfx('ui_inventory_open');
  }
  
  static playInventoryClose(): void {
    audioManager.duckMusic(1.0, AUDIO_TIMING.NORMAL_FADE); // Return to normal
    audioManager.playSfx('ui_inventory_close');
  }
}

/**
 * World/environment audio
 */
export class WorldAudio {
  
  static playItemCollect(itemType: 'rupee' | 'heart' | 'key' | 'special' = 'rupee'): void {
    const variations = {
      rupee: { pitch: PITCH_VARIATIONS.MODERATE, volume: 0.6 },
      heart: { pitch: PITCH_VARIATIONS.SUBTLE, volume: 0.8 },
      key: { pitch: PITCH_VARIATIONS.SUBTLE, volume: 0.7 },
      special: { pitch: PITCH_VARIATIONS.NOTICEABLE, volume: 0.9 }
    };
    
    const config = variations[itemType];
    audioManager.playSfx(`sfx_item_${itemType}`, {
      pitchVariation: config.pitch,
      volume: config.volume
    });
  }
  
  static playDoorOpen(): void {
    audioManager.playSfx('sfx_door_open', {
      volume: 0.7
    });
  }
  
  static playSecretReveal(): void {
    audioManager.duckMusic(0.3, AUDIO_TIMING.SLOW_FADE);
    audioManager.playSfx('sfx_secret_reveal', {
      volume: 0.8
    });
  }
  
  static playRealmTransition(): void {
    // Special effect for Eclipse/Dayrealm switching
    audioManager.duckMusic(0.1, AUDIO_TIMING.SLOW_FADE);
    audioManager.playSfx('sfx_realm_transition', {
      volume: 0.9
    });
  }
}

/**
 * Region-specific music management
 */
export class RegionAudio {
  private static currentRegion?: string | undefined;
  
  static async enterRegion(regionName: string): Promise<void> {
    if (this.currentRegion === regionName) return;
    
    // Load region music if not already loaded
    await audioManager.loadRegionMusic(regionName);
    
    // Play with crossfade
    audioManager.playMusic(`bgm_${regionName}`, AUDIO_TIMING.MUSIC_CROSSFADE);
    
    this.currentRegion = regionName;
  }
  
  static getCurrentRegion(): string | undefined {
    return this.currentRegion;
  }

  // For testing access
  static _setCurrentRegion(region: string | undefined): void {
    this.currentRegion = region;
  }
}

/**
 * Audio preset configurations for different game scenarios
 */
export const AUDIO_PRESETS = {
  NORMAL_GAMEPLAY: {
    master: 0.7,
    music: 0.6,
    sfx: 0.8,
    ui: 0.7,
    ambient: 0.4
  },
  
  BOSS_BATTLE: {
    master: 0.8,
    music: 0.7,
    sfx: 0.9,
    ui: 0.6,
    ambient: 0.2
  },
  
  DIALOGUE_SCENE: {
    master: 0.6,
    music: 0.3,
    sfx: 0.6,
    ui: 0.7,
    ambient: 0.2
  },
  
  MENU_FOCUSED: {
    master: 0.5,
    music: 0.2,
    sfx: 0.4,
    ui: 0.8,
    ambient: 0.1
  }
} as const;

/**
 * Apply audio preset for different game states
 */
export function applyAudioPreset(preset: keyof typeof AUDIO_PRESETS): void {
  const settings = AUDIO_PRESETS[preset];
  
  Object.entries(settings).forEach(([category, level]) => {
    audioManager.setMixerLevel(category as any, level);
  });
}

/**
 * Initialize audio system with SNES-optimized settings
 */
export async function initializeAudio(): Promise<void> {
  try {
    // Preload critical audio first
    await audioManager.preloadCriticalAudio();
    
    // Apply default preset
    applyAudioPreset('NORMAL_GAMEPLAY');
    
    console.log('✅ Audio system initialized with SNES-style settings');
  } catch (error) {
    console.error('❌ Failed to initialize audio system:', error);
  }
}

/**
 * Create audio file paths for different formats
 */
export function createAudioPaths(basePath: string): string[] {
  return [
    `${basePath}.ogg`,  // Primary format - excellent compression
    `${basePath}.m4a`   // Fallback for Safari/iOS
  ];
}

/**
 * Audio debugging utilities
 */
export const AudioDebug = {
  /**
   * Test all SFX with labels
   */
  testAllSfx(): void {
    const testSounds = [
      'sfx_sword_swing',
      'sfx_enemy_hit', 
      'sfx_player_damage',
      'sfx_item_collect',
      'ui_menu_select'
    ];
    
    testSounds.forEach((sound, index) => {
      setTimeout(() => {
        console.log(`🔊 Testing: ${sound}`);
        audioManager.playSfx(sound, { pitchVariation: PITCH_VARIATIONS.MODERATE });
      }, index * 1000);
    });
  },
  
  /**
   * Log current audio state
   */
  logAudioState(): void {
    const mixer = audioManager.getMixerSettings();
    console.log('🎵 Audio State:', {
      mixer,
      currentRegion: RegionAudio.getCurrentRegion()
    });
  }
};