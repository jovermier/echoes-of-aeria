/**
 * TileRenderer - Advanced ALTTP-style tile rendering with layering and animations
 * Handles tilemap rendering, animations, and layering with authentic 16-bit quality
 * Enhanced with ALTTP Tileset Manager integration
 */

import { spriteManager } from './SpriteManager';
import { altttpTilesetManager, ALTTPTileVariant, ALTTPTileLayer } from './ALTTPTilesetManager';
import { TileType } from '@shared/types.js';

export interface TileData {
  baseType: number;
  variant?: number;
  animated?: boolean;
  animationFrames?: number;
  animationSpeed?: number;
  passable?: boolean;
  interactive?: boolean;
  // Enhanced ALTTP properties
  altttpVariantId?: string;
  layerType?: 'ground' | 'decoration' | 'overlay' | 'collision';
  depth?: number; // For depth sorting within layers
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'screen';
  flipX?: boolean;
  flipY?: boolean;
  rotation?: number;
}

export interface TileLayer {
  name: string;
  tiles: (TileData | null)[][];
  opacity: number;
  visible: boolean;
  // Enhanced ALTTP layer properties
  zIndex?: number;
  blendMode?: 'normal' | 'multiply' | 'overlay' | 'screen';
  scrollSpeed?: { x: number; y: number }; // For parallax effects
  animated?: boolean;
}

export interface ALTTPTileMap {
  width: number;
  height: number;
  layers: Map<string, TileLayer>;
  tileSize: number;
  backgroundMusic?: string;
  ambientSounds?: string[];
}

export class TileRenderer {
  private tileSize: number = 16;
  private tilesetCanvas: HTMLCanvasElement;
  private tilesetCtx: CanvasRenderingContext2D;
  private tileCache: Map<string, HTMLCanvasElement> = new Map();
  private animationTimers: Map<string, number> = new Map();
  private layerOrder: ALTTPTileLayer[] = [];
  private currentTileMap: ALTTPTileMap | null = null;
  
  // Performance optimization
  private cullingEnabled: boolean = true;
  private lastRenderTime: number = 0;
  private frameSkipThreshold: number = 16.67; // ~60 FPS

  constructor() {
    this.tilesetCanvas = document.createElement('canvas');
    this.tilesetCanvas.width = 512; // Increased for ALTTP tileset
    this.tilesetCanvas.height = 512;
    this.tilesetCtx = this.tilesetCanvas.getContext('2d')!;
    this.tilesetCtx.imageSmoothingEnabled = false;
    
    // Initialize ALTTP layer order
    this.layerOrder = altttpTilesetManager.getLayers();
    
    this.generateDefaultTileset();
  }

  private generateDefaultTileset(): void {
    // Generate a default tileset with programmatic pixel art
    const tileTypes = [
      { type: 'grass', color: '#4a8c4a', secondary: '#3a7c3a' },
      { type: 'water', color: '#2196f3', secondary: '#1976d2' },
      { type: 'stone', color: '#757575', secondary: '#555555' },
      { type: 'dirt', color: '#8b6914', secondary: '#6b4423' },
      { type: 'sand', color: '#f4e4c1', secondary: '#e6d2a3' },
      { type: 'grass', color: '#2e7d32', secondary: '#1b5e20' }, // Dark grass
      { type: 'water', color: '#0288d1', secondary: '#01579b' }, // Deep water
      { type: 'stone', color: '#424242', secondary: '#212121' }, // Dark stone
    ];

    tileTypes.forEach((tileInfo, index) => {
      const x = (index % 16) * this.tileSize;
      const y = Math.floor(index / 16) * this.tileSize;
      
      const tile = spriteManager.generateTile(
        tileInfo.type,
        this.tileSize,
        tileInfo.color,
        tileInfo.secondary
      );
      
      this.tilesetCtx.drawImage(tile, x, y);
      
      // Cache individual tiles
      this.tileCache.set(`tile_${index}`, tile);
    });

    // Add decorative tiles
    this.generateDecorationTiles();
  }

