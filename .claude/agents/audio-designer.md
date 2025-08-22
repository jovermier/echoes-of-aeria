---
name: "Audio Designer Agent"
description: "Specializes in audio system implementation, music composition, sound design, and audio programming for Echoes of Aeria"
---

# Audio Designer Agent

## Purpose
Specializes in audio system implementation, music composition, sound design, and audio programming for Echoes of Aeria.

## Expertise Areas
- **8-bit Chiptune Composition**: SNES-style audio synthesis and composition
- **Dynamic Audio Systems**: Adaptive music and interactive sound design
- **Web Audio API**: Browser-based audio programming and optimization
- **Audio Asset Pipeline**: File formats, compression, streaming, and loading
- **Spatial Audio**: Environmental audio and 3D sound positioning

## Key Responsibilities

### Audio Architecture Design

#### Web Audio API Implementation
```typescript
class AudioManager {
  private audioContext: AudioContext;
  private masterGainNode: GainNode;
  private musicGainNode: GainNode;
  private sfxGainNode: GainNode;
  private activeOscillators: Map<string, OscillatorNode> = new Map();
  
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.setupGainNodes();
  }
  
  private setupGainNodes() {
    this.masterGainNode = this.audioContext.createGain();
    this.musicGainNode = this.audioContext.createGain();
    this.sfxGainNode = this.audioContext.createGain();
    
    // Connect audio graph
    this.musicGainNode.connect(this.masterGainNode);
    this.sfxGainNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.audioContext.destination);
    
    // Set initial volumes (30% master as per current implementation)
    this.masterGainNode.gain.value = 0.3;
    this.musicGainNode.gain.value = 0.7;
    this.sfxGainNode.gain.value = 0.8;
  }
}
```

#### SNES-Style Audio Implementation with Howler.js

#### Recommended Audio Manager (Implemented)
```typescript
// Located at: src/game/systems/AudioManager.ts
import { Howl, Howler } from 'howler';

export interface AudioAsset {
  id: string;
  src: string[];  // ['.ogg', '.m4a'] for cross-browser support
  volume: number;
  loop?: boolean;
  sprite?: Record<string, [number, number, boolean]>; // [start_ms, duration_ms, loop]
  category: 'music' | 'sfx' | 'ui' | 'ambient';
}

export class AudioManager {
  // Singleton pattern with SNES-optimized features:
  // - Mobile audio unlock handling
  // - Pitch variation for organic SFX feel
  // - Music ducking for dialogue/events
  // - Concurrency limits to prevent audio chaos
  // - Intro->Loop sprite system for seamless music
}
```

#### SNES Audio Production Specifications
```typescript
// Located at: src/assets/audioManifest.ts
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
  }
};
```

### Chiptune Music System

#### Note and Scale Definitions
```typescript
// Musical note frequencies for 8-bit chiptune
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.00, B6: 1975.53
} as const;

// Zelda-inspired scale patterns
const SCALES = {
  HYRULE_MAJOR: [NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, NOTES.G4, NOTES.A4, NOTES.B4, NOTES.C5],
  ZELDA_MINOR: [NOTES.A3, NOTES.B3, NOTES.C4, NOTES.D4, NOTES.E4, NOTES.F4, NOTES.G4, NOTES.A4],
  MYSTIC_PENTATONIC: [NOTES.C4, NOTES.D4, NOTES.F4, NOTES.G4, NOTES.A4, NOTES.C5]
} as const;
```

