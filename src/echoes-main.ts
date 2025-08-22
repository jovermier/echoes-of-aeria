import './style.css'

// Echoes of Aeria - Main Game File
// Based on the Game Design Document

// === CORE TYPES ===
type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'playing' | 'paused' | 'dialogue' | 'inventory' | 'menu';
type WorldState = 'dayrealm' | 'eclipse';

const TILE_SIZE = 16; // 16x16 tiles as specified in GDD
const VIEWPORT_WIDTH = 50;  // tiles visible horizontally
const VIEWPORT_HEIGHT = 37; // tiles visible vertically
const WORLD_WIDTH = 256;    // total world width in tiles
const WORLD_HEIGHT = 192;   // total world height in tiles

// === ENUMS ===
const Direction = {
  UP: 'up' as const,
  DOWN: 'down' as const,
  LEFT: 'left' as const,
  RIGHT: 'right' as const
} as const;

const GameState = {
  PLAYING: 'playing' as const,
  PAUSED: 'paused' as const,
  DIALOGUE: 'dialogue' as const,
  INVENTORY: 'inventory' as const,
  MENU: 'menu' as const
} as const;

const WorldState = {
  DAYREALM: 'dayrealm' as const,
  ECLIPSE: 'eclipse' as const
} as const;

// Tile types matching the regions from the map
enum TileType {
  GRASS = 0,
  WATER = 1,
  FOREST = 2,
  MOUNTAIN = 3,
  DESERT = 4,
  SNOW = 5,
  MARSH = 6,
  VOLCANIC = 7,
  WALL = 8,
  DOOR = 9,
  BRIDGE = 10,
  PATH = 11,
  HOUSE = 12,
  SHRINE = 13,
  CHEST = 14,
  FLOWER = 15
}

// === INTERFACES ===
interface Vector2 {
  x: number;
  y: number;
}

interface Entity {
  position: Vector2;
  size: Vector2;
  direction: Direction;
  speed: number;
  sprite: string;
}

interface Player extends Entity {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  hearts: number;
  gleam: number; // currency
  inventory: PlayerInventory;
  animationFrame: number;
  animationTimer: number;
  attacking: boolean;
  attackTimer: number;
  lastAttackTime: number;
  invulnerable: boolean;
  invulnerableTimer: number;
}

interface PlayerInventory {
  // Core progression items from GDD
  sunflame_lantern: boolean;
  gale_boots: boolean;
  riverfin_vest: boolean;
  aether_mirror: boolean;
  storm_disk: boolean;
  quake_maul: boolean;
  tide_hook: boolean;
  sunflame_prism: boolean;
  kingsbane_sigil: boolean;
  
  // Collectibles
  aether_shards: number;
  keys: { [key: string]: number };
  heart_pieces: number;
  rumor_cards: number;
}

interface Enemy extends Entity {
  health: number;
  maxHealth: number;
  attackDamage: number;
  attackRange: number;
  detectionRange: number;
  enemyType: string;
  aiState: 'idle' | 'patrol' | 'chase' | 'attack' | 'retreat';
  animationFrame: number;
  animationTimer: number;
  attacking: boolean;
  attackTimer: number;
  lastAttackTime: number;
}

interface NPC extends Entity {
  name: string;
  dialogue: string[];
  currentDialogue: number;
  questGiver: boolean;
  shopkeeper: boolean;
  interactable: boolean;
}

interface Region {
  name: string;
  bounds: { x1: number, y1: number, x2: number, y2: number };
  primaryTile: TileType;
  enemies: string[];
  music?: string;
}

