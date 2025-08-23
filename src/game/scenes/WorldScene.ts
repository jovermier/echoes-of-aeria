// World Scene - Main gameplay scene with ECS integration
// Following Game Architect specifications for ECS + Phaser integration

import Phaser from 'phaser';
import { World, EntityBuilder } from '../ECS.js';
import { gameEvents } from '@shared/events.js';
import { TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, TOWNS, TUTORIAL } from '@shared/constants.js';
import { WorldGenerator, type WorldTile } from '../utils/WorldGenerator.js';
import { TileType } from '@shared/types.js';

// Import systems
import { MovementSystem } from '../systems/MovementSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { InventorySystem } from '../systems/InventorySystem.js';
import { VisualEffectsSystem } from '../systems/VisualEffectsSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { WeatherSystem, WeatherType } from '../systems/WeatherSystem.js';
import { audioManager } from '../systems/AudioManager.js';
import { AudioUtils } from '../utils/audioUtils.js';

// Add missing types for Web Audio API
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export class WorldScene extends Phaser.Scene {
  private ecsWorld!: World;
  private playerEntity!: string;
  private currentMap = 'hearthmere';
  private worldGenerator!: WorldGenerator;
  private worldTiles: WorldTile[][] = [];
  private currentRealm: 'dayrealm' | 'eclipse' = 'dayrealm';
  
  // Performance tracking
  private lastCameraX = 0;
  private lastCameraY = 0;
  private lastRenderTime = 0;
  private readonly RENDER_INTERVAL = 16; // ~60fps limit for world rendering
  private frameCount = 0;
  private lastFPSTime = 0;
  
  // Rendering groups
  private backgroundLayer!: Phaser.GameObjects.Group;
  private entityLayer!: Phaser.GameObjects.Group;
  private foregroundLayer!: Phaser.GameObjects.Group;
  private uiLayer!: Phaser.GameObjects.Group;
  
  // Visual Effects System
  private visualEffects!: VisualEffectsSystem;
  
  // Weather System
  private weatherSystem!: WeatherSystem;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    console.log('World Scene: Starting game world');
    
    // Initialize ECS
    this.initializeECS();
    
    // Set up rendering layers
    this.createRenderingLayers();
    
    // Create game world
    this.createWorld();
    
    // Create player
    this.createPlayer();
    
    // Create NPCs
    this.createNPCs();
    
    // Set up camera
    this.setupCamera();
    
    // Set up input handling
    this.setupInput();
    
    // Initialize audio system
    this.initializeAudio();
    
    // Initialize visual effects system
    this.initializeVisualEffects();
    
    // Initialize weather system
    this.initializeWeatherSystem();
    
    // Start game systems
    this.startSystems();
    
    console.log('World Scene: Initialization complete');
    
    // Start tutorial experience
    this.startTutorialSequence();
    
    // Log player starting position and nearby tiles
    setTimeout(() => {
      this.logPlayerStartingArea();
    }, 1500);
  }

  update(time: number, deltaTime: number): void {
    // Convert deltaTime to seconds for physics calculations
    const deltaTimeSeconds = deltaTime / 1000;
    
    // Debug logging for deltaTime monitoring
    if (Math.random() < 0.001) { // Log occasionally to avoid spam
      console.log('WorldScene: deltaTime =', deltaTime, 'ms =', deltaTimeSeconds, 'seconds');
    }
    
    // Update ECS world (all systems)
    this.ecsWorld.update(deltaTimeSeconds);
    
    // Update visual effects system
    this.visualEffects.update(deltaTimeSeconds);
    
    // Update weather system
    this.weatherSystem.update(deltaTimeSeconds);
    
    // Check if we need to re-render the world tiles (performance optimization)
    this.checkWorldRenderUpdate(time);
    
    // Performance monitoring (development only)
    if (import.meta.env.DEV) {
      this.updatePerformanceMonitor(time);
    }
  }

  private updatePerformanceMonitor(time: number): void {
    this.frameCount++;
    
    // Log FPS every 5 seconds
    if (time - this.lastFPSTime > 5000) {
      const fps = this.frameCount / 5;
      console.log(`Average FPS: ${fps.toFixed(1)}`);
      this.frameCount = 0;
      this.lastFPSTime = time;
    }
  }

  private checkWorldRenderUpdate(time: number): void {
    // Only re-render if enough time has passed and camera moved significantly
    if (time - this.lastRenderTime < this.RENDER_INTERVAL) {
      return;
    }

    const camera = this.cameras.main;
    const cameraMoved = Math.abs(camera.scrollX - this.lastCameraX) > TILE_SIZE * 2 ||
                      Math.abs(camera.scrollY - this.lastCameraY) > TILE_SIZE * 2;

    if (cameraMoved) {
      this.renderWorldTiles();
      this.lastCameraX = camera.scrollX;
      this.lastCameraY = camera.scrollY;
      this.lastRenderTime = time;
    }
  }

  private initializeECS(): void {
    this.ecsWorld = new World();
    
    // Add core systems in execution order
    this.ecsWorld.addSystem(new InputSystem(this));
    this.ecsWorld.addSystem(new MovementSystem());
    this.ecsWorld.addSystem(new CollisionSystem());
    this.ecsWorld.addSystem(new CombatSystem());
    this.ecsWorld.addSystem(new InteractionSystem(this));
    this.ecsWorld.addSystem(new InventorySystem());
    this.ecsWorld.addSystem(new RenderSystem(this));
  }

  private createRenderingLayers(): void {
    // Create rendering layers for proper depth sorting
    this.backgroundLayer = this.add.group();
    this.entityLayer = this.add.group();
    this.foregroundLayer = this.add.group();
    this.uiLayer = this.add.group();
  }

  private createWorld(): void {
    console.log('Creating world with WorldGenerator...');
    
    // Generate the full world
    this.worldGenerator = new WorldGenerator();
    this.worldTiles = this.worldGenerator.getWorld();
    
    // Set camera bounds to the full world
    const worldPixelWidth = WORLD_WIDTH * TILE_SIZE;
    const worldPixelHeight = WORLD_HEIGHT * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldPixelWidth, worldPixelHeight);
    
    // Create tile graphics for the world (we'll only render visible tiles for performance)
    this.createWorldGraphics();
    
    console.log(`World created: ${WORLD_WIDTH}x${WORLD_HEIGHT} tiles (${worldPixelWidth}x${worldPixelHeight} pixels)`);
  }

  private worldGraphics!: Phaser.GameObjects.Graphics;

  private createWorldGraphics(): void {
    // Create a large graphics object for the world tiles
    this.worldGraphics = this.add.graphics();
    this.renderWorldTiles();
    
    this.backgroundLayer.add(this.worldGraphics);
    
    // Add region labels for towns
    this.addTownLabels();
  }

  private renderWorldTiles(): void {
    this.worldGraphics.clear();
    
    // Get camera bounds for viewport culling
    const camera = this.cameras.main;
    const camLeft = Math.floor(camera.scrollX / TILE_SIZE) - 1;
    const camTop = Math.floor(camera.scrollY / TILE_SIZE) - 1;
    const camRight = Math.ceil((camera.scrollX + camera.width) / TILE_SIZE) + 1;
    const camBottom = Math.ceil((camera.scrollY + camera.height) / TILE_SIZE) + 1;
    
    // Clamp to world bounds
    const startX = Math.max(0, camLeft);
    const startY = Math.max(0, camTop);
    const endX = Math.min(WORLD_WIDTH, camRight);
    const endY = Math.min(WORLD_HEIGHT, camBottom);
    
    // Render tiles in layers for depth effect (like Zelda)
    this.renderTileLayer(startX, startY, endX, endY, 'ground');
    this.renderTileLayer(startX, startY, endX, endY, 'decorations');
    this.renderTileLayer(startX, startY, endX, endY, 'details');
  }

  private renderTileLayer(startX: number, startY: number, endX: number, endY: number, layer: 'ground' | 'decorations' | 'details'): void {
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = this.worldTiles[y][x];
        const tileType = this.currentRealm === 'eclipse' ? 
          this.worldGenerator.getEclipseTile(tile.tileType) : tile.tileType;
        
        if (this.shouldRenderTileInLayer(tileType, layer)) {
          this.renderEnhancedTile(x, y, tileType, layer);
        }
      }
    }
  }

  private shouldRenderTileInLayer(tileType: TileType, layer: 'ground' | 'decorations' | 'details'): boolean {
    const groundTiles = new Set([
      TileType.GRASS, TileType.WATER, TileType.FOREST, TileType.MOUNTAIN,
      TileType.DESERT, TileType.SNOW, TileType.MARSH, TileType.VOLCANIC,
      TileType.WALL, TileType.BRIDGE, TileType.PATH, TileType.HOUSE,
      TileType.GRASS_DARK, TileType.GRASS_LIGHT, TileType.DIRT, TileType.SAND,
      TileType.STONE, TileType.WATER_DEEP, TileType.WATER_SHALLOW, TileType.COBBLESTONE
    ]);

    const decorationTiles = new Set([
      TileType.BUSH, TileType.ROCK, TileType.TREE, TileType.TALL_GRASS,
      TileType.MUSHROOM, TileType.POND, TileType.WOODEN_FENCE
    ]);

    const detailTiles = new Set([
      TileType.FLOWER, TileType.CHEST, TileType.DOOR, TileType.SHRINE,
      TileType.STATUE, TileType.FOUNTAIN, TileType.WELL, TileType.SIGN,
      TileType.TORCH, TileType.LANTERN
    ]);

    switch (layer) {
      case 'ground': return groundTiles.has(tileType);
      case 'decorations': return decorationTiles.has(tileType);
      case 'details': return detailTiles.has(tileType);
      default: return false;
    }
  }

  private renderEnhancedTile(x: number, y: number, tileType: TileType, layer: 'ground' | 'decorations' | 'details'): void {
    const pixelX = x * TILE_SIZE;
    const pixelY = y * TILE_SIZE;
    const baseColor = this.getTileColor(tileType);
    
    // Add subtle shadows and highlights for depth
    const shadowOffset = layer === 'details' ? 1 : 0;
    if (shadowOffset > 0 && this.shouldHaveShadow(tileType)) {
      this.worldGraphics.fillStyle(0x000000, 0.2);
      this.worldGraphics.fillRect(pixelX + shadowOffset, pixelY + shadowOffset, TILE_SIZE, TILE_SIZE);
    }

    // Render main tile
    this.worldGraphics.fillStyle(baseColor);
    this.worldGraphics.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
    
    // Add tile-specific visual enhancements
    this.addTileDetails(x, y, tileType, pixelX, pixelY);
  }

  private shouldHaveShadow(tileType: TileType): boolean {
    const shadowTiles = new Set([
      TileType.CHEST, TileType.STATUE, TileType.FOUNTAIN, TileType.WELL,
      TileType.TORCH, TileType.LANTERN, TileType.TREE, TileType.ROCK
    ]);
    return shadowTiles.has(tileType);
  }

  private addTileDetails(x: number, y: number, tileType: TileType, pixelX: number, pixelY: number): void {
    const size = TILE_SIZE;
    const halfSize = size / 2;
    const quarterSize = size / 4;

    switch (tileType) {
      case TileType.WATER:
      case TileType.WATER_DEEP:
        // Add water shimmer effect
        this.worldGraphics.fillStyle(0x4A7BCA, 0.3);
        this.worldGraphics.fillRect(pixelX + 2, pixelY + 2, size - 4, 2);
        this.worldGraphics.fillRect(pixelX + 4, pixelY + 8, size - 8, 2);
        break;

      case TileType.GRASS:
        // Add grass texture variation
        const grassVariant = (x + y) % 3;
        if (grassVariant === 0) {
          this.worldGraphics.fillStyle(0x5BA052, 0.4);
          this.worldGraphics.fillRect(pixelX + 1, pixelY + 12, 3, 2);
          this.worldGraphics.fillRect(pixelX + 8, pixelY + 10, 2, 3);
        }
        break;

      case TileType.CHEST:
        // Enhanced chest with highlight
        this.worldGraphics.fillStyle(0xFFD700, 0.8);
        this.worldGraphics.fillRect(pixelX + quarterSize, pixelY + quarterSize, halfSize, halfSize);
        this.worldGraphics.fillStyle(0xFFFFAA);
        this.worldGraphics.fillRect(pixelX + quarterSize + 2, pixelY + quarterSize + 2, 4, 2);
        break;

      case TileType.FLOWER:
        // Multi-colored flower
        const flowerHue = ((x * 7 + y * 13) % 6);
        const flowerColors = [0xFF69B4, 0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A, 0x98D8C8];
        this.worldGraphics.fillStyle(flowerColors[flowerHue]);
        this.worldGraphics.fillCircle(pixelX + halfSize, pixelY + halfSize, 3);
        break;

      case TileType.TORCH:
        // Animated torch flame effect
        this.worldGraphics.fillStyle(0xFF6B47);
        this.worldGraphics.fillRect(pixelX + 6, pixelY + 2, 4, 8);
        this.worldGraphics.fillStyle(0xFFD700, 0.7);
        this.worldGraphics.fillRect(pixelX + 7, pixelY + 3, 2, 4);
        break;

      case TileType.BUSH:
        // Layered bush with depth
        this.worldGraphics.fillStyle(0x2D5B2D, 0.8);
        this.worldGraphics.fillCircle(pixelX + halfSize, pixelY + halfSize + 2, 6);
        this.worldGraphics.fillStyle(0x4A8B3B, 0.6);
        this.worldGraphics.fillCircle(pixelX + halfSize - 2, pixelY + halfSize, 4);
        break;

      case TileType.ROCK:
        // Multi-tone rock
        this.worldGraphics.fillStyle(0x555555);
        this.worldGraphics.fillRect(pixelX + 2, pixelY + 4, 12, 10);
        this.worldGraphics.fillStyle(0x777777);
        this.worldGraphics.fillRect(pixelX + 3, pixelY + 5, 6, 6);
        break;
    }
  }

  private getTileColor(tileType: TileType): number {
    // Use enhanced 16-bit color palette
    switch (tileType) {
      // Base terrain - rich, vibrant colors
      case TileType.GRASS: return 0x4A8B3B;
      case TileType.WATER: return 0x1E5BB8;
      case TileType.FOREST: return 0x2D5B2D;
      case TileType.MOUNTAIN: return 0x6B5B73;
      case TileType.DESERT: return 0xE6C679;
      case TileType.SNOW: return 0xE8F4F8;
      case TileType.MARSH: return 0x5A7C47;
      case TileType.VOLCANIC: return 0x8B2635;
      
      // Structures - earth tones
      case TileType.WALL: return 0x4A4A52;
      case TileType.DOOR: return 0x8B5A2B;
      case TileType.BRIDGE: return 0xA67C52;
      case TileType.PATH: return 0xB8A082;
      case TileType.HOUSE: return 0x7C5A3A;
      case TileType.SHRINE: return 0x6B4A8B;
      
      // Interactive objects
      case TileType.CHEST: return 0xD49C3D;
      case TileType.FLOWER: return 0xE84A5F;
      
      // Enhanced environmental details
      case TileType.BUSH: return 0x3A6B2D;
      case TileType.ROCK: return 0x7A7A82;
      case TileType.TREE: return 0x2D3D2D;
      case TileType.TALL_GRASS: return 0x5BA052;
      case TileType.MUSHROOM: return 0xB85A3A;
      case TileType.POND: return 0x4A8BCA;
      case TileType.STONE_WALL: return 0x5A5A63;
      case TileType.WOODEN_FENCE: return 0x9C6B39;
      case TileType.DIRT_PATH: return 0xA68B6B;
      case TileType.COBBLESTONE: return 0x6B6B73;
      
      // Decorative elements
      case TileType.STATUE: return 0x7A7A8B;
      case TileType.FOUNTAIN: return 0x5A8BCA;
      case TileType.WELL: return 0x5A5A63;
      case TileType.SIGN: return 0x8B6B3A;
      case TileType.TORCH: return 0xD49C3D;
      case TileType.LANTERN: return 0xE6B55C;
      
      // Ground variations
      case TileType.GRASS_DARK: return 0x3A6B2D;
      case TileType.GRASS_LIGHT: return 0x6BAD5A;
      case TileType.DIRT: return 0x8B6B4A;
      case TileType.SAND: return 0xE6C679;
      case TileType.STONE: return 0x6B6B73;
      
      // Water variations
      case TileType.WATER_DEEP: return 0x1A4A9C;
      case TileType.WATER_SHALLOW: return 0x4A7BCA;
      case TileType.WATERFALL: return 0x7ABFFF;
      
      default: return 0x4A8B3B;
    }
  }

  private addTownLabels(): void {
    Object.values(TOWNS).forEach(town => {
      const townLabel = this.add.text(
        town.x * TILE_SIZE,
        (town.y - 3) * TILE_SIZE,
        town.name,
        {
          fontSize: '12px',
          color: '#ffffff',
          fontFamily: 'monospace',
          stroke: '#000000',
          strokeThickness: 2
        }
      ).setOrigin(0.5);
      this.foregroundLayer.add(townLabel);
    });
  }

  private createPlayer(): void {
    // Create player entity using ECS - spawn at center of Hearthmere town
    // Offset by half a tile to center player in tile and avoid collision issues
    const startPosition = {
      x: TOWNS.HEARTHMERE.x * TILE_SIZE + (TILE_SIZE / 2),
      y: TOWNS.HEARTHMERE.y * TILE_SIZE + (TILE_SIZE / 2)
    };
    
    // Verify spawn position is safe (should be on a PATH tile in our new town layout)
    const tileX = Math.floor(startPosition.x / TILE_SIZE);
    const tileY = Math.floor(startPosition.y / TILE_SIZE);
    console.log(`Player spawning at tile (${tileX}, ${tileY}), pixel position (${startPosition.x}, ${startPosition.y})`);

    const playerEntity = EntityBuilder.create(this.ecsWorld)
      .with({
        type: 'transform',
        entityId: '',
        position: startPosition,
        rotation: 0,
        scale: { x: 1, y: 1 }
      })
      .with({
        type: 'sprite',
        entityId: '',
        texture: 'player',
        frame: 0,
        tint: 0xffffff,
        alpha: 1
      })
      .with({
        type: 'movement',
        entityId: '',
        velocity: { x: 0, y: 0 },
        speed: 80,
        direction: 'down'
      })
      .with({
        type: 'collider',
        entityId: '',
        bounds: { x: 0, y: 0, width: 12, height: 12 },
        solid: true,
        trigger: false
      })
      .with({
        type: 'health',
        entityId: '',
        current: 6,
        maximum: 6,
        invulnerable: false,
        invulnerabilityTimer: 0
      })
      .with({
        type: 'player',
        entityId: '',
        stamina: 100,
        maxStamina: 100,
        gleam: 0,
        hearts: 3,
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
      })
      .build();

    this.playerEntity = playerEntity.id;

    // Emit player creation event
    gameEvents.emit({
      type: 'player.moved',
      payload: {
        position: startPosition,
        direction: 'down'
      },
      timestamp: Date.now()
    });
  }

  private createNPCs(): void {
    // Create Keeper Elowen strategically positioned near the shrine for easy discovery
    const elowenPosition = {
      x: (TOWNS.HEARTHMERE.x + 2) * TILE_SIZE + 4, // Next to the shrine, slightly offset
      y: (TOWNS.HEARTHMERE.y - 1) * TILE_SIZE + 4  // Positioned for tutorial flow
    };

    EntityBuilder.create(this.ecsWorld)
      .with({
        type: 'transform',
        entityId: '',
        position: elowenPosition,
        rotation: 0,
        scale: { x: 1, y: 1 }
      })
      .with({
        type: 'sprite',
        entityId: '',
        texture: 'npc',
        frame: 0,
        tint: 0x9C27B0, // Purple color for keeper
        alpha: 1
      })
      .with({
        type: 'collider',
        entityId: '',
        bounds: { x: 0, y: 0, width: 12, height: 12 },
        solid: true,
        trigger: false
      })
      .with({
        type: 'npc',
        entityId: '',
        name: 'Keeper Elowen',
        dialogue: [
          "Welcome to Hearthmere, brave traveler! I am Keeper Elowen.",
          "Use WASD or arrow keys to move around. Try walking to me!",
          "Press SPACE or ENTER to interact with people and objects.",
          "This realm has two faces - press E to glimpse the Eclipse!",
          "The Aether Mirror will let you walk between worlds safely.",
          "Explore beyond our town, but return when you need guidance.",
          "May your journey through Aeria bring you great discovery!"
        ],
        currentDialogue: 0,
        questGiver: true,
        shopkeeper: false,
        interactable: true
      })
      .build();

    console.log(`Created tutorial NPC Keeper Elowen at position (${elowenPosition.x}, ${elowenPosition.y})`);
    
    // Add some test items near the player for visual effects demonstration
    this.createTestItems();
  }

  private createTestItems(): void {
    // Get inventory system to add test pickups
    const inventorySystem = this.ecsWorld.getSystems().find(s => s.constructor.name === 'InventorySystem') as any;
    
    if (inventorySystem) {
      // Add test items around the starting area for effect demonstration
      const startX = TOWNS.HEARTHMERE.x * TILE_SIZE;
      const startY = TOWNS.HEARTHMERE.y * TILE_SIZE;
      
      // Heart piece (shows pink sparkles)
      inventorySystem.addItemPickup('demo_heart', {
        id: 'demo_heart',
        itemType: 'heart_pieces',
        position: { x: startX + TILE_SIZE * 3, y: startY + TILE_SIZE * 2 },
        value: 1
      });
      
      // Aether shard (shows golden sparkles)
      inventorySystem.addItemPickup('demo_shard', {
        id: 'demo_shard',
        itemType: 'aether_shards',
        position: { x: startX - TILE_SIZE * 2, y: startY + TILE_SIZE },
        value: 1
      });
      
      // Currency/rupee (shows green sparkles)
      inventorySystem.addItemPickup('demo_currency', {
        id: 'demo_currency',
        itemType: 'aether_shards', // Using this as currency for now
        position: { x: startX + TILE_SIZE, y: startY + TILE_SIZE * 3 },
        value: 5
      });
      
      console.log('✨ Created test items around spawn area for visual effects demonstration');
      console.log('💖 Heart piece: East of spawn (pink sparkles when collected)');
      console.log('💎 Aether shard: West of spawn (golden sparkles when collected)');
      console.log('💰 Currency pile: South of spawn (green sparkles when collected)');
    }
  }

  private setupCamera(): void {
    // Camera bounds are set in createWorld() method
    // Camera will follow player - this will be handled by the render system
    this.cameras.main.setRoundPixels(true); // Pixel-perfect rendering
    
    // Set camera to start at player position
    const startPosition = {
      x: TOWNS.HEARTHMERE.x * TILE_SIZE,
      y: TOWNS.HEARTHMERE.y * TILE_SIZE
    };
    this.cameras.main.centerOn(startPosition.x, startPosition.y);
  }

  private setupInput(): void {
    // Input is handled by the InputSystem, but we can set up scene-level shortcuts
    this.input.keyboard?.on('keydown-ESC', () => {
      gameEvents.emit({
        type: 'game.paused',
        payload: { paused: true },
        timestamp: Date.now()
      });
    });

    this.input.keyboard?.on('keydown-I', () => {
      gameEvents.emit({
        type: 'ui.inventory.toggle',
        payload: { open: true },
        timestamp: Date.now()
      });
    });

    // Eclipse/Dayrealm realm switching
    this.input.keyboard?.on('keydown-E', () => {
      this.toggleRealm();
    });

    // Test audio (T key)
    this.input.keyboard?.on('keydown-T', () => {
      console.log('Testing audio...');
      this.playTestAudio();
    });

    // Generate audio files (G key)
    this.input.keyboard?.on('keydown-G', async () => {
      console.log('🎼 Generating audio files...');
      try {
        if (this.audioContext) {
          const { AudioFileWriter } = await import('../utils/audioFileWriter.js');
          const writer = new AudioFileWriter(this.audioContext);
          await writer.generateAllAudioFiles();
          console.log('✅ Audio files generated! Press R to reload and hear music.');
        } else {
          console.warn('❌ Audio context not available');
        }
      } catch (error) {
        console.error('❌ Failed to generate audio:', error);
      }
    });

    // Debug: Direct movement test keys
    this.input.keyboard?.on('keydown-UP', () => {
      console.log('UP arrow pressed directly!');
      this.testManualMovement(0, -20);
    });
    
    this.input.keyboard?.on('keydown-W', () => {
      console.log('W key pressed directly!');
      this.testManualMovement(0, -20);
    });

    // Debug: Force velocity test (M key)
    this.input.keyboard?.on('keydown-M', () => {
      console.log('M key pressed - forcing velocity test!');
      this.testForceVelocity();
    });
    
    // Debug: Toggle collision debug info (C key)
    this.input.keyboard?.on('keydown-C', () => {
      this.toggleCollisionDebug();
    });

    // Set up inventory event handlers
    this.setupInventoryEvents();
    
    // Set up combat controls
    this.setupCombatControls();
    
    // Set up weather controls
    this.setupWeatherControls();
  }

  private setupInventoryEvents(): void {
    // Handle inventory item collection feedback
    gameEvents.on('inventory.item.collected', (event: any) => {
      console.log(`Item collected: ${event.payload.itemType}`);
      // Could play collection sound effect here
      this.playTestAudio();
    });

    // Handle inventory item usage
    gameEvents.on('inventory.item.used', (event: any) => {
      console.log(`Item used: ${event.payload.itemType}`);
    });

    // Handle realm switching from aether mirror
    gameEvents.on('world.realm.switch', () => {
      this.toggleRealm();
    });

    // Handle lighting effects from sunflame lantern
    gameEvents.on('world.light.toggle', (_event: any) => {
      console.log('Sunflame lantern activated!');
      // Could implement lighting effects here
    });

    // Handle player speed boost from gale boots
    gameEvents.on('player.speed.boost', (event: any) => {
      const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'movement');
      if (playerEntities.length > 0) {
        const movementComponent = playerEntities[0].components.get('movement') as any;
        if (movementComponent && typeof movementComponent.speed === 'number') {
          const originalSpeed = movementComponent.speed;
          movementComponent.speed *= event.payload.multiplier;
          
          // Reset speed after duration
          setTimeout(() => {
            movementComponent.speed = originalSpeed;
            console.log('Speed boost ended');
          }, event.payload.duration);
          
          console.log(`Speed boost activated! ${event.payload.multiplier}x for ${event.payload.duration}ms`);
        }
      }
    });
  }

  private setupCombatControls(): void {
    // Sword attack with X key
    this.input.keyboard?.on('keydown-X', () => {
      const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'transform', 'movement');
      if (playerEntities.length > 0) {
        const playerId = playerEntities[0].id;
        
        // Emit combat attack event
        gameEvents.emit({
          type: 'combat.attack',
          payload: {
            attackerId: playerId,
            weaponType: 'sword'
          },
          timestamp: Date.now()
        });
        
        console.log('Player attacks with sword!');
      }
    });
    
    // Magic attack with Z key (if player has magic abilities)
    this.input.keyboard?.on('keydown-Z', () => {
      const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'transform', 'movement');
      if (playerEntities.length > 0) {
        const playerId = playerEntities[0].id;
        const playerComponent = playerEntities[0].components.get('player') as any;
        
        // Check if player has magic abilities (for now, just allow it)
        if (playerComponent) {
          gameEvents.emit({
            type: 'combat.attack',
            payload: {
              attackerId: playerId,
              weaponType: 'magic_blast'
            },
            timestamp: Date.now()
          });
          
          console.log('Player casts magic blast!');
        }
      }
    });
    
    // Test damage (for demonstration)
    this.input.keyboard?.on('keydown-H', () => {
      const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'health');
      if (playerEntities.length > 0) {
        const playerId = playerEntities[0].id;
        
        gameEvents.emit({
          type: 'combat.damage',
          payload: {
            targetId: playerId,
            damage: 1,
            source: 'test'
          },
          timestamp: Date.now()
        });
        
        console.log('Player takes test damage!');
      }
    });

    console.log('Combat controls: X = Sword Attack, Z = Magic Attack, H = Test Damage');
  }

  private setupWeatherControls(): void {
    // Weather control keys (1-5)
    this.input.keyboard?.on('keydown-ONE', () => {
      this.weatherSystem.setWeather(WeatherType.CLEAR);
      console.log('Weather: Clear skies');
    });

    this.input.keyboard?.on('keydown-TWO', () => {
      this.weatherSystem.setWeather(WeatherType.RAIN);
      console.log('Weather: Rain started');
    });

    this.input.keyboard?.on('keydown-THREE', () => {
      this.weatherSystem.setWeather(WeatherType.SNOW);
      console.log('Weather: Snow started');
    });

    this.input.keyboard?.on('keydown-FOUR', () => {
      this.weatherSystem.setWeather(WeatherType.FOG);
      console.log('Weather: Fog rolled in');
    });

    this.input.keyboard?.on('keydown-FIVE', () => {
      this.weatherSystem.setWeather(WeatherType.STORM);
      console.log('Weather: Storm approaching!');
    });

    // Toggle auto weather (6 key)
    this.input.keyboard?.on('keydown-SIX', () => {
      const currentAuto = this.weatherSystem.isAutoWeatherEnabled();
      this.weatherSystem.setAutoWeather(!currentAuto);
      console.log(`Auto weather: ${!currentAuto ? 'ENABLED' : 'DISABLED'}`);
    });

    console.log('Weather controls: 1=Clear, 2=Rain, 3=Snow, 4=Fog, 5=Storm, 6=Auto');
  }

  private async initializeAudio(): Promise<void> {
    try {
      console.log('Initializing audio system...');
      
      // Initialize audio context
      const audioContext = await AudioUtils.initializeAudioContext();
      if (!audioContext) {
        console.log('Audio not available - continuing in silent mode');
        return;
      }
      
      // Store audio context globally for testing
      (window as any).audioContext = audioContext;
      
      // Generate audio files if they don't exist
      console.log('🎵 Checking for generated audio...');
      if (!(window as any).generatedAudioFiles) {
        console.log('🎼 No generated audio found - creating audio files...');
        try {
          // Import and run audio generation
          const { AudioFileWriter } = await import('../utils/audioFileWriter.js');
          const writer = new AudioFileWriter(audioContext);
          await writer.generateAllAudioFiles();
          console.log('✅ Audio generation complete!');
        } catch (error) {
          console.warn('⚠️ Audio generation failed, using test audio only:', error);
        }
      } else {
        console.log('✅ Generated audio files found and ready!');
      }
      
      // Check if audio files exist
      const musicFiles = [
        '/assets/audio/music/hearthmere.ogg',
        '/assets/audio/music/hearthmere.m4a'
      ];
      
      const hasAudioFiles = await AudioUtils.checkMultipleAudioFiles(musicFiles);
      
      if (hasAudioFiles) {
        console.log('Audio files found - loading background music');
        await audioManager.loadRegionMusic('hearthmere');
        audioManager.playMusic('bgm_hearthmere');
      } else {
        console.log('Audio files not present - using test audio only');
        // Play a brief welcome tone after a delay (after user interaction)
        setTimeout(async () => {
          try {
            await AudioUtils.createTestTone(440, 0.15, 0.02);
            console.log('Audio system ready - press T to test or E to hear realm switching');
          } catch (error) {
            console.log('Audio context not activated yet - click game to enable audio');
          }
        }, 1000);
      }
      
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      console.log('Audio system will continue in silent mode');
    }
  }

  private async playTestAudio(): Promise<void> {
    try {
      await AudioUtils.createTestTone(440, 0.3, 0.05);
      console.log('Played test audio tone - audio system is working!');
    } catch (error) {
      console.warn('Could not play test audio:', error);
      console.log('Click anywhere on the game to activate audio context');
    }
  }

  private startSystems(): void {
    // Systems are already added to ECS world and will update automatically
    console.log('World Scene: All systems started');
    
    // Provide world data to movement system for collision detection
    this.updateMovementSystemWorldData();
    
    // Emit world ready event
    gameEvents.emit({
      type: 'world.map.loaded',
      payload: {
        mapId: this.currentMap,
        mapName: 'Hearthmere'
      },
      timestamp: Date.now()
    });
  }
  
  private updateMovementSystemWorldData(): void {
    // Send world tile data to the movement system for collision detection
    gameEvents.emit({
      type: 'movement.worldData.update',
      payload: {
        worldTiles: this.worldTiles,
        realm: this.currentRealm
      },
      timestamp: Date.now()
    });
    
    console.log('WorldScene: Updated MovementSystem with world data (', this.worldTiles.length, 'x', this.worldTiles[0]?.length, 'tiles )');
  }

  private initializeWeatherSystem(): void {
    console.log('Initializing weather system with atmospheric effects...');
    
    // Create the weather system
    this.weatherSystem = new WeatherSystem(this);
    
    // Set up initial weather (clear by default, but can be changed)
    // Uncomment to start with rain for demonstration:
    // this.weatherSystem.setWeather(WeatherType.RAIN);
    
    // Enable auto weather changes (optional)
    // this.weatherSystem.setAutoWeather(true);
    
    console.log('Weather system initialized - press 1-5 to change weather');
  }

  // Public API for other systems
  getECSWorld(): World {
    return this.ecsWorld;
  }

  getPlayerEntity(): string {
    return this.playerEntity;
  }

  // Expose the world and systems for testing
  get world(): World {
    return this.ecsWorld;
  }

  get inputSystem() {
    return this.ecsWorld.getSystems().find(s => s.constructor.name === 'InputSystem');
  }

  get movementSystem() {
    return this.ecsWorld.getSystems().find(s => s.constructor.name === 'MovementSystem');
  }

  getBackgroundLayer(): Phaser.GameObjects.Group {
    return this.backgroundLayer;
  }

  getEntityLayer(): Phaser.GameObjects.Group {
    return this.entityLayer;
  }

  getForegroundLayer(): Phaser.GameObjects.Group {
    return this.foregroundLayer;
  }

  getUILayer(): Phaser.GameObjects.Group {
    return this.uiLayer;
  }

  private initializeVisualEffects(): void {
    console.log('Initializing ALTTP-style visual effects system...');
    
    // Create the visual effects system
    this.visualEffects = new VisualEffectsSystem(this);
    
    // Set up environmental effects for existing tiles
    this.setupEnvironmentalEffects();
    
    console.log('Visual effects system initialized with particle pooling and transitions');
  }

  private setupEnvironmentalEffects(): void {
    // Add torch flame effects to existing torch tiles
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const tile = this.worldTiles[y][x];
        
        if (tile.tileType === TileType.TORCH) {
          // Create continuous torch flame effect
          const pixelX = x * TILE_SIZE + TILE_SIZE / 2;
          const pixelY = y * TILE_SIZE + TILE_SIZE / 2;
          
          // Set up interval for torch flames
          setInterval(() => {
            if (this.visualEffects) {
              this.visualEffects.createTorchFlame(pixelX, pixelY - 6);
            }
          }, 150 + Math.random() * 100);
        }
        
        if (tile.tileType === TileType.WATER || tile.tileType === TileType.WATER_DEEP) {
          // Set up water sparkle effects
          const pixelX = x * TILE_SIZE;
          const pixelY = y * TILE_SIZE;
          
          // Check for water sparkles occasionally
          setInterval(() => {
            if (this.visualEffects) {
              this.visualEffects.createWaterSparkles(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            }
          }, 2000 + Math.random() * 3000);
        }
      }
    }
  }

  // Eclipse/Dayrealm realm switching
  private toggleRealm(): void {
    // TODO: Check if player has Aether Mirror (for now, just allow switching)
    const previousRealm = this.currentRealm;
    const targetRealm = this.currentRealm === 'dayrealm' ? 'eclipse' : 'dayrealm';
    
    // Emit realm switch start event
    gameEvents.emit({
      type: 'world/realmSwitchStart',
      payload: {
        fromRealm: previousRealm,
        toRealm: targetRealm
      },
      timestamp: Date.now()
    });
    
    // Use visual effects system for realm switching
    this.visualEffects.playRealmSwitchEffect(previousRealm, targetRealm);
    
    // Add audio feedback
    this.playRealmSwitchSound(targetRealm).catch(console.warn);
    
    this.currentRealm = targetRealm;
    
    console.log(`Realm switched from ${previousRealm} to ${this.currentRealm}`);
    
    // Re-render the world with new realm tiles
    this.renderWorldTiles();
    
    // Update town labels for new realm
    this.updateTownLabelsForRealm();
    
    // Update movement system with new realm data for collision detection
    this.updateMovementSystemWorldData();
    
    // Emit realm switched completion event
    gameEvents.emit({
      type: 'world/realmSwitched',
      payload: {
        previousRealm,
        currentRealm: this.currentRealm,
        transitionType: 'flash'
      },
      timestamp: Date.now()
    });
  }

  private updateTownLabelsForRealm(): void {
    // Update town label colors based on current realm
    const labelColor = this.currentRealm === 'eclipse' ? '#9C27B0' : '#ffffff';
    const strokeColor = this.currentRealm === 'eclipse' ? '#4A148C' : '#000000';
    
    // Find and update existing town labels (simplified approach)
    this.foregroundLayer.getChildren().forEach(child => {
      if (child instanceof Phaser.GameObjects.Text) {
        child.setColor(labelColor);
        child.setStroke(strokeColor, 2);
      }
    });
  }

  getCurrentRealm(): 'dayrealm' | 'eclipse' {
    return this.currentRealm;
  }

  private async playRealmSwitchSound(targetRealm: 'dayrealm' | 'eclipse'): Promise<void> {
    try {
      // Try to play realm switch sound effect from files first
      if (targetRealm === 'eclipse') {
        audioManager.playSfx('sfx_realm_eclipse', { pitchVariation: 50 });
      } else {
        audioManager.playSfx('sfx_realm_dayrealm', { pitchVariation: 30 });
      }
    } catch (error) {
      // Fallback to test tone if audio files don't exist
      try {
        const tones = AudioUtils.getAudioRealmTones();
        const tone = tones[targetRealm];
        await AudioUtils.createTestTone(tone.frequency, tone.duration, tone.volume);
        console.log(`Played ${targetRealm} realm switch tone`);
      } catch (audioError) {
        console.log('Audio context not ready - click game to enable audio');
      }
    }
  }

  // Debug method to test manual movement
  private testManualMovement(deltaX: number, deltaY: number): void {
    const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'transform');
    if (playerEntities.length > 0) {
      const playerEntity = playerEntities[0];
      const transform = playerEntity.components.get('transform') as any;
      if (transform && transform.position) {
        const oldPos = { ...transform.position };
        transform.position.x += deltaX;
        transform.position.y += deltaY;
        console.log(`Manual movement test: ${oldPos.x},${oldPos.y} -> ${transform.position.x},${transform.position.y}`);
      }
    }
  }

  // Debug method to test velocity application
  private testForceVelocity(): void {
    const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'movement', 'transform');
    if (playerEntities.length > 0) {
      const playerEntity = playerEntities[0];
      const movement = playerEntity.components.get('movement') as any;
      const transform = playerEntity.components.get('transform') as any;
      
      if (movement && transform) {
        console.log('Before velocity test:', {
          position: { ...transform.position },
          velocity: { ...movement.velocity },
          speed: movement.speed
        });
        
        // Set a test velocity
        movement.velocity.x = 0;
        movement.velocity.y = -100; // Move up at 100 pixels/second
        
        console.log('Forced velocity set to:', movement.velocity);
        console.log('Next frame should show movement...');
      }
    }
  }

  // Debug collision info toggle
  private toggleCollisionDebug(): void {
    // Since DEBUG is readonly, we'll create a runtime flag
    const movementSystem = this.ecsWorld.getSystems().find(s => s.constructor.name === 'MovementSystem') as any;
    if (movementSystem) {
      const currentDebugState = (movementSystem as any).debugTileCollision || false;
      (movementSystem as any).debugTileCollision = !currentDebugState;
      console.log('Tile collision debug mode:', !currentDebugState ? 'ON' : 'OFF');
      
      if (!currentDebugState) {
        console.log('Controls: WASD/Arrow keys to move, C to toggle collision debug, E to switch realms');
        console.log('Debug info will show when player hits walls or interactive tiles');
      }
    }
  }
  
  // Get current tile info at player position (for debugging)
  private getPlayerTileInfo(): void {
    const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'transform', 'collider');
    if (playerEntities.length > 0) {
      const playerEntity = playerEntities[0];
      const transform = playerEntity.components.get('transform') as any;
      const collider = playerEntity.components.get('collider') as any;
      
      if (transform && collider) {
        const movementSystem = this.ecsWorld.getSystems().find(s => s.constructor.name === 'MovementSystem') as any;
        if (movementSystem && movementSystem.getTileAtPosition) {
          const tileInfo = movementSystem.getTileAtPosition(transform.position.x, transform.position.y);
          console.log('Player tile info:', {
            position: transform.position,
            tileInfo,
            realm: this.currentRealm
          });
        }
      }
    }
  }

  // Log player starting area for testing
  private logPlayerStartingArea(): void {
    const playerEntities = this.ecsWorld.getEntitiesWithComponents('player', 'transform');
    if (playerEntities.length > 0) {
      const playerEntity = playerEntities[0];
      const transform = playerEntity.components.get('transform') as any;
      
      if (transform) {
        const tileX = Math.floor(transform.position.x / TILE_SIZE);
        const tileY = Math.floor(transform.position.y / TILE_SIZE);
        
        console.log(`🎯 Player starts at tile (${tileX}, ${tileY}), pixel (${transform.position.x}, ${transform.position.y})`);
        console.log('📍 Nearby tiles for testing:');
        
        // Log nearby tiles in a 5x5 area
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const checkX = tileX + dx;
            const checkY = tileY + dy;
            
            if (checkY >= 0 && checkY < this.worldTiles.length &&
                checkX >= 0 && checkX < this.worldTiles[0].length) {
              const tile = this.worldTiles[checkY][checkX];
              const tileNames: Record<number, string> = {
                [0]: 'GRASS', [1]: 'WATER', [2]: 'FOREST', [3]: 'MOUNTAIN',
                [4]: 'DESERT', [5]: 'SNOW', [6]: 'MARSH', [7]: 'VOLCANIC',
                [8]: 'WALL', [9]: 'DOOR', [10]: 'BRIDGE', [11]: 'PATH',
                [12]: 'HOUSE', [13]: 'SHRINE', [14]: 'CHEST', [15]: 'FLOWER'
              };
              
              const tileName = tileNames[tile.tileType] || 'UNKNOWN';
              const walkable = tile.walkable ? '✅' : '❌';
              
              if (dx === 0 && dy === 0) {
                console.log(`  [${checkX}, ${checkY}] ${tileName} ${walkable} <- PLAYER HERE`);
              } else if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
                console.log(`  [${checkX}, ${checkY}] ${tileName} ${walkable}`);
              }
            }
          }
        }
      }
    }
  }

  // Tutorial sequence for new players
  private startTutorialSequence(): void {
    // Welcome message
    setTimeout(() => {
      console.log('🌟 WELCOME TO ECHOES OF AERIA! 🌟');
      console.log('You have arrived in the peaceful town of Hearthmere.');
      console.log('');
      
      // Show initial tutorial message as a system notification
      gameEvents.emit({
        type: 'ui/tutorial.message',
        payload: {
          title: 'Welcome to Hearthmere!',
          message: 'You have arrived in the peaceful starting town.',
          duration: 3000
        },
        timestamp: Date.now()
      });
    }, TUTORIAL.WELCOME_MESSAGE_DELAY);

    // Movement controls
    setTimeout(() => {
      console.log('🎮 MOVEMENT CONTROLS:');
      console.log('• Use WASD keys or Arrow Keys to move around');
      console.log('• Try moving in all directions to explore the town');
      console.log('');
      
      gameEvents.emit({
        type: 'ui/tutorial.message',
        payload: {
          title: 'Learn to Move',
          message: 'Use WASD or Arrow Keys to move around town',
          duration: 4000
        },
        timestamp: Date.now()
      });
    }, TUTORIAL.CONTROL_HINT_DELAY);

    // NPC interaction
    setTimeout(() => {
      console.log('👥 INTERACTION SYSTEM:');
      console.log('• Look for Keeper Elowen (purple figure near the shrine)');
      console.log('• Walk close to NPCs to see interaction prompts');
      console.log('• Press SPACE or ENTER to talk to people');
      console.log('');
      
      gameEvents.emit({
        type: 'ui/tutorial.message',
        payload: {
          title: 'Talk to Keeper Elowen',
          message: 'Find the purple NPC near the shrine and press SPACE to talk',
          duration: 5000
        },
        timestamp: Date.now()
      });
    }, TUTORIAL.NPC_HINT_DELAY);

    // Realm switching
    setTimeout(() => {
      console.log('🌓 REALM MECHANICS:');
      console.log('• Press E to switch between Dayrealm and Eclipse');
      console.log('• Each realm has different terrain and paths');
      console.log('• Explore both realms to discover all secrets!');
      console.log('');
      
      gameEvents.emit({
        type: 'ui/tutorial.message',
        payload: {
          title: 'Try Realm Switching',
          message: 'Press E to see the Eclipse realm transformation',
          duration: 4000
        },
        timestamp: Date.now()
      });
    }, TUTORIAL.REALM_SWITCH_HINT_DELAY);

    // Final exploration message
    setTimeout(() => {
      console.log('⭐ READY TO EXPLORE:');
      console.log('• Chest: Check the chest south of town center');
      console.log('• Paths: Follow paths to explore beyond Hearthmere');
      console.log('• Combat: Press X to attack with sword, Z for magic blast');
      console.log('• Effects: Watch for sparkles, screen shake, and particles!');
      console.log('• Weather: Press 1-5 to change weather, 6 for auto mode');
      console.log('• Debug: Press C for collision debug info');
      console.log('• Audio: Press T to test audio system');
      console.log('');
      console.log('🚀 Your adventure in Aeria begins now!');
      
      gameEvents.emit({
        type: 'ui/tutorial.message',
        payload: {
          title: 'Adventure Awaits!',
          message: 'Explore the chest and paths. Your journey begins now!',
          duration: 5000
        },
        timestamp: Date.now()
      });
    }, TUTORIAL.REALM_SWITCH_HINT_DELAY + 5000);
  }

  // Cleanup when scene is shutdown
  shutdown(): void {
    if (this.ecsWorld) {
      this.ecsWorld.clear();
    }
    
    if (this.visualEffects) {
      this.visualEffects.destroy();
    }
    
    if (this.weatherSystem) {
      this.weatherSystem.destroy();
    }
    
    console.log('World Scene: Cleanup complete');
  }
}