#### Chiptune Synthesis Engine
```typescript
class ChiptuneEngine {
  private audioContext: AudioContext;
  private voiceChannels: ChipVoice[] = [];
  
  constructor(audioContext: AudioContext, channelCount: number = 4) {
    this.audioContext = audioContext;
    
    // Create multiple voice channels for polyphonic music
    for (let i = 0; i < channelCount; i++) {
      this.voiceChannels.push(new ChipVoice(audioContext, i));
    }
  }
  
  playNote(channel: number, frequency: number, duration: number, waveform: OscillatorType = 'square') {
    if (channel < this.voiceChannels.length) {
      this.voiceChannels[channel].playNote(frequency, duration, waveform);
    }
  }
  
  playChord(frequencies: number[], duration: number) {
    frequencies.forEach((freq, index) => {
      if (index < this.voiceChannels.length) {
        this.voiceChannels[index].playNote(freq, duration);
      }
    });
  }
}

class ChipVoice {
  private audioContext: AudioContext;
  private channelId: number;
  private currentOscillator?: OscillatorNode;
  private gainNode: GainNode;
  
  constructor(audioContext: AudioContext, channelId: number) {
    this.audioContext = audioContext;
    this.channelId = channelId;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0.25; // Prevent clipping with multiple voices
  }
  
  playNote(frequency: number, duration: number, waveform: OscillatorType = 'square') {
    // Stop current note if playing
    this.stopNote();
    
    // Create new oscillator
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentOscillator.type = waveform;
    this.currentOscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    // Apply ADSR envelope
    this.applyEnvelope(duration);
    
    // Connect and start
    this.currentOscillator.connect(this.gainNode);
    this.currentOscillator.start();
    this.currentOscillator.stop(this.audioContext.currentTime + duration);
  }
  
  private applyEnvelope(duration: number) {
    const now = this.audioContext.currentTime;
    const attack = 0.02;   // 20ms attack
    const decay = 0.1;     // 100ms decay  
    const sustain = 0.6;   // 60% sustain level
    const release = 0.2;   // 200ms release
    
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(0.25, now + attack);
    this.gainNode.gain.linearRampToValueAtTime(0.25 * sustain, now + attack + decay);
    this.gainNode.gain.setValueAtTime(0.25 * sustain, now + duration - release);
    this.gainNode.gain.linearRampToValueAtTime(0, now + duration);
  }
}
```

### Dynamic Music System

#### Adaptive Music Composition
```typescript
interface MusicTrack {
  id: string;
  tempo: number;              // BPM
  timeSignature: [number, number]; // [4, 4] for 4/4 time
  key: string;                // Musical key
  mood: 'peaceful' | 'tense' | 'mysterious' | 'heroic' | 'dark';
  layers: MusicLayer[];
  transitions: MusicTransition[];
}

interface MusicLayer {
  name: string;               // "melody", "harmony", "bass", "percussion"
  pattern: NoteSequence[];
  volume: number;
  channel: number;
  waveform: OscillatorType;
  enabled: boolean;
}

interface NoteSequence {
  note: number;               // Frequency or NOTES enum value
  duration: number;           // In beats
  velocity: number;           // 0-1 volume multiplier
  timing: number;             // Beat position in measure
}
```

#### Region-Specific Music Implementation
```typescript
// Verdant Lowlands - Peaceful exploration theme
const VERDANT_LOWLANDS_MUSIC: MusicTrack = {
  id: 'verdant_lowlands',
  tempo: 120,
  timeSignature: [4, 4],
  key: 'C_major',
  mood: 'peaceful',
  layers: [
    {
      name: 'melody',
      pattern: [
        { note: NOTES.C5, duration: 1, velocity: 0.8, timing: 0 },
        { note: NOTES.D5, duration: 1, velocity: 0.7, timing: 1 },
        { note: NOTES.E5, duration: 2, velocity: 0.9, timing: 2 },
        { note: NOTES.C5, duration: 2, velocity: 0.8, timing: 4 },
        { note: NOTES.G4, duration: 2, velocity: 0.7, timing: 6 }
      ],
      volume: 0.7,
      channel: 0,
      waveform: 'square',
      enabled: true
    },
    {
      name: 'harmony',
      pattern: [
        { note: NOTES.E4, duration: 4, velocity: 0.5, timing: 0 },
        { note: NOTES.F4, duration: 4, velocity: 0.5, timing: 4 }
      ],
      volume: 0.4,
      channel: 1,
      waveform: 'triangle',
      enabled: true
    }
  ],
  transitions: []
};

// Whisperwood - Mysterious forest theme
const WHISPERWOOD_MUSIC: MusicTrack = {
  id: 'whisperwood',
  tempo: 90,
  timeSignature: [3, 4],
  key: 'A_minor',
  mood: 'mysterious',
  layers: [
    {
      name: 'melody',
      pattern: [
        { note: NOTES.A4, duration: 1.5, velocity: 0.6, timing: 0 },
        { note: NOTES.C5, duration: 1, velocity: 0.7, timing: 1.5 },
        { note: NOTES.B4, duration: 0.5, velocity: 0.5, timing: 2.5 },
        { note: NOTES.A4, duration: 3, velocity: 0.8, timing: 3 }
      ],
      volume: 0.6,
      channel: 0,
      waveform: 'sawtooth',
      enabled: true
    }
  ],
  transitions: []
};
```

