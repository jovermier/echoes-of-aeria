# SNES-Style Audio System for Echoes of Aeria

This directory contains a comprehensive audio management system designed to deliver authentic 16-bit audio experiences in the browser, following best practices from the SNES era.

## 🎵 Key Features

### Authentic SNES Sound
- **Intro->Loop Music Structure**: Seamless background music with sample-accurate looping
- **Pitch Variation**: Organic SFX feel with ±20-40 cent pitch randomization
- **Music Ducking**: Automatic volume reduction for dialogue and impact moments
- **ADSR Characteristics**: Proper attack/decay/sustain/release envelopes

### Modern Web Optimization
- **Cross-Browser Support**: OGG Vorbis primary + M4A fallback for Safari/iOS
- **Mobile Audio Unlock**: Automatic handling of iOS/Android audio policies
- **Zero-Latency SFX**: Critical sounds preloaded for instant response
- **Concurrency Control**: Intelligent limiting to prevent audio chaos
- **Performance Optimized**: Efficient memory usage and garbage collection

## 📁 File Structure

```
src/game/systems/
├── AudioManager.ts         # Core audio management singleton
└── README-Audio.md         # This documentation

src/game/utils/
└── audioUtils.ts           # High-level utilities and presets

src/assets/
└── audioManifest.ts        # Complete audio asset definitions

src/game/examples/
└── audioIntegration.ts     # Usage examples and integration patterns

public/audio/               # Audio asset files
├── music/                  # Regional themes with intro/loop structure
├── sfx/                    # Combat and interaction sounds
├── ui/                     # Menu and interface audio
└── ambient/                # Environmental loops
```

## 🚀 Quick Start

### Initialize Audio System
```typescript
import { initializeAudio } from '../utils/audioUtils';

// Initialize SNES-style audio on game startup
await initializeAudio();
```

### Play Combat Audio
```typescript
import { CombatAudio } from '../utils/audioUtils';

// Sword swing with subtle pitch variation
CombatAudio.playSwordSwing();

// Player damage with music ducking
CombatAudio.playPlayerDamage();
```

### Region Music Management
```typescript
import { RegionAudio } from '../utils/audioUtils';

// Seamlessly transition to region music
await RegionAudio.enterRegion('verdant_lowlands');
```

### Apply Audio Presets
```typescript
import { applyAudioPreset } from '../utils/audioUtils';

// Switch to boss battle audio levels
applyAudioPreset('BOSS_BATTLE');

// Return to normal gameplay
applyAudioPreset('NORMAL_GAMEPLAY');
```

## 🎚️ Audio Categories & Mixing

The system uses four distinct audio categories:

- **Music** (60%): Regional themes, boss battles, ambient music
- **SFX** (80%): Combat sounds, interactions, movement
- **UI** (70%): Menu navigation, confirmations, notifications  
- **Ambient** (40%): Environmental loops, atmospheric sounds

Each category can be independently controlled for dynamic mixing.

## 🎼 Production Specifications

### Music Tracks
- **Format**: OGG Vorbis (128-160 kbps) + M4A fallback
- **Structure**: 4-12 second intro + 40-72 second loop section
- **Mastering**: Light compression, tape saturation, LPF @12kHz
- **Sample Rate**: 44.1 kHz stereo

### Sound Effects
- **Format**: OGG Vorbis (96-128 kbps) + M4A fallback  
- **Duration**: <2 seconds for most SFX
- **Sample Rate**: 22.05 kHz mono (retro) or 44.1 kHz (modern)
- **Processing**: ADSR envelope, pitch variation ready

## 🔧 Advanced Features

### Pitch Variation Presets
```typescript
PITCH_VARIATIONS = {
  SUBTLE: 20,     // ±20 cents - barely noticeable
  MODERATE: 40,   // ±40 cents - adds life without being obvious
  NOTICEABLE: 80, // ±80 cents - clearly varied
  EXTREME: 120    // ±120 cents - cartoonish/exaggerated
}
```

