/**
 * Enhanced SpriteManager - ALTTP-style sprite system
 * Handles sprite loading, caching, pixel-perfect rendering, and ALTTP-authentic animations
 */

import { ALTTP_PALETTE } from '@shared/constants.js';

export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX?: number; // Sprite anchor point for proper alignment
  anchorY?: number;
  hitboxX?: number; // Collision box offset
  hitboxY?: number;
  hitboxW?: number; // Collision box size
  hitboxH?: number;
}

export interface SpriteAnimation {
  name: string;
  frames: SpriteFrame[];
  frameDuration: number; // ms per frame
  loop: boolean;
  flipX?: boolean; // Can this animation be flipped horizontally
  priority?: number; // Animation priority for state management
}

export interface SpriteSheet {
  image: HTMLImageElement;
  frameWidth: number;
  frameHeight: number;
  animations: Map<string, SpriteAnimation>;
  metadata: SpriteMetadata;
}

export interface SpriteMetadata {
  type: 'character' | 'tile' | 'effect' | 'ui';
  pixelPerfect: boolean;
  paletteConstrained: boolean; // Limited to 16 colors
  baseWidth: number;
  baseHeight: number;
  animationStates: string[]; // Available animation states
}

export interface AnimationState {
  currentAnimation: string;
  currentFrame: number;
  frameTimer: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  isAttacking: boolean;
}

export class SpriteManager {
  private spriteSheets: Map<string, SpriteSheet> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationStates: Map<string, AnimationState> = new Map(); // Track animation states per entity
  private generatedSprites: Map<string, HTMLCanvasElement> = new Map(); // Cache generated sprites

