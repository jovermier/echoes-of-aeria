import './style.css';

class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isPlaying: boolean = false;
  public backgroundMusicTimeout: number | null = null;
  public activeOscillators: Set<OscillatorNode> = new Set();

  constructor() {
    this.initAudio();
  }

  private async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  // Nuclear option - completely destroy and recreate audio context
  forceResetAudio() {
    console.log('FORCE RESETTING AUDIO - Destroying everything');

    // Stop all active oscillators
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {}
    });
    this.activeOscillators.clear();

    // Clear timeouts
    if (this.backgroundMusicTimeout) {
      clearTimeout(this.backgroundMusicTimeout);
      this.backgroundMusicTimeout = null;
    }

    // Close and recreate audio context
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
    }

    this.isPlaying = false;

    // Recreate fresh audio context
    setTimeout(() => {
      this.initAudio();
    }, 100);
  }

  private createSquareWave(frequency: number, duration: number, volume: number = 0.1): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playNote(frequency: number, duration: number = 0.2, volume: number = 0.1): void {
    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.createSquareWave(frequency, duration, volume);
  }

  playSound(
    soundType:
      | 'attack'
      | 'collect'
      | 'hurt'
      | 'enemy_hit'
      | 'player_damage'
      | 'enemy_damage'
      | 'player_attack'
      | 'enemy_attack',
  ): void {
    switch (soundType) {
      case 'attack':
        this.playNote(440, 0.1, 0.15);
        setTimeout(() => this.playNote(660, 0.1, 0.1), 50);
        break;
      case 'collect':
        this.playNote(523, 0.1, 0.12);
        setTimeout(() => this.playNote(659, 0.1, 0.1), 80);
        setTimeout(() => this.playNote(784, 0.15, 0.08), 160);
        break;
      case 'hurt':
        this.playNote(220, 0.3, 0.2);
        break;
      case 'enemy_hit':
        this.playNote(330, 0.1, 0.1);
        break;
      case 'player_damage':
        // More dramatic player damage sound
        this.playNote(180, 0.2, 0.25); // Low painful note
        setTimeout(() => this.playNote(160, 0.2, 0.2), 100); // Even lower
        setTimeout(() => this.playNote(140, 0.3, 0.15), 200); // Fading pain
        break;
      case 'enemy_damage':
        // Higher pitched enemy damage sound
        this.playNote(400, 0.15, 0.18); // Sharp hit
        setTimeout(() => this.playNote(350, 0.1, 0.12), 80); // Quick follow-up
        break;
      case 'player_attack':
        // Heroic sword swish sound
        this.playNote(600, 0.08, 0.12); // Sharp swish start
        setTimeout(() => this.playNote(800, 0.06, 0.1), 30); // Rising pitch
        setTimeout(() => this.playNote(700, 0.08, 0.08), 60); // Completing swing
        break;
      case 'enemy_attack':
        // Menacing enemy attack sound
        this.playNote(250, 0.12, 0.15); // Low growling start
        setTimeout(() => this.playNote(300, 0.1, 0.12), 50); // Rising threat
        setTimeout(() => this.playNote(280, 0.08, 0.1), 100); // Attack follow-through
        break;
    }
  }

  startBackgroundMusic(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.playBackgroundLoop();
  }

  stopBackgroundMusic(): void {
    this.isPlaying = false;
    if (this.backgroundMusicTimeout) {
      clearTimeout(this.backgroundMusicTimeout);
      this.backgroundMusicTimeout = null;
    }

    // Stop all active oscillators immediately
    this.activeOscillators.forEach(oscillator => {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (e) {
        // Oscillator might already be stopped, ignore error
      }
    });
    this.activeOscillators.clear();
  }

  private playBackgroundLoop(): void {
    if (!this.isPlaying) return;

    // Main melody (lead voice) - Gentle intro building to heroic theme
    const melody = [
      // Gentle opening - soft and welcoming
      { freq: 523, dur: 0.75 }, // C (gentle start)
      { freq: 587, dur: 0.5 }, // D
      { freq: 659, dur: 0.75 }, // E (warm)
      { freq: 0, dur: 0.5 }, // Rest
      { freq: 587, dur: 0.5 }, // D
      { freq: 523, dur: 1.0 }, // C (peaceful)
      { freq: 0, dur: 0.5 }, // Rest

      // Adventure theme A section - rising melody
      { freq: 587, dur: 0.25 }, // D
      { freq: 659, dur: 0.25 }, // E
      { freq: 740, dur: 0.5 }, // F#
      { freq: 880, dur: 0.5 }, // A
      { freq: 784, dur: 0.25 }, // G
      { freq: 659, dur: 0.25 }, // E
      { freq: 587, dur: 0.5 }, // D
      { freq: 523, dur: 0.5 }, // C

      // Build to heroic fanfare (moved later in the song)
      { freq: 523, dur: 0.5 }, // C
      { freq: 659, dur: 0.5 }, // E
      { freq: 784, dur: 0.5 }, // G
      { freq: 1047, dur: 1.0 }, // C high (strong resolution)
      { freq: 880, dur: 0.5 }, // A
      { freq: 784, dur: 0.5 }, // G
      { freq: 659, dur: 1.0 }, // E (held)

      // B section - more complex melodic line
      { freq: 698, dur: 0.25 }, // F
      { freq: 784, dur: 0.25 }, // G
      { freq: 880, dur: 0.5 }, // A
      { freq: 932, dur: 0.25 }, // Bb
      { freq: 1047, dur: 0.75 }, // C high (climax)
      { freq: 880, dur: 0.25 }, // A
      { freq: 784, dur: 0.5 }, // G
      { freq: 659, dur: 1.0 }, // E (resolution)

      // Bridge section - mysterious/exploration feel
      { freq: 466, dur: 0.5 }, // Bb (modal interchange)
      { freq: 523, dur: 0.5 }, // C
      { freq: 622, dur: 0.5 }, // Eb
      { freq: 698, dur: 0.5 }, // F
      { freq: 740, dur: 1.0 }, // F# (tension)
      { freq: 784, dur: 0.5 }, // G
      { freq: 880, dur: 0.5 }, // A

      // Final heroic return - leads back to beginning
      { freq: 1047, dur: 0.25 }, // C high
      { freq: 932, dur: 0.25 }, // Bb
      { freq: 880, dur: 0.5 }, // A
      { freq: 784, dur: 0.25 }, // G
      { freq: 659, dur: 0.25 }, // E
      { freq: 587, dur: 0.25 }, // D (transitional)
      { freq: 523, dur: 0.5 }, // C (brief resolution)
      { freq: 440, dur: 0.25 }, // A (setup for next loop)
      { freq: 494, dur: 0.25 }, // B (leading tone back to C)
    ];

    // Harmony line (second voice) - creates rich harmonies
    const harmony = [
      // Opening harmonies - thirds and fifths
      { freq: 330, dur: 0.5 }, // E (third below C)
      { freq: 392, dur: 0.5 }, // G (fifth below E)
      { freq: 523, dur: 0.5 }, // C (fifth below G)
      { freq: 659, dur: 1.0 }, // E (third below C high)
      { freq: 554, dur: 0.5 }, // C# (third below A)
      { freq: 523, dur: 0.5 }, // C (fourth below G)
      { freq: 392, dur: 1.0 }, // G (third below E)
      { freq: 0, dur: 0.5 }, // Rest

      // Harmony for A section
      { freq: 293, dur: 0.25 }, // D (octave below)
      { freq: 330, dur: 0.25 }, // E (octave below)
      { freq: 370, dur: 0.5 }, // F# (octave below)
      { freq: 440, dur: 0.5 }, // A (octave below)
      { freq: 392, dur: 0.25 }, // G (octave below)
      { freq: 330, dur: 0.25 }, // E (octave below)
      { freq: 293, dur: 0.5 }, // D (octave below)
      { freq: 262, dur: 0.5 }, // C (octave below)

      // B section harmonies
      { freq: 349, dur: 0.25 }, // F (octave below)
      { freq: 392, dur: 0.25 }, // G (octave below)
      { freq: 440, dur: 0.5 }, // A (octave below)
      { freq: 466, dur: 0.25 }, // Bb (octave below)
      { freq: 523, dur: 0.75 }, // C (octave below high C)
      { freq: 440, dur: 0.25 }, // A (octave below)
      { freq: 392, dur: 0.5 }, // G (octave below)
      { freq: 330, dur: 1.0 }, // E (octave below)

      // Bridge harmonies
      { freq: 233, dur: 0.5 }, // Bb (octave below)
      { freq: 262, dur: 0.5 }, // C (octave below)
      { freq: 311, dur: 0.5 }, // Eb (octave below)
      { freq: 349, dur: 0.5 }, // F (octave below)
      { freq: 370, dur: 1.0 }, // F# (octave below)
      { freq: 392, dur: 0.5 }, // G (octave below)
      { freq: 440, dur: 0.5 }, // A (octave below)

      // Final section harmonies - smoother transition
      { freq: 523, dur: 0.25 }, // C (octave below high C)
      { freq: 466, dur: 0.25 }, // Bb (octave below)
      { freq: 440, dur: 0.5 }, // A (octave below)
      { freq: 392, dur: 0.25 }, // G (octave below)
      { freq: 330, dur: 0.25 }, // E (octave below)
      { freq: 293, dur: 0.25 }, // D (transitional harmony)
      { freq: 262, dur: 0.5 }, // C (brief resolution)
      { freq: 220, dur: 0.25 }, // A (setup harmony)
      { freq: 247, dur: 0.25 }, // B (leading harmony)
    ];

    // Bass line - provides rhythmic foundation like Zelda games
    const bassLine = [
      // Strong bass foundation
      { freq: 131, dur: 1.0 }, // C bass
      { freq: 165, dur: 1.0 }, // E bass
      { freq: 196, dur: 1.0 }, // G bass
      { freq: 131, dur: 1.0 }, // C bass
      { freq: 147, dur: 1.0 }, // D bass
      { freq: 196, dur: 1.0 }, // G bass
      { freq: 131, dur: 1.0 }, // C bass
      { freq: 0, dur: 0.5 }, // Rest

      // Walking bass line for A section
      { freq: 147, dur: 0.5 }, // D bass
      { freq: 131, dur: 0.5 }, // C bass
      { freq: 147, dur: 0.5 }, // D bass
      { freq: 165, dur: 0.5 }, // E bass
      { freq: 147, dur: 0.5 }, // D bass
      { freq: 131, dur: 0.5 }, // C bass
      { freq: 147, dur: 0.5 }, // D bass
      { freq: 131, dur: 0.5 }, // C bass

      // B section bass
      { freq: 175, dur: 0.5 }, // F bass
      { freq: 196, dur: 0.5 }, // G bass
      { freq: 220, dur: 0.5 }, // A bass
      { freq: 131, dur: 0.5 }, // C bass
      { freq: 131, dur: 1.0 }, // C bass (strong)
      { freq: 147, dur: 0.5 }, // D bass
      { freq: 196, dur: 0.5 }, // G bass
      { freq: 131, dur: 1.0 }, // C bass

      // Bridge bass - darker progression
      { freq: 117, dur: 0.5 }, // Bb bass
      { freq: 131, dur: 0.5 }, // C bass
      { freq: 156, dur: 0.5 }, // Eb bass
      { freq: 175, dur: 0.5 }, // F bass
      { freq: 185, dur: 1.0 }, // F# bass
      { freq: 196, dur: 0.5 }, // G bass
      { freq: 220, dur: 0.5 }, // A bass

      // Final bass progression - connecting back to start
      { freq: 131, dur: 0.5 }, // C bass
      { freq: 117, dur: 0.5 }, // Bb bass
      { freq: 110, dur: 0.5 }, // A bass
      { freq: 98, dur: 0.25 }, // G bass
      { freq: 82, dur: 0.25 }, // E bass
      { freq: 73, dur: 0.25 }, // D bass (transitional)
      { freq: 65, dur: 0.5 }, // C bass (brief rest)
      { freq: 110, dur: 0.25 }, // A bass (anticipation)
      { freq: 123, dur: 0.25 }, // B bass (leading back to C)
    ];

    // Arpeggio/percussion layer for texture
    const arpeggios = [
      // Opening arpeggiated chords
      { freq: 262, dur: 0.125 },
      { freq: 330, dur: 0.125 },
      { freq: 392, dur: 0.125 },
      { freq: 523, dur: 0.125 },
      { freq: 330, dur: 0.125 },
      { freq: 415, dur: 0.125 },
      { freq: 494, dur: 0.125 },
      { freq: 659, dur: 0.125 },
      { freq: 392, dur: 0.125 },
      { freq: 494, dur: 0.125 },
      { freq: 587, dur: 0.125 },
      { freq: 784, dur: 0.125 },
      { freq: 523, dur: 0.125 },
      { freq: 659, dur: 0.125 },
      { freq: 784, dur: 0.125 },
      { freq: 1047, dur: 0.125 },

      // Continue pattern throughout and lead back to beginning
      { freq: 440, dur: 0.125 },
      { freq: 554, dur: 0.125 },
      { freq: 659, dur: 0.125 },
      { freq: 880, dur: 0.125 },
      { freq: 392, dur: 0.125 },
      { freq: 494, dur: 0.125 },
      { freq: 587, dur: 0.125 },
      { freq: 784, dur: 0.125 },
      { freq: 330, dur: 0.125 },
      { freq: 415, dur: 0.125 },
      { freq: 494, dur: 0.125 },
      { freq: 659, dur: 0.125 },
      // Final transitional arpeggios leading back to opening
      { freq: 262, dur: 0.125 },
      { freq: 330, dur: 0.125 },
      { freq: 415, dur: 0.125 },
      { freq: 494, dur: 0.125 },
    ];

    // Start all instruments simultaneously at normal volumes
    this.playMelodyLayer(melody, 0.08, 'sawtooth'); // Lead melody
    this.playMelodyLayer(harmony, 0.04, 'square'); // Harmony
    this.playMelodyLayer(bassLine, 0.03, 'triangle'); // Bass
    this.playMelodyLayer(arpeggios, 0.02, 'sine'); // Arpeggios

    // Use fixed loop duration for tight timing (no gaps)
    const loopDuration = 16000; // 16 seconds - fixed duration for consistent looping

    this.backgroundMusicTimeout = window.setTimeout(() => {
      this.playBackgroundLoop();
    }, loopDuration); // Seamless loop with fixed timing
  }

  private playMelodyLayer(
    melody: Array<{ freq: number; dur: number }>,
    volume: number,
    waveType: OscillatorType = 'square',
  ): void {
    let currentTime = 0;
    melody.forEach(note => {
      setTimeout(() => {
        if (this.isPlaying && note.freq > 0) {
          // 0 frequency = rest
          this.playComplexNote(note.freq, note.dur, volume, waveType);
        }
      }, currentTime * 1000);
      currentTime += note.dur;
    });
  }

  private playComplexNote(
    frequency: number,
    duration: number,
    volume: number,
    waveType: OscillatorType = 'square',
  ): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Add slight vibrato for more musical expression
    if (waveType === 'sawtooth') {
      const vibrato = this.audioContext.createOscillator();
      const vibratoGain = this.audioContext.createGain();
      vibrato.frequency.setValueAtTime(6, this.audioContext.currentTime); // 6Hz vibrato
      vibratoGain.gain.setValueAtTime(2, this.audioContext.currentTime); // Small pitch variation
      vibrato.connect(vibratoGain);
      vibratoGain.connect(oscillator.frequency);
      vibrato.start(this.audioContext.currentTime);
      vibrato.stop(this.audioContext.currentTime + duration);
    }

    // Low-pass filter for warmer sound
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    filterNode.Q.setValueAtTime(1, this.audioContext.currentTime);

    // ADSR envelope for more natural sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02); // Attack
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, this.audioContext.currentTime + 0.1); // Decay
    gainNode.gain.setValueAtTime(volume * 0.7, this.audioContext.currentTime + duration - 0.1); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration); // Release

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Track this oscillator so we can stop it later
    this.activeOscillators.add(oscillator);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);

    // Remove from tracking when it naturally ends
    oscillator.addEventListener('ended', () => {
      this.activeOscillators.delete(oscillator);
    });
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

type Direction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right';

type GameState = 'title' | 'playing' | 'paused' | 'inventory' | 'gameover' | 'dungeon';
type WorldState = 'dayrealm' | 'eclipse';

type DungeonType =
  | 'rootway_shrine'
  | 'old_waterworks'
  | 'mire_grotto'
  | 'cliffspire_monastery'
  | 'frostforge_bastion'
  | 'sunken_aqueduct'
  | 'amberglass_caverns'
  | 'obsidian_crown';

interface DungeonEntrance {
  id: DungeonType;
  name: string;
  position: Vector2;
  unlocked: boolean;
  completed: boolean;
  requiredItem?: string;
}

interface DungeonData {
  id: DungeonType;
  name: string;
  description: string;
  width: number;
  height: number;
  tiles: TileType[][];
  startPosition: Vector2;
  bossPosition?: Vector2;
  reward: {
    item: string;
    shard: string;
  };
}