#### Music State Management
```typescript
class MusicManager {
  private currentTrack?: MusicTrack;
  private isPlaying: boolean = false;
  private sequencer: MusicSequencer;
  
  constructor(private chiptuneEngine: ChiptuneEngine) {
    this.sequencer = new MusicSequencer(chiptuneEngine);
  }
  
  playRegionMusic(regionName: string, fadeTime: number = 2.0) {
    const newTrack = this.getTrackForRegion(regionName);
    
    if (this.currentTrack?.id === newTrack.id) {
      return; // Already playing this track
    }
    
    if (this.isPlaying) {
      this.fadeOut(fadeTime / 2).then(() => {
        this.startTrack(newTrack, fadeTime / 2);
      });
    } else {
      this.startTrack(newTrack, fadeTime);
    }
  }
  
  private getTrackForRegion(regionName: string): MusicTrack {
    const trackMap: Record<string, MusicTrack> = {
      'Verdant Lowlands': VERDANT_LOWLANDS_MUSIC,
      'Whisperwood': WHISPERWOOD_MUSIC,
      'Moonwell Marsh': MOONWELL_MARSH_MUSIC,
      // ... other regions
    };
    
    return trackMap[regionName] || VERDANT_LOWLANDS_MUSIC;
  }
}
```

### Sound Effects System

#### SFX Categories and Implementation
```typescript
interface SoundEffect {
  id: string;
  category: 'combat' | 'movement' | 'interaction' | 'ambient' | 'ui';
  synthesis: 'oscillator' | 'noise' | 'sample';
  parameters: SFXParameters;
}

interface SFXParameters {
  frequency?: number;
  duration: number;
  volume: number;
  envelope: ADSREnvelope;
  filter?: FilterParams;
  modulation?: ModulationParams;
}

// Combat sound effects
const COMBAT_SFX = {
  SWORD_SWING: {
    id: 'sword_swing',
    category: 'combat',
    synthesis: 'oscillator',
    parameters: {
      frequency: 200,
      duration: 0.15,
      volume: 0.6,
      envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.09 },
      filter: { type: 'lowpass', frequency: 800 },
      modulation: { type: 'frequency', rate: 20, depth: 50 }
    }
  },
  
  ENEMY_HIT: {
    id: 'enemy_hit',
    category: 'combat',
    synthesis: 'noise',
    parameters: {
      duration: 0.1,
      volume: 0.5,
      envelope: { attack: 0.005, decay: 0.03, sustain: 0.1, release: 0.065 },
      filter: { type: 'highpass', frequency: 300 }
    }
  },
  
  PLAYER_DAMAGE: {
    id: 'player_damage',
    category: 'combat',
    synthesis: 'oscillator',
    parameters: {
      frequency: 150,
      duration: 0.4,
      volume: 0.7,
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.28 },
      modulation: { type: 'frequency', rate: 8, depth: 30 }
    }
  }
} as const;
```

#### SFX Synthesis Engine
```typescript
class SFXEngine {
  constructor(private audioContext: AudioContext, private sfxGainNode: GainNode) {}
  
  playSoundEffect(sfx: SoundEffect, pitch: number = 1.0, volume: number = 1.0) {
    switch (sfx.synthesis) {
      case 'oscillator':
        this.playOscillatorSFX(sfx, pitch, volume);
        break;
      case 'noise':
        this.playNoiseSFX(sfx, volume);
        break;
      case 'sample':
        this.playSampleSFX(sfx, pitch, volume);
        break;
    }
  }
  
  private playOscillatorSFX(sfx: SoundEffect, pitch: number, volume: number) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();
    
    // Configure oscillator
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(
      (sfx.parameters.frequency || 440) * pitch,
      this.audioContext.currentTime
    );
    
    // Configure filter if specified
    if (sfx.parameters.filter) {
      filterNode.type = sfx.parameters.filter.type as BiquadFilterType;
      filterNode.frequency.setValueAtTime(
        sfx.parameters.filter.frequency,
        this.audioContext.currentTime
      );
    }
    
    // Apply ADSR envelope
    this.applyEnvelope(gainNode, sfx.parameters.envelope, sfx.parameters.duration, volume);
    
    // Connect audio graph
    oscillator.connect(sfx.parameters.filter ? filterNode : gainNode);
    if (sfx.parameters.filter) filterNode.connect(gainNode);
    gainNode.connect(this.sfxGainNode);
    
    // Apply modulation if specified
    if (sfx.parameters.modulation) {
      this.applyModulation(oscillator, sfx.parameters.modulation);
    }
    
    // Play sound
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + sfx.parameters.duration);
  }
  
  private applyEnvelope(gainNode: GainNode, envelope: ADSREnvelope, duration: number, volume: number) {
    const now = this.audioContext.currentTime;
    const { attack, decay, sustain, release } = envelope;
    const peakVolume = (sfx.parameters.volume || 1.0) * volume;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peakVolume, now + attack);
    gainNode.gain.linearRampToValueAtTime(peakVolume * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(peakVolume * sustain, now + duration - release);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
  }
}
```