  constructor() {
    // Create offscreen canvas for sprite operations
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true })!;
    
    // Ensure pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    
    // Initialize ALTTP character sprites
    this.initializeALTTPSprites();
  }

  private initializeALTTPSprites(): void {
    // Generate ALTTP-style Link sprites programmatically
    this.generateAndCacheALTTPPlayerSprites();
    this.generateAndCacheALTTPNPCSprites();
    this.generateAndCacheALTTPEnemySprites();
  }

  private generateAndCacheALTTPPlayerSprites(): void {
    // Generate Link-inspired player sprite sheet (4 directions x 3 frames each)
    const spriteCanvas = this.generateALTTPCharacterSprite('player', 16, 16);
    
    // Create animation definitions for Link
    const playerAnimations = new Map<string, SpriteAnimation>();
    
    // Walking animations (3 frames each)
    const directions = ['down', 'up', 'left', 'right'];
    directions.forEach((direction, dirIndex) => {
      const frames: SpriteFrame[] = [];
      for (let frame = 0; frame < 3; frame++) {
        frames.push({
          x: dirIndex * 16,
          y: frame * 16,
          width: 16,
          height: 16,
          anchorX: 8,
          anchorY: 14,
          hitboxX: 4,
          hitboxY: 8,
          hitboxW: 8,
          hitboxH: 8
        });
      }
      
      playerAnimations.set(`walk_${direction}`, {
        name: `walk_${direction}`,
        frames,
        frameDuration: 200, // 200ms per frame for smooth walking
        loop: true,
        flipX: false,
        priority: 1
      });
      
      // Idle animations (just first frame)
      playerAnimations.set(`idle_${direction}`, {
        name: `idle_${direction}`,
        frames: [frames[0]], // Just first frame
        frameDuration: 1000,
        loop: false,
        flipX: false,
        priority: 0
      });
    });
    
    // Attack animations
    directions.forEach((direction, dirIndex) => {
      playerAnimations.set(`attack_${direction}`, {
        name: `attack_${direction}`,
        frames: [{
          x: dirIndex * 16,
          y: 48, // Attack frames below walking frames
          width: 16,
          height: 16,
          anchorX: 8,
          anchorY: 14,
          hitboxX: direction === 'left' ? 0 : direction === 'right' ? 12 : 4,
          hitboxY: direction === 'up' ? 0 : direction === 'down' ? 12 : 4,
          hitboxW: direction === 'left' || direction === 'right' ? 20 : 8,
          hitboxH: direction === 'up' || direction === 'down' ? 20 : 8
        }],
        frameDuration: 300, // Attack duration from constants
        loop: false,
        flipX: false,
        priority: 3
      });
    });
    
    // Store as sprite sheet
    const img = new Image();
    img.onload = () => {
      this.spriteSheets.set('player', {
        image: img,
        frameWidth: 16,
        frameHeight: 16,
        animations: playerAnimations,
        metadata: {
          type: 'character',
          pixelPerfect: true,
          paletteConstrained: true,
          baseWidth: 16,
          baseHeight: 16,
          animationStates: Array.from(playerAnimations.keys())
        }
      });
    };
    img.src = spriteCanvas.toDataURL();
    this.generatedSprites.set('player', spriteCanvas);
  }

  private generateAndCacheALTTPNPCSprites(): void {
    // Generate Keeper-style NPC sprites
    const npcCanvas = this.generateALTTPCharacterSprite('npc', 16, 16);
    
    const npcAnimations = new Map<string, SpriteAnimation>();
    const directions = ['down', 'up', 'left', 'right'];
    
    directions.forEach((direction, dirIndex) => {
      const frames: SpriteFrame[] = [];
      for (let frame = 0; frame < 3; frame++) {
        frames.push({
          x: dirIndex * 16,
          y: frame * 16,
          width: 16,
          height: 16,
          anchorX: 8,
          anchorY: 14,
          hitboxX: 2,
          hitboxY: 6,
          hitboxW: 12,
          hitboxH: 10
        });
      }
      
      // NPCs have simpler animations - mainly idle with slight movement
      npcAnimations.set(`idle_${direction}`, {
        name: `idle_${direction}`,
        frames: [frames[0], frames[1]], // Slight animation
        frameDuration: 800,
        loop: true,
        flipX: false,
        priority: 0
      });
    });
    
    const img = new Image();
    img.onload = () => {
      this.spriteSheets.set('npc_keeper', {
        image: img,
        frameWidth: 16,
        frameHeight: 16,
        animations: npcAnimations,
        metadata: {
          type: 'character',
          pixelPerfect: true,
          paletteConstrained: true,
          baseWidth: 16,
          baseHeight: 16,
          animationStates: Array.from(npcAnimations.keys())
        }
      });
    };
    img.src = npcCanvas.toDataURL();
    this.generatedSprites.set('npc_keeper', npcCanvas);
  }

  private generateAndCacheALTTPEnemySprites(): void {
    // Generate basic enemy sprites (goblin-like)
    const enemyCanvas = this.generateALTTPCharacterSprite('enemy', 16, 16);
    
    const enemyAnimations = new Map<string, SpriteAnimation>();
    const directions = ['down', 'up', 'left', 'right'];
    
    directions.forEach((direction, dirIndex) => {
      const frames: SpriteFrame[] = [];
      for (let frame = 0; frame < 3; frame++) {
        frames.push({
          x: dirIndex * 16,
          y: frame * 16,
          width: 16,
          height: 16,
          anchorX: 8,
          anchorY: 14,
          hitboxX: 3,
          hitboxY: 6,
          hitboxW: 10,
          hitboxH: 8
        });
      }
      
      enemyAnimations.set(`walk_${direction}`, {
        name: `walk_${direction}`,
        frames,
        frameDuration: 250, // Slightly slower than player
        loop: true,
        flipX: false,
        priority: 1
      });
      
      enemyAnimations.set(`idle_${direction}`, {
        name: `idle_${direction}`,
        frames: [frames[0]],
        frameDuration: 1000,
        loop: false,
        flipX: false,
        priority: 0
      });
    });
    
    const img = new Image();
    img.onload = () => {
      this.spriteSheets.set('enemy_basic', {
        image: img,
        frameWidth: 16,
        frameHeight: 16,
        animations: enemyAnimations,
        metadata: {
          type: 'character',
          pixelPerfect: true,
          paletteConstrained: true,
          baseWidth: 16,
          baseHeight: 16,
          animationStates: Array.from(enemyAnimations.keys())
        }
      });
    };
    img.src = enemyCanvas.toDataURL();
    this.generatedSprites.set('enemy_basic', enemyCanvas);
  }

  // Animation state management
  initializeAnimationState(entityId: string, spriteKey: string): void {
    this.animationStates.set(entityId, {
      currentAnimation: `idle_down`,
      currentFrame: 0,
      frameTimer: 0,
      direction: 'down',
      isMoving: false,
      isAttacking: false
    });
  }

  updateAnimationState(
    entityId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    isMoving: boolean,
    isAttacking: boolean,
    deltaTime: number
  ): void {
    const state = this.animationStates.get(entityId);
    if (!state) return;
    
    // Update state
    state.direction = direction;
    state.isMoving = isMoving;
    state.isAttacking = isAttacking;
    
    // Determine target animation
    let targetAnimation = `idle_${direction}`;
    if (isAttacking) {
      targetAnimation = `attack_${direction}`;
    } else if (isMoving) {
      targetAnimation = `walk_${direction}`;
    }
    
    // Change animation if needed
    if (state.currentAnimation !== targetAnimation) {
      state.currentAnimation = targetAnimation;
      state.currentFrame = 0;
      state.frameTimer = 0;
    }
    
    // Update frame timing
    state.frameTimer += deltaTime;
    
    // Get current animation data
    const spriteSheet = this.getSpriteSheetForEntity(entityId);
    if (!spriteSheet) return;
    
    const animation = spriteSheet.animations.get(state.currentAnimation);
    if (!animation) return;
    
    // Advance frame if needed
    if (state.frameTimer >= animation.frameDuration) {
      state.frameTimer = 0;
      
      if (animation.loop || state.currentFrame < animation.frames.length - 1) {
        state.currentFrame = (state.currentFrame + 1) % animation.frames.length;
      }
      
      // For non-looping animations (like attacks), return to idle
      if (!animation.loop && state.currentFrame === animation.frames.length - 1) {
        if (isAttacking && !isMoving) {
          // Attack finished, return to idle
          setTimeout(() => {
            const currentState = this.animationStates.get(entityId);
            if (currentState && currentState.currentAnimation.includes('attack')) {
              currentState.currentAnimation = `idle_${direction}`;
              currentState.currentFrame = 0;
              currentState.frameTimer = 0;
            }
          }, 50);
        }
      }
    }
  }

  private getSpriteSheetForEntity(entityId: string): SpriteSheet | undefined {
    // Determine sprite sheet based on entity type (simplified for now)
    // In a full implementation, this would query the ECS for entity type
    if (entityId.includes('player')) return this.spriteSheets.get('player');
    if (entityId.includes('npc')) return this.spriteSheets.get('npc_keeper');
    if (entityId.includes('enemy')) return this.spriteSheets.get('enemy_basic');
    return this.spriteSheets.get('player'); // Default
  }

  getCurrentAnimationFrame(entityId: string): SpriteFrame | null {
    const state = this.animationStates.get(entityId);
    if (!state) return null;
    
    const spriteSheet = this.getSpriteSheetForEntity(entityId);
    if (!spriteSheet) return null;
    
    const animation = spriteSheet.animations.get(state.currentAnimation);
    if (!animation) return null;
    
    return animation.frames[state.currentFrame] || null;
  }

  getGeneratedSprite(spriteKey: string): HTMLCanvasElement | undefined {
    return this.generatedSprites.get(spriteKey);
  }

  getSpriteSheet(key: string): SpriteSheet | undefined {
    return this.spriteSheets.get(key);
  }

  async loadSpriteSheet(
    key: string,
    imagePath: string,
    frameWidth: number,
    frameHeight: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages.set(key, img);
        this.spriteSheets.set(key, {
          image: img,
          frameWidth,
          frameHeight,
          animations: new Map(),
        });
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load sprite: ${imagePath}`));
      img.src = imagePath;
    });
  }

  defineSpriteAnimation(
    sheetKey: string,
    animationName: string,
    startFrame: number,
    frameCount: number,
    frameDuration: number = 100,
    loop: boolean = true
  ): void {
    const sheet = this.spriteSheets.get(sheetKey);
    if (!sheet) {
      console.error(`Sprite sheet ${sheetKey} not found`);
      return;
    }

    const frames: SpriteFrame[] = [];
    const cols = Math.floor(sheet.image.width / sheet.frameWidth);

    for (let i = 0; i < frameCount; i++) {
      const frameIndex = startFrame + i;
      const col = frameIndex % cols;
      const row = Math.floor(frameIndex / cols);

      frames.push({
        x: col * sheet.frameWidth,
        y: row * sheet.frameHeight,
        width: sheet.frameWidth,
        height: sheet.frameHeight,
      });
    }

    sheet.animations.set(animationName, {
      name: animationName,
      frames,
      frameDuration,
      loop,
    });
  }

  drawSprite(
    ctx: CanvasRenderingContext2D,
    sheetKey: string,
    frameX: number,
    frameY: number,
    destX: number,
    destY: number,
    scale: number = 1
  ): void {
    const sheet = this.spriteSheets.get(sheetKey);
    if (!sheet) return;

    ctx.imageSmoothingEnabled = false; // Pixel art crisp rendering
    ctx.drawImage(
      sheet.image,
      frameX * sheet.frameWidth,
      frameY * sheet.frameHeight,
      sheet.frameWidth,
      sheet.frameHeight,
      destX,
      destY,
      sheet.frameWidth * scale,
      sheet.frameHeight * scale
    );
  }

  drawAnimationFrame(
    ctx: CanvasRenderingContext2D,
    sheetKey: string,
    animationName: string,
    frameIndex: number,
    destX: number,
    destY: number,
    scale: number = 1
  ): void {
    const sheet = this.spriteSheets.get(sheetKey);
    if (!sheet) return;

    const animation = sheet.animations.get(animationName);
    if (!animation) return;

    const frame = animation.frames[frameIndex % animation.frames.length];
    
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet.image,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      destX,
      destY,
      frame.width * scale,
      frame.height * scale
    );
  }

  /**
   * Generate ALTTP-quality pixel art tiles programmatically
   * Enhanced with proper shading, textures, and detail matching 16-bit quality
   */
  generateTile(
    type: string,
    size: number = 16,
    primaryColor?: string,
    secondaryColor?: string
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    switch (type) {
      case 'grass':
        this.drawALTTPGrassTile(ctx, size);
        break;
      case 'water':
        this.drawALTTPWaterTile(ctx, size);
        break;
      case 'forest':
        this.drawALTTPForestTile(ctx, size);
        break;
      case 'mountain':
        this.drawALTTPMountainTile(ctx, size);
        break;
      case 'desert':
        this.drawALTTPDesertTile(ctx, size);
        break;
      case 'snow':
        this.drawALTTPSnowTile(ctx, size);
        break;
      case 'marsh':
        this.drawALTTPMarshTile(ctx, size);
        break;
      case 'volcanic':
        this.drawALTTPVolcanicTile(ctx, size);
        break;
      case 'wall':
        this.drawALTTPWallTile(ctx, size);
        break;
      case 'path':
        this.drawALTTPPathTile(ctx, size);
        break;
      case 'house':
        this.drawALTTPHouseTile(ctx, size);
        break;
      case 'door':
        this.drawALTTPDoorTile(ctx, size);
        break;
      case 'bridge':
        this.drawALTTPBridgeTile(ctx, size);
        break;
      case 'shrine':
        this.drawALTTPShrineTile(ctx, size);
        break;
      case 'chest':
        this.drawALTTPChestTile(ctx, size);
        break;
      case 'flower':
        this.drawALTTPFlowerTile(ctx, size);
        break;
      default:
        // Fallback grass tile
        this.drawALTTPGrassTile(ctx, size);
    }

    return canvas;
  }

  // ALTTP-Quality tile drawing methods with authentic 16-bit pixel art detail
  
  private drawALTTPGrassTile(ctx: CanvasRenderingContext2D, size: number): void {
    // ALTTP grass uses authentic SNES overworld palette
    const darkGreen = '#206020';  // Dark grass shadows (#41 in ALTTP palette)
    const midGreen = '#40A040';   // Base ALTTP grass color (#45 in ALTTP palette)  
    const lightGreen = '#80C080'; // Light grass highlights (#49 in ALTTP palette)
    const shadowGreen = '#006000'; // Deep grass shadows

    // Base layer
    ctx.fillStyle = darkGreen;
    ctx.fillRect(0, 0, size, size);

    // Grass texture pattern (ALTTP style)
    ctx.fillStyle = midGreen;
    // Top section
    ctx.fillRect(2, 1, 2, 1);
    ctx.fillRect(6, 0, 3, 1);
    ctx.fillRect(11, 1, 2, 1);
    ctx.fillRect(14, 2, 1, 2);
    
    // Middle section  
    ctx.fillRect(1, 5, 1, 3);
    ctx.fillRect(4, 4, 2, 2);
    ctx.fillRect(8, 6, 2, 1);
    ctx.fillRect(12, 4, 1, 3);
    
    // Bottom section
    ctx.fillRect(3, 10, 2, 2);
    ctx.fillRect(7, 9, 3, 1);
    ctx.fillRect(10, 11, 2, 2);
    ctx.fillRect(13, 13, 2, 1);

    // Light highlights
    ctx.fillStyle = lightGreen;
    ctx.fillRect(3, 2, 1, 1);
    ctx.fillRect(7, 1, 1, 1);
    ctx.fillRect(5, 5, 1, 1);
    ctx.fillRect(9, 7, 1, 1);
    ctx.fillRect(4, 11, 1, 1);
    ctx.fillRect(11, 12, 1, 1);

    // Shadow details
    ctx.fillStyle = shadowGreen;
    ctx.fillRect(0, 3, 1, 2);
    ctx.fillRect(0, 8, 1, 3);
    ctx.fillRect(0, 13, 1, 3);
    ctx.fillRect(15, 4, 1, 2);
    ctx.fillRect(15, 9, 1, 3);
  }

  private drawALTTPWaterTile(ctx: CanvasRenderingContext2D, size: number): void {
    // ALTTP water with authentic SNES blue palette
    const deepBlue = '#004080';   // Dark water depths (#61 in ALTTP palette)
    const mediumBlue = '#0080E0'; // Deep ALTTP water blue (#65 in ALTTP palette)
    const lightBlue = '#40A0F0';  // Light water highlights (#69 in ALTTP palette)
    const white = '#F8F8F8';      // Wave foam (ALTTP white)

    // Base water
    ctx.fillStyle = deepBlue;
    ctx.fillRect(0, 0, size, size);

    // Water depth variation
    ctx.fillStyle = mediumBlue;
    ctx.fillRect(2, 2, 12, 1);
    ctx.fillRect(1, 4, 14, 2);
    ctx.fillRect(3, 7, 10, 1);
    ctx.fillRect(2, 9, 12, 2);
    ctx.fillRect(4, 12, 8, 2);

    // Surface highlights and waves
    ctx.fillStyle = lightBlue;
    ctx.fillRect(3, 3, 1, 1);
    ctx.fillRect(8, 2, 2, 1);
    ctx.fillRect(12, 4, 1, 1);
    ctx.fillRect(5, 8, 1, 1);
    ctx.fillRect(10, 9, 1, 1);
    ctx.fillRect(6, 13, 2, 1);

    // Wave foam
    ctx.fillStyle = white;
    ctx.fillRect(4, 3, 1, 1);
    ctx.fillRect(9, 2, 1, 1);
    ctx.fillRect(6, 8, 1, 1);
    ctx.fillRect(11, 13, 1, 1);
  }

  private drawALTTPForestTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Dense forest with tree trunks and foliage
    const darkGreen = '#2e7d32';  // Dark foliage
    const mediumGreen = '#388e3c'; // Medium foliage  
    const lightGreen = '#4caf50';  // Light foliage
    const brown = '#5d4037';       // Tree trunk
    const darkBrown = '#3e2723';   // Trunk shadows

    // Background foliage
    ctx.fillStyle = darkGreen;
    ctx.fillRect(0, 0, size, size);

    // Tree trunk
    ctx.fillStyle = brown;
    ctx.fillRect(6, 8, 4, 8);
    
    // Trunk highlights and shadows
    ctx.fillStyle = darkBrown;
    ctx.fillRect(6, 8, 1, 8);
    ctx.fillRect(6, 12, 4, 1);

    // Foliage clusters
    ctx.fillStyle = mediumGreen;
    ctx.fillRect(1, 1, 5, 4);
    ctx.fillRect(10, 0, 6, 5);
    ctx.fillRect(0, 6, 4, 5);
    ctx.fillRect(11, 7, 5, 4);
    ctx.fillRect(2, 12, 4, 4);

    // Light foliage highlights
    ctx.fillStyle = lightGreen;
    ctx.fillRect(2, 2, 2, 1);
    ctx.fillRect(11, 1, 2, 1);
    ctx.fillRect(1, 7, 1, 2);
    ctx.fillRect(12, 8, 2, 1);
    ctx.fillRect(3, 13, 1, 2);
  }

  private drawALTTPMountainTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Rocky mountain with proper shading
    const darkGray = '#424242';   // Base rock
    const mediumGray = '#616161';  // Mid tones
    const lightGray = '#757575';   // Highlights
    const shadow = '#212121';      // Deep shadows

    // Base mountain color
    ctx.fillStyle = mediumGray;
    ctx.fillRect(0, 0, size, size);

    // Rock face shading
    ctx.fillStyle = darkGray;
    ctx.fillRect(0, 0, 2, size);
    ctx.fillRect(2, 12, 14, 4);
    ctx.fillRect(8, 6, 8, 6);

    // Highlights on rock surfaces
    ctx.fillStyle = lightGray;
    ctx.fillRect(2, 0, 1, 12);
    ctx.fillRect(3, 2, 3, 1);
    ctx.fillRect(3, 5, 4, 1);
    ctx.fillRect(3, 8, 5, 1);
    ctx.fillRect(9, 7, 2, 1);
    ctx.fillRect(12, 9, 3, 1);

    // Deep crevices and shadows
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, 1, size);
    ctx.fillRect(7, 6, 1, 10);
    ctx.fillRect(2, 11, 5, 1);
    ctx.fillRect(11, 8, 1, 4);
  }

  private drawALTTPDesertTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Sandy desert with dune patterns
    const lightSand = '#fff176';   // Light sand
    const mediumSand = '#ffb74d';  // Medium sand
    const darkSand = '#ff8a65';    // Sand shadows
    const shadow = '#d84315';      // Deep shadows

    // Base sand color
    ctx.fillStyle = mediumSand;
    ctx.fillRect(0, 0, size, size);

    // Sand dune highlights
    ctx.fillStyle = lightSand;
    ctx.fillRect(0, 0, 16, 3);
    ctx.fillRect(0, 3, 8, 2);
    ctx.fillRect(0, 5, 4, 3);
    ctx.fillRect(10, 3, 6, 2);
    ctx.fillRect(12, 5, 4, 2);

    // Sand ripples and texture
    ctx.fillStyle = darkSand;
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(2, 10, 12, 1);
    ctx.fillRect(4, 12, 8, 1);
    ctx.fillRect(6, 14, 4, 1);

    // Shadow areas
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 9, 16, 1);
    ctx.fillRect(3, 11, 10, 1);
    ctx.fillRect(5, 13, 6, 1);
    ctx.fillRect(7, 15, 2, 1);

    // Small sand particles
    ctx.fillStyle = lightSand;
    for (let i = 0; i < 8; i++) {
      const x = (i * 3 + 1) % 16;
      const y = (i * 2 + 6) % 8 + 8;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  private drawALTTPSnowTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Snowy ground with texture
    const pureWhite = '#ffffff';   // Fresh snow
    const lightBlue = '#e3f2fd';   // Snow shadows
    const mediumBlue = '#bbdefb';  // Deeper shadows
    const darkBlue = '#90caf9';    // Ice/compacted snow

    // Base snow
    ctx.fillStyle = pureWhite;
    ctx.fillRect(0, 0, size, size);

    // Snow depth shadows
    ctx.fillStyle = lightBlue;
    ctx.fillRect(0, 4, 3, 1);
    ctx.fillRect(0, 8, 5, 1);
    ctx.fillRect(0, 12, 4, 1);
    ctx.fillRect(12, 2, 4, 1);
    ctx.fillRect(10, 6, 6, 1);
    ctx.fillRect(8, 10, 8, 1);

    // Compacted snow areas
    ctx.fillStyle = mediumBlue;
    ctx.fillRect(1, 5, 2, 2);
    ctx.fillRect(4, 9, 3, 2);
    ctx.fillRect(9, 3, 2, 1);
    ctx.fillRect(11, 7, 2, 2);
    ctx.fillRect(6, 13, 3, 1);

    // Ice patches
    ctx.fillStyle = darkBlue;
    ctx.fillRect(2, 6, 1, 1);
    ctx.fillRect(5, 10, 1, 1);
    ctx.fillRect(10, 3, 1, 1);
    ctx.fillRect(12, 8, 1, 1);
  }

  private drawALTTPMarshTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Swampy marsh with murky water and reeds
    const darkGreen = '#33691e';   // Murky water
    const mudBrown = '#5d4037';    // Mud
    const marsh = '#689f38';       // Marsh plants
    const lightGreen = '#8bc34a';  // Reed highlights

    // Murky water base
    ctx.fillStyle = darkGreen;
    ctx.fillRect(0, 0, size, size);

    // Mud patches
    ctx.fillStyle = mudBrown;
    ctx.fillRect(1, 1, 3, 2);
    ctx.fillRect(6, 3, 4, 3);
    ctx.fillRect(12, 1, 3, 4);
    ctx.fillRect(2, 8, 5, 3);
    ctx.fillRect(9, 9, 4, 2);
    ctx.fillRect(1, 13, 6, 2);
    ctx.fillRect(10, 12, 5, 3);

    // Marsh vegetation
    ctx.fillStyle = marsh;
    ctx.fillRect(0, 6, 1, 4);
    ctx.fillRect(5, 0, 1, 3);
    ctx.fillRect(8, 2, 1, 2);
    ctx.fillRect(15, 5, 1, 6);
    ctx.fillRect(11, 6, 1, 2);
    ctx.fillRect(4, 11, 1, 3);
    ctx.fillRect(8, 14, 1, 2);

    // Reed highlights
    ctx.fillStyle = lightGreen;
    ctx.fillRect(0, 6, 1, 1);
    ctx.fillRect(5, 0, 1, 1);
    ctx.fillRect(15, 5, 1, 1);
    ctx.fillRect(4, 11, 1, 1);
  }

  private drawALTTPVolcanicTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Volcanic rock with lava cracks
    const darkRock = '#212121';    // Volcanic rock
    const mediumRock = '#424242';  // Rock highlights
    const lavaRed = '#d32f2f';     // Lava
    const lavaOrange = '#ff5722';  // Lava glow
    const lavaYellow = '#ffc107';  // Lava highlights

    // Base volcanic rock
    ctx.fillStyle = darkRock;
    ctx.fillRect(0, 0, size, size);

    // Rock texture
    ctx.fillStyle = mediumRock;
    ctx.fillRect(2, 1, 3, 1);
    ctx.fillRect(7, 0, 4, 2);
    ctx.fillRect(13, 2, 2, 3);
    ctx.fillRect(1, 5, 4, 2);
    ctx.fillRect(8, 6, 3, 1);
    ctx.fillRect(3, 9, 5, 2);
    ctx.fillRect(10, 11, 4, 2);
    ctx.fillRect(1, 13, 6, 2);

    // Lava cracks
    ctx.fillStyle = lavaRed;
    ctx.fillRect(6, 2, 1, 8);
    ctx.fillRect(4, 7, 3, 1);
    ctx.fillRect(9, 4, 1, 4);
    ctx.fillRect(12, 8, 3, 1);

    // Lava glow
    ctx.fillStyle = lavaOrange;
    ctx.fillRect(6, 3, 1, 1);
    ctx.fillRect(6, 6, 1, 1);
    ctx.fillRect(5, 7, 1, 1);
    ctx.fillRect(9, 5, 1, 1);
    ctx.fillRect(13, 8, 1, 1);

    // Lava highlights
    ctx.fillStyle = lavaYellow;
    ctx.fillRect(6, 4, 1, 1);
    ctx.fillRect(6, 7, 1, 1);
    ctx.fillRect(9, 6, 1, 1);
  }

  private drawALTTPWallTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Stone brick wall
    const darkStone = '#424242';   // Base stone
    const mediumStone = '#616161'; // Stone face
    const lightStone = '#757575';  // Highlights
    const mortar = '#212121';      // Mortar lines

    // Base stone
    ctx.fillStyle = mediumStone;
    ctx.fillRect(0, 0, size, size);

    // Brick pattern
    ctx.fillStyle = darkStone;
    ctx.fillRect(0, 0, 8, 5);
    ctx.fillRect(8, 0, 8, 5);
    ctx.fillRect(0, 5, 4, 6);
    ctx.fillRect(4, 5, 8, 6);
    ctx.fillRect(12, 5, 4, 6);
    ctx.fillRect(0, 11, 8, 5);
    ctx.fillRect(8, 11, 8, 5);

    // Mortar lines
    ctx.fillStyle = mortar;
    // Horizontal mortar
    ctx.fillRect(0, 5, 16, 1);
    ctx.fillRect(0, 10, 16, 1);
    // Vertical mortar
    ctx.fillRect(7, 0, 1, 5);
    ctx.fillRect(3, 5, 1, 6);
    ctx.fillRect(11, 5, 1, 6);
    ctx.fillRect(7, 11, 1, 5);

    // Brick highlights
    ctx.fillStyle = lightStone;
    ctx.fillRect(1, 1, 1, 3);
    ctx.fillRect(9, 1, 1, 3);
    ctx.fillRect(1, 6, 1, 3);
    ctx.fillRect(5, 6, 1, 3);
    ctx.fillRect(13, 6, 1, 3);
    ctx.fillRect(1, 12, 1, 3);
    ctx.fillRect(9, 12, 1, 3);
  }

  private drawALTTPPathTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Dirt path with stone borders
    const lightBrown = '#8d6e63';  // Path surface
    const mediumBrown = '#6d4c41'; // Path base
    const darkBrown = '#4e342e';   // Path shadows
    const stone = '#616161';       // Stone markers

    // Path base
    ctx.fillStyle = mediumBrown;
    ctx.fillRect(0, 0, size, size);

    // Path surface
    ctx.fillStyle = lightBrown;
    ctx.fillRect(2, 2, 12, 12);

    // Path texture
    ctx.fillStyle = darkBrown;
    ctx.fillRect(3, 4, 1, 1);
    ctx.fillRect(6, 3, 1, 1);
    ctx.fillRect(9, 5, 1, 1);
    ctx.fillRect(12, 4, 1, 1);
    ctx.fillRect(4, 8, 1, 1);
    ctx.fillRect(7, 9, 1, 1);
    ctx.fillRect(10, 7, 1, 1);
    ctx.fillRect(5, 12, 1, 1);
    ctx.fillRect(8, 11, 1, 1);
    ctx.fillRect(11, 13, 1, 1);

    // Stone path markers
    ctx.fillStyle = stone;
    ctx.fillRect(1, 1, 2, 2);
    ctx.fillRect(13, 1, 2, 2);
    ctx.fillRect(1, 13, 2, 2);
    ctx.fillRect(13, 13, 2, 2);
  }

  private drawALTTPHouseTile(ctx: CanvasRenderingContext2D, size: number): void {
    // House roof tile
    const darkRed = '#b71c1c';     // Roof base
    const mediumRed = '#d32f2f';   // Roof highlights  
    const lightRed = '#f44336';    // Roof edges
    const shadow = '#424242';      // Roof shadows

    // Roof base
    ctx.fillStyle = mediumRed;
    ctx.fillRect(0, 0, size, size);

    // Roof tile pattern
    ctx.fillStyle = darkRed;
    ctx.fillRect(0, 0, 16, 3);
    ctx.fillRect(0, 4, 16, 3);
    ctx.fillRect(0, 8, 16, 3);
    ctx.fillRect(0, 12, 16, 3);

    // Tile highlights
    ctx.fillStyle = lightRed;
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 4, 16, 1);
    ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(0, 12, 16, 1);

    // Tile shadows
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 2, 16, 1);
    ctx.fillRect(0, 6, 16, 1);
    ctx.fillRect(0, 10, 16, 1);
    ctx.fillRect(0, 14, 16, 1);
  }

  private drawALTTPDoorTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Wooden door
    const darkBrown = '#3e2723';   // Door base
    const mediumBrown = '#5d4037'; // Wood grain
    const lightBrown = '#8d6e63';  // Wood highlights
    const metal = '#616161';       // Door hardware

    // Door base
    ctx.fillStyle = darkBrown;
    ctx.fillRect(0, 0, size, size);

    // Wood grain
    ctx.fillStyle = mediumBrown;
    ctx.fillRect(2, 1, 12, 14);

    // Wood planks
    ctx.fillStyle = lightBrown;
    ctx.fillRect(3, 2, 10, 1);
    ctx.fillRect(3, 5, 10, 1);
    ctx.fillRect(3, 8, 10, 1);
    ctx.fillRect(3, 11, 10, 1);

    // Door frame
    ctx.fillStyle = darkBrown;
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);

    // Door handle
    ctx.fillStyle = metal;
    ctx.fillRect(11, 7, 2, 2);
  }

  private drawALTTPBridgeTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Wooden bridge over water
    const darkBlue = '#1565c0';    // Water underneath
    const brown = '#5d4037';       // Bridge planks
    const lightBrown = '#8d6e63';  // Plank highlights
    const shadow = '#3e2723';      // Plank shadows

    // Water underneath
    ctx.fillStyle = darkBlue;
    ctx.fillRect(0, 0, size, size);

    // Bridge planks
    ctx.fillStyle = brown;
    ctx.fillRect(0, 6, 16, 4);

    // Plank details
    ctx.fillStyle = lightBrown;
    ctx.fillRect(0, 6, 16, 1);
    ctx.fillRect(0, 8, 16, 1);

    // Plank shadows
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 9, 16, 1);
    
    // Plank separations
    ctx.fillStyle = shadow;
    ctx.fillRect(4, 6, 1, 4);
    ctx.fillRect(8, 6, 1, 4);
    ctx.fillRect(12, 6, 1, 4);
  }

  private drawALTTPShrineTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Ancient shrine stone
    const darkStone = '#37474f';   // Base stone
    const mediumStone = '#546e7a'; // Stone face
    const lightStone = '#78909c';  // Highlights
    const mystic = '#9c27b0';      // Mystic glow

    // Base stone
    ctx.fillStyle = darkStone;
    ctx.fillRect(0, 0, size, size);

    // Stone blocks
    ctx.fillStyle = mediumStone;
    ctx.fillRect(1, 1, 6, 6);
    ctx.fillRect(9, 1, 6, 6);
    ctx.fillRect(1, 9, 6, 6);
    ctx.fillRect(9, 9, 6, 6);

    // Stone highlights
    ctx.fillStyle = lightStone;
    ctx.fillRect(2, 2, 1, 4);
    ctx.fillRect(10, 2, 1, 4);
    ctx.fillRect(2, 10, 1, 4);
    ctx.fillRect(10, 10, 1, 4);

    // Mystic runes/glow
    ctx.fillStyle = mystic;
    ctx.fillRect(7, 3, 2, 1);
    ctx.fillRect(7, 7, 2, 1);
    ctx.fillRect(3, 7, 1, 2);
    ctx.fillRect(12, 7, 1, 2);
    ctx.fillRect(7, 12, 2, 1);
  }

  private drawALTTPChestTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Treasure chest
    const darkBrown = '#3e2723';   // Chest base
    const mediumBrown = '#5d4037'; // Chest body
    const lightBrown = '#8d6e63';  // Wood highlights
    const gold = '#ffc107';        // Gold fittings
    const shadow = '#212121';      // Shadows

    // Ground/shadow
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 12, 16, 4);

    // Chest body
    ctx.fillStyle = mediumBrown;
    ctx.fillRect(3, 8, 10, 8);

    // Chest lid
    ctx.fillStyle = darkBrown;
    ctx.fillRect(3, 6, 10, 3);

    // Wood grain
    ctx.fillStyle = lightBrown;
    ctx.fillRect(4, 7, 8, 1);
    ctx.fillRect(4, 9, 8, 1);
    ctx.fillRect(4, 11, 8, 1);
    ctx.fillRect(4, 13, 8, 1);

    // Gold fittings
    ctx.fillStyle = gold;
    // Corners
    ctx.fillRect(3, 6, 1, 1);
    ctx.fillRect(12, 6, 1, 1);
    ctx.fillRect(3, 15, 1, 1);
    ctx.fillRect(12, 15, 1, 1);
    // Lock
    ctx.fillRect(7, 10, 2, 3);

    // Chest edges
    ctx.fillStyle = darkBrown;
    ctx.fillRect(3, 8, 1, 8);
    ctx.fillRect(12, 8, 1, 8);
    ctx.fillRect(3, 15, 10, 1);
  }

  private drawALTTPFlowerTile(ctx: CanvasRenderingContext2D, size: number): void {
    // Flower on grass
    const darkGreen = '#4a7c59';   // Grass base
    const mediumGreen = '#5a8c69';  // Grass mid
    const lightGreen = '#6a9c79';   // Grass highlights
    const flowerPink = '#e91e63';   // Flower petals
    const flowerYellow = '#ffeb3b'; // Flower center
    const stem = '#2e7d32';         // Flower stem

    // Grass base (simplified)
    ctx.fillStyle = darkGreen;
    ctx.fillRect(0, 0, size, size);

    // Grass texture
    ctx.fillStyle = mediumGreen;
    ctx.fillRect(1, 2, 3, 1);
    ctx.fillRect(6, 1, 4, 1);
    ctx.fillRect(12, 3, 2, 1);
    ctx.fillRect(0, 6, 2, 1);
    ctx.fillRect(4, 7, 3, 1);
    ctx.fillRect(9, 6, 4, 1);
    ctx.fillRect(2, 11, 3, 1);
    ctx.fillRect(7, 12, 4, 1);
    ctx.fillRect(13, 10, 2, 1);

    // Grass highlights
    ctx.fillStyle = lightGreen;
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(7, 1, 1, 1);
    ctx.fillRect(5, 7, 1, 1);
    ctx.fillRect(10, 6, 1, 1);
    ctx.fillRect(8, 12, 1, 1);

    // Flower stem
    ctx.fillStyle = stem;
    ctx.fillRect(7, 9, 1, 5);
    ctx.fillRect(8, 11, 1, 2);

    // Flower petals
    ctx.fillStyle = flowerPink;
    ctx.fillRect(6, 7, 1, 1);
    ctx.fillRect(8, 7, 1, 1);
    ctx.fillRect(5, 8, 1, 1);
    ctx.fillRect(9, 8, 1, 1);
    ctx.fillRect(6, 9, 1, 1);
    ctx.fillRect(8, 9, 1, 1);

    // Flower center
    ctx.fillStyle = flowerYellow;
    ctx.fillRect(7, 8, 1, 1);
  }

  /**
   * Generate ALTTP-quality character sprites with detailed animations
   */
  generateALTTPCharacterSprite(
    characterType: 'player' | 'npc' | 'enemy' = 'player',
    width: number = 16,
    height: number = 16
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width * 4; // 4 directions
    canvas.height = height * 3; // 3 frames per direction
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    switch (characterType) {
      case 'player':
        return this.generateALTTPPlayerSprite(ctx, width, height);
      case 'npc':
        return this.generateALTTPNPCSprite(ctx, width, height, '#9C27B0'); // Purple for keeper
      case 'enemy':
        return this.generateALTTPEnemySprite(ctx, width, height);
      default:
        return this.generateALTTPPlayerSprite(ctx, width, height);
    }
  }

  private generateALTTPPlayerSprite(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): HTMLCanvasElement {
    // ALTTP Link colors from authentic SNES palette
    const tunicGreen = '#00B800';     // Link's tunic green (#24 in ALTTP palette)
    const tunicDark = '#006000';      // Tunic shadows (#20 in ALTTP palette)
    const tunicLight = '#60E060';     // Tunic highlights (#28 in ALTTP palette)
    const skinTone = '#F8C898';       // Skin tone (#E4 in ALTTP palette)
    const skinShadow = '#D09060';     // Skin shadows (#E0 in ALTTP palette)
    const hairBrown = '#B06020';      // Hair brown (#D4 in ALTTP palette)
    const capGreen = '#00A000';       // Cap green (#23 in ALTTP palette)
    const bootsBrown = '#905030';     // Boots brown (#D2 in ALTTP palette)
    const black = '#000000';          // True black outline

    const directions = ['down', 'up', 'left', 'right'];
    
    directions.forEach((dir, dirIndex) => {
      for (let frame = 0; frame < 3; frame++) {
        const x = dirIndex * width;
        const y = frame * height;
        
        // Body (tunic)
        ctx.fillStyle = tunicGreen;
        ctx.fillRect(x + 4, y + 7, 8, 7);
        
        // Tunic shading
        ctx.fillStyle = tunicDark;
        ctx.fillRect(x + 4, y + 7, 1, 7);  // Left shadow
        ctx.fillRect(x + 4, y + 13, 8, 1); // Bottom shadow
        
        // Tunic highlights
        ctx.fillStyle = tunicLight;
        ctx.fillRect(x + 5, y + 8, 1, 2);
        ctx.fillRect(x + 10, y + 8, 1, 2);
        
        // Head
        ctx.fillStyle = skinTone;
        ctx.fillRect(x + 6, y + 3, 4, 4);
        
        // Head shading
        ctx.fillStyle = skinShadow;
        ctx.fillRect(x + 6, y + 6, 4, 1); // Neck shadow
        
        // Cap/hair
        ctx.fillStyle = capGreen;
        ctx.fillRect(x + 6, y + 2, 4, 2);
        
        // Hair highlights
        ctx.fillStyle = hairBrown;
        switch (dir) {
          case 'down':
          case 'up':
            ctx.fillRect(x + 5, y + 3, 1, 2); // Side hair
            ctx.fillRect(x + 10, y + 3, 1, 2);
            break;
          case 'left':
            ctx.fillRect(x + 10, y + 3, 1, 2);
            break;
          case 'right':
            ctx.fillRect(x + 5, y + 3, 1, 2);
            break;
        }
        
        // Face details
        ctx.fillStyle = black;
        switch (dir) {
          case 'down':
            ctx.fillRect(x + 7, y + 4, 1, 1); // Left eye
            ctx.fillRect(x + 8, y + 4, 1, 1); // Right eye
            break;
          case 'up':
            // Back of head - no face
            break;
          case 'left':
            ctx.fillRect(x + 7, y + 4, 1, 1); // Visible eye
            break;
          case 'right':
            ctx.fillRect(x + 8, y + 4, 1, 1); // Visible eye
            break;
        }
        
        // Arms
        ctx.fillStyle = tunicGreen;
        if (dir === 'left' || dir === 'right') {
          // Side view arms
          const armX = dir === 'left' ? x + 3 : x + 12;
          const armOffset = frame === 1 ? 1 : 0; // Swing animation
          ctx.fillRect(armX, y + 8 + armOffset, 1, 4);
        } else {
          // Front/back view arms
          ctx.fillRect(x + 3, y + 8, 1, 3);
          ctx.fillRect(x + 12, y + 8, 1, 3);
        }
        
        // Legs and walking animation
        ctx.fillStyle = tunicGreen;
        const legOffset = frame === 1 ? 0 : (frame === 0 ? -1 : 1);
        ctx.fillRect(x + 5, y + 14, 2, 1); // Left leg
        ctx.fillRect(x + 9, y + 14, 2, 1); // Right leg
        
        // Boots
        ctx.fillStyle = bootsBrown;
        ctx.fillRect(x + 5 + legOffset, y + 15, 2, 1); // Left boot
        ctx.fillRect(x + 9 - legOffset, y + 15, 2, 1); // Right boot
        
        // Outline details
        ctx.fillStyle = black;
        // Head outline
        ctx.fillRect(x + 5, y + 2, 1, 1); // Top left
        ctx.fillRect(x + 10, y + 2, 1, 1); // Top right
        ctx.fillRect(x + 5, y + 6, 1, 1); // Bottom left  
        ctx.fillRect(x + 10, y + 6, 1, 1); // Bottom right
      }
    });

    return ctx.canvas;
  }

  private generateALTTPNPCSprite(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    robeColor: string = '#8040C0' // Purple robe (#9A in ALTTP palette)
  ): HTMLCanvasElement {
    // NPC colors (robed figure like Keeper Elowen) - authentic ALTTP palette
    const robePrimary = robeColor;
    const robeDark = this.darkenColor(robeColor, 0.3);
    const robeLight = this.lightenColor(robeColor, 0.2);
    const skinTone = '#F8C898';      // Skin tone (#E4 in ALTTP palette)
    const skinShadow = '#D09060';    // Skin shadows (#E0 in ALTTP palette)
    const black = '#000000';         // True black outline

    const directions = ['down', 'up', 'left', 'right'];
    
    directions.forEach((dir, dirIndex) => {
      for (let frame = 0; frame < 3; frame++) {
        const x = dirIndex * width;
        const y = frame * height;
        
        // Robe body
        ctx.fillStyle = robePrimary;
        ctx.fillRect(x + 3, y + 6, 10, 9);
        
        // Robe shading
        ctx.fillStyle = robeDark;
        ctx.fillRect(x + 3, y + 6, 2, 9);
        ctx.fillRect(x + 3, y + 13, 10, 2);
        
        // Robe highlights
        ctx.fillStyle = robeLight;
        ctx.fillRect(x + 5, y + 7, 1, 2);
        ctx.fillRect(x + 8, y + 7, 2, 1);
        
        // Hood/head
        ctx.fillStyle = robeDark;
        ctx.fillRect(x + 5, y + 2, 6, 4);
        
        // Face (visible under hood)
        ctx.fillStyle = skinTone;
        ctx.fillRect(x + 6, y + 3, 4, 3);
        
        // Face shading
        ctx.fillStyle = skinShadow;
        ctx.fillRect(x + 6, y + 5, 4, 1);
        
        // Eyes
        ctx.fillStyle = black;
        if (dir === 'down') {
          ctx.fillRect(x + 7, y + 4, 1, 1);
          ctx.fillRect(x + 8, y + 4, 1, 1);
        } else if (dir === 'left') {
          ctx.fillRect(x + 7, y + 4, 1, 1);
        } else if (dir === 'right') {
          ctx.fillRect(x + 8, y + 4, 1, 1);
        }
        
        // Staff or hands (minimal animation)
        ctx.fillStyle = '#8B4513'; // Brown staff
        if (frame === 1) {
          ctx.fillRect(x + 2, y + 4, 1, 8); // Staff
        }
      }
    });

    return ctx.canvas;
  }

  private generateALTTPEnemySprite(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): HTMLCanvasElement {
    // Basic enemy colors (goblin-like) using authentic ALTTP palette
    const skinGreen = '#406040';     // Goblin base green (#44 in ALTTP palette)
    const skinDark = '#204020';      // Goblin shadow green (#40 in ALTTP palette)
    const skinLight = '#80A080';     // Goblin highlight green (#48 in ALTTP palette)
    const clothBrown = '#906040';    // Wooden structure brown (#D3 in ALTTP palette)
    const clothDark = '#603020';     // Wood shadow brown (#CF in ALTTP palette)
    const black = '#000000';         // True black outline
    const red = '#E00000';           // Bright red enemy eyes (#A0 in ALTTP palette)

    const directions = ['down', 'up', 'left', 'right'];
    
    directions.forEach((dir, dirIndex) => {
      for (let frame = 0; frame < 3; frame++) {
        const x = dirIndex * width;
        const y = frame * height;
        
        // Body
        ctx.fillStyle = clothBrown;
        ctx.fillRect(x + 4, y + 8, 8, 6);
        
        // Body shading
        ctx.fillStyle = clothDark;
        ctx.fillRect(x + 4, y + 8, 1, 6);
        ctx.fillRect(x + 4, y + 13, 8, 1);
        
        // Head
        ctx.fillStyle = skinGreen;
        ctx.fillRect(x + 5, y + 3, 6, 5);
        
        // Head shading
        ctx.fillStyle = skinDark;
        ctx.fillRect(x + 5, y + 3, 1, 5);
        ctx.fillRect(x + 5, y + 7, 6, 1);
        
        // Head highlights
        ctx.fillStyle = skinLight;
        ctx.fillRect(x + 9, y + 4, 1, 2);
        
        // Eyes (red)
        ctx.fillStyle = red;
        if (dir === 'down') {
          ctx.fillRect(x + 6, y + 5, 1, 1);
          ctx.fillRect(x + 9, y + 5, 1, 1);
        } else if (dir === 'left') {
          ctx.fillRect(x + 6, y + 5, 1, 1);
        } else if (dir === 'right') {
          ctx.fillRect(x + 9, y + 5, 1, 1);
        }
        
        // Legs (walking animation)
        ctx.fillStyle = skinGreen;
        const legOffset = frame === 1 ? 1 : 0;
        ctx.fillRect(x + 5, y + 14 + legOffset, 2, 1);
        ctx.fillRect(x + 9, y + 14 - legOffset, 2, 1);
        
        // Weapon (simple club)
        ctx.fillStyle = clothBrown;
        if (dir === 'left') {
          ctx.fillRect(x + 2, y + 6, 1, 4);
          ctx.fillRect(x + 1, y + 6, 1, 1);
        } else if (dir === 'right') {
          ctx.fillRect(x + 13, y + 6, 1, 4);
          ctx.fillRect(x + 14, y + 6, 1, 1);
        }
      }
    });

    return ctx.canvas;
  }

  // Utility functions for color manipulation
  private darkenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));
    return `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
  }

  private lightenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + factor));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + factor));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + factor));
    return `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
  }
}

export const spriteManager = new SpriteManager();