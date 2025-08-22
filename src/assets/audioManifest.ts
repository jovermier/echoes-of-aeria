import type { AudioAsset } from '../game/systems/AudioManager';
import { createAudioPaths } from '../game/utils/audioUtils';

/**
 * Complete audio asset manifest for Echoes of Aeria
 * Following SNES-style audio organization and optimization
 */

// Background Music - with intro/loop sprites for seamless SNES-style looping
export const MUSIC_ASSETS: AudioAsset[] = [
  {
    id: 'bgm_verdant_lowlands',
    src: createAudioPaths('/audio/music/verdant_lowlands'),
    volume: 0.6,
    category: 'music',
    sprite: {
      intro: [0, 8000, false],     // 8-second intro
      loop: [8000, 56000, true]    // 56-second main loop
    }
  },
  {
    id: 'bgm_whisperwood',
    src: createAudioPaths('/audio/music/whisperwood'),
    volume: 0.5,
    category: 'music',
    sprite: {
      intro: [0, 6000, false],
      loop: [6000, 48000, true]
    }
  },
  {
    id: 'bgm_moonwell_marsh',
    src: createAudioPaths('/audio/music/moonwell_marsh'),
    volume: 0.55,
    category: 'music',
    sprite: {
      intro: [0, 10000, false],
      loop: [10000, 64000, true]
    }
  },
  {
    id: 'bgm_frostpeak_tundra',
    src: createAudioPaths('/audio/music/frostpeak_tundra'),
    volume: 0.6,
    category: 'music',
    sprite: {
      intro: [0, 12000, false],
      loop: [12000, 72000, true]
    }
  },
  {
    id: 'bgm_obsidian_crater',
    src: createAudioPaths('/audio/music/obsidian_crater'),
    volume: 0.65,
    category: 'music',
    sprite: {
      intro: [0, 8000, false],
      loop: [8000, 60000, true]
    }
  },
  {
    id: 'bgm_boss_battle',
    src: createAudioPaths('/audio/music/boss_battle'),
    volume: 0.7,
    category: 'music',
    loop: true // Simple loop for intense boss music
  },
  {
    id: 'bgm_dungeon_theme',
    src: createAudioPaths('/audio/music/dungeon_theme'),
    volume: 0.5,
    category: 'music',
    sprite: {
      intro: [0, 4000, false],
      loop: [4000, 40000, true]
    }
  }
];

// Combat Sound Effects - optimized for low latency and pitch variation
export const COMBAT_SFX: AudioAsset[] = [
  {
    id: 'sfx_sword_swing',
    src: createAudioPaths('/audio/sfx/sword_swing'),
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'sfx_sword_hit',
    src: createAudioPaths('/audio/sfx/sword_hit'),
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'sfx_enemy_hit',
    src: createAudioPaths('/audio/sfx/enemy_hit'),
    volume: 0.6,
    category: 'sfx'
  },
  {
    id: 'sfx_enemy_death',
    src: createAudioPaths('/audio/sfx/enemy_death'),
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'sfx_player_damage',
    src: createAudioPaths('/audio/sfx/player_damage'),
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'sfx_boss_hit',
    src: createAudioPaths('/audio/sfx/boss_hit'),
    volume: 1.0,
    category: 'sfx'
  },
  {
    id: 'sfx_shield_block',
    src: createAudioPaths('/audio/sfx/shield_block'),
    volume: 0.6,
    category: 'sfx'
  }
];

// Item and Interaction SFX
export const INTERACTION_SFX: AudioAsset[] = [
  {
    id: 'sfx_item_rupee',
    src: createAudioPaths('/audio/sfx/item_rupee'),
    volume: 0.6,
    category: 'sfx'
  },
  {
    id: 'sfx_item_heart',
    src: createAudioPaths('/audio/sfx/item_heart'),
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'sfx_item_key',
    src: createAudioPaths('/audio/sfx/item_key'),
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'sfx_item_special',
    src: createAudioPaths('/audio/sfx/item_special'),
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'sfx_door_open',
    src: createAudioPaths('/audio/sfx/door_open'),
    volume: 0.7,
    category: 'sfx'
  },
  {
    id: 'sfx_door_locked',
    src: createAudioPaths('/audio/sfx/door_locked'),
    volume: 0.6,
    category: 'sfx'
  },
  {
    id: 'sfx_chest_open',
    src: createAudioPaths('/audio/sfx/chest_open'),
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'sfx_secret_reveal',
    src: createAudioPaths('/audio/sfx/secret_reveal'),
    volume: 0.9,
    category: 'sfx'
  },
  {
    id: 'sfx_realm_transition',
    src: createAudioPaths('/audio/sfx/realm_transition'),
    volume: 0.8,
    category: 'sfx'
  },
  {
    id: 'sfx_puzzle_solve',
    src: createAudioPaths('/audio/sfx/puzzle_solve'),
    volume: 0.7,
    category: 'sfx'
  }
];