### Environmental Audio

#### Spatial Audio Implementation
```typescript
class SpatialAudioManager {
  private pannerNodes: Map<string, PannerNode> = new Map();
  
  createSpatialSound(id: string, position: Vector2, playerPosition: Vector2): PannerNode {
    const pannerNode = this.audioContext.createPanner();
    
    // Configure 3D audio properties
    pannerNode.panningModel = 'HRTF';
    pannerNode.distanceModel = 'linear';
    pannerNode.maxDistance = 200;  // Max hearing distance in pixels
    pannerNode.rolloffFactor = 1;
    
    // Set position based on game world coordinates
    this.updateSpatialPosition(pannerNode, position, playerPosition);
    
    this.pannerNodes.set(id, pannerNode);
    return pannerNode;
  }
  
  updateSpatialPosition(panner: PannerNode, soundPos: Vector2, playerPos: Vector2) {
    // Convert 2D game coordinates to 3D audio space
    const relativeX = (soundPos.x - playerPos.x) / 100; // Normalize to reasonable scale
    const relativeY = 0; // Keep on same horizontal plane
    const relativeZ = (soundPos.y - playerPos.y) / 100;
    
    panner.positionX.setValueAtTime(relativeX, this.audioContext.currentTime);
    panner.positionY.setValueAtTime(relativeY, this.audioContext.currentTime);
    panner.positionZ.setValueAtTime(relativeZ, this.audioContext.currentTime);
  }
}
```

#### Ambient Sound Layers
```typescript
const AMBIENT_SOUNDS = {
  FOREST: {
    layers: [
      { id: 'wind', volume: 0.3, frequency: 100, modulation: { rate: 0.5, depth: 20 } },
      { id: 'leaves', volume: 0.2, frequency: 2000, modulation: { rate: 2, depth: 100 } },
      { id: 'birds', volume: 0.15, pattern: 'random_chirps' }
    ]
  },
  
  MARSH: {
    layers: [
      { id: 'water', volume: 0.4, frequency: 80, modulation: { rate: 0.3, depth: 10 } },
      { id: 'bubbles', volume: 0.2, pattern: 'random_pops' },
      { id: 'mist', volume: 0.25, frequency: 1500, filter: 'lowpass' }
    ]
  },
  
  DUNGEON: {
    layers: [
      { id: 'echo', volume: 0.3, reverb: { roomSize: 0.8, decay: 2.5 } },
      { id: 'drips', volume: 0.1, pattern: 'random_drips' },
      { id: 'distant_wind', volume: 0.2, frequency: 60 }
    ]
  }
} as const;
```

### Audio Optimization

#### Performance Guidelines
```typescript
class AudioOptimizer {
  private activeVoices: number = 0;
  private maxVoices: number = 16;
  private voicePool: AudioBufferSourceNode[] = [];
  
  // Voice limiting to prevent audio overload
  canPlayNewVoice(): boolean {
    return this.activeVoices < this.maxVoices;
  }
  
  // Audio compression for web delivery
  optimizeAudioAssets(assets: AudioAsset[]): OptimizedAudioAsset[] {
    return assets.map(asset => ({
      ...asset,
      // Prefer OGG for smaller file sizes, fallback to MP3
      format: this.supportsOGG() ? 'ogg' : 'mp3',
      bitrate: asset.type === 'music' ? 128 : 96, // Lower bitrate for SFX
      sampleRate: asset.type === 'music' ? 44100 : 22050 // Lower rate for SFX
    }));
  }
  
  // Cleanup unused audio resources
  garbageCollectAudio() {
    this.pannerNodes.forEach((panner, id) => {
      if (!this.isAudioSourceActive(id)) {
        panner.disconnect();
        this.pannerNodes.delete(id);
      }
    });
  }
}
```

### Integration with Game Systems