type TileType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;

const Direction = {
  UP: 'up' as const,
  DOWN: 'down' as const,
  LEFT: 'left' as const,
  RIGHT: 'right' as const,
  UP_LEFT: 'up-left' as const,
  UP_RIGHT: 'up-right' as const,
  DOWN_LEFT: 'down-left' as const,
  DOWN_RIGHT: 'down-right' as const,
} as const;

const GameState = {
  TITLE: 'title' as const,
  PLAYING: 'playing' as const,
  PAUSED: 'paused' as const,
  INVENTORY: 'inventory' as const,
  GAMEOVER: 'gameover' as const,
} as const;

const TileType = {
  GRASS: 0 as const,
  WALL: 1 as const,
  WATER: 2 as const,
  TREE: 3 as const,
  ROCK: 4 as const,
  PATH: 5 as const,
  HOUSE_WALL: 6 as const,
  HOUSE_DOOR: 7 as const,
  BRIDGE: 8 as const,
  FLOWER: 9 as const,
  MOUNTAIN: 10 as const,
  DEEP_WATER: 11 as const,
  CASTLE_WALL: 12 as const,
  CASTLE_DOOR: 13 as const,
  TEMPLE: 14 as const,
  KEEP: 15 as const,
  DESERT: 16 as const,
  SNOW: 17 as const,
  MARSH: 18 as const,
  HOUSE: 19 as const,
  FLOOR: 20 as const,
} as const;

interface Vector2 {
  x: number;
  y: number;
}

interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface Entity {
  position: Vector2;
  size: Vector2;
  health: number;
  maxHealth: number;
  direction: Direction;
  speed: number;
  sprite: Sprite;
}

interface Player extends Entity {
  attacking: boolean;
  attackTimer: number;
  attackCooldown: number;
  lastAttackTime: number;
  hearts: number;
  rupees: number;
  keys: number;
  heartContainers: number;
  hasAetherMirror: boolean;
  hasSword: boolean;
  inventory: string[];
  animationFrame: number;
  animationTimer: number;
  hitEnemies: Set<Enemy>;
  isFlashing: boolean;
  flashTimer: number;
}

interface Enemy extends Entity {
  attackDamage: number;
  moveTimer: number;
  target: Vector2 | null;
  animationFrame: number;
  animationTimer: number;
  attackCooldown: number;
  lastAttackTime: number;
  attacking: boolean;
  attackTimer: number;
  hasHitPlayer: boolean;
  isFlashing: boolean;
  flashTimer: number;
}

interface Item {
  position: Vector2;
  size: Vector2;
  type: string;
  value: number;
  sprite: Sprite;
  collected: boolean;
}

class Camera {
  position: Vector2 = { x: 0, y: 0 };
  target: Vector2 = { x: 0, y: 0 };

  update(targetX: number, targetY: number, canvasWidth: number, canvasHeight: number) {
    this.target.x = targetX - canvasWidth / 2;
    this.target.y = targetY - canvasHeight / 2;

    const lerpFactor = 0.1;
    this.position.x += (this.target.x - this.position.x) * lerpFactor;
    this.position.y += (this.target.y - this.position.y) * lerpFactor;
    
    // Round camera position to whole pixels to prevent flickering
    this.position.x = Math.round(this.position.x);
    this.position.y = Math.round(this.position.y);
  }
}

class World {
  tileSize: number = 32;
  width: number = 80; // Expanded world size for Echoes of Aeria
  height: number = 60; // Larger world to accommodate all regions
  tiles: TileType[][] = [];
  eclipseTiles: TileType[][] = []; // Eclipse world version
  revealed: boolean[][] = [];
  visibilityRadius: number = 5;
  worldState: WorldState = 'dayrealm'; // Current world state
  transitionEffect: boolean = false; // Visual transition effect
  transitionTimer: number = 0;
  transitionDuration: number = 500; // ms

  constructor() {
    this.generateWorld();
    this.generateEclipseWorld();
    this.initializeFogOfWar();
  }

