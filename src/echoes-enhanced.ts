import './style.css';
import { spriteManager } from './game/systems/SpriteManager';
import { tileRenderer, TileLayer, TileData } from './game/systems/TileRenderer';

/**
 * Echoes of Aeria - Enhanced Version
 * Features proper sprite rendering, animations, and Zelda-like mechanics
 */

// === CORE TYPES ===
type Direction = 'up' | 'down' | 'left' | 'right';
type GameState = 'playing' | 'paused' | 'dialogue' | 'inventory' | 'menu' | 'transition';

interface Vector2 {
  x: number;
  y: number;
}

interface Entity {
  position: Vector2;
  size: Vector2;
  direction: Direction;
  speed: number;
  sprite: HTMLCanvasElement | null;
  animationFrame: number;
  animationTimer: number;
  currentAnimation: string;
}

interface Player extends Entity {
  health: number;
  maxHealth: number;
  hearts: number;
  rupees: number; // Zelda-style currency
  inventory: PlayerInventory;
  attacking: boolean;
  attackTimer: number;
  invulnerable: boolean;
  invulnerableTimer: number;
  swordHitbox: { x: number; y: number; width: number; height: number } | null;
}

interface PlayerInventory {
  hasSword: boolean;
  hasBow: boolean;
  hasBoomerang: boolean;
  hasBombs: boolean;
  bombCount: number;
  arrowCount: number;
  keys: number;
  bossKeys: number;
  map: boolean;
  compass: boolean;
}

interface Enemy extends Entity {
  type: 'slime' | 'guard' | 'bat' | 'skeleton';
  health: number;
  damage: number;
  aiState: 'idle' | 'patrol' | 'chase' | 'attack';
  patrolPath?: Vector2[];
  currentPatrolIndex?: number;
  lastPlayerSighting?: Vector2;
  stunTimer: number;
}

// === CONSTANTS ===
const TILE_SIZE = 16;
const VIEWPORT_TILES_X = 20; // Closer to SNES resolution
const VIEWPORT_TILES_Y = 15;
const SCREEN_WIDTH = VIEWPORT_TILES_X * TILE_SIZE;
const SCREEN_HEIGHT = VIEWPORT_TILES_Y * TILE_SIZE;

// Tile type definitions (matching TileRenderer)
const TILE_TYPES = {
  GRASS: 0,
  WATER: 1,
  STONE_FLOOR: 2,
  DIRT: 3,
  SAND: 4,
  DARK_GRASS: 5,
  DEEP_WATER: 6,
  WALL: 7,
  FLOWER: 16,
  BUSH: 17,
  ROCK: 18,
  TREE_STUMP: 19,
};

class EnhancedEchoesGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hudCanvas: HTMLCanvasElement;
  private hudCtx: CanvasRenderingContext2D;
  
  // Debug tracking
  private frameCount: number = 0;
  private deltaTimeLog: number[] = [];
  private movementLog: Array<{frame: number, deltaTime: number, position: Vector2, input: string}> = [];
  
  private keys: { [key: string]: boolean } = {};
  private gameState: GameState = 'playing';
  
  // Game layers
  private groundLayer!: TileLayer;
  private decorationLayer!: TileLayer;
  private collisionLayer!: TileLayer;
  
  private player!: Player;
  private enemies: Enemy[] = [];
  private camera: Vector2 = { x: 0, y: 0 };
  private screenShake: { intensity: number; duration: number } = { intensity: 0, duration: 0 };
  
  private lastTime: number = 0;
  private currentRoom: { x: number; y: number } = { x: 0, y: 0 };
  
  // Animation timing
  private globalAnimationTime: number = 0;
  private frameTimeHistory: number[] = [];
  private smoothedDeltaTime: number = 0.016;

  constructor() {
    // Main game canvas
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.canvas.width = SCREEN_WIDTH * 2; // Scale up for better visibility
    this.canvas.height = SCREEN_HEIGHT * 2;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    
    // HUD canvas (overlay)
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.id = 'hudCanvas';
    this.hudCanvas.width = this.canvas.width;
    this.hudCanvas.height = this.canvas.height;
    this.hudCanvas.style.position = 'absolute';
    this.hudCanvas.style.left = this.canvas.offsetLeft + 'px';
    this.hudCanvas.style.top = this.canvas.offsetTop + 'px';
    this.hudCanvas.style.pointerEvents = 'none';
    this.hudCtx = this.hudCanvas.getContext('2d', { alpha: true })!;
    this.hudCtx.imageSmoothingEnabled = false;
    document.body.appendChild(this.hudCanvas);
    
    this.initialize();
    
    // Expose for debugging
    (window as any).game = this;
  }

  private async initialize(): Promise<void> {
    // Initialize world
    this.createWorld();
    this.initPlayer();
    this.spawnEnemies();
    
    // Set up input
    this.setupEventListeners();
    
    // Start game loop
    this.startGame();
  }

  private createWorld(): void {
    // Create tile layers
    this.groundLayer = tileRenderer.createTileLayer(
      'ground',
      VIEWPORT_TILES_X * 10, // 10 screens wide
      VIEWPORT_TILES_Y * 10  // 10 screens tall
    );
    
    this.decorationLayer = tileRenderer.createTileLayer(
      'decorations',
      VIEWPORT_TILES_X * 10,
      VIEWPORT_TILES_Y * 10
    );
    
    this.collisionLayer = tileRenderer.createTileLayer(
      'collision',
      VIEWPORT_TILES_X * 10,
      VIEWPORT_TILES_Y * 10
    );
    
    // Generate a simple dungeon room for testing
    this.generateDungeonRoom(0, 0);
  }

  private generateDungeonRoom(roomX: number, roomY: number): void {
    const startX = roomX * VIEWPORT_TILES_X;
    const startY = roomY * VIEWPORT_TILES_Y;
    
    for (let y = 0; y < VIEWPORT_TILES_Y; y++) {
      for (let x = 0; x < VIEWPORT_TILES_X; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        
        // Walls around the edge
        if (x === 0 || x === VIEWPORT_TILES_X - 1 || 
            y === 0 || y === VIEWPORT_TILES_Y - 1) {
          tileRenderer.setTile(this.groundLayer, worldX, worldY, {
            baseType: TILE_TYPES.STONE_FLOOR,
            passable: true
          });
          tileRenderer.setTile(this.collisionLayer, worldX, worldY, {
            baseType: TILE_TYPES.WALL,
            passable: false
          });
        } else {
          // Floor tiles with variation
          const floorType = Math.random() > 0.9 ? TILE_TYPES.STONE_FLOOR : TILE_TYPES.GRASS;
          tileRenderer.setTile(this.groundLayer, worldX, worldY, {
            baseType: floorType,
            passable: true
          });
          
          // Random decorations
          if (Math.random() < 0.05) {
            const decoType = [TILE_TYPES.FLOWER, TILE_TYPES.BUSH, TILE_TYPES.ROCK][
              Math.floor(Math.random() * 3)
            ];
            tileRenderer.setTile(this.decorationLayer, worldX, worldY, {
              baseType: decoType,
              passable: decoType === TILE_TYPES.FLOWER
            });
          }
        }
      }
    }
    
    // Add water feature in center
    for (let y = 5; y < 10; y++) {
      for (let x = 8; x < 12; x++) {
        const worldX = startX + x;
        const worldY = startY + y;
        
        tileRenderer.setTile(this.groundLayer, worldX, worldY, {
          baseType: TILE_TYPES.WATER,
          animated: true,
          animationFrames: 2,
          animationSpeed: 500,
          passable: false
        });
      }
    }
    
    // Add some pillars
    const pillarPositions = [
      { x: 4, y: 4 }, { x: 15, y: 4 },
      { x: 4, y: 10 }, { x: 15, y: 10 }
    ];
    
    pillarPositions.forEach(pos => {
      tileRenderer.setTile(this.collisionLayer, startX + pos.x, startY + pos.y, {
        baseType: TILE_TYPES.WALL,
        passable: false
      });
    });
  }

  private initPlayer(): void {
    // Generate player sprite
    const playerSprite = spriteManager.generateCharacterSprite(16, 16, '#22a822');
    
    this.player = {
      position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
      size: { x: 14, y: 14 },
      direction: 'down',
      speed: 120, // Adjusted for smoother movement
      sprite: playerSprite,
      animationFrame: 0,
      animationTimer: 0,
      currentAnimation: 'idle_down',
      health: 6,
      maxHealth: 6,
      hearts: 3,
      rupees: 0,
      inventory: {
        hasSword: true,
        hasBow: false,
        hasBoomerang: false,
        hasBombs: false,
        bombCount: 0,
        arrowCount: 0,
        keys: 0,
        bossKeys: 0,
        map: false,
        compass: false,
      },
      attacking: false,
      attackTimer: 0,
      invulnerable: false,
      invulnerableTimer: 0,
      swordHitbox: null,
    };
  }

  private spawnEnemies(): void {
    // Spawn some test enemies
    const enemyPositions = [
      { x: 100, y: 100, type: 'slime' as const },
      { x: 200, y: 150, type: 'slime' as const },
      { x: 150, y: 200, type: 'bat' as const },
    ];
    
    enemyPositions.forEach(pos => {
      const enemySprite = this.generateEnemySprite(pos.type);
      
      this.enemies.push({
        position: { x: pos.x, y: pos.y },
        size: { x: 14, y: 14 },
        direction: 'down',
        speed: 30,
        sprite: enemySprite,
        animationFrame: 0,
        animationTimer: 0,
        currentAnimation: 'idle',
        type: pos.type,
        health: pos.type === 'slime' ? 2 : 3,
        damage: 1,
        aiState: 'patrol',
        patrolPath: this.generatePatrolPath(pos.x, pos.y),
        currentPatrolIndex: 0,
        stunTimer: 0,
      });
    });
  }

  private generateEnemySprite(type: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    
    switch (type) {
      case 'slime':
        // Green slime
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(3, 8, 10, 7);
        ctx.fillRect(4, 6, 8, 2);
        ctx.fillRect(5, 5, 6, 1);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(5, 9, 2, 2);
        ctx.fillRect(9, 9, 2, 2);
        break;
        
      case 'bat':
        // Purple bat
        ctx.fillStyle = '#9c27b0';
        // Body
        ctx.fillRect(6, 7, 4, 4);
        // Wings
        ctx.fillRect(2, 8, 4, 2);
        ctx.fillRect(10, 8, 4, 2);
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(7, 8, 1, 1);
        ctx.fillRect(8, 8, 1, 1);
        break;
        
      default:
        // Generic enemy
        ctx.fillStyle = '#f44336';
        ctx.fillRect(4, 4, 8, 8);
    }
    
    return canvas;
  }

  private generatePatrolPath(centerX: number, centerY: number): Vector2[] {
    // Simple square patrol path
    const size = 50;
    return [
      { x: centerX - size, y: centerY - size },
      { x: centerX + size, y: centerY - size },
      { x: centerX + size, y: centerY + size },
      { x: centerX - size, y: centerY + size },
    ];
  }

  private setupEventListeners(): void {
    // Keyboard input
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      
      // Handle special keys
      if (e.key === 'Escape') {
        this.gameState = this.gameState === 'playing' ? 'paused' : 'playing';
      }
      
      if (e.key === 'i' || e.key === 'I') {
        this.gameState = this.gameState === 'inventory' ? 'playing' : 'inventory';
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  private updatePlayer(deltaTime: number): void {
    if (this.gameState !== 'playing') return;
    
    // Handle invulnerability
    if (this.player.invulnerable) {
      this.player.invulnerableTimer -= deltaTime;
      if (this.player.invulnerableTimer <= 0) {
        this.player.invulnerable = false;
      }
    }
    
    // Handle attack
    if (this.player.attacking) {
      this.player.attackTimer -= deltaTime;
      if (this.player.attackTimer <= 0) {
        this.player.attacking = false;
        this.player.swordHitbox = null;
      }
    }
    
    // Movement
    let dx = 0;
    let dy = 0;
    
    if (this.keys['arrowup'] || this.keys['w']) {
      dy = -1;
      this.player.direction = 'up';
    }
    if (this.keys['arrowdown'] || this.keys['s']) {
      dy = 1;
      this.player.direction = 'down';
    }
    if (this.keys['arrowleft'] || this.keys['a']) {
      dx = -1;
      this.player.direction = 'left';
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      dx = 1;
      this.player.direction = 'right';
    }
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const factor = 0.707; // 1/sqrt(2)
      dx *= factor;
      dy *= factor;
    }
    
    // Apply speed and deltaTime
    const moveSpeed = this.player.speed * deltaTime;
    dx *= moveSpeed;
    dy *= moveSpeed;
    
    // Debug logging
    if (dx !== 0 || dy !== 0) {
      const inputKeys = Object.keys(this.keys).filter(k => this.keys[k]).join(',');
      this.movementLog.push({
        frame: this.frameCount,
        deltaTime,
        position: {...this.player.position},
        input: inputKeys
      });
      
      // Log first 10 movement frames for debugging
      if (this.movementLog.length <= 10) {
        console.log(`Frame ${this.frameCount}: dt=${deltaTime.toFixed(4)}, dx=${dx.toFixed(2)}, dy=${dy.toFixed(2)}, keys=${inputKeys}`);
      }
    }
    
    // Check collision and move
    const newX = this.player.position.x + dx;
    const newY = this.player.position.y + dy;
    
    if (this.isPositionPassable(newX, this.player.position.y, this.player.size.x, this.player.size.y)) {
      this.player.position.x = newX;
    }
    if (this.isPositionPassable(this.player.position.x, newY, this.player.size.x, this.player.size.y)) {
      this.player.position.y = newY;
    }
    
    // Attack input
    if ((this.keys[' '] || this.keys['z']) && !this.player.attacking && this.player.inventory.hasSword) {
      this.performSwordAttack();
    }
    
    // Update animation
    if (dx !== 0 || dy !== 0) {
      this.player.animationTimer += deltaTime;
      if (this.player.animationTimer > 0.15) {
        this.player.animationFrame = (this.player.animationFrame + 1) % 3;
        this.player.animationTimer = 0;
      }
    } else {
      this.player.animationFrame = 0;
    }
    
    // Update camera
    this.updateCamera();
  }

  private performSwordAttack(): void {
    this.player.attacking = true;
    this.player.attackTimer = 0.25;
    
    // Create sword hitbox based on direction
    const reach = 20;
    const width = 16;
    const height = 20;
    
    switch (this.player.direction) {
      case 'up':
        this.player.swordHitbox = {
          x: this.player.position.x - width / 2,
          y: this.player.position.y - reach,
          width: width,
          height: height
        };
        break;
      case 'down':
        this.player.swordHitbox = {
          x: this.player.position.x - width / 2,
          y: this.player.position.y + this.player.size.y,
          width: width,
          height: height
        };
        break;
      case 'left':
        this.player.swordHitbox = {
          x: this.player.position.x - reach,
          y: this.player.position.y - height / 2 + this.player.size.y / 2,
          width: height,
          height: width
        };
        break;
      case 'right':
        this.player.swordHitbox = {
          x: this.player.position.x + this.player.size.x,
          y: this.player.position.y - height / 2 + this.player.size.y / 2,
          width: height,
          height: width
        };
        break;
    }
    
    // Check hits
    this.checkSwordHits();
    
    // Screen shake for impact
    this.addScreenShake(2, 0.1);
  }

  private checkSwordHits(): void {
    if (!this.player.swordHitbox) return;
    
    this.enemies.forEach(enemy => {
      if (enemy.stunTimer > 0) return;
      
      if (this.checkCollision(
        this.player.swordHitbox!,
        { x: enemy.position.x, y: enemy.position.y, width: enemy.size.x, height: enemy.size.y }
      )) {
        // Deal damage
        enemy.health -= 1;
        enemy.stunTimer = 0.5;
        
        // Knockback
        const dx = enemy.position.x - this.player.position.x;
        const dy = enemy.position.y - this.player.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          enemy.position.x += (dx / dist) * 20;
          enemy.position.y += (dy / dist) * 20;
        }
        
        // Screen shake
        this.addScreenShake(3, 0.15);
      }
    });
    
    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.health > 0);
  }

  private updateEnemies(deltaTime: number): void {
    this.enemies.forEach(enemy => {
      // Update stun timer
      if (enemy.stunTimer > 0) {
        enemy.stunTimer -= deltaTime;
        return;
      }
      
      // Simple AI
      switch (enemy.aiState) {
        case 'patrol':
          this.updateEnemyPatrol(enemy, deltaTime);
          break;
        case 'chase':
          this.updateEnemyChase(enemy, deltaTime);
          break;
      }
      
      // Check if player is nearby
      const dist = this.getDistance(enemy.position, this.player.position);
      if (dist < 80 && enemy.aiState === 'patrol') {
        enemy.aiState = 'chase';
        enemy.lastPlayerSighting = { ...this.player.position };
      } else if (dist > 120 && enemy.aiState === 'chase') {
        enemy.aiState = 'patrol';
      }
      
      // Check collision with player
      if (!this.player.invulnerable && dist < 20) {
        this.damagePlayer(enemy.damage);
      }
      
      // Update animation
      enemy.animationTimer += deltaTime;
      if (enemy.animationTimer > 0.2) {
        enemy.animationFrame = (enemy.animationFrame + 1) % 2;
        enemy.animationTimer = 0;
      }
    });
  }

  private updateEnemyPatrol(enemy: Enemy, deltaTime: number): void {
    if (!enemy.patrolPath || enemy.patrolPath.length === 0) return;
    
    const target = enemy.patrolPath[enemy.currentPatrolIndex!];
    const dist = this.getDistance(enemy.position, target);
    
    if (dist < 5) {
      enemy.currentPatrolIndex = ((enemy.currentPatrolIndex || 0) + 1) % enemy.patrolPath.length;
    } else {
      // Move towards target
      const dx = target.x - enemy.position.x;
      const dy = target.y - enemy.position.y;
      const moveX = (dx / dist) * enemy.speed * deltaTime;
      const moveY = (dy / dist) * enemy.speed * deltaTime;
      
      enemy.position.x += moveX;
      enemy.position.y += moveY;
    }
  }

  private updateEnemyChase(enemy: Enemy, deltaTime: number): void {
    if (!enemy.lastPlayerSighting) return;
    
    const dx = this.player.position.x - enemy.position.x;
    const dy = this.player.position.y - enemy.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const moveX = (dx / dist) * enemy.speed * 1.5 * deltaTime;
      const moveY = (dy / dist) * enemy.speed * 1.5 * deltaTime;
      
      enemy.position.x += moveX;
      enemy.position.y += moveY;
    }
  }

  private damagePlayer(damage: number): void {
    this.player.health -= damage;
    this.player.invulnerable = true;
    this.player.invulnerableTimer = 1.0;
    
    // Strong screen shake
    this.addScreenShake(5, 0.3);
    
    // Check death
    if (this.player.health <= 0) {
      this.gameState = 'menu';
      // Reset game or show game over
    }
  }

  private addScreenShake(intensity: number, duration: number): void {
    this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    this.screenShake.duration = Math.max(this.screenShake.duration, duration);
  }

  private updateCamera(): void {
    // Smooth camera follow with screen shake
    const targetX = this.player.position.x - SCREEN_WIDTH / 2;
    const targetY = this.player.position.y - SCREEN_HEIGHT / 2;
    
    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;
    
    // Apply screen shake
    if (this.screenShake.duration > 0) {
      this.camera.x += (Math.random() - 0.5) * this.screenShake.intensity * 2;
      this.camera.y += (Math.random() - 0.5) * this.screenShake.intensity * 2;
    }
    
    // Clamp to world bounds
    this.camera.x = Math.max(0, Math.min(this.camera.x, VIEWPORT_TILES_X * 10 * TILE_SIZE - SCREEN_WIDTH));
    this.camera.y = Math.max(0, Math.min(this.camera.y, VIEWPORT_TILES_Y * 10 * TILE_SIZE - SCREEN_HEIGHT));
  }

  private isPositionPassable(x: number, y: number, width: number, height: number): boolean {
    // Check tile collision at corners
    const points = [
      { x: x, y: y },
      { x: x + width, y: y },
      { x: x, y: y + height },
      { x: x + width, y: y + height }
    ];
    
    for (const point of points) {
      const tileX = Math.floor(point.x / TILE_SIZE);
      const tileY = Math.floor(point.y / TILE_SIZE);
      
      // Check collision layer
      const collisionTile = this.collisionLayer.tiles[tileY]?.[tileX];
      if (collisionTile && !collisionTile.passable) {
        return false;
      }
      
      // Check ground layer for water, etc.
      const groundTile = this.groundLayer.tiles[tileY]?.[tileX];
      if (groundTile && !groundTile.passable) {
        return false;
      }
    }
    
    return true;
  }

  private checkCollision(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private getDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Debug methods for testing
  public getDebugInfo() {
    return {
      frameCount: this.frameCount,
      deltaTimeLog: this.deltaTimeLog.slice(-20), // Last 20 frames
      movementLog: this.movementLog.slice(-10), // Last 10 movements
      playerPosition: {...this.player.position},
      currentKeys: Object.keys(this.keys).filter(k => this.keys[k])
    };
  }

  public clearDebugLog() {
    this.movementLog = [];
    this.deltaTimeLog = [];
  }

  private draw(): void {
    // Clear canvases
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Scale up for pixel art
    this.ctx.save();
    this.ctx.scale(2, 2);
    
    // Render tile layers
    tileRenderer.renderTileLayer(
      this.ctx,
      this.groundLayer,
      this.camera.x,
      this.camera.y,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      this.globalAnimationTime
    );
    
    tileRenderer.renderTileLayer(
      this.ctx,
      this.decorationLayer,
      this.camera.x,
      this.camera.y,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      this.globalAnimationTime
    );
    
    // Draw enemies
    this.enemies.forEach(enemy => {
      const screenX = enemy.position.x - this.camera.x;
      const screenY = enemy.position.y - this.camera.y;
      
      if (screenX > -32 && screenX < SCREEN_WIDTH + 32 &&
          screenY > -32 && screenY < SCREEN_HEIGHT + 32) {
        // Flash white when hit
        if (enemy.stunTimer > 0 && Math.floor(enemy.stunTimer * 10) % 2) {
          this.ctx.fillStyle = '#fff';
          this.ctx.fillRect(screenX, screenY, enemy.size.x, enemy.size.y);
        } else if (enemy.sprite) {
          this.ctx.drawImage(enemy.sprite, screenX, screenY);
        }
      }
    });
    
    // Draw player
    const playerScreenX = this.player.position.x - this.camera.x;
    const playerScreenY = this.player.position.y - this.camera.y;
    
    // Flash when invulnerable
    if (!this.player.invulnerable || Math.floor(this.player.invulnerableTimer * 10) % 2) {
      if (this.player.sprite) {
        // Draw appropriate animation frame
        const dirIndex = ['down', 'up', 'left', 'right'].indexOf(this.player.direction);
        const frameY = this.player.animationFrame * 16;
        
        this.ctx.drawImage(
          this.player.sprite,
          dirIndex * 16, frameY,
          16, 16,
          playerScreenX, playerScreenY,
          16, 16
        );
      }
    }
    
    // Draw sword
    if (this.player.attacking && this.player.swordHitbox) {
      this.ctx.fillStyle = '#silver';
      this.ctx.fillRect(
        this.player.swordHitbox.x - this.camera.x,
        this.player.swordHitbox.y - this.camera.y,
        this.player.swordHitbox.width,
        this.player.swordHitbox.height
      );
    }
    
    // Render collision layer (walls) on top
    tileRenderer.renderTileLayer(
      this.ctx,
      this.collisionLayer,
      this.camera.x,
      this.camera.y,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
      this.globalAnimationTime
    );
    
    this.ctx.restore();
    
    // Draw HUD
    this.drawHUD();
  }

  private drawHUD(): void {
    this.hudCtx.clearRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
    
    // HUD background
    this.hudCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.hudCtx.fillRect(0, 0, this.hudCanvas.width, 60);
    
    // Hearts
    const heartSize = 16;
    for (let i = 0; i < this.player.hearts; i++) {
      const x = 20 + i * (heartSize + 4);
      const y = 20;
      
      this.drawHeart(this.hudCtx, x, y, heartSize, i * 2 < this.player.health);
    }
    
    // Rupees
    this.hudCtx.fillStyle = '#0f0';
    this.hudCtx.font = 'bold 16px monospace';
    this.hudCtx.fillText(`₹${this.player.rupees}`, 20, 50);
    
    // Items
    const itemX = this.hudCanvas.width - 100;
    if (this.player.inventory.hasSword) {
      this.hudCtx.fillStyle = '#silver';
      this.hudCtx.fillRect(itemX, 20, 20, 30);
    }
    
    // Keys
    this.hudCtx.fillStyle = '#gold';
    this.hudCtx.fillText(`Keys: ${this.player.inventory.keys}`, itemX - 80, 40);
    
    // Game state overlays
    if (this.gameState === 'paused') {
      this.hudCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.hudCtx.fillRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
      
      this.hudCtx.fillStyle = '#fff';
      this.hudCtx.font = 'bold 32px monospace';
      this.hudCtx.textAlign = 'center';
      this.hudCtx.fillText('PAUSED', this.hudCanvas.width / 2, this.hudCanvas.height / 2);
      this.hudCtx.font = '16px monospace';
      this.hudCtx.fillText('Press ESC to continue', this.hudCanvas.width / 2, this.hudCanvas.height / 2 + 40);
      this.hudCtx.textAlign = 'left';
    }
    
    if (this.gameState === 'inventory') {
      this.drawInventoryScreen();
    }
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, full: boolean): void {
    ctx.fillStyle = full ? '#f00' : '#400';
    
    // Simple heart shape
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.bezierCurveTo(x, y + size / 2, x + size / 2, y + size * 0.9, x + size / 2, y + size * 0.9);
    ctx.bezierCurveTo(x + size / 2, y + size * 0.9, x + size, y + size / 2, x + size, y + size / 4);
    ctx.bezierCurveTo(x + size, y, x + size / 2, y, x + size / 2, y + size / 4);
    ctx.fill();
  }

  private drawInventoryScreen(): void {
    // Dark overlay
    this.hudCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.hudCtx.fillRect(0, 0, this.hudCanvas.width, this.hudCanvas.height);
    
    // Title
    this.hudCtx.fillStyle = '#fff';
    this.hudCtx.font = 'bold 24px monospace';
    this.hudCtx.textAlign = 'center';
    this.hudCtx.fillText('INVENTORY', this.hudCanvas.width / 2, 50);
    
    // Items grid
    const gridX = 100;
    const gridY = 100;
    const cellSize = 50;
    
    // Draw grid
    this.hudCtx.strokeStyle = '#666';
    this.hudCtx.lineWidth = 2;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        this.hudCtx.strokeRect(gridX + x * cellSize, gridY + y * cellSize, cellSize, cellSize);
      }
    }
    
    // Draw items
    let itemIndex = 0;
    if (this.player.inventory.hasSword) {
      this.hudCtx.fillStyle = '#silver';
      this.hudCtx.fillRect(gridX + 10, gridY + 10, 30, 30);
      itemIndex++;
    }
    
    // Instructions
    this.hudCtx.font = '16px monospace';
    this.hudCtx.fillText('Press I to close', this.hudCanvas.width / 2, this.hudCanvas.height - 30);
    this.hudCtx.textAlign = 'left';
  }

  private update(deltaTime: number): void {
    // Update screen shake
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      if (this.screenShake.duration <= 0) {
        this.screenShake.intensity = 0;
      }
    }
    
    // Update game based on state
    if (this.gameState === 'playing') {
      this.updatePlayer(deltaTime);
      this.updateEnemies(deltaTime);
    }
    
    // Update global animation timer
    this.globalAnimationTime += deltaTime * 1000; // Convert to ms
  }

  private startGame(): void {
    this.gameLoop(0);
  }

  private gameLoop(currentTime: number): void {
    // Skip first frame to avoid large delta
    if (this.lastTime === 0) {
      this.lastTime = currentTime;
      requestAnimationFrame((time) => this.gameLoop(time));
      return;
    }
    
    const rawDeltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Track frame info
    this.frameCount++;
    
    // Skip first few frames to avoid initialization spikes
    if (this.frameCount <= 3) {
      this.draw();
      requestAnimationFrame((time) => this.gameLoop(time));
      return;
    }
    
    // Smooth deltaTime to prevent movement spikes
    this.frameTimeHistory.push(rawDeltaTime);
    if (this.frameTimeHistory.length > 10) {
      this.frameTimeHistory.shift();
    }
    
    // Use median of recent frame times to avoid spikes
    const sortedFrameTimes = [...this.frameTimeHistory].sort((a, b) => a - b);
    const medianDeltaTime = sortedFrameTimes[Math.floor(sortedFrameTimes.length / 2)];
    
    // Cap and smooth the deltaTime
    const cappedDeltaTime = Math.min(medianDeltaTime, 0.020); // Cap at 20ms
    this.smoothedDeltaTime = this.smoothedDeltaTime * 0.9 + cappedDeltaTime * 0.1; // Smooth with lerp
    
    // Use smoothed deltaTime for consistent movement
    const deltaTime = Math.max(0.008, Math.min(this.smoothedDeltaTime, 0.020)); // Clamp between 8ms and 20ms
    
    this.deltaTimeLog.push(deltaTime);
    
    // Debug first few frames after initialization
    if (this.frameCount <= 8) {
      console.log(`Frame ${this.frameCount}: raw=${rawDeltaTime.toFixed(4)}, median=${medianDeltaTime.toFixed(4)}, smoothed=${deltaTime.toFixed(4)}`);
    }
    
    this.update(deltaTime);
    this.draw();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new EnhancedEchoesGame();
  });
} else {
  new EnhancedEchoesGame();
}