  private generateDecorationTiles(): void {
    // Generate flowers, bushes, rocks, etc.
    const decorations = [
      { name: 'flower', baseColor: '#ff6b9d', stemColor: '#4a8c4a' },
      { name: 'bush', baseColor: '#2e7d32', shadowColor: '#1b5e20' },
      { name: 'rock', baseColor: '#9e9e9e', shadowColor: '#616161' },
      { name: 'tree_stump', baseColor: '#6d4c41', ringColor: '#4e342e' },
    ];

    decorations.forEach((deco, index) => {
      const tileIndex = 16 + index; // Start after basic tiles
      const x = (tileIndex % 16) * this.tileSize;
      const y = Math.floor(tileIndex / 16) * this.tileSize;
      
      const canvas = document.createElement('canvas');
      canvas.width = this.tileSize;
      canvas.height = this.tileSize;
      const ctx = canvas.getContext('2d')!;

      switch (deco.name) {
        case 'flower':
          this.drawFlower(ctx, deco.baseColor, deco.stemColor);
          break;
        case 'bush':
          this.drawBush(ctx, deco.baseColor, deco.shadowColor);
          break;
        case 'rock':
          this.drawRock(ctx, deco.baseColor, deco.shadowColor);
          break;
        case 'tree_stump':
          this.drawTreeStump(ctx, deco.baseColor, deco.ringColor);
          break;
      }

      this.tilesetCtx.drawImage(canvas, x, y);
      this.tileCache.set(`deco_${deco.name}`, canvas);
    });
  }

  private drawFlower(ctx: CanvasRenderingContext2D, petalColor: string, stemColor: string): void {
    const size = this.tileSize;
    
    // Stem
    ctx.fillStyle = stemColor;
    ctx.fillRect(size / 2 - 1, size / 2 + 2, 2, 6);
    
    // Petals
    ctx.fillStyle = petalColor;
    const centerX = size / 2;
    const centerY = size / 2;
    
    // Draw 5 petals
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const petalX = centerX + Math.cos(angle) * 3;
      const petalY = centerY + Math.sin(angle) * 3;
      ctx.fillRect(petalX - 1, petalY - 1, 3, 3);
    }
    