  generateWorld() {
    this.tiles = [];

    // Initialize ENTIRE world with grass first (prevents black areas)
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = TileType.GRASS;
      }
    }

    // Create the map regions on top of grass base
    this.createFixedMap();

    // Double-check: fill any remaining undefined tiles
    this.fillMissingTiles();
  }

  createFixedMap() {
    // Create the Echoes of Aeria world regions
    this.createEchoesRegions();

    // Add towns and settlements
    this.createTowns();

    // Connect regions with paths
    this.createRegionPaths();

    // Add dungeons and special locations
    this.createDungeons();

    // Scattered details and decorations
    this.addRegionalDetails();
  }

  fillMissingTiles() {
    // Ensure no undefined/null tiles exist
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x] === undefined || this.tiles[y][x] === null) {
          this.tiles[y][x] = TileType.GRASS;
        }
      }
    }
  }

  createEchoesRegions() {
    // Recreate the map layout from the provided image
    // 1. Central Grasslands (center) - Main starting area
    this.createCentralGrasslands();

    // 2. Desert Canyons (left and northwest) - Brown canyon areas
    this.createDesertCanyons();

    // 3. Water Networks (throughout) - Rivers and lakes
    this.createWaterNetworks();

    // 4. Snowy Peaks (northeast) - Ice region
    this.createSnowyPeaks();

    // 5. Eastern Grasslands (right side) - Extended green areas
    this.createEasternGrasslands();

    // 6. Southern Marsh (bottom) - Swampy areas
    this.createSouthernMarsh();

    // 7. Forest Patches (scattered) - Tree clusters
    this.createForestPatches();

    // 8. Mountain Barriers (borders) - Rocky boundaries
    this.createMountainBarriers();
  }

  createCentralGrasslands() {
    // Central green area - main starting region (matches image center)
    for (let x = 25; x < 55; x++) {
      for (let y = 20; y < 50; y++) {
        this.tiles[y][x] = TileType.GRASS;
        // Add scattered trees and flowers
        if (Math.random() < 0.08) {
          this.tiles[y][x] = TileType.TREE;
        } else if (Math.random() < 0.05) {
          this.tiles[y][x] = TileType.FLOWER;
        }
      }
    }
  }

  createDesertCanyons() {
    // Left side desert/canyon areas (brown regions in image)
    for (let x = 5; x < 25; x++) {
      for (let y = 5; y < 35; y++) {
        this.tiles[y][x] = TileType.DESERT;
        // Add rock formations
        if (Math.random() < 0.15) {
          this.tiles[y][x] = TileType.ROCK;
        }
      }
    }

    // Northwest canyon area
    for (let x = 25; x < 45; x++) {
      for (let y = 5; y < 18; y++) {
        this.tiles[y][x] = TileType.DESERT;
        if (Math.random() < 0.12) {
          this.tiles[y][x] = TileType.ROCK;
        }
      }
    }
  }

  createWaterNetworks() {
    // Central lake (smaller, more controlled)
    for (let x = 35; x < 40; x++) {
      for (let y = 28; y < 32; y++) {
        this.tiles[y][x] = TileType.WATER;
      }
    }

    // Limited river connections (not blocking entire center)
    // Small horizontal river sections
    for (let x = 20; x < 30; x++) {
      this.tiles[31][x] = TileType.WATER;
    }
    for (let x = 50; x < 65; x++) {
      this.tiles[31][x] = TileType.WATER;
    }

    // Small vertical river sections
    for (let y = 15; y < 25; y++) {
      this.tiles[y][42] = TileType.WATER;
    }
    for (let y = 40; y < 45; y++) {
      this.tiles[y][42] = TileType.WATER;
    }

    // Eastern lakes and waterways
    for (let x = 60; x < 70; x++) {
      for (let y = 15; y < 25; y++) {
        if ((x + y) % 4 === 0) {
          this.tiles[y][x] = TileType.WATER;
        }
      }
    }

    // Add bridges at key crossing points
    this.tiles[31][30] = TileType.BRIDGE;
    this.tiles[31][50] = TileType.BRIDGE;
    this.tiles[22][42] = TileType.BRIDGE;
    this.tiles[38][42] = TileType.BRIDGE;
  }

  createSnowyPeaks() {
    // Northeast snowy region (white area in top-right of image)
    for (let x = 60; x < 75; x++) {
      for (let y = 5; y < 20; y++) {
        this.tiles[y][x] = TileType.SNOW;
        // Add mountains for snow peaks
        if (Math.random() < 0.2) {
          this.tiles[y][x] = TileType.MOUNTAIN;
        }
      }
    }
  }

  createEasternGrasslands() {
    // Right side green areas (extensive grasslands in image)
    for (let x = 55; x < 75; x++) {
      for (let y = 25; y < 55; y++) {
        this.tiles[y][x] = TileType.GRASS;
        // Scattered trees and flowers
        if (Math.random() < 0.1) {
          this.tiles[y][x] = TileType.TREE;
        } else if (Math.random() < 0.06) {
          this.tiles[y][x] = TileType.FLOWER;
        }
      }
    }
  }

  createSouthernMarsh() {
    // Bottom swampy areas
    for (let x = 20; x < 60; x++) {
      for (let y = 50; y < 58; y++) {
        this.tiles[y][x] = TileType.MARSH;
        // Add water pools
        if (Math.random() < 0.3) {
          this.tiles[y][x] = TileType.WATER;
        }
      }
    }
  }

  createForestPatches() {
    // Scattered forest areas throughout the map
    const forestAreas = [
      { x: 10, y: 15, w: 8, h: 6 },
      { x: 25, y: 45, w: 6, h: 5 },
      { x: 65, y: 35, w: 7, h: 8 },
      { x: 15, y: 35, w: 5, h: 4 },
    ];

    forestAreas.forEach(area => {
      for (let x = area.x; x < area.x + area.w; x++) {
        for (let y = area.y; y < area.y + area.h; y++) {
          if (Math.random() < 0.7) {
            this.tiles[y][x] = TileType.TREE;
          }
        }
      }
    });
  }

  createMountainBarriers() {
    // Add mountain barriers at map edges to match image borders
    // Top border
    for (let x = 0; x < 80; x++) {
      for (let y = 0; y < 3; y++) {
        this.tiles[y][x] = TileType.MOUNTAIN;
      }
    }

    // Bottom border
    for (let x = 0; x < 80; x++) {
      for (let y = 57; y < 60; y++) {
        this.tiles[y][x] = TileType.MOUNTAIN;
      }
    }

    // Left border
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 3; x++) {
        this.tiles[y][x] = TileType.MOUNTAIN;
      }
    }

    // Right border
    for (let y = 0; y < 60; y++) {
      for (let x = 77; x < 80; x++) {
        this.tiles[y][x] = TileType.MOUNTAIN;
      }
    }
  }

  createTowns() {
    // Main central settlement (matches the large structure in image center)
    this.createCentralTown();

    // Smaller settlements scattered around map
    this.createScatteredSettlements();
  }

  createCentralTown() {
    // Main settlement in center (matches the big structure in image)
    const townX = 35;
    const townY = 28;

    // Large central building complex
    for (let x = townX; x < townX + 8; x++) {
      for (let y = townY; y < townY + 6; y++) {
        this.tiles[y][x] = TileType.HOUSE;
      }
    }

    // Main entrance
    this.tiles[townY + 5][townX + 4] = TileType.HOUSE_DOOR;

    // Surrounding paths
    for (let x = townX - 2; x < townX + 10; x++) {
      this.tiles[townY - 1][x] = TileType.PATH;
      this.tiles[townY + 6][x] = TileType.PATH;
    }
    for (let y = townY - 1; y < townY + 7; y++) {
      this.tiles[y][townX - 1] = TileType.PATH;
      this.tiles[y][townX + 8] = TileType.PATH;
    }
  }

  createBuilding(x: number, y: number, width: number, height: number, hasDoor: boolean) {
    for (let bx = x; bx < x + width; bx++) {
      for (let by = y; by < y + height; by++) {
        if (bx === x || bx === x + width - 1 || by === y || by === y + height - 1) {
          this.tiles[by][bx] = TileType.HOUSE_WALL;
        } else {
          this.tiles[by][bx] = TileType.PATH;
        }
      }
    }

    if (hasDoor) {
      this.tiles[y + height - 1][x + Math.floor(width / 2)] = TileType.HOUSE_DOOR;
    }
  }

  createScatteredSettlements() {
    // Various settlements, castles, and caves to fill empty areas
    const structures = [
      // Houses and villages
      { x: 12, y: 10, w: 3, h: 2, type: 'house' },
      { x: 8, y: 45, w: 2, h: 2, type: 'house' },
      { x: 65, y: 15, w: 3, h: 3, type: 'house' },
      { x: 70, y: 45, w: 2, h: 2, type: 'house' },
      { x: 20, y: 25, w: 2, h: 2, type: 'house' },

      // Castles and keeps matching the map
      { x: 10, y: 20, w: 4, h: 4, type: 'castle' },
      { x: 55, y: 8, w: 5, h: 5, type: 'keep' }, // Main keep structure
      { x: 75, y: 25, w: 3, h: 4, type: 'castle' },
      { x: 15, y: 55, w: 4, h: 3, type: 'castle' },

      // Temples and shrines
      { x: 25, y: 15, w: 3, h: 3, type: 'temple' },
      { x: 68, y: 35, w: 3, h: 3, type: 'temple' },

      // Cave entrances
      { x: 5, y: 15, w: 2, h: 2, type: 'cave' },
      { x: 25, y: 5, w: 2, h: 2, type: 'cave' },
      { x: 50, y: 12, w: 2, h: 2, type: 'cave' },
      { x: 72, y: 35, w: 2, h: 2, type: 'cave' },
      { x: 12, y: 50, w: 2, h: 2, type: 'cave' },

      // Additional structures to fill gaps
      { x: 30, y: 50, w: 3, h: 2, type: 'house' },
      { x: 60, y: 40, w: 2, h: 2, type: 'house' },
      { x: 40, y: 8, w: 3, h: 2, type: 'house' },
      { x: 18, y: 35, w: 2, h: 2, type: 'house' },
      { x: 78, y: 15, w: 2, h: 2, type: 'cave' },
      { x: 5, y: 35, w: 3, h: 2, type: 'castle' },
      { x: 45, y: 55, w: 4, h: 3, type: 'castle' },
      { x: 65, y: 55, w: 2, h: 2, type: 'cave' },
    ];

    structures.forEach(structure => {
      this.createStructure(structure.x, structure.y, structure.w, structure.h, structure.type);
    });
  }

  createStructure(x: number, y: number, width: number, height: number, type: string) {
    for (let bx = x; bx < x + width; bx++) {
      for (let by = y; by < y + height; by++) {
        if (bx >= 0 && bx < this.width && by >= 0 && by < this.height) {
          if (type === 'castle') {
            if (bx === x || bx === x + width - 1 || by === y || by === y + height - 1) {
              this.tiles[by][bx] = TileType.CASTLE_WALL;
            } else {
              this.tiles[by][bx] = TileType.PATH;
            }
          } else if (type === 'cave') {
            this.tiles[by][bx] = TileType.WALL;
          } else if (type === 'temple') {
            this.tiles[by][bx] = TileType.TEMPLE;
          } else if (type === 'keep') {
            this.tiles[by][bx] = TileType.KEEP;
          } else {
            // house
            if (bx === x || bx === x + width - 1 || by === y || by === y + height - 1) {
              this.tiles[by][bx] = TileType.HOUSE_WALL;
            } else {
              this.tiles[by][bx] = TileType.PATH;
            }
          }
        }
      }
    }

    // Add entrances
    if (type === 'house') {
      const doorX = x + Math.floor(width / 2);
      const doorY = y + height - 1;
      if (doorX >= 0 && doorX < this.width && doorY >= 0 && doorY < this.height) {
        this.tiles[doorY][doorX] = TileType.HOUSE_DOOR;
      }
    } else if (type === 'castle') {
      const doorX = x + Math.floor(width / 2);
      const doorY = y + height - 1;
      if (doorX >= 0 && doorX < this.width && doorY >= 0 && doorY < this.height) {
        this.tiles[doorY][doorX] = TileType.CASTLE_DOOR;
      }
    } else if (type === 'cave') {
      // Cave entrance in the center
      const caveX = x + Math.floor(width / 2);
      const caveY = y + Math.floor(height / 2);
      if (caveX >= 0 && caveX < this.width && caveY >= 0 && caveY < this.height) {
        this.tiles[caveY][caveX] = TileType.WALL; // Cave entrance as dark wall
      }
    }
  }

  createRegionPaths() {
    // Connect major regions with paths
    this.createPath(29, 35, 55, 25); // Hearthmere to Rivergate
    this.createPath(25, 35, 15, 50); // Hearthmere to Dustfall
    this.createPath(25, 35, 20, 15); // Hearthmere to Monastery
    this.createPath(45, 14, 50, 20); // Keep to other regions
  }

  createPath(x1: number, y1: number, x2: number, y2: number) {
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    let x = x1,
      y = y1;

    while (x !== x2 || y !== y2) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.tiles[y][x] = TileType.PATH;
      }
      if (x !== x2) x += dx;
      if (y !== y2) y += dy;
    }
  }

  createDungeons() {
    // Add dungeon entrances in each region
    this.tiles[15][20] = TileType.WALL; // Rootway Shrine (Whisperwood)
    this.tiles[30][60] = TileType.WALL; // Old Waterworks (Riverlands)
    this.tiles[50][40] = TileType.WALL; // Mire Grotto (Moonwell Marsh)
    // ... more dungeons
  }

  addRegionalDetails() {
    // Add scattered decorations throughout regions
    for (let i = 0; i < 50; i++) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);

      if (this.tiles[y][x] === TileType.GRASS && Math.random() < 0.3) {
        this.tiles[y][x] = TileType.FLOWER;
      }
    }
  }

  addObstacles() {
    // Scattered rocks
    this.tiles[8][15] = TileType.ROCK;
    this.tiles[12][8] = TileType.ROCK;
    this.tiles[20][12] = TileType.ROCK;
    this.tiles[18][28] = TileType.ROCK;
    this.tiles[6][25] = TileType.ROCK;

    // More trees for atmosphere
    this.tiles[7][20] = TileType.TREE;
    this.tiles[11][26] = TileType.TREE;
    this.tiles[19][8] = TileType.TREE;
    this.tiles[24][15] = TileType.TREE;

    // Additional flowers
    this.tiles[9][16] = TileType.FLOWER;
    this.tiles[14][25] = TileType.FLOWER;
    this.tiles[21][10] = TileType.FLOWER;
  }

  initializeFogOfWar() {
    this.revealed = [];
    for (let y = 0; y < this.height; y++) {
      this.revealed[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.revealed[y][x] = false;
      }
    }
  }

  revealArea(centerX: number, centerY: number) {
    const tileX = Math.floor(centerX / this.tileSize);
    const tileY = Math.floor(centerY / this.tileSize);

    for (let y = tileY - this.visibilityRadius; y <= tileY + this.visibilityRadius; y++) {
      for (let x = tileX - this.visibilityRadius; x <= tileX + this.visibilityRadius; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const distance = Math.sqrt((x - tileX) ** 2 + (y - tileY) ** 2);
          if (distance <= this.visibilityRadius) {
            this.revealed[y][x] = true;
          }
        }
      }
    }
  }

  isTileRevealed(x: number, y: number): boolean {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return false;
    }

    return this.revealed[tileY][tileX];
  }

  getTileAt(x: number, y: number): TileType {
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);

    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return TileType.WALL;
    }

    const currentTiles = this.getCurrentTiles();
    return currentTiles[tileY][tileX];
  }

  isPassable(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    return (
      tile === TileType.GRASS ||
      tile === TileType.PATH ||
      tile === TileType.HOUSE_DOOR ||
      tile === TileType.CASTLE_DOOR ||
      tile === TileType.BRIDGE ||
      tile === TileType.FLOWER
    );
  }

  draw(ctx: CanvasRenderingContext2D, camera: Camera) {
    const startX = Math.floor(camera.position.x / this.tileSize);
    const startY = Math.floor(camera.position.y / this.tileSize);
    const endX = Math.min(startX + Math.ceil(ctx.canvas.width / this.tileSize) + 1, this.width);
    const endY = Math.min(startY + Math.ceil(ctx.canvas.height / this.tileSize) + 1, this.height);

    for (let y = Math.max(0, startY); y < endY; y++) {
      for (let x = Math.max(0, startX); x < endX; x++) {
        const screenX = Math.round(x * this.tileSize - camera.position.x);
        const screenY = Math.round(y * this.tileSize - camera.position.y);

        if (this.revealed[y][x]) {
          const currentTiles = this.getCurrentTiles();
          const tileType = currentTiles[y][x];
          this.drawDetailedTile(ctx, tileType, screenX, screenY);
        } else {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
        }
      }
    }

    // Draw transition effect
    if (this.transitionEffect) {
      this.drawTransitionEffect(ctx);
    }
  }

  drawTransitionEffect(ctx: CanvasRenderingContext2D) {
    const progress = this.transitionTimer / this.transitionDuration;
    const flashIntensity = Math.sin(progress * Math.PI * 4) * 0.3; // Pulsing effect

    // Eclipse transition - darker with blue/purple tint
    if (this.worldState === 'eclipse') {
      ctx.fillStyle = `rgba(30, 20, 60, ${flashIntensity})`;
    } else {
      // Dayrealm transition - brighter with golden tint
      ctx.fillStyle = `rgba(255, 240, 150, ${flashIntensity})`;
    }

    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  drawDetailedTile(ctx: CanvasRenderingContext2D, tileType: TileType, x: number, y: number) {
    const size = this.tileSize;

    switch (tileType) {
      case TileType.GRASS:
        this.drawGrass(ctx, x, y, size);
        break;
      case TileType.WALL:
        this.drawWall(ctx, x, y, size);
        break;
      case TileType.WATER:
        this.drawWater(ctx, x, y, size);
        break;
      case TileType.TREE:
        this.drawTree(ctx, x, y, size);
        break;
      case TileType.ROCK:
        this.drawRock(ctx, x, y, size);
        break;
      case TileType.PATH:
        this.drawPath(ctx, x, y, size);
        break;
      case TileType.HOUSE_WALL:
        this.drawHouseWall(ctx, x, y, size);
        break;
      case TileType.HOUSE_DOOR:
        this.drawHouseDoor(ctx, x, y, size);
        break;
      case TileType.BRIDGE:
        this.drawBridge(ctx, x, y, size);
        break;
      case TileType.FLOWER:
        this.drawFlower(ctx, x, y, size);
        break;
      case TileType.MOUNTAIN:
        this.drawMountain(ctx, x, y, size);
        break;
      case TileType.DEEP_WATER:
        this.drawDeepWater(ctx, x, y, size);
        break;
      case TileType.CASTLE_WALL:
        this.drawCastleWall(ctx, x, y, size);
        break;
      case TileType.CASTLE_DOOR:
        this.drawCastleDoor(ctx, x, y, size);
        break;
      case TileType.TEMPLE:
        this.drawTemple(ctx, x, y, size);
        break;
      case TileType.KEEP:
        this.drawKeep(ctx, x, y, size);
        break;
      case TileType.DESERT:
        this.drawDesert(ctx, x, y, size);
        break;
      case TileType.SNOW:
        this.drawSnow(ctx, x, y, size);
        break;
      case TileType.MARSH:
        this.drawMarsh(ctx, x, y, size);
        break;
      case TileType.HOUSE:
        this.drawHouseWall(ctx, x, y, size); // Reuse house wall for now
        break;
      case TileType.FLOOR:
        this.drawFloor(ctx, x, y, size);
        break;
    }
  }

  drawGrass(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Base grass color
    ctx.fillStyle = '#7CB342';
    ctx.fillRect(x, y, size, size);

    // Grass texture with slightly different greens
    ctx.fillStyle = '#8BC34A';
    for (let i = 0; i < 8; i++) {
      const grassX = x + i * 4 + 2;
      const grassY = y + 4 + (i % 3) * 8;
      ctx.fillRect(grassX, grassY, 2, 6);
    }

    // Lighter grass highlights
    ctx.fillStyle = '#9CCC65';
    for (let i = 0; i < 4; i++) {
      const grassX = x + i * 8 + 4;
      const grassY = y + 2 + (i % 2) * 12;
      ctx.fillRect(grassX, grassY, 1, 4);
    }
  }

  drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Base rock color
    ctx.fillStyle = '#546E7A';
    ctx.fillRect(x, y, size, size);

    // Rock shape (irregular)
    ctx.fillStyle = '#607D8B';
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, size / 3, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rock highlights
    ctx.fillStyle = '#78909C';
    ctx.fillRect(x + 4, y + 4, size / 3, size / 4);

    // Rock shadows
    ctx.fillStyle = '#455A64';
    ctx.fillRect(x + size - 8, y + size - 8, 6, 6);

    // Small rock details
    ctx.fillStyle = '#37474F';
    ctx.fillRect(x + 2, y + size - 4, 3, 2);
    ctx.fillRect(x + size - 5, y + 2, 2, 3);
  }

  drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Grass base
    this.drawGrass(ctx, x, y, size);

    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Flower stem
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(centerX - 1, centerY + 3, 2, 8);

    // Flower petals
    ctx.fillStyle = '#E91E63';
    const petalSize = 4;
    // Top petal
    ctx.fillRect(centerX - petalSize / 2, centerY - petalSize - 2, petalSize, petalSize);
    // Bottom petal
    ctx.fillRect(centerX - petalSize / 2, centerY + 2, petalSize, petalSize);
    // Left petal
    ctx.fillRect(centerX - petalSize - 2, centerY - petalSize / 2, petalSize, petalSize);
    // Right petal
    ctx.fillRect(centerX + 2, centerY - petalSize / 2, petalSize, petalSize);

    // Flower center
    ctx.fillStyle = '#FDD835';
    ctx.fillRect(centerX - 2, centerY - 2, 4, 4);
  }

  drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Grass base
    this.drawGrass(ctx, x, y, size);

    // Tree trunk
    ctx.fillStyle = '#5D4037';
    const trunkWidth = 6;
    const trunkHeight = 12;
    ctx.fillRect(x + size / 2 - trunkWidth / 2, y + size - trunkHeight, trunkWidth, trunkHeight);

    // Tree trunk texture
    ctx.fillStyle = '#4A2C2A';
    ctx.fillRect(x + size / 2 - 1, y + size - trunkHeight, 1, trunkHeight);

    // Tree canopy
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(x + 4, y + 4, size - 8, size - 12);

    // Canopy details
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(x + 6, y + 6, size - 12, size - 16);

    // Leaves highlights
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < 6; i++) {
      const leafX = x + 6 + (i % 3) * 6;
      const leafY = y + 6 + Math.floor(i / 3) * 4;
      ctx.fillRect(leafX, leafY, 3, 3);
    }
  }

  drawWater(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Base water color
    ctx.fillStyle = '#1976D2';
    ctx.fillRect(x, y, size, size);

    // Water waves
    ctx.fillStyle = '#2196F3';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + i * 8, y + 4 + (i % 2) * 8, 6, 2);
    }

    // Water highlights
    ctx.fillStyle = '#42A5F5';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 2 + i * 10, y + 2 + i * 6, 4, 1);
    }
  }

  drawDeepWater(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Base deep water color
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(x, y, size, size);

    // Darker center
    ctx.fillStyle = '#01579B';
    ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

    // Deep water waves
    ctx.fillStyle = '#1565C0';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 2 + i * 9, y + 6 + i * 4, 5, 2);
    }
  }

  drawPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Base path color
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(x, y, size, size);

    // Path texture
    ctx.fillStyle = '#BCAAA4';
    for (let i = 0; i < 12; i++) {
      const stoneX = x + (i % 4) * 8 + 2;
      const stoneY = y + Math.floor(i / 4) * 8 + 2;
      ctx.fillRect(stoneX, stoneY, 4, 4);
    }

    // Path wear marks
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(x + size / 2 - 2, y + 4, 4, size - 8);
  }

  drawHouseWall(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // High-fidelity house wall based on map details

    // Base stone wall
    ctx.fillStyle = '#8D7053';
    ctx.fillRect(x, y, size, size);

    // Stone texture with irregular blocks
    ctx.fillStyle = '#7A5F42';
    const stonePattern = [
      [2, 2, 6, 4],
      [10, 2, 4, 4], // Top row stones
      [1, 7, 7, 4],
      [9, 7, 6, 4], // Middle row stones
      [3, 12, 5, 3],
      [10, 12, 4, 3], // Bottom row stones
    ];

    stonePattern.forEach(([sx, sy, sw, sh]) => {
      if (sx + sw <= size && sy + sh <= size) {
        ctx.fillRect(x + sx, y + sy, sw, sh);
      }
    });

    // Stone highlights for depth
    ctx.fillStyle = '#A08866';
    stonePattern.forEach(([sx, sy, sw, sh]) => {
      if (sx + sw <= size && sy + sh <= size) {
        ctx.fillRect(x + sx, y + sy, 1, sh); // Left highlight
        ctx.fillRect(x + sx, y + sy, sw, 1); // Top highlight
      }
    });

    // Mortar lines between stones
    ctx.fillStyle = '#5D4A37';
    ctx.fillRect(x, y + 6, size, 1);
    ctx.fillRect(x, y + 11, size, 1);
    ctx.fillRect(x + 8, y + 2, 1, 4);
    ctx.fillRect(x + 8, y + 7, 1, 4);
  }

  drawHouseDoor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // High-fidelity house door with detailed wooden texture

    // Stone door frame
    ctx.fillStyle = '#8D7053';
    ctx.fillRect(x, y, size, size);

    // Arched doorway frame
    ctx.fillStyle = '#7A5F42';
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);

    // Wooden door
    ctx.fillStyle = '#6D4C41';
    ctx.fillRect(x + 3, y + 3, size - 6, size - 6);

    // Wood grain texture
    ctx.fillStyle = '#5D4037';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 4 + i * 3, y + 4, 1, size - 8);
    }

    // Door panels with raised edges
    ctx.fillStyle = '#4A2C2A';
    const panelInset = 5;
    const panelHeight = (size - 12) / 2;

    // Upper panel
    ctx.fillRect(x + panelInset, y + panelInset, size - panelInset * 2, panelHeight - 1);
    // Lower panel
    ctx.fillRect(
      x + panelInset,
      y + panelInset + panelHeight + 1,
      size - panelInset * 2,
      panelHeight - 1,
    );

    // Panel highlights
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x + panelInset, y + panelInset, size - panelInset * 2, 1); // Top edge
    ctx.fillRect(x + panelInset, y + panelInset, 1, panelHeight - 1); // Left edge
    ctx.fillRect(x + panelInset, y + panelInset + panelHeight + 1, size - panelInset * 2, 1);
    ctx.fillRect(x + panelInset, y + panelInset + panelHeight + 1, 1, panelHeight - 1);

    // Iron door handle and hinges
    ctx.fillStyle = '#424242';
    ctx.fillRect(x + size - 7, y + size / 2 - 1, 3, 2); // Handle
    ctx.fillRect(x + 2, y + 5, 2, 2); // Top hinge
    ctx.fillRect(x + 2, y + size - 7, 2, 2); // Bottom hinge

    // Handle highlight
    ctx.fillStyle = '#616161';
    ctx.fillRect(x + size - 7, y + size / 2 - 1, 1, 1);
  }

  drawBridge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Water underneath
    this.drawWater(ctx, x, y, size);

    // Bridge planks
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x, y + 8, size, 16);

    // Plank details
    ctx.fillStyle = '#6D4C41';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + i * 8, y + 8, 7, 16);
    }

    // Bridge supports
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(x, y + 6, size, 2);
    ctx.fillRect(x, y + 24, size, 2);
  }

  drawMountain(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Base mountain color
    ctx.fillStyle = '#424242';
    ctx.fillRect(x, y, size, size);

    // Mountain texture
    ctx.fillStyle = '#616161';
    for (let i = 0; i < 8; i++) {
      const rockX = x + (i % 4) * 8;
      const rockY = y + Math.floor(i / 4) * 16 + 4;
      ctx.fillRect(rockX, rockY, 6, 8);
    }

    // Mountain highlights
    ctx.fillStyle = '#757575';
    ctx.fillRect(x + 2, y + 2, size - 4, 4);

    // Mountain shadows
    ctx.fillStyle = '#212121';
    ctx.fillRect(x + size - 6, y + size - 6, 6, 6);
  }

  drawWall(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Similar to house wall but more weathered
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x, y, size, size);

    // Stone blocks
    ctx.fillStyle = '#6D4C41';
    for (let i = 0; i < 6; i++) {
      const blockX = x + (i % 3) * 10 + 1;
      const blockY = y + Math.floor(i / 3) * 16 + 1;
      ctx.fillRect(blockX, blockY, 9, 14);
    }

    // Weathering
    ctx.fillStyle = '#5D4037';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + i * 8 + 2, y + i * 6 + 4, 2, 3);
    }
  }

  drawCastleWall(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // High-fidelity castle wall matching the map's grey structures

    // Base grey stone
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(x, y, size, size);

    // Large stone blocks
    ctx.fillStyle = '#757575';
    const castleBlocks = [
      [1, 1, 7, 5],
      [9, 1, 6, 5], // Top row
      [0, 7, 8, 4],
      [9, 7, 6, 4], // Middle row
      [2, 12, 6, 3],
      [9, 12, 6, 3], // Bottom row
    ];

    castleBlocks.forEach(([bx, by, bw, bh]) => {
      if (bx + bw <= size && by + bh <= size) {
        ctx.fillRect(x + bx, y + by, bw, bh);
      }
    });

    // Stone highlights for 3D effect
    ctx.fillStyle = '#BDBDBD';
    castleBlocks.forEach(([bx, by, bw, bh]) => {
      if (bx + bw <= size && by + bh <= size) {
        ctx.fillRect(x + bx, y + by, 1, bh); // Left highlight
        ctx.fillRect(x + bx, y + by, bw, 1); // Top highlight
      }
    });

    // Deep mortar lines
    ctx.fillStyle = '#424242';
    ctx.fillRect(x, y + 6, size, 1);
    ctx.fillRect(x, y + 11, size, 1);
    ctx.fillRect(x + 8, y, 1, size);

    // Battlements detail
    if (Math.random() < 0.3) {
      // Some walls have crenellations
      ctx.fillStyle = '#757575';
      ctx.fillRect(x + 2, y, 3, 3);
      ctx.fillRect(x + 8, y, 3, 3);
      ctx.fillRect(x + 14, y, 2, 3);
    }
  }

  drawCastleDoor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // High-fidelity castle entrance with portcullis

    // Stone archway
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(x, y, size, size);

    // Arch opening
    ctx.fillStyle = '#424242';
    ctx.fillRect(x + 2, y + 4, size - 4, size - 4);

    // Arch stones
    ctx.fillStyle = '#757575';
    ctx.fillRect(x + 1, y + 3, size - 2, 2); // Arch lintel
    ctx.fillRect(x + 3, y + 1, size - 6, 2); // Upper arch

    // Portcullis bars
    ctx.fillStyle = '#424242';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 4 + i * 3, y + 5, 1, size - 6);
    }

    // Horizontal portcullis bars
    for (let i = 0; i < 2; i++) {
      ctx.fillRect(x + 3, y + 7 + i * 4, size - 6, 1);
    }

    // Iron reinforcement
    ctx.fillStyle = '#212121';
    ctx.fillRect(x + 1, y + size - 3, size - 2, 2); // Bottom bar
    ctx.fillRect(x + 1, y + 4, size - 2, 1); // Top bar

    // Castle door handles/rings
    ctx.fillStyle = '#B8860B'; // Dark gold
    ctx.fillRect(x + 2, y + size / 2, 2, 2);
    ctx.fillRect(x + size - 4, y + size / 2, 2, 2);
  }

  drawTemple(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // High-fidelity temple structure like the ones in the map

    // Base temple stone (lighter than castle)
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(x, y, size, size);

    // Temple columns/pillars
    ctx.fillStyle = '#BCAAA4';
    ctx.fillRect(x + 2, y + 2, 3, size - 4); // Left pillar
    ctx.fillRect(x + size - 5, y + 2, 3, size - 4); // Right pillar

    // Column capitals
    ctx.fillStyle = '#A1887F';
    ctx.fillRect(x + 1, y + 2, 5, 2); // Left capital
    ctx.fillRect(x + size - 6, y + 2, 5, 2); // Right capital

    // Temple entrance recess
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x + 6, y + 4, size - 12, size - 6);

    // Sacred symbols/decorations
    ctx.fillStyle = '#6D4C41';
    const symbolSize = 2;
    ctx.fillRect(x + size / 2 - 1, y + 6, symbolSize, symbolSize); // Top symbol
    ctx.fillRect(x + size / 2 - 1, y + size / 2, symbolSize, symbolSize); // Center symbol
    ctx.fillRect(x + size / 2 - 1, y + size - 6, symbolSize, symbolSize); // Bottom symbol

    // Temple steps
    ctx.fillStyle = '#BCAAA4';
    ctx.fillRect(x, y + size - 2, size, 2); // Bottom step
    ctx.fillRect(x + 1, y + size - 3, size - 2, 1); // Middle step

    // Ornate details
    ctx.fillStyle = '#795548';
    ctx.fillRect(x + 3, y + 1, size - 6, 1); // Top border
    ctx.fillRect(x + 1, y + 1, 1, size - 2); // Left border
    ctx.fillRect(x + size - 2, y + 1, 1, size - 2); // Right border
  }

  drawKeep(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Central keep/tower structure

    // Tower base
    ctx.fillStyle = '#757575';
    ctx.fillRect(x, y, size, size);

    // Tower levels
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 8); // Main tower

    // Tower top/roof
    ctx.fillStyle = '#5D4037'; // Dark brown roof
    const roofStart = y + 4;
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + 2 + i, roofStart - i, size - 4 - i * 2, 1);
    }

    // Tower windows
    ctx.fillStyle = '#424242';
    ctx.fillRect(x + size / 2 - 1, y + 6, 2, 3); // Upper window
    ctx.fillRect(x + size / 2 - 1, y + 10, 2, 3); // Lower window

    // Window highlights (glass reflection)
    ctx.fillStyle = '#E3F2FD';
    ctx.fillRect(x + size / 2 - 1, y + 6, 1, 1);
    ctx.fillRect(x + size / 2 - 1, y + 10, 1, 1);

    // Tower entrance
    ctx.fillStyle = '#424242';
    ctx.fillRect(x + size / 2 - 2, y + size - 5, 4, 5);

    // Entrance arch
    ctx.fillStyle = '#9E9E9E';
    ctx.fillRect(x + size / 2 - 2, y + size - 5, 4, 1);

    // Banner pole
    ctx.fillStyle = '#8D6E63';
    ctx.fillRect(x + size - 3, y + 2, 1, 6);

    // Banner
    ctx.fillStyle = '#C62828'; // Red banner
    ctx.fillRect(x + size - 6, y + 3, 3, 4);
  }

  drawDesert(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Eclipse desert - darker, more mysterious
    const baseColor = this.worldState === 'eclipse' ? '#8B7355' : '#F4A460';
    const textureColor = this.worldState === 'eclipse' ? '#A0522D' : '#DEB887';
    const duneColor = this.worldState === 'eclipse' ? '#696969' : '#DAA520';

    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, size, size);

    // Sand texture
    ctx.fillStyle = textureColor;
    for (let i = 0; i < 6; i++) {
      const sandX = x + i * 5 + 2;
      const sandY = y + 4 + (i % 3) * 8;
      ctx.fillRect(sandX, sandY, 3, 2);
    }

    // Sand dunes
    ctx.fillStyle = duneColor;
    ctx.fillRect(x + 2, y + size - 4, size - 4, 3);

    // Eclipse effect - add mysterious shadows
    if (this.worldState === 'eclipse') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(x, y, size / 2, size);
    }
  }

  drawSnow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Eclipse snow - darker, more frozen
    const baseColor = this.worldState === 'eclipse' ? '#E6E6FA' : '#FFFAFA';
    const textureColor = this.worldState === 'eclipse' ? '#D8BFD8' : '#F0F8FF';
    const iceColor = this.worldState === 'eclipse' ? '#B0C4DE' : '#E0FFFF';

    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, size, size);

    // Snow texture
    ctx.fillStyle = textureColor;
    for (let i = 0; i < 8; i++) {
      const snowX = x + i * 4 + 1;
      const snowY = y + 2 + (i % 4) * 6;
      ctx.fillRect(snowX, snowY, 2, 2);
    }

    // Ice patches
    ctx.fillStyle = iceColor;
    ctx.fillRect(x + 1, y + 1, 4, 4);
    ctx.fillRect(x + size - 5, y + size - 5, 4, 4);

    // Eclipse effect - add frost patterns
    if (this.worldState === 'eclipse') {
      ctx.fillStyle = 'rgba(70, 130, 180, 0.3)';
      ctx.fillRect(x + 4, y, 2, size);
      ctx.fillRect(x, y + 4, size, 2);
    }
  }

  drawMarsh(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Eclipse marsh - darker, more ominous
    const baseColor = this.worldState === 'eclipse' ? '#2F2F2F' : '#556B2F';
    const waterColor = this.worldState === 'eclipse' ? '#3C3C3C' : '#6B8E23';
    const grassColor = this.worldState === 'eclipse' ? '#4B5320' : '#9ACD32';
    const bubbleColor = this.worldState === 'eclipse' ? '#696969' : '#8FBC8F';

    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, size, size);

    // Marsh water
    ctx.fillStyle = waterColor;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    // Marsh grass patches
    ctx.fillStyle = grassColor;
    for (let i = 0; i < 4; i++) {
      const grassX = x + (i % 2) * 12 + 4;
      const grassY = y + Math.floor(i / 2) * 12 + 4;
      ctx.fillRect(grassX, grassY, 6, 8);
    }

    // Bubbles/swamp gas
    ctx.fillStyle = bubbleColor;
    ctx.fillRect(x + 6, y + 6, 2, 2);
    ctx.fillRect(x + size - 8, y + size - 8, 2, 2);

    // Eclipse effect - add eerie mist
    if (this.worldState === 'eclipse') {
      ctx.fillStyle = 'rgba(75, 0, 130, 0.2)';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + i * 8, y + i * 4, 6, 4);
      }
    }
  }

  drawFloor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Stone floor for dungeons
    const baseColor = '#8E8E93'; // Light gray stone
    const groutColor = '#5D5D5D'; // Darker grout lines
    const shadowColor = '#6B6B6B'; // Subtle shadows
    
    // Base floor
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, size, size);
    
    // Stone tile grid pattern
    ctx.fillStyle = groutColor;
    ctx.fillRect(x + size/2, y, 1, size); // Vertical grout line
    ctx.fillRect(x, y + size/2, size, 1); // Horizontal grout line
    
    // Add some texture to make it look more stone-like
    ctx.fillStyle = shadowColor;
    for (let i = 0; i < 4; i++) {
      const stoneX = x + (i % 2) * (size/2) + 2;
      const stoneY = y + Math.floor(i / 2) * (size/2) + 2;
      ctx.fillRect(stoneX, stoneY, 4, 2);
      ctx.fillRect(stoneX + 6, stoneY + 4, 3, 2);
    }
    
    // Highlight edges for depth
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(x, y, size, 1); // Top highlight
    ctx.fillRect(x, y, 1, size); // Left highlight
  }

  generateEclipseWorld() {
    // Generate Eclipse version of the world
    this.eclipseTiles = [];

    // Start with a copy of the Dayrealm
    for (let y = 0; y < this.height; y++) {
      this.eclipseTiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.eclipseTiles[y][x] = this.tiles[y][x];
      }
    }

    // Apply Eclipse transformations
    this.applyEclipseTransformations();
  }

  applyEclipseTransformations() {
    // Eclipse world changes - darker, more mysterious version with strategic gameplay elements

    // 1. Transform some grass areas to marsh (creates new traversal challenges)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.eclipseTiles[y][x] === TileType.GRASS && Math.random() < 0.12) {
          this.eclipseTiles[y][x] = TileType.MARSH;
        }
      }
    }

    // 2. Add mystical bridges where there was water (opens new paths)
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.eclipseTiles[y][x] === TileType.WATER && Math.random() < 0.25) {
          // Check if this creates a useful bridge connection
          const hasLandNearby =
            this.eclipseTiles[y - 1][x] === TileType.GRASS ||
            this.eclipseTiles[y + 1][x] === TileType.GRASS ||
            this.eclipseTiles[y][x - 1] === TileType.GRASS ||
            this.eclipseTiles[y][x + 1] === TileType.GRASS ||
            this.eclipseTiles[y - 1][x] === TileType.PATH ||
            this.eclipseTiles[y + 1][x] === TileType.PATH ||
            this.eclipseTiles[y][x - 1] === TileType.PATH ||
            this.eclipseTiles[y][x + 1] === TileType.PATH;
          if (hasLandNearby) {
            this.eclipseTiles[y][x] = TileType.BRIDGE;
          }
        }
      }
    }

    // 3. Transform some mountains to ancient walls (reveals hidden structures)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.eclipseTiles[y][x] === TileType.MOUNTAIN && Math.random() < 0.35) {
          this.eclipseTiles[y][x] = TileType.CASTLE_WALL;
        }
      }
    }

    // 4. Create mysterious pathways through dense forests
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.eclipseTiles[y][x] === TileType.TREE && Math.random() < 0.08) {
          // Create clearings and hidden paths
          this.eclipseTiles[y][x] = TileType.PATH;
          // Extend the path in a random direction
          const directions = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ];
          const dir = directions[Math.floor(Math.random() * directions.length)];
          const nextX = x + dir[0];
          const nextY = y + dir[1];
          if (
            nextX >= 0 &&
            nextX < this.width &&
            nextY >= 0 &&
            nextY < this.height &&
            this.eclipseTiles[nextY][nextX] === TileType.TREE
          ) {
            this.eclipseTiles[nextY][nextX] = TileType.PATH;
          }
        }
      }
    }

    // 5. Transform buildings into ancient ruins and mystical structures
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.eclipseTiles[y][x] === TileType.HOUSE_WALL && Math.random() < 0.4) {
          this.eclipseTiles[y][x] = TileType.CASTLE_WALL;
        } else if (this.eclipseTiles[y][x] === TileType.HOUSE && Math.random() < 0.2) {
          this.eclipseTiles[y][x] = TileType.TEMPLE;
        }
      }
    }

    // 6. Add snow patches in northern regions (Eclipse brings winter elements)
    for (let y = 0; y < this.height / 3; y++) {
      for (let x = 0; x < this.width; x++) {
        if (
          (this.eclipseTiles[y][x] === TileType.GRASS ||
            this.eclipseTiles[y][x] === TileType.PATH) &&
          Math.random() < 0.1
        ) {
          this.eclipseTiles[y][x] = TileType.SNOW;
        }
      }
    }

    // 7. Transform some water to desert (ancient lakes dried up in Eclipse)
    for (let y = (this.height * 2) / 3; y < this.height; y++) {
      for (let x = 0; x < this.width / 2; x++) {
        if (this.eclipseTiles[y][x] === TileType.WATER && Math.random() < 0.15) {
          this.eclipseTiles[y][x] = TileType.DESERT;
        }
      }
    }
  }

  toggleWorldState() {
    // Toggle between Dayrealm and Eclipse with transition effect
    this.transitionEffect = true;
    this.transitionTimer = 0;
    this.worldState = this.worldState === 'dayrealm' ? 'eclipse' : 'dayrealm';
    console.log(`World flipped to: ${this.worldState}`);
  }

  updateTransition(deltaTime: number) {
    if (this.transitionEffect) {
      this.transitionTimer += deltaTime;
      if (this.transitionTimer >= this.transitionDuration) {
        this.transitionEffect = false;
        this.transitionTimer = 0;
      }
    }
  }

  getCurrentTiles(): TileType[][] {
    return this.worldState === 'eclipse' ? this.eclipseTiles : this.tiles;
  }
}

class ZeldaGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private keys: { [key: string]: boolean } = {};
  private gameState: GameState = GameState.TITLE;
  private camera: Camera;
  private world: World;
  private player!: Player;
  private enemies: Enemy[] = [];
  private items: Item[] = [];
  private lastTime: number = 0;
  private audioManager: AudioManager;

  // Dungeon system
  private dungeonEntrances: DungeonEntrance[] = [];
  private currentDungeon: DungeonData | null = null;
  private dungeonWorld: World | null = null;
  private playerInventory: Set<string> = new Set();
  private collectedShards: Set<string> = new Set();

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.audioManager = new AudioManager();
    this.camera = new Camera();
    this.world = new World();
    this.initDungeonSystem();
    this.initPlayer();
    this.spawnEnemies();
    this.spawnItems();
    this.setupEventListeners();
    this.setupResizeHandler();
    this.resizeCanvas(); // Set initial size
    this.startGame();
  }

  private startGame() {
    this.audioManager.startBackgroundMusic();
    this.gameLoop(0);
  }

  initPlayer() {
    this.player = {
      position: { x: 45 * this.world.tileSize, y: 35 * this.world.tileSize }, // Start in safe grassland east of central town
      size: { x: 24, y: 24 },
      health: 6,
      maxHealth: 6,
      direction: Direction.DOWN,
      speed: 120,
      sprite: { x: 0, y: 0, width: 24, height: 24, color: '#00FF00' },
      attacking: false,
      attackTimer: 0,
      attackCooldown: 0.5, // 0.5 second cooldown between attacks
      lastAttackTime: 0,
      hearts: 3,
      rupees: 0,
      keys: 0,
      heartContainers: 3, // Total heart containers collected
      hasSword: true,
      hasAetherMirror: true, // Player starts with Aether Mirror for testing
      inventory: ['sword', 'aether_mirror'],
      animationFrame: 0,
      animationTimer: 0,
      hitEnemies: new Set(),
      isFlashing: false,
      flashTimer: 0,
    };

    this.world.revealArea(
      this.player.position.x + this.player.size.x / 2,
      this.player.position.y + this.player.size.y / 2,
    );
  }

  spawnEnemies() {
    // Balanced enemy positions - safe starting area but good density elsewhere
    const enemyPositions = [
      // Desert areas (higher enemy density in harsh terrain)
      { x: 8, y: 8 },
      { x: 12, y: 10 },
      { x: 15, y: 12 },
      { x: 18, y: 8 },
      { x: 22, y: 15 },
      { x: 10, y: 18 },
      { x: 16, y: 22 },
      { x: 8, y: 25 },
      { x: 20, y: 20 },
      { x: 35, y: 8 },
      { x: 38, y: 12 },
      { x: 42, y: 10 },
      { x: 40, y: 6 },
      { x: 32, y: 14 },

      // Snow region (ice creatures)
      { x: 62, y: 8 },
      { x: 68, y: 10 },
      { x: 72, y: 12 },
      { x: 65, y: 15 },
      { x: 70, y: 18 },
      { x: 74, y: 8 },
      { x: 60, y: 12 },
      { x: 66, y: 20 },
      { x: 73, y: 15 },

      // Forest patches (woodland creatures)
      { x: 12, y: 18 },
      { x: 16, y: 16 },
      { x: 14, y: 20 },
      { x: 10, y: 15 },
      { x: 26, y: 47 },
      { x: 28, y: 45 },
      { x: 24, y: 48 },
      { x: 67, y: 38 },
      { x: 70, y: 40 },
      { x: 65, y: 42 },
      { x: 68, y: 35 },
      { x: 17, y: 37 },
      { x: 15, y: 39 },

      // Eastern grasslands (more scattered threats)
      { x: 58, y: 28 },
      { x: 62, y: 32 },
      { x: 68, y: 30 },
      { x: 72, y: 35 },
      { x: 65, y: 25 },
      { x: 60, y: 38 },
      { x: 70, y: 42 },
      { x: 74, y: 28 },
      { x: 55, y: 35 },

      // Southern marsh (swamp monsters)
      { x: 22, y: 52 },
      { x: 28, y: 54 },
      { x: 35, y: 53 },
      { x: 42, y: 55 },
      { x: 48, y: 52 },
      { x: 55, y: 54 },
      { x: 32, y: 51 },
      { x: 38, y: 56 },
      { x: 45, y: 50 },

      // Western areas (bandits, but keeping safe zone)
      { x: 15, y: 25 },
      { x: 12, y: 28 },
      { x: 18, y: 22 },
      { x: 20, y: 26 },
      { x: 14, y: 42 },
      { x: 18, y: 45 },
      { x: 22, y: 43 },
      { x: 16, y: 48 },

      // Northern areas (various threats)
      { x: 48, y: 15 },
      { x: 52, y: 18 },
      { x: 45, y: 12 },
      { x: 50, y: 8 },
      { x: 25, y: 18 },
      { x: 28, y: 15 },
      { x: 22, y: 12 },

      // Border patrols (map edge guards)
      { x: 6, y: 6 },
      { x: 74, y: 6 },
      { x: 6, y: 54 },
      { x: 74, y: 54 },
      { x: 6, y: 30 },
      { x: 74, y: 30 },
      { x: 40, y: 6 },
      { x: 40, y: 54 },

      // River/water area guardians
      { x: 25, y: 31 },
      { x: 55, y: 31 },
      { x: 30, y: 31 },
      { x: 50, y: 31 },
      { x: 42, y: 20 },
      { x: 42, y: 45 },
      { x: 42, y: 15 },
      { x: 42, y: 48 },

      // Scattered roaming enemies (medium distance from start)
      { x: 25, y: 20 },
      { x: 55, y: 20 },
      { x: 25, y: 45 },
      { x: 55, y: 45 },
      { x: 30, y: 25 },
      { x: 50, y: 25 },
      { x: 30, y: 40 },
      { x: 50, y: 40 },
    ];

    enemyPositions.forEach(pos => {
      const x = pos.x * this.world.tileSize;
      const y = pos.y * this.world.tileSize;

      if (this.world.isPassable(x, y)) {
        const enemy: Enemy = {
          position: { x, y },
          size: { x: 20, y: 20 },
          health: 2, // Exactly 2 health so 1 damage per hit = 2 hits to die
          maxHealth: 2,
          direction: Direction.DOWN,
          speed: 60,
          sprite: { x: 0, y: 0, width: 20, height: 20, color: '#FF4444' },
          attackDamage: 1,
          moveTimer: 0,
          target: null,
          animationFrame: 0,
          animationTimer: 0,
          attackCooldown: 1.0, // 1 second cooldown between attacks
          lastAttackTime: 0,
          attacking: false,
          attackTimer: 0,
          hasHitPlayer: false,
          isFlashing: false,
          flashTimer: 0,
        };
        this.enemies.push(enemy);
      }
    });
  }

  spawnItems() {
    // Fixed item positions with specific types
    const fixedItems = [
      // Village area
      { x: 13, y: 27, type: 'heart' },
      { x: 26, y: 26, type: 'rupee' },

      // Forest area treasures
      { x: 34, y: 16, type: 'key' },
      { x: 32, y: 11, type: 'rupee' },
      { x: 36, y: 19, type: 'heart' },

      // Lake area
      { x: 5, y: 11, type: 'rupee' },
      { x: 11, y: 7, type: 'key' },

      // Temple area
      { x: 21, y: 14, type: 'key' },
      { x: 19, y: 16, type: 'heart' },

      // Mountain pass
      { x: 19, y: 3, type: 'rupee' },
      { x: 20, y: 2, type: 'rupee' },

      // Scattered around paths
      { x: 15, y: 11, type: 'rupee' },
      { x: 27, y: 15, type: 'rupee' },
      { x: 9, y: 19, type: 'heart' },
      { x: 25, y: 8, type: 'key' },

      // Special valuable items
      { x: 12, y: 15, type: 'gem' },
      { x: 35, y: 25, type: 'coin' },
      { x: 8, y: 25, type: 'gem' },
      { x: 30, y: 12, type: 'coin' },
    ];

    fixedItems.forEach(itemData => {
      const x = itemData.x * this.world.tileSize;
      const y = itemData.y * this.world.tileSize;

      if (this.world.isPassable(x, y)) {
        let color = '#FFD700';
        let value = 1;

        if (itemData.type === 'heart') {
          color = '#FF69B4';
          value = 2;
        } else if (itemData.type === 'key') {
          color = '#C0C0C0';
          value = 1;
        } else if (itemData.type === 'gem') {
          color = '#00FFFF'; // Cyan gem
          value = 2; // Base value, multiplied by 5 in collection
        } else if (itemData.type === 'coin') {
          color = '#FFA500'; // Orange coin
          value = 3; // Base value, multiplied by 2 in collection
        }

        const item: Item = {
          position: { x, y },
          size: { x: 16, y: 16 },
          type: itemData.type,
          value,
          sprite: { x: 0, y: 0, width: 16, height: 16, color },
          collected: false,
        };
        this.items.push(item);
      }
    });
  }

  setupEventListeners() {
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;

      // Title screen - any key starts the game
      if (this.gameState === GameState.TITLE) {
        this.gameState = GameState.PLAYING;
        this.audioManager.startBackgroundMusic();
        return;
      }

      // Game over screen - any key restarts the game
      if (this.gameState === GameState.GAMEOVER) {
        this.restartGame();
        return;
      }

      if (e.key === 'Escape') {
        if (this.gameState === GameState.DUNGEON) {
          // Exit dungeon
          this.exitDungeon();
        } else {
          const newState =
            this.gameState === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING;
          this.gameState = newState;
          if (newState === GameState.PAUSED) {
            this.audioManager.stopBackgroundMusic();
          } else {
            this.audioManager.startBackgroundMusic();
          }
        }
      }
      if (e.key === 'i' || e.key === 'I') {
        this.gameState =
          this.gameState === GameState.INVENTORY ? GameState.PLAYING : GameState.INVENTORY;
      }
      if (e.key === 'm' || e.key === 'M') {
        if (this.audioManager) {
          this.audioManager.stopBackgroundMusic();
          setTimeout(() => this.audioManager.startBackgroundMusic(), 100);
        }
      }
      if ((e.key === 'e' || e.key === 'E') && this.player.hasAetherMirror) {
        // Toggle Eclipse/Dayrealm with Aether Mirror
        this.world.toggleWorldState();
        this.audioManager.playSound('collect'); // Play mirror sound effect
        console.log(`World state changed to: ${this.world.worldState}`);
      }
    });

    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });
  }

  resizeCanvas() {
    // Get the window dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Fixed game resolution - this never changes (prevents positioning issues)
    const gameWidth = 1024;
    const gameHeight = 768;
    const gameAspectRatio = gameWidth / gameHeight; // 4:3 ratio

    // Calculate the display size that fits in the window while maintaining aspect ratio
    let displayWidth, displayHeight;

    if (windowWidth / windowHeight > gameAspectRatio) {
      // Window is wider than game aspect ratio, fit to height
      displayHeight = windowHeight;
      displayWidth = displayHeight * gameAspectRatio;
    } else {
      // Window is taller than game aspect ratio, fit to width  
      displayWidth = windowWidth;
      displayHeight = displayWidth / gameAspectRatio;
    }

    // Try to use integer scaling factors when possible for crisp pixels
    const scaleX = displayWidth / gameWidth;
    const scaleY = displayHeight / gameHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Use integer scaling if we're close to a whole number
    const integerScale = Math.floor(scale);
    if (integerScale >= 1 && (scale - integerScale) < 0.1) {
      displayWidth = gameWidth * integerScale;
      displayHeight = gameHeight * integerScale;
    }

    // Set canvas internal resolution (always fixed)
    this.canvas.width = gameWidth;
    this.canvas.height = gameHeight;

    // Set CSS display size (scales to fit screen)
    this.canvas.style.width = Math.floor(displayWidth) + 'px';
    this.canvas.style.height = Math.floor(displayHeight) + 'px';

    // Center the canvas
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.transform = 'translate(-50%, -50%)';

    // Disable image smoothing for pixel-perfect scaling
    this.ctx.imageSmoothingEnabled = false;
  }

  updatePlayer(deltaTime: number) {
    if (this.gameState !== GameState.PLAYING && this.gameState !== GameState.DUNGEON) return;

    // Handle flashing timer
    if (this.player.isFlashing) {
      this.player.flashTimer -= deltaTime;
      if (this.player.flashTimer <= 0) {
        this.player.isFlashing = false;
      }
    }

    // Handle animation timers
    this.player.animationTimer += deltaTime;
    if (this.player.animationTimer >= 0.2) {
      // Change frame every 0.2 seconds
      this.player.animationFrame = (this.player.animationFrame + 1) % 4;
      this.player.animationTimer = 0;
    }

    const speed = this.player.speed * deltaTime;
    let newX = this.player.position.x;
    let newY = this.player.position.y;

    const upPressed = this.keys['arrowup'] || this.keys['w'];
    const downPressed = this.keys['arrowdown'] || this.keys['s'];
    const leftPressed = this.keys['arrowleft'] || this.keys['a'];
    const rightPressed = this.keys['arrowright'] || this.keys['d'];

    // Handle diagonal movement when two keys are pressed
    if (upPressed && leftPressed) {
      newY -= speed * 0.707; // Normalize diagonal movement
      newX -= speed * 0.707;
      this.player.direction = Direction.UP_LEFT;
    } else if (upPressed && rightPressed) {
      newY -= speed * 0.707;
      newX += speed * 0.707;
      this.player.direction = Direction.UP_RIGHT;
    } else if (downPressed && leftPressed) {
      newY += speed * 0.707;
      newX -= speed * 0.707;
      this.player.direction = Direction.DOWN_LEFT;
    } else if (downPressed && rightPressed) {
      newY += speed * 0.707;
      newX += speed * 0.707;
      this.player.direction = Direction.DOWN_RIGHT;
    } else {
      // Handle single direction movement
      if (upPressed) {
        newY -= speed;
        this.player.direction = Direction.UP;
      }
      if (downPressed) {
        newY += speed;
        this.player.direction = Direction.DOWN;
      }
      if (leftPressed) {
        newX -= speed;
        this.player.direction = Direction.LEFT;
      }
      if (rightPressed) {
        newX += speed;
        this.player.direction = Direction.RIGHT;
      }
    }

    const currentTime = performance.now() / 1000;
    if (
      this.keys[' '] &&
      this.player.hasSword &&
      !this.player.attacking &&
      currentTime - this.player.lastAttackTime >= this.player.attackCooldown
    ) {
      this.player.attacking = true;
      this.player.attackTimer = 0.3;
      this.player.lastAttackTime = currentTime;
      this.player.hitEnemies.clear(); // Reset hit enemies for new attack
      this.audioManager.playSound('player_attack'); // New heroic attack sound
    }

    if (this.player.attacking) {
      this.player.attackTimer -= deltaTime;
      if (this.player.attackTimer <= 0) {
        this.player.attacking = false;
        this.player.hitEnemies.clear(); // Clear when attack ends
      }
    }

    // Check movement collision 
    if (this.gameState === GameState.DUNGEON && this.currentDungeon) {
      // Dungeon collision detection
      if (this.isDungeonPassable(newX, this.player.position.y)) {
        this.player.position.x = newX;
      }
      if (this.isDungeonPassable(this.player.position.x, newY)) {
        this.player.position.y = newY;
      }
    } else {
      // World collision detection
      if (
        this.world.isPassable(newX, this.player.position.y) &&
        this.world.isPassable(newX + this.player.size.x, this.player.position.y) &&
        this.world.isPassable(newX, this.player.position.y + this.player.size.y) &&
        this.world.isPassable(newX + this.player.size.x, this.player.position.y + this.player.size.y)
      ) {
        this.player.position.x = newX;
      }

      if (
        this.world.isPassable(this.player.position.x, newY) &&
        this.world.isPassable(this.player.position.x + this.player.size.x, newY) &&
        this.world.isPassable(this.player.position.x, newY + this.player.size.y) &&
        this.world.isPassable(this.player.position.x + this.player.size.x, newY + this.player.size.y)
      ) {
        this.player.position.y = newY;
      }
    }

    this.world.revealArea(
      this.player.position.x + this.player.size.x / 2,
      this.player.position.y + this.player.size.y / 2,
    );
  }

  initDungeonSystem() {
    // Initialize dungeon entrances based on the game document
    this.dungeonEntrances = [
      {
        id: "rootway_shrine",
        name: "Rootway Shrine",
        position: { x: 15 * this.world.tileSize, y: 20 * this.world.tileSize }, // Whisperwood
        unlocked: true, // First dungeon is always unlocked
        completed: false
      },
      {
        id: "old_waterworks", 
        name: "Old Waterworks",
        position: { x: 60 * this.world.tileSize, y: 30 * this.world.tileSize }, // Riverlands
        unlocked: true, // Unlocked after getting lantern
        completed: false
      }
    ];

    // Give player starting items for testing
    this.playerInventory.add("sunflame_lantern");
    this.playerInventory.add("aether_mirror");
  }

  checkDungeonEntrance() {
    if (this.gameState !== GameState.PLAYING) return;

    const playerCenter = {
      x: this.player.position.x + this.player.size.x / 2,
      y: this.player.position.y + this.player.size.y / 2
    };

    // Check if player is near any dungeon entrance
    for (const entrance of this.dungeonEntrances) {
      const distance = Math.sqrt(
        Math.pow(playerCenter.x - entrance.position.x, 2) +
        Math.pow(playerCenter.y - entrance.position.y, 2)
      );

      if (distance < 40) { // Within interaction range
        if (entrance.unlocked && !entrance.completed) {
          // Show interaction prompt
          this.drawInteractionPrompt(entrance.name);
          
          // Check for Enter key to enter dungeon
          if (this.keys['Enter']) {
            this.enterDungeon(entrance);
          }
        } else if (!entrance.unlocked) {
          // Show locked message
          this.drawLockedMessage(entrance.name, entrance.requiredItem || "unknown item");
        } else if (entrance.completed) {
          // Show completed message
          this.drawCompletedMessage(entrance.name);
        }
      }
    }
  }

  enterDungeon(entrance: DungeonEntrance) {
    console.log(`Entering ${entrance.name}`);
    this.gameState = GameState.DUNGEON;
    
    // Create simple test dungeon room
    this.currentDungeon = {
      id: entrance.id,
      name: entrance.name,
      description: "A mysterious dungeon chamber",
      width: 20,
      height: 15,
      tiles: this.createSimpleDungeonTiles(20, 15),
      startPosition: { x: 1, y: 13 },
      bossPosition: { x: 18, y: 2 },
      reward: { item: "test_item", shard: "test_shard" }
    };
    
    // Set player to dungeon start position
    this.player.position = {
      x: this.currentDungeon.startPosition.x * this.world.tileSize,
      y: this.currentDungeon.startPosition.y * this.world.tileSize
    };
    
    // Reset camera
    this.camera.setTarget(this.player.position.x, this.player.position.y);
    
    this.audioManager.playSound('collect'); // Enter sound
  }

  createSimpleDungeonTiles(width: number, height: number): TileType[][] {
    const tiles: TileType[][] = [];
    
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        // Create simple room with walls around edges
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          tiles[y][x] = TileType.WALL;
        } else {
          tiles[y][x] = TileType.FLOOR;
        }
      }
    }
    
    return tiles;
  }

  exitDungeon() {
    console.log("Exiting dungeon");
    this.gameState = GameState.PLAYING;
    this.currentDungeon = null;
    
    // Return player to world
    this.player.position = { x: 45 * this.world.tileSize, y: 35 * this.world.tileSize };
    this.camera.setTarget(this.player.position.x, this.player.position.y);
  }

  drawInteractionPrompt(dungeonName: string) {
    const canvas = this.canvas;
    const ctx = this.ctx;
    
    // Draw interaction prompt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height - 100, 300, 60);
    
    ctx.fillStyle = '#FFFF00';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Press ENTER to enter`, canvas.width / 2, canvas.height - 70);
    ctx.fillText(dungeonName, canvas.width / 2, canvas.height - 50);
    ctx.textAlign = 'left';
  }

  drawLockedMessage(dungeonName: string, requiredItem: string) {
    const canvas = this.canvas;
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height - 100, 300, 60);
    
    ctx.fillStyle = '#FF6666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${dungeonName} is locked`, canvas.width / 2, canvas.height - 70);
    ctx.fillText(`Requires: ${requiredItem}`, canvas.width / 2, canvas.height - 50);
    ctx.textAlign = 'left';
  }

  drawCompletedMessage(dungeonName: string) {
    const canvas = this.canvas;
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(canvas.width / 2 - 150, canvas.height - 100, 300, 60);
    
    ctx.fillStyle = '#66FF66';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${dungeonName}`, canvas.width / 2, canvas.height - 70);
    ctx.fillText('COMPLETED', canvas.width / 2, canvas.height - 50);
    ctx.textAlign = 'left';
  }

  drawDungeon() {
    if (!this.currentDungeon) return;
    
    const tileSize = this.world.tileSize;
    const ctx = this.ctx;
    
    // Draw dungeon tiles
    for (let y = 0; y < this.currentDungeon.height; y++) {
      for (let x = 0; x < this.currentDungeon.width; x++) {
        const tileType = this.currentDungeon.tiles[y][x];
        const screenX = x * tileSize - this.camera.position.x;
        const screenY = y * tileSize - this.camera.position.y;
        
        // Only draw tiles that are visible on screen
        if (screenX + tileSize >= 0 && screenX < this.canvas.width &&
            screenY + tileSize >= 0 && screenY < this.canvas.height) {
          
          this.world.drawTile(ctx, tileType, screenX, screenY, tileSize);
        }
      }
    }
    
    // Draw dungeon UI
    this.drawDungeonUI();
  }

  drawDungeonUI() {
    if (!this.currentDungeon) return;
    
    const ctx = this.ctx;
    
    // Draw dungeon name and instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 50);
    
    ctx.fillStyle = '#FFFF00';
    ctx.font = '18px Arial';
    ctx.fillText(this.currentDungeon.name, 20, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText('Press ESC to exit dungeon', 20, 50);
  }

  isDungeonPassable(x: number, y: number): boolean {
    if (!this.currentDungeon) return false;
    
    const tileSize = this.world.tileSize;
    const tileX = Math.floor(x / tileSize);
    const tileY = Math.floor(y / tileSize);
    
    // Check bounds
    if (tileX < 0 || tileX >= this.currentDungeon.width || 
        tileY < 0 || tileY >= this.currentDungeon.height) {
      return false;
    }
    
    const tile = this.currentDungeon.tiles[tileY][tileX];
    
    // Check all four corners of the player's bounding box
    const corners = [
      { x, y },
      { x: x + this.player.size.x, y },
      { x, y: y + this.player.size.y },
      { x: x + this.player.size.x, y: y + this.player.size.y }
    ];
    
    for (const corner of corners) {
      const cornerTileX = Math.floor(corner.x / tileSize);
      const cornerTileY = Math.floor(corner.y / tileSize);
      
      if (cornerTileX < 0 || cornerTileX >= this.currentDungeon.width || 
          cornerTileY < 0 || cornerTileY >= this.currentDungeon.height) {
        return false;
      }
      
      const cornerTile = this.currentDungeon.tiles[cornerTileY][cornerTileX];
      
      // Only FLOOR tiles are passable in dungeons
      if (cornerTile !== TileType.FLOOR) {
        return false;
      }
    }
    
    return true;
  }

  updateEnemies(deltaTime: number) {
    if (this.gameState !== GameState.PLAYING) return;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Handle enemy flashing
      if (enemy.isFlashing) {
        enemy.flashTimer -= deltaTime;
        if (enemy.flashTimer <= 0) {
          enemy.isFlashing = false;
        }
      }

      // Handle enemy animation
      enemy.animationTimer += deltaTime;
      if (enemy.animationTimer >= 0.3) {
        // Enemies animate slower
        enemy.animationFrame = (enemy.animationFrame + 1) % 4;
        enemy.animationTimer = 0;
      }

      // Handle enemy attack timer
      if (enemy.attacking) {
        enemy.attackTimer -= deltaTime;
        if (enemy.attackTimer <= 0) {
          enemy.attacking = false;
        }
      }

      const distToPlayer = Math.hypot(
        this.player.position.x - enemy.position.x,
        this.player.position.y - enemy.position.y,
      );

      // Check if enemy should start attacking - attack immediately when in range
      const currentTime = performance.now() / 1000;
      if (
        distToPlayer < 50 &&
        !enemy.attacking &&
        this.world.isTileRevealed(enemy.position.x, enemy.position.y) &&
        currentTime - enemy.lastAttackTime >= enemy.attackCooldown
      ) {
        enemy.attacking = true;
        enemy.attackTimer = 0.4; // 0.4 second attack animation (faster)
        enemy.lastAttackTime = currentTime;
        enemy.hasHitPlayer = false; // Reset hit flag for new attack
        this.audioManager.playSound('enemy_attack'); // Menacing enemy attack sound
      }

      // Only move if not attacking or about to attack
      if (
        distToPlayer < 120 &&
        this.world.isTileRevealed(enemy.position.x, enemy.position.y) &&
        !enemy.attacking &&
        distToPlayer > 45
      ) {
        const dx = this.player.position.x - enemy.position.x;
        const dy = this.player.position.y - enemy.position.y;
        const length = Math.hypot(dx, dy);

        if (length > 0) {
          const speed = enemy.speed * deltaTime * 1.2; // 20% faster when chasing
          const newX = enemy.position.x + (dx / length) * speed;
          const newY = enemy.position.y + (dy / length) * speed;

          if (this.world.isPassable(newX, newY)) {
            enemy.position.x = newX;
            enemy.position.y = newY;

            // Update direction based on movement - including diagonals
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            const threshold = 0.5; // For diagonal detection

            if (absX > absY * threshold && absY > absX * threshold) {
              // Diagonal movement
              if (dx > 0 && dy > 0) {
                enemy.direction = Direction.DOWN_RIGHT;
              } else if (dx > 0 && dy < 0) {
                enemy.direction = Direction.UP_RIGHT;
              } else if (dx < 0 && dy > 0) {
                enemy.direction = Direction.DOWN_LEFT;
              } else {
                enemy.direction = Direction.UP_LEFT;
              }
            } else if (absX > absY) {
              // Primarily horizontal
              enemy.direction = dx > 0 ? Direction.RIGHT : Direction.LEFT;
            } else {
              // Primarily vertical
              enemy.direction = dy > 0 ? Direction.DOWN : Direction.UP;
            }
          }
        }
      } else if (!enemy.attacking) {
        enemy.moveTimer -= deltaTime;
        if (enemy.moveTimer <= 0) {
          enemy.moveTimer = Math.random() * 2 + 1;
          const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
          enemy.direction = directions[Math.floor(Math.random() * directions.length)];
        }

        const speed = enemy.speed * deltaTime * 0.5;
        let newX = enemy.position.x;
        let newY = enemy.position.y;

        switch (enemy.direction) {
          case Direction.UP:
            newY -= speed;
            break;
          case Direction.DOWN:
            newY += speed;
            break;
          case Direction.LEFT:
            newX -= speed;
            break;
          case Direction.RIGHT:
            newX += speed;
            break;
        }

        if (this.world.isPassable(newX, newY)) {
          enemy.position.x = newX;
          enemy.position.y = newY;
        }
      }

      // Player attacking enemy - enhanced with directional attack range
      if (
        this.player.attacking &&
        this.checkAttackCollision(this.player, enemy) &&
        this.world.isTileRevealed(enemy.position.x, enemy.position.y) &&
        !this.player.hitEnemies.has(enemy)
      ) {
        this.player.hitEnemies.add(enemy); // Mark as hit this attack
        enemy.health -= 1; // Each hit does 1 damage, enemy has 2 health = 2 hits to die
        this.audioManager.playSound('enemy_damage'); // New enemy damage sound

        // Start enemy flashing effect
        enemy.isFlashing = true;
        enemy.flashTimer = 0.4; // Flash for 0.4 seconds

        // Push enemy back
        this.pushback(
          enemy,
          this.player.position.x + this.player.size.x / 2,
          this.player.position.y + this.player.size.y / 2,
          30,
        );

        if (enemy.health <= 0) {
          console.log('Enemy defeated!');
          this.enemies.splice(i, 1);
          this.player.rupees += 5;
          console.log(`Enemy defeated! Gained 5 rupees. Total: ${this.player.rupees}`);
        }
      }

      // Enemy attacking player (during attack animation and collision)
      if (
        enemy.attacking &&
        enemy.attackTimer > 0.15 &&
        enemy.attackTimer < 0.35 &&
        this.checkAttackCollision(enemy, this.player) &&
        this.world.isTileRevealed(enemy.position.x, enemy.position.y) &&
        !enemy.hasHitPlayer
      ) {
        enemy.hasHitPlayer = true; // Mark that this attack has hit
        this.player.health--;
        this.audioManager.playSound('player_damage'); // New dramatic damage sound

        // Start player flashing effect
        this.player.isFlashing = true;
        this.player.flashTimer = 0.6; // Flash for 0.6 seconds

        // Push player back
        this.pushback(
          this.player,
          enemy.position.x + enemy.size.x / 2,
          enemy.position.y + enemy.size.y / 2,
          40,
        );

        if (this.player.health <= 0) {
          // Immediately stop all audio when player dies
          this.audioManager.stopBackgroundMusic();
          this.gameState = GameState.GAMEOVER;
        }
      }
    }
  }

  updateItems() {
    if (this.gameState !== GameState.PLAYING) return;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];

      if (this.checkCollision(this.player, item) && !item.collected) {
        item.collected = true;
        this.audioManager.playSound('collect');

        switch (item.type) {
          case 'rupee':
            this.player.rupees += item.value;
            console.log(`Collected rupee! Total: ${this.player.rupees}`);
            break;
          case 'heart':
            // Heart containers increase max health and fully heal
            this.player.heartContainers += 1;
            this.player.maxHealth += 2; // Each heart container adds 2 health points
            this.player.health = this.player.maxHealth; // Fully heal when collecting heart container
            console.log(
              `Collected heart container! Total: ${this.player.heartContainers}, Max Health: ${this.player.maxHealth}`,
            );
            break;
          case 'key':
            this.player.keys += 1;
            this.player.inventory.push('key');
            console.log(`Collected key! Total: ${this.player.keys}`);
            break;
          case 'gem':
            this.player.rupees += item.value * 5; // Gems are worth more
            console.log(
              `Collected gem worth ${item.value * 5} rupees! Total: ${this.player.rupees}`,
            );
            break;
          case 'coin':
            this.player.rupees += item.value * 2; // Coins are worth 2x
            console.log(
              `Collected coin worth ${item.value * 2} rupees! Total: ${this.player.rupees}`,
            );
            break;
        }

        this.items.splice(i, 1);
      }
    }
  }

  checkCollision(a: any, b: any): boolean {
    return (
      a.position.x < b.position.x + b.size.x &&
      a.position.x + a.size.x > b.position.x &&
      a.position.y < b.position.y + b.size.y &&
      a.position.y + a.size.y > b.position.y
    );
  }

  checkAttackCollision(attacker: any, target: any): boolean {
    // Enhanced attack collision with directional range
    const attackRange = 20; // Extended attack range
    let attackX = attacker.position.x;
    let attackY = attacker.position.y;
    let attackWidth = attacker.size.x;
    let attackHeight = attacker.size.y;

    // Extend attack hitbox based on direction
    switch (attacker.direction) {
      case Direction.UP:
        attackY -= attackRange;
        attackHeight += attackRange;
        break;
      case Direction.DOWN:
        attackHeight += attackRange;
        break;
      case Direction.LEFT:
        attackX -= attackRange;
        attackWidth += attackRange;
        break;
      case Direction.RIGHT:
        attackWidth += attackRange;
        break;
      case Direction.UP_LEFT:
        attackX -= attackRange * 0.707;
        attackY -= attackRange * 0.707;
        attackWidth += attackRange * 0.707;
        attackHeight += attackRange * 0.707;
        break;
      case Direction.UP_RIGHT:
        attackY -= attackRange * 0.707;
        attackWidth += attackRange * 0.707;
        attackHeight += attackRange * 0.707;
        break;
      case Direction.DOWN_LEFT:
        attackX -= attackRange * 0.707;
        attackWidth += attackRange * 0.707;
        attackHeight += attackRange * 0.707;
        break;
      case Direction.DOWN_RIGHT:
        attackWidth += attackRange * 0.707;
        attackHeight += attackRange * 0.707;
        break;
    }

    const attackBox = {
      position: { x: attackX, y: attackY },
      size: { x: attackWidth, y: attackHeight },
    };

    return this.checkCollision(attackBox, target);
  }

  wouldCollideWithEnemies(x: number, y: number): boolean {
    const testRect = { position: { x, y }, size: this.player.size };
    return this.enemies.some(
      enemy =>
        this.world.isTileRevealed(enemy.position.x, enemy.position.y) &&
        this.checkCollision(testRect, enemy),
    );
  }

  wouldEnemyCollide(enemy: Enemy, x: number, y: number): boolean {
    const testRect = { position: { x, y }, size: enemy.size };

    // Check collision with player
    if (this.checkCollision(testRect, this.player)) {
      return true;
    }

    // Check collision with other enemies
    return this.enemies.some(
      otherEnemy =>
        otherEnemy !== enemy &&
        this.world.isTileRevealed(otherEnemy.position.x, otherEnemy.position.y) &&
        this.checkCollision(testRect, otherEnemy),
    );
  }

  pushback(entity: any, fromX: number, fromY: number, force: number) {
    const dx = entity.position.x - fromX;
    const dy = entity.position.y - fromY;
    const length = Math.hypot(dx, dy);

    if (length > 0) {
      const pushX = entity.position.x + (dx / length) * force;
      const pushY = entity.position.y + (dy / length) * force;

      // Check bounds and world collision for pushback
      if (
        this.world.isPassable(pushX, entity.position.y) &&
        this.world.isPassable(pushX + entity.size.x, entity.position.y) &&
        this.world.isPassable(pushX, entity.position.y + entity.size.y) &&
        this.world.isPassable(pushX + entity.size.x, entity.position.y + entity.size.y)
      ) {
        entity.position.x = pushX;
      }

      if (
        this.world.isPassable(entity.position.x, pushY) &&
        this.world.isPassable(entity.position.x + entity.size.x, pushY) &&
        this.world.isPassable(entity.position.x, pushY + entity.size.y) &&
        this.world.isPassable(entity.position.x + entity.size.x, pushY + entity.size.y)
      ) {
        entity.position.y = pushY;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw appropriate world based on game state
    if (this.gameState === GameState.DUNGEON && this.currentDungeon) {
      this.drawDungeon();
    } else {
      this.world.draw(this.ctx, this.camera);
    }

    this.items.forEach(item => {
      if (!item.collected && this.world.isTileRevealed(item.position.x, item.position.y)) {
        this.drawItem(
          item,
          Math.round(item.position.x - this.camera.position.x),
          Math.round(item.position.y - this.camera.position.y),
        );
      }
    });

    this.drawPlayer(
      Math.round(this.player.position.x - this.camera.position.x),
      Math.round(this.player.position.y - this.camera.position.y),
      this.player.direction,
      this.player.animationFrame,
    );

    if (this.player.attacking) {
      this.drawSword(
        Math.round(this.player.position.x - this.camera.position.x),
        Math.round(this.player.position.y - this.camera.position.y),
        this.player.direction,
      );
    }

    this.enemies.forEach(enemy => {
      if (this.world.isTileRevealed(enemy.position.x, enemy.position.y)) {
        this.drawEnemy(
          Math.round(enemy.position.x - this.camera.position.x),
          Math.round(enemy.position.y - this.camera.position.y),
          enemy.direction,
          enemy.animationFrame,
          enemy.attacking,
          enemy, // Pass the enemy object for flash checking
        );
      }
    });

    this.drawUI();
  }

  drawUI() {
    // Smaller top UI bar background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, 70);

    // Draw hearts
    this.drawHearts();

    // Draw currency and keys below hearts
    this.drawCurrencyAndKeys();

    // Game title in center of header
    this.ctx.fillStyle = '#FFD700'; // Same golden yellow as title screen
    this.ctx.font = 'bold 20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ECHOES OF AERIA', this.canvas.width / 2, 25);
    this.ctx.textAlign = 'left'; // Reset alignment

    // Top-right directions
    this.drawDirections();

    if (this.gameState === GameState.TITLE) {
      this.drawTitleScreen();
    } else if (this.gameState === GameState.PAUSED) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'left';

      // Draw controls in pause menu
      this.drawPauseControls();
    }

    if (this.gameState === GameState.INVENTORY) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.fillStyle = '#FFF';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('INVENTORY', this.canvas.width / 2, 100);

      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'left';
      let y = 150;
      this.player.inventory.forEach(item => {
        this.ctx.fillText(`• ${item}`, this.canvas.width / 2 - 100, y);
        y += 30;
      });

      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press I to close', this.canvas.width / 2, this.canvas.height - 50);
      this.ctx.textAlign = 'left';
    }

    if (this.gameState === GameState.GAMEOVER) {
      this.drawGameOverScreen();
    }
  }

  gameLoop(currentTime: number) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.camera.update(
      this.player.position.x + this.player.size.x / 2,
      this.player.position.y + this.player.size.y / 2,
      this.canvas.width,
      this.canvas.height,
    );

    this.updatePlayer(deltaTime);
    this.updateEnemies(deltaTime);
    this.updateItems();
    this.checkDungeonEntrance(); // Check for dungeon interactions
    this.world.updateTransition(deltaTime * 1000); // Convert to ms

    this.draw();

    requestAnimationFrame(time => this.gameLoop(time));
  }

  drawHearts() {
    // Draw heart containers - larger size
    for (let i = 0; i < this.player.maxHealth / 2; i++) {
      const heartX = 10 + i * 35; // Increased spacing for larger hearts
      const heartY = 8;

      // Determine heart state
      const heartValue = i * 2;
      if (this.player.health > heartValue + 1) {
        // Full heart
        this.drawHeart(heartX, heartY, 'full');
      } else if (this.player.health === heartValue + 1) {
        // Half heart
        this.drawHeart(heartX, heartY, 'half');
      } else {
        // Empty heart
        this.drawHeart(heartX, heartY, 'empty');
      }
    }
  }

  drawHeart(x: number, y: number, state: 'full' | 'half' | 'empty') {
    // Larger heart - scaled up by 1.5x
    const scale = 1.5;

    // Heart outline
    this.ctx.fillStyle = '#800000';
    this.ctx.fillRect(x + 4 * scale, y, 4 * scale, 2 * scale);
    this.ctx.fillRect(x + 12 * scale, y, 4 * scale, 2 * scale);
    this.ctx.fillRect(x + 2 * scale, y + 2 * scale, 2 * scale, 4 * scale);
    this.ctx.fillRect(x + 8 * scale, y + 2 * scale, 8 * scale, 4 * scale);
    this.ctx.fillRect(x + 16 * scale, y + 2 * scale, 2 * scale, 4 * scale);
    this.ctx.fillRect(x + 4 * scale, y + 6 * scale, 12 * scale, 2 * scale);
    this.ctx.fillRect(x + 6 * scale, y + 8 * scale, 8 * scale, 2 * scale);
    this.ctx.fillRect(x + 8 * scale, y + 10 * scale, 4 * scale, 2 * scale);
    this.ctx.fillRect(x + 9 * scale, y + 12 * scale, 2 * scale, 2 * scale);

    // Heart fill based on state
    if (state === 'full') {
      this.ctx.fillStyle = '#FF0000';
    } else if (state === 'half') {
      this.ctx.fillStyle = '#FF0000';
    } else {
      this.ctx.fillStyle = '#333333';
    }

    // Fill the heart
    this.ctx.fillRect(x + 4 * scale, y + 1 * scale, 4 * scale, 1 * scale);
    this.ctx.fillRect(x + 12 * scale, y + 1 * scale, 4 * scale, 1 * scale);
    this.ctx.fillRect(x + 3 * scale, y + 2 * scale, 13 * scale, 4 * scale);
    this.ctx.fillRect(x + 4 * scale, y + 6 * scale, 12 * scale, 2 * scale);
    this.ctx.fillRect(x + 6 * scale, y + 8 * scale, 8 * scale, 2 * scale);
    this.ctx.fillRect(x + 8 * scale, y + 10 * scale, 4 * scale, 2 * scale);
    this.ctx.fillRect(x + 9 * scale, y + 12 * scale, 2 * scale, 1 * scale);

    // Half heart overlay
    if (state === 'half') {
      this.ctx.fillStyle = '#333333';
      this.ctx.fillRect(x + 10 * scale, y + 2 * scale, 6 * scale, 4 * scale);
      this.ctx.fillRect(x + 10 * scale, y + 6 * scale, 6 * scale, 2 * scale);
      this.ctx.fillRect(x + 10 * scale, y + 8 * scale, 4 * scale, 2 * scale);
      this.ctx.fillRect(x + 10 * scale, y + 10 * scale, 2 * scale, 2 * scale);
    }
  }

  drawCurrencyAndKeys() {
    // Position below hearts - second row
    const startY = 45;

    // Draw rupee icon and count
    const rupeeX = 10;

    // Draw rupee icon (diamond shape)
    this.ctx.fillStyle = '#00FF00'; // Green rupee
    this.ctx.fillRect(rupeeX + 4, startY, 8, 2);
    this.ctx.fillRect(rupeeX + 2, startY + 2, 12, 2);
    this.ctx.fillRect(rupeeX, startY + 4, 16, 4);
    this.ctx.fillRect(rupeeX + 2, startY + 8, 12, 2);
    this.ctx.fillRect(rupeeX + 4, startY + 10, 8, 2);

    // Rupee highlight
    this.ctx.fillStyle = '#90EE90';
    this.ctx.fillRect(rupeeX + 4, startY + 1, 4, 1);
    this.ctx.fillRect(rupeeX + 2, startY + 3, 6, 1);
    this.ctx.fillRect(rupeeX + 1, startY + 5, 6, 1);

    // Currency count
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${this.player.rupees}`, rupeeX + 20, startY + 10);

    // Draw key icon and count
    const keyX = 100;

    // Draw key icon
    this.ctx.fillStyle = '#FFD700'; // Gold key
    // Key shaft
    this.ctx.fillRect(keyX, startY + 6, 12, 3);
    // Key head (circular)
    this.ctx.fillRect(keyX + 10, startY + 2, 6, 2);
    this.ctx.fillRect(keyX + 9, startY + 4, 8, 2);
    this.ctx.fillRect(keyX + 9, startY + 6, 8, 2);
    this.ctx.fillRect(keyX + 10, startY + 8, 6, 2);
    // Key teeth
    this.ctx.fillRect(keyX + 6, startY + 9, 2, 2);
    this.ctx.fillRect(keyX + 3, startY + 9, 2, 3);

    // Key highlight
    this.ctx.fillStyle = '#FFFF99';
    this.ctx.fillRect(keyX + 1, startY + 7, 6, 1);
    this.ctx.fillRect(keyX + 11, startY + 3, 3, 1);
    this.ctx.fillRect(keyX + 10, startY + 5, 4, 1);

    // Key count
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.font = '14px Arial';
    this.ctx.fillText(`${this.player.keys}`, keyX + 20, startY + 10);
  }

  drawDirections() {
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('ESC - Pause', this.canvas.width - 10, 20);
    this.ctx.textAlign = 'left'; // Reset text alignment
  }

  drawPauseControls() {
    const centerX = this.canvas.width / 2;
    const startY = this.canvas.height / 2 + 100;

    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('CONTROLS:', centerX, startY);

    this.ctx.font = '14px Arial';
    this.ctx.fillText('WASD/Arrow Keys - Move', centerX, startY + 30);
    this.ctx.fillText('Space - Attack', centerX, startY + 50);
    this.ctx.fillText('E - Toggle Realms', centerX, startY + 70);
    this.ctx.fillText('I - Inventory', centerX, startY + 90);
    this.ctx.fillText('M - Restart Music', centerX, startY + 110);
    this.ctx.fillText('ESC - Resume Game', centerX, startY + 130);

    this.ctx.textAlign = 'left'; // Reset text alignment
  }

  drawTitleScreen() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Main title
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ECHOES OF AERIA', centerX, centerY - 60);

    // Subtitle
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('A Classic Action-Adventure', centerX, centerY - 20);

    // Start instruction
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('Press Any Key to Start', centerX, centerY + 40);

    // Additional info
    this.ctx.fillStyle = '#A0A0A0';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('Best experienced with audio enabled', centerX, centerY + 80);

    this.ctx.textAlign = 'left'; // Reset text alignment
  }

  drawGameOverScreen() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Game Over title
    this.ctx.fillStyle = '#FF0000';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', centerX, centerY - 60);

    // Death message
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.font = '20px Arial';
    this.ctx.fillText('The realm has fallen...', centerX, centerY - 20);

    // Restart instruction
    this.ctx.fillStyle = '#FFF';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText('Press Any Key to Try Again', centerX, centerY + 40);

    // Additional flavor text
    this.ctx.fillStyle = '#A0A0A0';
    this.ctx.font = '14px Arial';
    this.ctx.fillText('The Echoes of Aeria await your return', centerX, centerY + 80);

    this.ctx.textAlign = 'left'; // Reset text alignment
  }

  restartGame() {
    console.log('RESTARTING GAME - Using nuclear audio reset');

    // NUCLEAR OPTION - Completely destroy and recreate audio system
    this.audioManager.forceResetAudio();

    // Reset player to original starting position and state
    this.player.health = this.player.maxHealth;
    this.player.position = {
      x: 45 * this.world.tileSize,
      y: 35 * this.world.tileSize,
    }; // Original starting position
    this.player.isFlashing = false;
    this.player.flashTimer = 0;

    // Reset enemies
    this.enemies.forEach(enemy => {
      enemy.health = enemy.maxHealth;
      enemy.isFlashing = false;
      enemy.flashTimer = 0;
      enemy.hasHitPlayer = false;
    });

    // Wait for audio context to be completely recreated, then start fresh
    setTimeout(() => {
      this.gameState = GameState.PLAYING;
      this.audioManager.startBackgroundMusic();
    }, 1000); // Longer wait for complete audio context recreation
  }

  drawSword(x: number, y: number, direction: Direction) {
    let swordX = x;
    let swordY = y;

    switch (direction) {
      case Direction.UP:
        swordX += 8;
        swordY -= 24;
        // Sword blade (vertical)
        this.ctx.fillStyle = '#C0C0C0'; // Silver blade
        this.ctx.fillRect(swordX, swordY, 8, 20);
        this.ctx.fillStyle = '#E6E6E6'; // Blade highlight
        this.ctx.fillRect(swordX + 1, swordY, 2, 20);
        // Hilt
        this.ctx.fillStyle = '#8B4513'; // Brown hilt
        this.ctx.fillRect(swordX - 2, swordY + 20, 12, 4);
        // Pommel
        this.ctx.fillStyle = '#FFD700'; // Gold pommel
        this.ctx.fillRect(swordX + 2, swordY + 24, 4, 4);
        break;

      case Direction.DOWN:
        swordX += 8;
        swordY += 28;
        // Sword blade (vertical)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 8, 20);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX + 1, swordY, 2, 20);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX - 2, swordY - 4, 12, 4);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX + 2, swordY - 8, 4, 4);
        break;

      case Direction.LEFT:
        swordX -= 24;
        swordY += 8;
        // Sword blade (horizontal)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 20, 8);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX, swordY + 1, 20, 2);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX + 20, swordY - 2, 4, 12);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX + 24, swordY + 2, 4, 4);
        break;

      case Direction.RIGHT:
        swordX += 28;
        swordY += 8;
        // Sword blade (horizontal)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 20, 8);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX, swordY + 1, 20, 2);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX - 4, swordY - 2, 4, 12);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX - 8, swordY + 2, 4, 4);
        break;

      case Direction.UP_LEFT:
        swordX -= 16;
        swordY -= 16;
        // Diagonal sword blade (angled up-left)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 16, 6);
        this.ctx.fillRect(swordX + 2, swordY - 2, 12, 6);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX + 1, swordY + 1, 14, 2);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX + 16, swordY + 6, 6, 6);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX + 18, swordY + 8, 3, 3);
        break;

      case Direction.UP_RIGHT:
        // Position sword to extend from top-right of player
        // Player is 24x24, sword is 16x6, position at player's top-right corner
        swordX += 24; // Start from right edge of player
        swordY -= 16; // Above player
        // Diagonal sword blade (angled up-right)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 16, 6);
        this.ctx.fillRect(swordX + 2, swordY - 2, 12, 6);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX + 1, swordY + 1, 14, 2);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX - 2, swordY + 6, 6, 6);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX - 1, swordY + 8, 3, 3);
        break;

      case Direction.DOWN_LEFT:
        // Position sword to extend from bottom-left of player
        // Start from left edge and below player
        swordX -= 16; // Extend left from player
        swordY += 24; // Below player (not above)
        // Diagonal sword blade (angled down-left)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 16, 6);
        this.ctx.fillRect(swordX + 2, swordY + 2, 12, 6);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX + 1, swordY + 1, 14, 2);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX + 16, swordY - 2, 6, 6);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX + 18, swordY, 3, 3);
        break;

      case Direction.DOWN_RIGHT:
        // Position sword to extend from bottom-right of player
        // Start from right edge and below player
        swordX += 24; // Start from right edge of player
        swordY += 24; // Below player (not above)
        // Diagonal sword blade (angled down-right)
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(swordX, swordY, 16, 6);
        this.ctx.fillRect(swordX + 2, swordY + 2, 12, 6);
        this.ctx.fillStyle = '#E6E6E6';
        this.ctx.fillRect(swordX + 1, swordY + 1, 14, 2);
        // Hilt
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(swordX - 2, swordY - 2, 6, 6);
        // Pommel
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(swordX - 1, swordY, 3, 3);
        break;
    }
  }

  drawPlayer(x: number, y: number, direction: Direction, frame: number) {
    // Player base color - Link's green tunic with flashing effect
    let baseColor = '#228B22';

    // Flash effect when taking damage
    if (this.player.isFlashing) {
      const flashSpeed = 8; // Flash 8 times per second
      const flashState = Math.floor(Date.now() / (1000 / flashSpeed)) % 2;
      if (flashState === 1) {
        baseColor = '#FF4444'; // Red flash when damaged
      }
    }

    // Body
    this.ctx.fillStyle = baseColor;
    this.ctx.fillRect(x + 4, y + 8, 16, 16);

    // Head/face
    this.ctx.fillStyle = '#FFDBAC'; // Skin color
    this.ctx.fillRect(x + 6, y + 2, 12, 10);

    // Hair (blonde)
    this.ctx.fillStyle = '#DAA520';
    this.ctx.fillRect(x + 4, y, 16, 6);

    // Hat (green)
    this.ctx.fillStyle = '#006400';
    this.ctx.fillRect(x + 2, y - 2, 20, 8);

    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 8, y + 5, 2, 1);
    this.ctx.fillRect(x + 14, y + 5, 2, 1);

    // Movement animation and directional sprites
    if (direction === Direction.UP) {
      // Walking up - show back view
      this.ctx.fillStyle = '#006400';
      this.ctx.fillRect(x + 6, y + 12, 4, 8); // Left arm
      this.ctx.fillRect(x + 14, y + 12, 4, 8); // Right arm

      // Legs with walking animation
      this.ctx.fillStyle = '#654321'; // Brown boots
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 4, y + 20, 6, 4); // Left foot forward
        this.ctx.fillRect(x + 14, y + 18, 6, 4); // Right foot back
      } else {
        this.ctx.fillRect(x + 4, y + 18, 6, 4); // Left foot back
        this.ctx.fillRect(x + 14, y + 20, 6, 4); // Right foot forward
      }
    } else if (direction === Direction.DOWN) {
      // Walking down - show front view
      this.ctx.fillStyle = '#8B4513'; // Brown sleeves
      this.ctx.fillRect(x + 2, y + 12, 4, 8); // Left arm
      this.ctx.fillRect(x + 18, y + 12, 4, 8); // Right arm

      // Legs with walking animation
      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 6, y + 20, 5, 4); // Left foot forward
        this.ctx.fillRect(x + 13, y + 18, 5, 4); // Right foot back
      } else {
        this.ctx.fillRect(x + 6, y + 18, 5, 4); // Left foot back
        this.ctx.fillRect(x + 13, y + 20, 5, 4); // Right foot forward
      }
    } else if (direction === Direction.LEFT) {
      // Walking left - side view
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(x + 2, y + 12, 3, 8); // Visible arm

      // Legs with walking animation
      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 4, y + 20, 4, 4); // Front foot
        this.ctx.fillRect(x + 10, y + 18, 4, 4); // Back foot
      } else {
        this.ctx.fillRect(x + 4, y + 18, 4, 4); // Back foot
        this.ctx.fillRect(x + 10, y + 20, 4, 4); // Front foot
      }
    } else if (direction === Direction.RIGHT) {
      // Walking right - side view
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(x + 19, y + 12, 3, 8); // Visible arm

      // Legs with walking animation
      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 16, y + 20, 4, 4); // Front foot
        this.ctx.fillRect(x + 10, y + 18, 4, 4); // Back foot
      } else {
        this.ctx.fillRect(x + 16, y + 18, 4, 4); // Back foot
        this.ctx.fillRect(x + 10, y + 20, 4, 4); // Front foot
      }
    } else if (direction === Direction.UP_LEFT) {
      // Diagonal up-left - blend of up and left views
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(x + 2, y + 12, 3, 8); // Left arm more visible
      this.ctx.fillRect(x + 14, y + 12, 4, 6); // Right arm partial

      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 3, y + 19, 5, 4); // Left foot forward
        this.ctx.fillRect(x + 12, y + 18, 5, 4); // Right foot back
      } else {
        this.ctx.fillRect(x + 3, y + 18, 5, 4); // Left foot back
        this.ctx.fillRect(x + 12, y + 19, 5, 4); // Right foot forward
      }
    } else if (direction === Direction.UP_RIGHT) {
      // Diagonal up-right - blend of up and right views
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(x + 6, y + 12, 4, 6); // Left arm partial
      this.ctx.fillRect(x + 19, y + 12, 3, 8); // Right arm more visible

      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 7, y + 18, 5, 4); // Left foot back
        this.ctx.fillRect(x + 15, y + 19, 5, 4); // Right foot forward
      } else {
        this.ctx.fillRect(x + 7, y + 19, 5, 4); // Left foot forward
        this.ctx.fillRect(x + 15, y + 18, 5, 4); // Right foot back
      }
    } else if (direction === Direction.DOWN_LEFT) {
      // Diagonal down-left - blend of down and left views
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(x + 2, y + 12, 4, 8); // Left arm visible
      this.ctx.fillRect(x + 16, y + 12, 4, 6); // Right arm partial

      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 4, y + 20, 5, 4); // Left foot forward
        this.ctx.fillRect(x + 12, y + 18, 5, 4); // Right foot back
      } else {
        this.ctx.fillRect(x + 4, y + 18, 5, 4); // Left foot back
        this.ctx.fillRect(x + 12, y + 20, 5, 4); // Right foot forward
      }
    } else if (direction === Direction.DOWN_RIGHT) {
      // Diagonal down-right - blend of down and right views
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(x + 6, y + 12, 4, 6); // Left arm partial
      this.ctx.fillRect(x + 18, y + 12, 4, 8); // Right arm visible

      this.ctx.fillStyle = '#654321';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 8, y + 18, 5, 4); // Left foot back
        this.ctx.fillRect(x + 15, y + 20, 5, 4); // Right foot forward
      } else {
        this.ctx.fillRect(x + 8, y + 20, 5, 4); // Left foot forward
        this.ctx.fillRect(x + 15, y + 18, 5, 4); // Right foot back
      }
    }

    // Shield (only visible from certain angles)
    if (
      direction === Direction.RIGHT ||
      direction === Direction.UP ||
      direction === Direction.UP_RIGHT ||
      direction === Direction.UP_LEFT
    ) {
      this.ctx.fillStyle = '#C0C0C0'; // Silver shield
      this.ctx.fillRect(x - 2, y + 10, 4, 8);
      this.ctx.fillStyle = '#FFD700'; // Gold trim
      this.ctx.fillRect(x - 1, y + 11, 2, 6);
    }
  }

  drawEnemy(
    x: number,
    y: number,
    direction: Direction,
    frame: number,
    attacking: boolean = false,
    enemy?: Enemy,
  ) {
    // Use the passed enemy object for flash checking
    const currentEnemy = enemy;

    // Enemy base (red goblin-like creature) with flashing effect
    let bodyColor = '#8B0000'; // Dark red body
    let headColor = '#CD5C5C'; // Lighter red head

    // Flash effect when taking damage
    if (currentEnemy && currentEnemy.isFlashing) {
      const flashSpeed = 10; // Flash 10 times per second (faster than player)
      const flashState = Math.floor(Date.now() / (1000 / flashSpeed)) % 2;
      if (flashState === 1) {
        bodyColor = '#FFFFFF'; // White flash when damaged
        headColor = '#FFAAAA'; // Light pink flash
      }
    }

    this.ctx.fillStyle = bodyColor;
    this.ctx.fillRect(x + 2, y + 6, 16, 14);

    // Head
    this.ctx.fillStyle = headColor;
    this.ctx.fillRect(x + 4, y + 2, 12, 8);

    // Eyes (glowing red)
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(x + 6, y + 4, 2, 2);
    this.ctx.fillRect(x + 12, y + 4, 2, 2);

    // Horns/spikes
    this.ctx.fillStyle = '#2F4F4F';
    this.ctx.fillRect(x + 3, y, 2, 4);
    this.ctx.fillRect(x + 15, y, 2, 4);

    // Movement animation based on direction
    if (direction === Direction.UP) {
      // Moving up
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x, y + 10, 4, 6); // Left arm
      this.ctx.fillRect(x + 16, y + 10, 4, 6); // Right arm

      // Legs with animation
      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 2, y + 16, 6, 4); // Left leg forward
        this.ctx.fillRect(x + 12, y + 14, 6, 4); // Right leg back
      } else {
        this.ctx.fillRect(x + 2, y + 14, 6, 4); // Left leg back
        this.ctx.fillRect(x + 12, y + 16, 6, 4); // Right leg forward
      }
    } else if (direction === Direction.DOWN) {
      // Moving down
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x - 2, y + 10, 4, 6); // Left arm
      this.ctx.fillRect(x + 18, y + 10, 4, 6); // Right arm

      // Legs with animation
      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 4, y + 16, 5, 4); // Left leg forward
        this.ctx.fillRect(x + 11, y + 14, 5, 4); // Right leg back
      } else {
        this.ctx.fillRect(x + 4, y + 14, 5, 4); // Left leg back
        this.ctx.fillRect(x + 11, y + 16, 5, 4); // Right leg forward
      }
    } else if (direction === Direction.LEFT) {
      // Moving left
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x - 2, y + 10, 3, 6); // Visible arm

      // Legs with animation
      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 2, y + 16, 4, 4); // Front leg
        this.ctx.fillRect(x + 8, y + 14, 4, 4); // Back leg
      } else {
        this.ctx.fillRect(x + 2, y + 14, 4, 4); // Back leg
        this.ctx.fillRect(x + 8, y + 16, 4, 4); // Front leg
      }
    } else if (direction === Direction.RIGHT) {
      // Moving right
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x + 19, y + 10, 3, 6); // Visible arm

      // Legs with animation
      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 14, y + 16, 4, 4); // Front leg
        this.ctx.fillRect(x + 8, y + 14, 4, 4); // Back leg
      } else {
        this.ctx.fillRect(x + 14, y + 14, 4, 4); // Back leg
        this.ctx.fillRect(x + 8, y + 16, 4, 4); // Front leg
      }
    } else if (direction === Direction.UP_LEFT) {
      // Moving up-left diagonal
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x - 1, y + 10, 3, 6); // Left arm more visible
      this.ctx.fillRect(x + 16, y + 10, 3, 5); // Right arm partial

      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 1, y + 15, 5, 4); // Left leg forward
        this.ctx.fillRect(x + 10, y + 14, 5, 4); // Right leg back
      } else {
        this.ctx.fillRect(x + 1, y + 14, 5, 4); // Left leg back
        this.ctx.fillRect(x + 10, y + 15, 5, 4); // Right leg forward
      }
    } else if (direction === Direction.UP_RIGHT) {
      // Moving up-right diagonal
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x + 4, y + 10, 3, 5); // Left arm partial
      this.ctx.fillRect(x + 17, y + 10, 3, 6); // Right arm more visible

      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 5, y + 14, 5, 4); // Left leg back
        this.ctx.fillRect(x + 13, y + 15, 5, 4); // Right leg forward
      } else {
        this.ctx.fillRect(x + 5, y + 15, 5, 4); // Left leg forward
        this.ctx.fillRect(x + 13, y + 14, 5, 4); // Right leg back
      }
    } else if (direction === Direction.DOWN_LEFT) {
      // Moving down-left diagonal
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x - 2, y + 10, 4, 6); // Left arm visible
      this.ctx.fillRect(x + 16, y + 10, 4, 5); // Right arm partial

      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 2, y + 16, 5, 4); // Left leg forward
        this.ctx.fillRect(x + 10, y + 14, 5, 4); // Right leg back
      } else {
        this.ctx.fillRect(x + 2, y + 14, 5, 4); // Left leg back
        this.ctx.fillRect(x + 10, y + 16, 5, 4); // Right leg forward
      }
    } else if (direction === Direction.DOWN_RIGHT) {
      // Moving down-right diagonal
      this.ctx.fillStyle = '#8B0000';
      this.ctx.fillRect(x + 4, y + 10, 4, 5); // Left arm partial
      this.ctx.fillRect(x + 16, y + 10, 4, 6); // Right arm visible

      this.ctx.fillStyle = '#2F4F4F';
      if (frame % 2 === 0) {
        this.ctx.fillRect(x + 6, y + 14, 5, 4); // Left leg back
        this.ctx.fillRect(x + 13, y + 16, 5, 4); // Right leg forward
      } else {
        this.ctx.fillRect(x + 6, y + 16, 5, 4); // Left leg forward
        this.ctx.fillRect(x + 13, y + 14, 5, 4); // Right leg back
      }
    }

    // Weapon (simple club) - enhanced during attack
    this.ctx.fillStyle = '#654321'; // Brown club
    if (attacking) {
      // Attacking animation - weapon raised and extended
      const attackOffset = attacking ? 6 : 0;
      if (direction === Direction.RIGHT) {
        this.ctx.fillRect(x + 18 + attackOffset, y + 4, 3, 12);
        this.ctx.fillRect(x + 14 + attackOffset, y + 2, 8, 4); // Club head raised
        // Attack slash effect
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x + 20 + attackOffset, y, 8, 2);
        this.ctx.fillRect(x + 22 + attackOffset, y + 2, 6, 2);
      } else if (direction === Direction.LEFT) {
        this.ctx.fillRect(x - 3 - attackOffset, y + 4, 3, 12);
        this.ctx.fillRect(x - 6 - attackOffset, y + 2, 8, 4); // Club head raised
        // Attack slash effect
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x - 8 - attackOffset, y, 8, 2);
        this.ctx.fillRect(x - 8 - attackOffset, y + 2, 6, 2);
      } else if (direction === Direction.UP) {
        this.ctx.fillRect(x + 8, y - 4 - attackOffset, 12, 3);
        this.ctx.fillRect(x + 6, y - 8 - attackOffset, 4, 8); // Club head raised
        // Attack slash effect
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x + 4, y - 6 - attackOffset, 2, 8);
        this.ctx.fillRect(x + 6, y - 8 - attackOffset, 2, 6);
      } else if (direction === Direction.DOWN) {
        this.ctx.fillRect(x + 8, y + 16 + attackOffset, 12, 3);
        this.ctx.fillRect(x + 6, y + 20 + attackOffset, 4, 8); // Club head lowered
        // Attack slash effect
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x + 4, y + 18 + attackOffset, 2, 8);
        this.ctx.fillRect(x + 6, y + 20 + attackOffset, 2, 6);
      } else if (direction === Direction.UP_LEFT) {
        this.ctx.fillRect(x - 2 - attackOffset, y + 2 - attackOffset, 8, 3);
        this.ctx.fillRect(x - 4 - attackOffset, y - 2 - attackOffset, 4, 6);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x - 6 - attackOffset, y - attackOffset, 6, 2);
        this.ctx.fillRect(x - 4 - attackOffset, y + 2 - attackOffset, 4, 2);
      } else if (direction === Direction.UP_RIGHT) {
        this.ctx.fillRect(x + 14 + attackOffset, y + 2 - attackOffset, 8, 3);
        this.ctx.fillRect(x + 16 + attackOffset, y - 2 - attackOffset, 4, 6);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x + 16 + attackOffset, y - attackOffset, 6, 2);
        this.ctx.fillRect(x + 16 + attackOffset, y + 2 - attackOffset, 4, 2);
      } else if (direction === Direction.DOWN_LEFT) {
        this.ctx.fillRect(x - 2 - attackOffset, y + 14 + attackOffset, 8, 3);
        this.ctx.fillRect(x - 4 - attackOffset, y + 16 + attackOffset, 4, 6);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x - 6 - attackOffset, y + 16 + attackOffset, 6, 2);
        this.ctx.fillRect(x - 4 - attackOffset, y + 14 + attackOffset, 4, 2);
      } else if (direction === Direction.DOWN_RIGHT) {
        this.ctx.fillRect(x + 14 + attackOffset, y + 14 + attackOffset, 8, 3);
        this.ctx.fillRect(x + 16 + attackOffset, y + 16 + attackOffset, 4, 6);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x + 16 + attackOffset, y + 16 + attackOffset, 6, 2);
        this.ctx.fillRect(x + 16 + attackOffset, y + 14 + attackOffset, 4, 2);
      }
    } else {
      // Normal weapon position
      if (direction === Direction.RIGHT) {
        this.ctx.fillRect(x + 18, y + 8, 2, 8);
        this.ctx.fillRect(x + 16, y + 6, 6, 3); // Club head
      } else if (direction === Direction.LEFT) {
        this.ctx.fillRect(x, y + 8, 2, 8);
        this.ctx.fillRect(x - 2, y + 6, 6, 3); // Club head
      }
    }
  }

  drawItem(item: Item, x: number, y: number) {
    switch (item.type) {
      case 'rupee':
        this.drawRupee(x, y);
        break;
      case 'heart':
        this.drawHeart(x, y);
        break;
      case 'key':
        this.drawKey(x, y);
        break;
      default:
        // Fallback to simple rectangle
        this.ctx.fillStyle = item.sprite.color;
        this.ctx.fillRect(x, y, item.sprite.width, item.sprite.height);
    }
  }

  drawRupee(x: number, y: number) {
    // High-fidelity rupee like classic Zelda games
    const centerX = x + 8;
    const centerY = y + 8;

    // Rupee body (diamond shape with facets)
    this.ctx.fillStyle = '#00FF00'; // Green rupee
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 6); // Top point
    this.ctx.lineTo(centerX + 4, centerY - 2); // Top right
    this.ctx.lineTo(centerX + 4, centerY + 2); // Bottom right
    this.ctx.lineTo(centerX, centerY + 6); // Bottom point
    this.ctx.lineTo(centerX - 4, centerY + 2); // Bottom left
    this.ctx.lineTo(centerX - 4, centerY - 2); // Top left
    this.ctx.closePath();
    this.ctx.fill();

    // Bright highlight facet
    this.ctx.fillStyle = '#66FF66';
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY - 6); // Top point
    this.ctx.lineTo(centerX + 2, centerY - 3); // Right of top
    this.ctx.lineTo(centerX, centerY); // Center
    this.ctx.lineTo(centerX - 2, centerY - 3); // Left of top
    this.ctx.closePath();
    this.ctx.fill();

    // Side facets for 3D effect
    this.ctx.fillStyle = '#00CC00'; // Darker green
    this.ctx.beginPath();
    this.ctx.moveTo(centerX + 2, centerY - 3);
    this.ctx.lineTo(centerX + 4, centerY - 2);
    this.ctx.lineTo(centerX + 4, centerY + 2);
    this.ctx.lineTo(centerX + 2, centerY + 1);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(centerX - 2, centerY - 3);
    this.ctx.lineTo(centerX - 4, centerY - 2);
    this.ctx.lineTo(centerX - 4, centerY + 2);
    this.ctx.lineTo(centerX - 2, centerY + 1);
    this.ctx.closePath();
    this.ctx.fill();

    // Bottom facets
    this.ctx.fillStyle = '#008800'; // Even darker green
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(centerX + 2, centerY + 1);
    this.ctx.lineTo(centerX, centerY + 6);
    this.ctx.lineTo(centerX - 2, centerY + 1);
    this.ctx.closePath();
    this.ctx.fill();

    // Bright sparkle effect
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(centerX - 1, centerY - 4, 1, 2);
    this.ctx.fillRect(centerX + 1, centerY - 2, 1, 1);
  }

  drawKey(x: number, y: number) {
    // Classic key item
    const centerX = x + 8;
    const centerY = y + 8;

    // Key shaft
    this.ctx.fillStyle = '#C0C0C0'; // Silver
    this.ctx.fillRect(centerX - 1, centerY - 2, 2, 8);

    // Key head (circular)
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 2, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Key head center hole
    this.ctx.fillStyle = '#666666';
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - 2, 1, 0, Math.PI * 2);
    this.ctx.fill();

    // Key teeth
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.fillRect(centerX + 1, centerY + 4, 2, 1);
    this.ctx.fillRect(centerX + 1, centerY + 2, 3, 1);

    // Highlight
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(centerX - 2, centerY - 4, 1, 1);
  }
}

new ZeldaGame();