// === WORLD REGIONS (from GDD) ===
const REGIONS: Region[] = [
  {
    name: "Verdant Lowlands",
    bounds: { x1: 60, y1: 90, x2: 120, y2: 140 },
    primaryTile: TileType.GRASS,
    enemies: ['sprig_stalker']
  },
  {
    name: "Riverlands & Waterworks", 
    bounds: { x1: 120, y1: 80, x2: 200, y2: 130 },
    primaryTile: TileType.WATER,
    enemies: ['mud_whelp', 'bog_serpent']
  },
  {
    name: "Moonwell Marsh",
    bounds: { x1: 100, y1: 130, x2: 160, y2: 180 },
    primaryTile: TileType.MARSH,
    enemies: ['bog_serpent', 'wisp_cluster']
  },
  {
    name: "Amber Dunes & Canyon",
    bounds: { x1: 30, y1: 140, x2: 100, y2: 192 },
    primaryTile: TileType.DESERT,
    enemies: ['sand_wraith', 'bandit_scrapper']
  },
  {
    name: "Whisperwood",
    bounds: { x1: 20, y1: 40, x2: 80, y2: 100 },
    primaryTile: TileType.FOREST,
    enemies: ['thorn_wolf', 'sprig_stalker']
  },
  {
    name: "Frostpeak Tundra",
    bounds: { x1: 140, y1: 20, x2: 220, y2: 80 },
    primaryTile: TileType.SNOW,
    enemies: ['wisp_cluster', 'stone_sentinel']
  },
  {
    name: "Obsidian Crater",
    bounds: { x1: 200, y1: 120, x2: 256, y2: 180 },
    primaryTile: TileType.VOLCANIC,
    enemies: ['rift_mote', 'stone_sentinel']
  },
  {
    name: "Eldercrown Keep",
    bounds: { x1: 110, y1: 30, x2: 150, y2: 70 },
    primaryTile: TileType.WALL,
    enemies: ['stone_sentinel']
  }
];

// === TOWNS (from GDD) ===
const TOWNS = {
  HEARTHMERE: { x: 80, y: 110, name: "Hearthmere" },
  RIVERGATE: { x: 140, y: 100, name: "Rivergate" },
  DUSTFALL_OUTPOST: { x: 60, y: 160, name: "Dustfall Outpost" },
  STARFALL_MONASTERY: { x: 50, y: 70, name: "Starfall Monastery" }
};

// === GAME CLASS ===
class EchoesOfAeria {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private keys: { [key: string]: boolean } = {};
  private gameState: GameState = GameState.PLAYING;
  private worldState: WorldState = WorldState.DAYREALM;
  
  private world: number[][];
  private player!: Player;
  private enemies: Enemy[] = [];
  private npcs: NPC[] = [];
  private camera: { x: number, y: number } = { x: 0, y: 0 };
  
  private lastTime: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Set canvas size to show VIEWPORT_WIDTH x VIEWPORT_HEIGHT tiles
    this.canvas.width = VIEWPORT_WIDTH * TILE_SIZE;
    this.canvas.height = VIEWPORT_HEIGHT * TILE_SIZE;
    