#### Audio Event System
```typescript
class AudioEventManager {
  private eventHandlers: Map<string, AudioEventHandler> = new Map();
  
  registerEventHandler(eventType: string, handler: AudioEventHandler) {
    this.eventHandlers.set(eventType, handler);
  }
  
  handleGameEvent(event: GameEvent) {
    const handler = this.eventHandlers.get(event.type);
    if (handler) {
      handler.processEvent(event);
    }
  }
}

// Example event handlers
const AUDIO_EVENT_HANDLERS = {
  'player.attack': (event: GameEvent) => {
    sfxEngine.playSoundEffect(COMBAT_SFX.SWORD_SWING);
  },
  
  'enemy.hit': (event: GameEvent) => {
    sfxEngine.playSoundEffect(COMBAT_SFX.ENEMY_HIT, 
      1.0 + (Math.random() - 0.5) * 0.2); // Random pitch variation
  },
  
  'realm.transition': (event: GameEvent) => {
    // Special transition sound effect
    this.playRealmTransitionSound(event.data.fromRealm, event.data.toRealm);
  },
  
  'player.region_enter': (event: GameEvent) => {
    musicManager.playRegionMusic(event.data.regionName);
  }
};
```

### Practical SNES-Style Audio Usage

#### High-Level Audio Utilities (Implemented)
```typescript
// Located at: src/game/utils/audioUtils.ts

// Combat audio with authentic SNES feel
export class CombatAudio {
  static playSwordSwing(): void {
    audioManager.playSfx('sfx_sword_swing', {
      pitchVariation: PITCH_VARIATIONS.SUBTLE, // ±20 cents
      volume: 0.8
    });
  }
  
  static playPlayerDamage(): void {
    // Duck music momentarily for impact
    audioManager.duckMusic(0.2, AUDIO_TIMING.DUCK_DURATION);
    audioManager.playSfx('sfx_player_damage', {
      pitchVariation: PITCH_VARIATIONS.SUBTLE,
      volume: 0.9
    });
  }
}

// Region music with intro->loop patterns
export class RegionAudio {
  static async enterRegion(regionName: string): Promise<void> {
    await audioManager.loadRegionMusic(regionName);
    audioManager.playMusic(`bgm_${regionName}`, AUDIO_TIMING.MUSIC_CROSSFADE);
  }
}
```

#### SNES-Authentic Pitch Variation
```typescript
export const PITCH_VARIATIONS = {
  SUBTLE: 20,     // ±20 cents - barely noticeable
  MODERATE: 40,   // ±40 cents - adds life without being obvious  
  NOTICEABLE: 80, // ±80 cents - clearly varied
  EXTREME: 120    // ±120 cents - cartoonish/exaggerated
} as const;

// Usage in game events:
audioManager.playSfx('sfx_enemy_hit', {
  pitchVariation: PITCH_VARIATIONS.MODERATE // Keeps hits interesting
});
```

#### Audio Presets for Game States
```typescript
export const AUDIO_PRESETS = {
  NORMAL_GAMEPLAY: {
    master: 0.7, music: 0.6, sfx: 0.8, ui: 0.7, ambient: 0.4
  },
  BOSS_BATTLE: {
    master: 0.8, music: 0.7, sfx: 0.9, ui: 0.6, ambient: 0.2
  },
  DIALOGUE_SCENE: {
    master: 0.6, music: 0.3, sfx: 0.6, ui: 0.7, ambient: 0.2
  }
} as const;

// Apply when game state changes
applyAudioPreset('BOSS_BATTLE');
```

### Production Workflow for SNES-Style Audio

#### Recommended Tools
- **Plogue chipsynth SFC (VST/AU)**: Extremely accurate SNES synth
- **SNES soundfonts (SF2)**: In any DAW (FL Studio, Ableton, Logic, LMMS)
- **Trackers**: OpenMPT or DefleMask for authentic composition
- **SFX generators**: bfxr, sfxr, ChipTone for retro sound effects

#### File Organization (Implemented)
```
public/audio/
├── music/           # Region themes with intro/loop structure
│   ├── verdant_lowlands.ogg
│   ├── verdant_lowlands.m4a
│   └── ...
├── sfx/             # Combat and interaction sounds  
│   ├── sword_swing.ogg
│   ├── enemy_hit.ogg
│   └── ...
├── ui/              # Menu and interface sounds
│   ├── menu_select.ogg
│   └── ...
└── ambient/         # Environmental loops
    ├── wind.ogg
    └── ...
```

#### Critical Performance Features
- **Mobile Audio Unlock**: Automatic handling for iOS/Android policies
- **Concurrency Limits**: Prevents audio chaos (max 3 similar SFX per 100ms)
- **Zero-Latency SFX**: Critical sounds preloaded for instant response
- **Sample-Accurate Looping**: Perfect music loops using Howler sprites
- **Automatic Fallbacks**: OGG primary, M4A for Safari/iOS compatibility

This agent ensures that Echoes of Aeria has rich, dynamic audio that enhances the gameplay experience while maintaining the authentic SNES aesthetic and technical performance requirements through modern web audio optimization.