// UI Sound Effects - crisp and responsive
export const UI_SFX: AudioAsset[] = [
  {
    id: 'ui_menu_select',
    src: createAudioPaths('/audio/ui/menu_select'),
    volume: 0.5,
    category: 'ui'
  },
  {
    id: 'ui_menu_confirm',
    src: createAudioPaths('/audio/ui/menu_confirm'),
    volume: 0.6,
    category: 'ui'
  },
  {
    id: 'ui_menu_cancel',
    src: createAudioPaths('/audio/ui/menu_cancel'),
    volume: 0.5,
    category: 'ui'
  },
  {
    id: 'ui_inventory_open',
    src: createAudioPaths('/audio/ui/inventory_open'),
    volume: 0.6,
    category: 'ui'
  },
  {
    id: 'ui_inventory_close',
    src: createAudioPaths('/audio/ui/inventory_close'),
    volume: 0.6,
    category: 'ui'
  },
  {
    id: 'ui_dialogue_advance',
    src: createAudioPaths('/audio/ui/dialogue_advance'),
    volume: 0.4,
    category: 'ui'
  },
  {
    id: 'ui_error',
    src: createAudioPaths('/audio/ui/error'),
    volume: 0.6,
    category: 'ui'
  }
];

// Ambient and Environmental Audio
export const AMBIENT_SFX: AudioAsset[] = [
  {
    id: 'ambient_wind',
    src: createAudioPaths('/audio/ambient/wind'),
    volume: 0.3,
    category: 'ambient',
    loop: true
  },
  {
    id: 'ambient_forest',
    src: createAudioPaths('/audio/ambient/forest'),
    volume: 0.2,
    category: 'ambient',
    loop: true
  },
  {
    id: 'ambient_water',
    src: createAudioPaths('/audio/ambient/water'),
    volume: 0.25,
    category: 'ambient',
    loop: true
  },
  {
    id: 'ambient_cave_echo',
    src: createAudioPaths('/audio/ambient/cave_echo'),
    volume: 0.2,
    category: 'ambient',
    loop: true
  }
];

// Complete asset collection for easy loading
export const ALL_AUDIO_ASSETS: AudioAsset[] = [
  ...MUSIC_ASSETS,
  ...COMBAT_SFX,
  ...INTERACTION_SFX,
  ...UI_SFX,
  ...AMBIENT_SFX
];

// Critical assets that need zero-latency (preloaded)
export const CRITICAL_AUDIO_ASSETS: AudioAsset[] = [
  ...COMBAT_SFX.filter(asset => 
    ['sfx_sword_swing', 'sfx_enemy_hit', 'sfx_player_damage'].includes(asset.id)
  ),
  ...UI_SFX.filter(asset => 
    ['ui_menu_select', 'ui_menu_confirm'].includes(asset.id)
  ),
  ...INTERACTION_SFX.filter(asset => 
    ['sfx_item_rupee', 'sfx_item_heart'].includes(asset.id)
  )
];

// Audio production guidelines for content creators
export const AUDIO_PRODUCTION_SPECS = {
  MUSIC: {
    format: 'OGG Vorbis + M4A fallback',
    quality: '128-160 kbps',
    sampleRate: '44.1 kHz',
    channels: 'Stereo',
    loopPoints: 'Sample-accurate, bar-aligned',
    masteringChain: 'Light compression, tape saturation, LPF @12kHz, -1dBFS headroom'
  },
  SFX: {
    format: 'OGG Vorbis + M4A fallback', 
    quality: '96-128 kbps',
    sampleRate: '22.05 kHz (retro) or 44.1 kHz (modern)',
    channels: 'Mono preferred',
    duration: '<2 seconds for most SFX',
    processing: 'ADSR envelope, pitch variation ready'
  },
  TECHNICAL_REQUIREMENTS: {
    introLoopStructure: 'Separate intro (non-looping) + loop section',
    silenceHandling: 'No leading/trailing silence',
    fileNaming: 'snake_case, descriptive, category prefixed',
    browserSupport: 'OGG (primary) + M4A (Safari/iOS fallback)',
    loadingStrategy: 'Critical SFX preloaded, music loaded per-region'
  }
} as const;