    this.world = this.generateWorld();
    this.initPlayer();
    this.initNPCs();
    this.setupEventListeners();
    this.startGame();
  }

  generateWorld(): number[][] {
    const world: number[][] = [];
    
    // Initialize world with grass
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      world[y] = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        world[y][x] = TileType.GRASS;
      }
    }

    // Fill regions based on bounds
    REGIONS.forEach(region => {
      for (let y = region.bounds.y1; y < region.bounds.y2; y++) {
        for (let x = region.bounds.x1; x < region.bounds.x2; x++) {
          if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
            world[y][x] = region.primaryTile;
          }
        }
      }
    });

    // Add paths connecting regions
    this.addPaths(world);
    
    // Add towns
    Object.values(TOWNS).forEach(town => {
      if (town.x >= 0 && town.x < WORLD_WIDTH && town.y >= 0 && town.y < WORLD_HEIGHT) {
        world[town.y][town.x] = TileType.HOUSE;
        // Add some buildings around the town center
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = town.x + dx;
            const ny = town.y + dy;
            if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
              if (Math.abs(dx) + Math.abs(dy) <= 2 && Math.random() > 0.6) {
                world[ny][nx] = TileType.HOUSE;
              }
            }
          }
        }
      }
    });

    return world;
  }

  addPaths(world: number[][]) {
    // Connect towns with paths (simplified)
    const towns = Object.values(TOWNS);
    for (let i = 0; i < towns.length - 1; i++) {
      const from = towns[i];
      const to = towns[i + 1];
      this.createPath(world, from.x, from.y, to.x, to.y);
    }
  }

  createPath(world: number[][], x1: number, y1: number, x2: number, y2: number) {
    // Simple pathfinding - create straight lines
    const dx = Math.sign(x2 - x1);
    const dy = Math.sign(y2 - y1);
    
    let x = x1, y = y1;
    while (x !== x2 || y !== y2) {
      if (x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT) {
        world[y][x] = TileType.PATH;
      }
      
      if (x !== x2) x += dx;
      if (y !== y2) y += dy;
    }
  }

  initPlayer() {
    // Start player in Hearthmere
    const startTown = TOWNS.HEARTHMERE;
    
    this.player = {
      position: { x: startTown.x * TILE_SIZE, y: startTown.y * TILE_SIZE },
      size: { x: 12, y: 12 },
      direction: Direction.DOWN,
      speed: 80,
      sprite: 'player',
      health: 6, // 3 hearts * 2
      maxHealth: 6,
      stamina: 100,
      maxStamina: 100,
      hearts: 3,
      gleam: 0,
      inventory: {
        sunflame_lantern: true, // Player starts with lantern per GDD
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
      },
      animationFrame: 0,
      animationTimer: 0,
      attacking: false,
      attackTimer: 0,
      lastAttackTime: 0,
      invulnerable: false,
      invulnerableTimer: 0
    };
  }

  initNPCs() {
    // Add Keeper Elowen in Hearthmere (tutorial mentor)
    this.npcs.push({
      position: { x: TOWNS.HEARTHMERE.x * TILE_SIZE + 32, y: TOWNS.HEARTHMERE.y * TILE_SIZE },
      size: { x: 12, y: 12 },
      direction: Direction.DOWN,
      speed: 0,
      sprite: 'elowen',
      name: 'Keeper Elowen',
      dialogue: [
        'Welcome to Hearthmere, young traveler.',
        'The ancient Heart of Aeria has been shattered...',
        'You must recover the eight Aether Shards to restore it.',
        'Take this Sunflame Lantern - it will light your way.',
        'The first bandits were seen heading toward Whisperwood.'
      ],
      currentDialogue: 0,
      questGiver: true,
      shopkeeper: false,
      interactable: true
    });
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      
      if (e.key === 'Escape') {
        this.gameState = this.gameState === GameState.PLAYING ? GameState.PAUSED : GameState.PLAYING;
      }
      
      if (e.key === 'i' || e.key === 'I') {
        this.gameState = this.gameState === GameState.INVENTORY ? GameState.PLAYING : GameState.INVENTORY;
      }

      // Interaction key
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.gameState === GameState.DIALOGUE) {
          this.advanceDialogue();
        } else {
          this.checkInteractions();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  checkInteractions() {
    // Check for nearby NPCs
    for (const npc of this.npcs) {
      const distance = Math.hypot(
        this.player.position.x - npc.position.x,
        this.player.position.y - npc.position.y
      );
      
      if (distance < 24 && npc.interactable) {
        this.startDialogue(npc);
        break;
      }
    }
  }

  startDialogue(npc: NPC) {
    this.gameState = GameState.DIALOGUE;
    npc.currentDialogue = 0;
  }

  advanceDialogue() {
    // Find current dialogue NPC and advance
    for (const npc of this.npcs) {
      const distance = Math.hypot(
        this.player.position.x - npc.position.x,
        this.player.position.y - npc.position.y
      );
      
      if (distance < 24) {
        npc.currentDialogue++;
        if (npc.currentDialogue >= npc.dialogue.length) {
          this.gameState = GameState.PLAYING;
          npc.currentDialogue = 0;
        }
        break;
      }
    }
  }

  updatePlayer(deltaTime: number) {
    if (this.gameState !== GameState.PLAYING) return;

    // Handle invulnerability
    if (this.player.invulnerable) {
      this.player.invulnerableTimer -= deltaTime;
      if (this.player.invulnerableTimer <= 0) {
        this.player.invulnerable = false;
      }
    }

    // Handle attack timer
    if (this.player.attacking) {
      this.player.attackTimer -= deltaTime;
      if (this.player.attackTimer <= 0) {
        this.player.attacking = false;
      }
    }

    // Movement
    const speed = this.player.speed * deltaTime;
    let newX = this.player.position.x;
    let newY = this.player.position.y;

    if (this.keys['arrowup'] || this.keys['w']) {
      newY -= speed;
      this.player.direction = Direction.UP;
    }
    if (this.keys['arrowdown'] || this.keys['s']) {
      newY += speed;
      this.player.direction = Direction.DOWN;
    }
    if (this.keys['arrowleft'] || this.keys['a']) {
      newX -= speed;
      this.player.direction = Direction.LEFT;
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      newX += speed;
      this.player.direction = Direction.RIGHT;
    }

    // Attack
    const currentTime = performance.now() / 1000;
    if ((this.keys[' '] || this.keys['enter']) && !this.player.attacking && 
        currentTime - this.player.lastAttackTime >= 0.5) {
      this.player.attacking = true;
      this.player.attackTimer = 0.3;
      this.player.lastAttackTime = currentTime;
    }

    // Collision detection
    if (this.isPassable(newX, this.player.position.y)) {
      this.player.position.x = newX;
    }
    if (this.isPassable(this.player.position.x, newY)) {
      this.player.position.y = newY;
    }

    // Update camera
    this.updateCamera();
  }

  updateCamera() {
    // Center camera on player
    this.camera.x = this.player.position.x - (this.canvas.width / 2);
    this.camera.y = this.player.position.y - (this.canvas.height / 2);
    
    // Clamp camera to world bounds
    this.camera.x = Math.max(0, Math.min(this.camera.x, WORLD_WIDTH * TILE_SIZE - this.canvas.width));
    this.camera.y = Math.max(0, Math.min(this.camera.y, WORLD_HEIGHT * TILE_SIZE - this.canvas.height));
  }

  isPassable(x: number, y: number): boolean {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    if (tileX < 0 || tileX >= WORLD_WIDTH || tileY < 0 || tileY >= WORLD_HEIGHT) {
      return false;
    }
    
    const tile = this.world[tileY][tileX];
    return tile !== TileType.WATER && tile !== TileType.MOUNTAIN && tile !== TileType.WALL;
  }

  getCurrentRegion(): Region | null {
    const tileX = Math.floor(this.player.position.x / TILE_SIZE);
    const tileY = Math.floor(this.player.position.y / TILE_SIZE);
    
    for (const region of REGIONS) {
      if (tileX >= region.bounds.x1 && tileX < region.bounds.x2 &&
          tileY >= region.bounds.y1 && tileY < region.bounds.y2) {
        return region;
      }
    }
    return null;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw world tiles
    const startTileX = Math.floor(this.camera.x / TILE_SIZE);
    const startTileY = Math.floor(this.camera.y / TILE_SIZE);
    const endTileX = Math.min(startTileX + VIEWPORT_WIDTH + 1, WORLD_WIDTH);
    const endTileY = Math.min(startTileY + VIEWPORT_HEIGHT + 1, WORLD_HEIGHT);

    for (let y = Math.max(0, startTileY); y < endTileY; y++) {
      for (let x = Math.max(0, startTileX); x < endTileX; x++) {
        const screenX = x * TILE_SIZE - this.camera.x;
        const screenY = y * TILE_SIZE - this.camera.y;
        
        this.drawTile(this.world[y][x], screenX, screenY);
      }
    }

    // Draw NPCs
    this.npcs.forEach(npc => {
      const screenX = npc.position.x - this.camera.x;
      const screenY = npc.position.y - this.camera.y;
      
      if (screenX > -16 && screenX < this.canvas.width + 16 &&
          screenY > -16 && screenY < this.canvas.height + 16) {
        this.drawNPC(npc, screenX, screenY);
      }
    });

    // Draw player
    const playerScreenX = this.player.position.x - this.camera.x;
    const playerScreenY = this.player.position.y - this.camera.y;
    this.drawPlayer(playerScreenX, playerScreenY);

    // Draw UI
    this.drawUI();
  }

  drawTile(tileType: TileType, x: number, y: number) {
    switch (tileType) {
      case TileType.GRASS:
        this.ctx.fillStyle = '#4CAF50';
        break;
      case TileType.WATER:
        this.ctx.fillStyle = '#2196F3';
        break;
      case TileType.FOREST:
        this.ctx.fillStyle = '#388E3C';
        break;
      case TileType.MOUNTAIN:
        this.ctx.fillStyle = '#607D8B';
        break;
      case TileType.DESERT:
        this.ctx.fillStyle = '#FFC107';
        break;
      case TileType.SNOW:
        this.ctx.fillStyle = '#E3F2FD';
        break;
      case TileType.MARSH:
        this.ctx.fillStyle = '#689F38';
        break;
      case TileType.VOLCANIC:
        this.ctx.fillStyle = '#D32F2F';
        break;
      case TileType.WALL:
        this.ctx.fillStyle = '#424242';
        break;
      case TileType.PATH:
        this.ctx.fillStyle = '#8D6E63';
        break;
      case TileType.HOUSE:
        this.ctx.fillStyle = '#5D4037';
        break;
      default:
        this.ctx.fillStyle = '#4CAF50';
    }
    
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  drawPlayer(x: number, y: number) {
    // Simple player representation - green with direction indicator
    this.ctx.fillStyle = this.player.invulnerable && Math.floor(Date.now() / 100) % 2 ? 
      '#90EE90' : '#228B22';
    this.ctx.fillRect(x + 2, y + 2, this.player.size.x, this.player.size.y);
    
    // Direction indicator
    this.ctx.fillStyle = '#FFFFFF';
    switch (this.player.direction) {
      case Direction.UP:
        this.ctx.fillRect(x + 6, y + 2, 2, 4);
        break;
      case Direction.DOWN:
        this.ctx.fillRect(x + 6, y + 10, 2, 4);
        break;
      case Direction.LEFT:
        this.ctx.fillRect(x + 2, y + 6, 4, 2);
        break;
      case Direction.RIGHT:
        this.ctx.fillRect(x + 10, y + 6, 4, 2);
        break;
    }
  }

  drawNPC(npc: NPC, x: number, y: number) {
    // Different colors for different NPCs
    switch (npc.name) {
      case 'Keeper Elowen':
        this.ctx.fillStyle = '#9C27B0'; // Purple for keeper
        break;
      default:
        this.ctx.fillStyle = '#FF9800'; // Orange for generic NPCs
    }
    
    this.ctx.fillRect(x + 2, y + 2, npc.size.x, npc.size.y);
    
    // Interaction indicator
    const distance = Math.hypot(
      this.player.position.x - npc.position.x,
      this.player.position.y - npc.position.y
    );
    
    if (distance < 24) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(x + 6, y - 4, 4, 2);
    }
  }

  drawUI() {
    // Health display
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(10, 10, 200, 60);
    
    // Hearts
    for (let i = 0; i < this.player.hearts; i++) {
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(20 + i * 20, 20, 16, 16);
      
      if (this.player.health <= i * 2) {
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(20 + i * 20, 20, 16, 16);
      } else if (this.player.health === i * 2 + 1) {
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(28 + i * 20, 20, 8, 16);
      }
    }

    // Currency
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Gleam: ${this.player.gleam}`, 20, 55);

    // Current region
    const region = this.getCurrentRegion();
    if (region) {
      this.ctx.fillText(`${region.name}`, 20, this.canvas.height - 20);
    }

    // Inventory screen
    if (this.gameState === GameState.INVENTORY) {
      this.drawInventory();
    }

    // Dialogue
    if (this.gameState === GameState.DIALOGUE) {
      this.drawDialogue();
    }

    // Pause screen
    if (this.gameState === GameState.PAUSED) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Press ESC to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.textAlign = 'left';
    }
  }

  drawInventory() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('INVENTORY', this.canvas.width / 2, 50);
    
    // Show obtained items
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    let y = 80;
    
    if (this.player.inventory.sunflame_lantern) {
      this.ctx.fillText('✓ Sunflame Lantern', 50, y);
      y += 25;
    }
    if (this.player.inventory.gale_boots) {
      this.ctx.fillText('✓ Gale Boots', 50, y);
      y += 25;
    }
    if (this.player.inventory.riverfin_vest) {
      this.ctx.fillText('✓ Riverfin Vest', 50, y);
      y += 25;
    }
    if (this.player.inventory.aether_mirror) {
      this.ctx.fillText('✓ Aether Mirror', 50, y);
      y += 25;
    }
    
    this.ctx.fillText(`Aether Shards: ${this.player.inventory.aether_shards}/8`, 50, y + 40);
    
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Press I to close', this.canvas.width / 2, this.canvas.height - 30);
  }

  drawDialogue() {
    // Find current NPC in dialogue range
    for (const npc of this.npcs) {
      const distance = Math.hypot(
        this.player.position.x - npc.position.x,
        this.player.position.y - npc.position.y
      );
      
      if (distance < 24 && npc.currentDialogue < npc.dialogue.length) {
        // Draw dialogue box
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(20, this.canvas.height - 120, this.canvas.width - 40, 100);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(20, this.canvas.height - 120, this.canvas.width - 40, 100);
        
        // NPC name
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(npc.name, 30, this.canvas.height - 100);
        
        // Dialogue text
        this.ctx.font = '14px Arial';
        const text = npc.dialogue[npc.currentDialogue];
        this.ctx.fillText(text, 30, this.canvas.height - 70);
        
        // Continue indicator
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Press SPACE to continue...', 30, this.canvas.height - 30);
        break;
      }
    }
  }

  startGame() {
    this.gameLoop(0);
  }

  gameLoop(currentTime: number) {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.updatePlayer(deltaTime);
    this.draw();

    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Start the game
new EchoesOfAeria();