    // Center
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(centerX - 1, centerY - 1, 2, 2);
  }

  private drawBush(ctx: CanvasRenderingContext2D, baseColor: string, shadowColor: string): void {
    const size = this.tileSize;
    
    // Shadow/base
    ctx.fillStyle = shadowColor;
    ctx.fillRect(2, size - 4, size - 4, 3);
    
    // Main bush body
    ctx.fillStyle = baseColor;
    ctx.fillRect(3, 6, size - 6, size - 9);
    
    // Rounded top
    ctx.fillRect(4, 5, size - 8, 1);
    ctx.fillRect(5, 4, size - 10, 1);
    
    // Highlights
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(5, 7, 2, 2);
    ctx.fillRect(size - 7, 8, 2, 2);
  }

  private drawRock(ctx: CanvasRenderingContext2D, baseColor: string, shadowColor: string): void {
    const size = this.tileSize;
    
    // Main rock body
    ctx.fillStyle = baseColor;
    ctx.fillRect(4, 6, 8, 8);
    
    // Irregular edges
    ctx.fillRect(3, 7, 1, 6);
    ctx.fillRect(12, 7, 1, 5);
    ctx.fillRect(5, 5, 6, 1);
    ctx.fillRect(5, 14, 6, 1);
    
    // Shadow
    ctx.fillStyle = shadowColor;
    ctx.fillRect(5, 12, 6, 2);
    ctx.fillRect(4, 10, 2, 2);
    
    // Highlight
    ctx.fillStyle = '#bdbdbd';
    ctx.fillRect(6, 7, 2, 2);
  }

  private drawTreeStump(ctx: CanvasRenderingContext2D, baseColor: string, ringColor: string): void {
    const size = this.tileSize;
    
    // Base stump
    ctx.fillStyle = baseColor;
    ctx.fillRect(4, 4, 8, 8);
    
    // Tree rings
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(5, 5, 6, 6);
    ctx.strokeRect(6, 6, 4, 4);
    
    // Center
    ctx.fillStyle = ringColor;
    ctx.fillRect(7, 7, 2, 2);
  }

  /**
   * Enhanced ALTTP-style tilemap rendering with layered depth
   */
  renderALTTPTileMap(
    ctx: CanvasRenderingContext2D,
    tileMap: ALTTPTileMap,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    currentTime: number
  ): void {
    if (!tileMap || tileMap.layers.size === 0) return;

    // Performance check
    if (currentTime - this.lastRenderTime < this.frameSkipThreshold) {
      return;
    }
    this.lastRenderTime = currentTime;

    // Render layers in Z-order (background to foreground)
    const sortedLayers = this.layerOrder
      .map(layerDef => tileMap.layers.get(layerDef.name))
      .filter(layer => layer && layer.visible)
      .sort((a, b) => (a!.zIndex || 0) - (b!.zIndex || 0));

    sortedLayers.forEach(layer => {
      if (layer) {
        this.renderTileLayer(ctx, layer, cameraX, cameraY, viewportWidth, viewportHeight, currentTime);
      }
    });
  }

  renderTileLayer(
    ctx: CanvasRenderingContext2D,
    layer: TileLayer,
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    currentTime: number
  ): void {
    if (!layer.visible) return;

    // Viewport culling for performance
    const startTileX = Math.max(0, Math.floor(cameraX / this.tileSize) - 1);
    const startTileY = Math.max(0, Math.floor(cameraY / this.tileSize) - 1);
    const endTileX = Math.min(layer.tiles[0]?.length || 0, Math.ceil((cameraX + viewportWidth) / this.tileSize) + 1);
    const endTileY = Math.min(layer.tiles.length, Math.ceil((cameraY + viewportHeight) / this.tileSize) + 1);

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.imageSmoothingEnabled = false; // Crisp pixel art

    // Apply layer blend mode
    if (layer.blendMode && layer.blendMode !== 'normal') {
      ctx.globalCompositeOperation = layer.blendMode;
    }

    // Apply parallax scrolling if configured
    let scrollOffsetX = 0;
    let scrollOffsetY = 0;
    if (layer.scrollSpeed) {
      scrollOffsetX = cameraX * (1 - layer.scrollSpeed.x);
      scrollOffsetY = cameraY * (1 - layer.scrollSpeed.y);
    }

    // Collect tiles for depth sorting if needed
    const tilesToRender: Array<{
      tile: TileData;
      x: number;
      y: number;
      screenX: number;
      screenY: number;
    }> = [];

    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        if (y < 0 || y >= layer.tiles.length || x < 0 || x >= layer.tiles[0].length) {
          continue;
        }

        const tile = layer.tiles[y][x];
        if (!tile) continue;

        const screenX = x * this.tileSize - cameraX + scrollOffsetX;
        const screenY = y * this.tileSize - cameraY + scrollOffsetY;

        tilesToRender.push({ tile, x, y, screenX, screenY });
      }
    }

    // Sort by depth if needed (for proper layering within the same layer)
    if (tilesToRender.some(t => t.tile.depth !== undefined)) {
      tilesToRender.sort((a, b) => (a.tile.depth || 0) - (b.tile.depth || 0));
    }

    // Render sorted tiles
    tilesToRender.forEach(({ tile, x, y, screenX, screenY }) => {
      if (tile.animated || tile.altttpVariantId) {
        this.renderALTTPTile(ctx, tile, screenX, screenY, currentTime, `${x},${y}`);
      } else {
        this.renderStaticTile(ctx, tile, screenX, screenY);
      }
    });

    ctx.restore();
  }

  /**
   * Render ALTTP-style tile with enhanced features
   */
  private renderALTTPTile(
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    x: number,
    y: number,
    currentTime: number,
    tileKey: string
  ): void {
    // Get ALTTP variant if specified
    if (tile.altttpVariantId) {
      const variant = altttpTilesetManager.getTileVariant(tile.altttpVariantId);
      const cachedTile = altttpTilesetManager.getCachedTile(tile.altttpVariantId);
      
      if (variant && cachedTile) {
        ctx.save();
        
        // Apply transformations
        if (tile.flipX || tile.flipY || tile.rotation) {
          ctx.translate(x + this.tileSize / 2, y + this.tileSize / 2);
          
          if (tile.rotation) {
            ctx.rotate(tile.rotation * Math.PI / 180);
          }
          
          if (tile.flipX || tile.flipY) {
            ctx.scale(tile.flipX ? -1 : 1, tile.flipY ? -1 : 1);
          }
          
          ctx.translate(-this.tileSize / 2, -this.tileSize / 2);
          ctx.drawImage(cachedTile, 0, 0);
        } else {
          ctx.drawImage(cachedTile, x, y);
        }
        
        // Handle animation for ALTTP tiles
        if (variant.animated && variant.animationFrames && variant.animationFrames > 1) {
          this.handleALTTPAnimation(ctx, variant, x, y, currentTime, tileKey);
        }
        
        ctx.restore();
        return;
      }
    }

    // Fallback to animated or static rendering
    if (tile.animated) {
      this.renderAnimatedTile(ctx, tile, x, y, currentTime, tileKey);
    } else {
      this.renderStaticTile(ctx, tile, x, y);
    }
  }

  /**
   * Handle ALTTP tile animations with proper timing
   */
  private handleALTTPAnimation(
    ctx: CanvasRenderingContext2D,
    variant: ALTTPTileVariant,
    x: number,
    y: number,
    currentTime: number,
    tileKey: string
  ): void {
    if (!variant.animated || !variant.animationFrames || !variant.animationSpeed) return;

    // Get or initialize timer
    if (!this.animationTimers.has(tileKey)) {
      this.animationTimers.set(tileKey, currentTime);
    }

    const startTime = this.animationTimers.get(tileKey)!;
    const elapsed = currentTime - startTime;
    const currentFrame = Math.floor(elapsed / variant.animationSpeed) % variant.animationFrames;

    // Get the specific animation frame
    const frameVariantId = `${variant.id}_${currentFrame}`;
    const frameTile = altttpTilesetManager.getCachedTile(frameVariantId);
    
    if (frameTile) {
      ctx.drawImage(frameTile, x, y);
    }
  }

  private renderStaticTile(
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    x: number,
    y: number
  ): void {
    const cachedTile = this.tileCache.get(`tile_${tile.baseType}`);
    if (cachedTile) {
      ctx.drawImage(cachedTile, x, y);
    } else {
      // Fallback to tileset
      const tileX = (tile.baseType % 16) * this.tileSize;
      const tileY = Math.floor(tile.baseType / 16) * this.tileSize;
      
      ctx.drawImage(
        this.tilesetCanvas,
        tileX, tileY,
        this.tileSize, this.tileSize,
        x, y,
        this.tileSize, this.tileSize
      );
    }
  }

  private renderAnimatedTile(
    ctx: CanvasRenderingContext2D,
    tile: TileData,
    x: number,
    y: number,
    currentTime: number,
    tileKey: string
  ): void {
    const animSpeed = tile.animationSpeed || 500; // ms per frame
    const frameCount = tile.animationFrames || 2;
    
    // Get or initialize timer for this tile
    if (!this.animationTimers.has(tileKey)) {
      this.animationTimers.set(tileKey, currentTime);
    }
    
    const startTime = this.animationTimers.get(tileKey)!;
    const elapsed = currentTime - startTime;
    const currentFrame = Math.floor(elapsed / animSpeed) % frameCount;
    
    // Render the appropriate frame
    const tileType = tile.baseType + currentFrame;
    this.renderStaticTile(ctx, { ...tile, baseType: tileType }, x, y);
  }

  /**
   * Create ALTTP-style tilemap with layered structure
   */
  createALTTPTileMap(
    width: number,
    height: number,
    backgroundMusic?: string,
    ambientSounds?: string[]
  ): ALTTPTileMap {
    const layers = new Map<string, TileLayer>();
    
    // Create standard ALTTP layers
    const altttpLayers = altttpTilesetManager.getLayers();
    altttpLayers.forEach(layerDef => {
      layers.set(layerDef.name, this.createTileLayer(
        layerDef.name,
        width,
        height,
        null,
        layerDef.zIndex || 0,
        layerDef.blendMode
      ));
    });
    
    return {
      width,
      height,
      layers,
      tileSize: this.tileSize,
      backgroundMusic,
      ambientSounds
    };
  }

  createTileLayer(
    name: string,
    width: number,
    height: number,
    defaultTile?: TileData | null,
    zIndex: number = 0,
    blendMode?: 'normal' | 'multiply' | 'overlay' | 'screen'
  ): TileLayer {
    const tiles: (TileData | null)[][] = [];
    
    for (let y = 0; y < height; y++) {
      tiles[y] = [];
      for (let x = 0; x < width; x++) {
        tiles[y][x] = defaultTile || null;
      }
    }

    return {
      name,
      tiles,
      opacity: 1,
      visible: true,
      zIndex,
      blendMode: blendMode || 'normal',
      scrollSpeed: { x: 1, y: 1 },
      animated: false
    };
  }

  /**
   * Convert simple world data to ALTTP tilemap format
   */
  convertWorldToALTTPTileMap(
    worldTiles: { tileType: number; walkable: boolean; region?: string }[][],
    width: number,
    height: number
  ): ALTTPTileMap {
    const tileMap = this.createALTTPTileMap(width, height);
    
    // Convert world tiles to layered ALTTP format
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y < worldTiles.length && x < worldTiles[y].length) {
          const worldTile = worldTiles[y][x];
          this.placeALTTPTile(tileMap, x, y, worldTile.tileType as TileType, {
            region: worldTile.region,
            walkable: worldTile.walkable
          });
        }
      }
    }
    
    return tileMap;
  }

  /**
   * Place an ALTTP tile with smart variant selection and layer assignment
   */
  placeALTTPTile(
    tileMap: ALTTPTileMap,
    x: number,
    y: number,
    tileType: TileType,
    context?: { region?: string; walkable?: boolean; environment?: string }
  ): void {
    // Get optimal variant for this tile type and context
    const variantId = altttpTilesetManager.getOptimalTileVariant(tileType, {
      environment: context?.region
    });
    
    const variant = altttpTilesetManager.getTileVariant(variantId);
    if (!variant) {
      console.warn(`No variant found for ${variantId}`);
      return;
    }

    // Determine appropriate layer based on tile type
    const layerName = this.getLayerForTileType(variant.layerType);
    const layer = tileMap.layers.get(layerName);
    
    if (layer && y < layer.tiles.length && x < layer.tiles[y].length) {
      layer.tiles[y][x] = {
        baseType: tileType,
        variant: variant.variant,
        altttpVariantId: variantId,
        layerType: variant.layerType,
        animated: variant.animated,
        animationFrames: variant.animationFrames,
        animationSpeed: variant.animationSpeed,
        passable: context?.walkable ?? true,
        interactive: false
      };
    }
  }

  private getLayerForTileType(layerType: 'ground' | 'decoration' | 'overlay' | 'collision'): string {
    switch (layerType) {
      case 'ground': return 'ground';
      case 'decoration': return 'decoration';
      case 'overlay': return 'overlay';
      case 'collision': return 'background'; // Hidden collision layer
      default: return 'ground';
    }
  }

  /**
   * Add environmental storytelling elements to tilemap
   */
  addEnvironmentalDetails(
    tileMap: ALTTPTileMap,
    region: string,
    density: number = 0.1
  ): void {
    const width = tileMap.width;
    const height = tileMap.height;
    const decorLayer = tileMap.layers.get('decoration');
    
    if (!decorLayer) return;
    
    // Add region-specific environmental details
    for (let attempts = 0; attempts < width * height * density; attempts++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      // Skip if tile already occupied
      if (decorLayer.tiles[y][x]) continue;
      
      // Add appropriate decoration based on region and surrounding context
      const decorationId = this.selectEnvironmentalDecoration(region, x, y, tileMap);
      if (decorationId) {
        const variant = altttpTilesetManager.getTileVariant(decorationId);
        if (variant) {
          decorLayer.tiles[y][x] = {
            baseType: variant.tileType,
            variant: variant.variant,
            altttpVariantId: decorationId,
            layerType: 'decoration',
            animated: variant.animated,
            animationFrames: variant.animationFrames,
            animationSpeed: variant.animationSpeed,
            passable: true,
            interactive: false
          };
        }
      }
    }
  }

  private selectEnvironmentalDecoration(
    region: string,
    x: number,
    y: number,
    tileMap: ALTTPTileMap
  ): string | null {
    const groundLayer = tileMap.layers.get('ground');
    if (!groundLayer || !groundLayer.tiles[y] || !groundLayer.tiles[y][x]) return null;
    
    const groundTile = groundLayer.tiles[y][x];
    if (!groundTile) return null;
    
    // Select decoration based on ground type and region
    const decorationOptions: string[] = [];
    
    switch (groundTile.baseType) {
      case TileType.GRASS:
        decorationOptions.push('flower_red', 'flower_blue', 'bush_green');
        if (region === 'Whisperwood') {
          decorationOptions.push('mushroom_red', 'rock_small');
        }
        break;
      case TileType.FOREST:
        decorationOptions.push('mushroom_red', 'bush_green');
        break;
      case TileType.DESERT:
        decorationOptions.push('rock_small', 'rock_large');
        break;
    }
    
    return decorationOptions.length > 0 
      ? decorationOptions[Math.floor(Math.random() * decorationOptions.length)]
      : null;
  }

  setTile(layer: TileLayer, x: number, y: number, tile: TileData | null): void {
    if (y >= 0 && y < layer.tiles.length && x >= 0 && x < layer.tiles[0].length) {
      layer.tiles[y][x] = tile;
    }
  }

  getTilesetCanvas(): HTMLCanvasElement {
    return this.tilesetCanvas;
  }
}

export const tileRenderer = new TileRenderer();