### Audio Presets for Game States
```typescript
AUDIO_PRESETS = {
  NORMAL_GAMEPLAY: { master: 0.7, music: 0.6, sfx: 0.8, ui: 0.7, ambient: 0.4 },
  BOSS_BATTLE: { master: 0.8, music: 0.7, sfx: 0.9, ui: 0.6, ambient: 0.2 },
  DIALOGUE_SCENE: { master: 0.6, music: 0.3, sfx: 0.6, ui: 0.7, ambient: 0.2 },
  MENU_FOCUSED: { master: 0.5, music: 0.2, sfx: 0.4, ui: 0.8, ambient: 0.1 }
}
```

### Concurrency Management
- Maximum 3 similar SFX playing simultaneously
- 100ms cooldown between identical sound effects
- Automatic cleanup of finished audio sources

## 🎯 Integration Examples

### Combat Integration
```typescript
export class Player {
  performAttack(): void {
    // Visual attack logic...
    CombatAudio.playSwordSwing();
  }
  
  takeDamage(amount: number): void {
    this.health -= amount;
    CombatAudio.playPlayerDamage(); // Includes music ducking
  }
}
```

### Menu Integration
```typescript
export class Menu {
  navigateUp(): void {
    this.selectedIndex--;
    UIAudio.playMenuSelect();
  }
  
  confirmSelection(): void {
    UIAudio.playMenuConfirm();
    // Handle selection...
  }
}
```

### World Integration
```typescript
export class WorldManager {
  async enterRegion(name: string): Promise<void> {
    await RegionAudio.enterRegion(name);
    // Update visuals...
  }
  
  collectItem(type: 'rupee' | 'heart' | 'key'): void {
    WorldAudio.playItemCollect(type);
    // Update inventory...
  }
}
```

## 🛠️ Recommended Tools

### For Music Composition
- **Plogue chipsynth SFC**: Extremely accurate SNES synthesis
- **SNES Soundfonts**: Use in any DAW (FL Studio, Ableton, Logic)
- **OpenMPT/DefleMask**: Tracker-based composition

### For SFX Creation
- **bfxr/sfxr**: Classic retro sound generators
- **ChipTone**: Browser-based chiptune SFX tool
- **Audacity**: Free editing for sample processing

## 📊 Performance Monitoring

The system includes built-in performance monitoring:

```typescript
// Check if audio system is performing well
const mixer = audioManager.getMixerSettings();
console.log('Audio performance:', {
  activeSounds: audioManager.getActiveSoundCount(),
  memoryUsage: audioManager.getMemoryUsage(),
  mixer
});
```

## 🐛 Debugging

### Audio Debug Utilities
```typescript
import { AudioDebug } from '../utils/audioUtils';

// Test all sound effects
AudioDebug.testAllSfx();

// Log current audio state
AudioDebug.logAudioState();
```

### Common Issues
- **No audio on mobile**: Ensure user interaction before playing audio
- **Audio lag**: Preload critical SFX using `audioManager.preloadCriticalAudio()`
- **Memory leaks**: Call `audioManager.dispose()` on scene cleanup
- **Cross-browser issues**: Verify both OGG and M4A files are present

## 🔄 Migration from Basic Audio

If migrating from a simpler audio system:

1. Replace direct Web Audio API calls with AudioManager
2. Convert music to intro+loop structure using audio editing software
3. Add pitch variation to existing SFX calls
4. Implement audio presets for different game states
5. Add music ducking for dialogue and impact moments

## 📈 Future Enhancements

Planned improvements:
- **3D Spatial Audio**: For environmental immersion
- **Dynamic Music Layers**: Adaptive instrumentation based on game state
- **Advanced Reverb**: Room-specific acoustic simulation
- **Audio Compression**: Real-time dynamics processing
- **Procedural SFX**: Runtime sound generation for infinite variety

---

This audio system ensures Echoes of Aeria delivers an authentic 16-bit audio experience while leveraging modern web technologies for optimal performance and compatibility.