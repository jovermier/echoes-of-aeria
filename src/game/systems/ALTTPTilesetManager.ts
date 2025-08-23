/**
 * ALTTP Tileset Manager - Comprehensive ALTTP-style tileset creation and management
 * Creates authentic 16-bit quality tiles with proper layering and animation support
 * Building upon the excellent SpriteManager foundation
 */

import { spriteManager } from './SpriteManager';
import { TileType } from '@shared/types.js';
import { ALTTP_PALETTE, TILE_COLORS } from '@shared/constants.js';

export interface ALTTPTileVariant {
  id: string;
  tileType: TileType;
  variant: number;
  layerType: 'ground' | 'decoration' | 'overlay' | 'collision';
  animated?: boolean;
  animationFrames?: number;
  animationSpeed?: number;
  autotile?: boolean; // For smart tile connections
  connectionRules?: TileConnectionRule[];
}

export interface TileConnectionRule {
  adjacentType: TileType;
  direction: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest';
  resultVariant: number;
}

export interface ALTTPTileLayer {
  name: string;
  zIndex: number;
  opacity: number;
  visible: boolean;
  blendMode?: 'normal' | 'multiply' | 'overlay';
}

export class ALTTPTilesetManager {
  private tilesetCanvas: HTMLCanvasElement;
  private tilesetCtx: CanvasRenderingContext2D;
  private tileVariants: Map<string, ALTTPTileVariant> = new Map();
  private tileCache: Map<string, HTMLCanvasElement> = new Map();
  private animatedTiles: Map<string, number> = new Map();
  private readonly TILE_SIZE = 16;
  private readonly TILESET_WIDTH = 32; // 32 tiles wide
  private readonly TILESET_HEIGHT = 32; // 32 tiles tall

  // ALTTP Layer definitions matching authentic visual depth
  private readonly ALTTP_LAYERS: ALTTPTileLayer[] = [
    { name: 'background', zIndex: 0, opacity: 1, visible: true },
    { name: 'ground', zIndex: 1, opacity: 1, visible: true },
    { name: 'decoration', zIndex: 2, opacity: 1, visible: true },
    { name: 'overlay', zIndex: 3, opacity: 1, visible: true },
    { name: 'effects', zIndex: 4, opacity: 0.8, visible: true, blendMode: 'overlay' }
  ];

  constructor() {
    this.tilesetCanvas = document.createElement('canvas');
    this.tilesetCanvas.width = this.TILESET_WIDTH * this.TILE_SIZE;
    this.tilesetCanvas.height = this.TILESET_HEIGHT * this.TILE_SIZE;
    this.tilesetCtx = this.tilesetCanvas.getContext('2d')!;
    this.tilesetCtx.imageSmoothingEnabled = false;

    this.initializeALTTPTileset();
  }

  private initializeALTTPTileset(): void {
    console.log('Initializing comprehensive ALTTP-style tileset...');
    
    // Create base terrain tiles with variations
    this.createTerrainTileVariants();
    
    // Create structure tiles (buildings, walls, etc.)
    this.createStructureTileVariants();
    
    // Create decoration tiles (objects, plants, etc.)
    this.createDecorationTileVariants();
    
    // Create animated tiles (water, lava, etc.)
    this.createAnimatedTileVariants();
    
    // Create autotiling rules for seamless connections
    this.setupAutotilingRules();
    
    console.log(`ALTTP Tileset initialized with ${this.tileVariants.size} tile variants`);
  }

  private createTerrainTileVariants(): void {
    // Grass terrain with multiple variants
    this.createGrassVariants();
    
    // Water with depth variations and animated waves
    this.createWaterVariants();
    
    // Forest with different tree densities
    this.createForestVariants();
    
    // Mountain/cliff tiles with proper edges
    this.createMountainVariants();
    
    // Desert with sand patterns
    this.createDesertVariants();
    
    // Snow with drift patterns
    this.createSnowVariants();
    
    // Marsh with organic patterns
    this.createMarshVariants();
    
    // Volcanic with lava flows
    this.createVolcanicVariants();
  }

  private createGrassVariants(): void {
    // Base grass
    this.addTileVariant('grass_base', TileType.GRASS, 0, 'ground');
    this.generateAndCacheTile('grass_base', (ctx) => this.drawEnhancedGrassTile(ctx, 0));
    
    // Grass with flower patches
    this.addTileVariant('grass_flowers', TileType.GRASS, 1, 'ground');
    this.generateAndCacheTile('grass_flowers', (ctx) => this.drawEnhancedGrassTile(ctx, 1));
    
    // Darker grass (shadows/forest edge)
    this.addTileVariant('grass_dark', TileType.GRASS_DARK, 0, 'ground');
    this.generateAndCacheTile('grass_dark', (ctx) => this.drawEnhancedGrassTile(ctx, 2));
    
    // Lighter grass (sunny areas)
    this.addTileVariant('grass_light', TileType.GRASS_LIGHT, 0, 'ground');
    this.generateAndCacheTile('grass_light', (ctx) => this.drawEnhancedGrassTile(ctx, 3));
    
    // Tall grass (decorative)
    this.addTileVariant('tall_grass', TileType.TALL_GRASS, 0, 'decoration');
    this.generateAndCacheTile('tall_grass', (ctx) => this.drawTallGrassTile(ctx));
  }

  private createWaterVariants(): void {
    // Animated water surface
    for (let frame = 0; frame < 4; frame++) {
      this.addTileVariant(`water_anim_${frame}`, TileType.WATER, frame, 'ground', true, 4, 800);
      this.generateAndCacheTile(`water_anim_${frame}`, (ctx) => this.drawAnimatedWaterTile(ctx, frame));
    }
    
    // Deep water
    this.addTileVariant('water_deep', TileType.WATER_DEEP, 0, 'ground');
    this.generateAndCacheTile('water_deep', (ctx) => this.drawDeepWaterTile(ctx));
    
    // Shallow water
    this.addTileVariant('water_shallow', TileType.WATER_SHALLOW, 0, 'ground');
    this.generateAndCacheTile('water_shallow', (ctx) => this.drawShallowWaterTile(ctx));
    
    // Waterfall (animated)
    for (let frame = 0; frame < 3; frame++) {
      this.addTileVariant(`waterfall_${frame}`, TileType.WATERFALL, frame, 'decoration', true, 3, 600);
      this.generateAndCacheTile(`waterfall_${frame}`, (ctx) => this.drawWaterfallTile(ctx, frame));
    }
  }

  private createForestVariants(): void {
    // Dense forest
    this.addTileVariant('forest_dense', TileType.FOREST, 0, 'ground');
    this.generateAndCacheTile('forest_dense', (ctx) => this.drawForestTile(ctx, 'dense'));
    
    // Light forest
    this.addTileVariant('forest_light', TileType.FOREST, 1, 'ground');
    this.generateAndCacheTile('forest_light', (ctx) => this.drawForestTile(ctx, 'light'));
    
    // Individual trees (decorative)
    this.addTileVariant('tree_large', TileType.TREE, 0, 'decoration');
    this.generateAndCacheTile('tree_large', (ctx) => this.drawTreeTile(ctx, 'large'));
    
    this.addTileVariant('tree_small', TileType.TREE, 1, 'decoration');
    this.generateAndCacheTile('tree_small', (ctx) => this.drawTreeTile(ctx, 'small'));
  }

  private createStructureTileVariants(): void {
    // Walls with different patterns
    this.createWallVariants();
    
    // Buildings with ALTTP-style roofs
    this.createBuildingVariants();
    
    // Paths and roads
    this.createPathVariants();
    
    // Bridges
    this.createBridgeVariants();
  }

  private createWallVariants(): void {
    // Stone wall variants
    this.addTileVariant('wall_stone', TileType.WALL, 0, 'ground');
    this.generateAndCacheTile('wall_stone', (ctx) => this.drawWallTile(ctx, 'stone'));
    
    // Castle wall
    this.addTileVariant('wall_castle', TileType.STONE_WALL, 0, 'ground');
    this.generateAndCacheTile('wall_castle', (ctx) => this.drawWallTile(ctx, 'castle'));
    
    // Wooden fence
    this.addTileVariant('fence_wood', TileType.WOODEN_FENCE, 0, 'decoration');
    this.generateAndCacheTile('fence_wood', (ctx) => this.drawFenceTile(ctx));
  }

  private createBuildingVariants(): void {
    // House roof variants
    this.addTileVariant('house_roof_red', TileType.HOUSE, 0, 'ground');
    this.generateAndCacheTile('house_roof_red', (ctx) => this.drawBuildingTile(ctx, 'house_red'));
    
    this.addTileVariant('house_roof_blue', TileType.HOUSE, 1, 'ground');
    this.generateAndCacheTile('house_roof_blue', (ctx) => this.drawBuildingTile(ctx, 'house_blue'));
    
    // Shrine variants
    this.addTileVariant('shrine_ancient', TileType.SHRINE, 0, 'ground');
    this.generateAndCacheTile('shrine_ancient', (ctx) => this.drawBuildingTile(ctx, 'shrine'));
    
    // Doors
    this.addTileVariant('door_wood', TileType.DOOR, 0, 'decoration');
    this.generateAndCacheTile('door_wood', (ctx) => this.drawDoorTile(ctx, 'wood'));
  }

  private createPathVariants(): void {
    // Dirt path variants
    this.addTileVariant('path_dirt', TileType.PATH, 0, 'ground');
    this.generateAndCacheTile('path_dirt', (ctx) => this.drawPathTile(ctx, 'dirt'));
    
    // Cobblestone
    this.addTileVariant('path_cobble', TileType.COBBLESTONE, 0, 'ground');
    this.generateAndCacheTile('path_cobble', (ctx) => this.drawPathTile(ctx, 'cobble'));
    
    // Stone path
    this.addTileVariant('path_stone', TileType.DIRT_PATH, 0, 'ground');
    this.generateAndCacheTile('path_stone', (ctx) => this.drawPathTile(ctx, 'stone'));
  }

  private createBridgeVariants(): void {
    // Wooden bridge variants
    this.addTileVariant('bridge_wood_h', TileType.BRIDGE, 0, 'ground');
    this.generateAndCacheTile('bridge_wood_h', (ctx) => this.drawBridgeTile(ctx, 'horizontal'));
    
    this.addTileVariant('bridge_wood_v', TileType.BRIDGE, 1, 'ground');
    this.generateAndCacheTile('bridge_wood_v', (ctx) => this.drawBridgeTile(ctx, 'vertical'));
  }

  private createDecorationTileVariants(): void {
    // Flora
    this.addTileVariant('flower_red', TileType.FLOWER, 0, 'decoration');
    this.generateAndCacheTile('flower_red', (ctx) => this.drawFlowerTile(ctx, 'red'));
    
    this.addTileVariant('flower_blue', TileType.FLOWER, 1, 'decoration');
    this.generateAndCacheTile('flower_blue', (ctx) => this.drawFlowerTile(ctx, 'blue'));
    
    this.addTileVariant('bush_green', TileType.BUSH, 0, 'decoration');
    this.generateAndCacheTile('bush_green', (ctx) => this.drawBushTile(ctx, 'green'));
    
    this.addTileVariant('mushroom_red', TileType.MUSHROOM, 0, 'decoration');
    this.generateAndCacheTile('mushroom_red', (ctx) => this.drawMushroomTile(ctx, 'red'));
    
    // Rocks and stones
    this.addTileVariant('rock_small', TileType.ROCK, 0, 'decoration');
    this.generateAndCacheTile('rock_small', (ctx) => this.drawRockTile(ctx, 'small'));
    
    this.addTileVariant('rock_large', TileType.ROCK, 1, 'decoration');
    this.generateAndCacheTile('rock_large', (ctx) => this.drawRockTile(ctx, 'large'));
    
    // Interactive objects
    this.addTileVariant('chest_closed', TileType.CHEST, 0, 'decoration');
    this.generateAndCacheTile('chest_closed', (ctx) => this.drawChestTile(ctx, 'closed'));
    
    this.addTileVariant('chest_open', TileType.CHEST, 1, 'decoration');
    this.generateAndCacheTile('chest_open', (ctx) => this.drawChestTile(ctx, 'open'));
    
    // Signs and posts
    this.addTileVariant('sign_wood', TileType.SIGN, 0, 'decoration');
    this.generateAndCacheTile('sign_wood', (ctx) => this.drawSignTile(ctx));
    
    this.addTileVariant('torch_lit', TileType.TORCH, 0, 'decoration');
    this.generateAndCacheTile('torch_lit', (ctx) => this.drawTorchTile(ctx, true));
    
    this.addTileVariant('lantern', TileType.LANTERN, 0, 'decoration');
    this.generateAndCacheTile('lantern', (ctx) => this.drawLanternTile(ctx));
    
    // Water features
    this.addTileVariant('well_stone', TileType.WELL, 0, 'decoration');
    this.generateAndCacheTile('well_stone', (ctx) => this.drawWellTile(ctx));
    
    this.addTileVariant('fountain', TileType.FOUNTAIN, 0, 'decoration');
    this.generateAndCacheTile('fountain', (ctx) => this.drawFountainTile(ctx));
    
    this.addTileVariant('pond_small', TileType.POND, 0, 'decoration');
    this.generateAndCacheTile('pond_small', (ctx) => this.drawPondTile(ctx));
  }

  private createAnimatedTileVariants(): void {
    // Animated lava for volcanic areas
    for (let frame = 0; frame < 3; frame++) {
      this.addTileVariant(`lava_${frame}`, TileType.VOLCANIC, frame, 'ground', true, 3, 1000);
      this.generateAndCacheTile(`lava_${frame}`, (ctx) => this.drawLavaTile(ctx, frame));
    }
    
    // Animated torch flame
    for (let frame = 0; frame < 2; frame++) {
      this.addTileVariant(`torch_flame_${frame}`, TileType.TORCH, frame, 'overlay', true, 2, 400);
      this.generateAndCacheTile(`torch_flame_${frame}`, (ctx) => this.drawTorchFlameTile(ctx, frame));
    }
  }

  private setupAutotilingRules(): void {
    // Set up connection rules for seamless tile transitions
    // This enables smart tile placement based on adjacent tiles
    const grassRules: TileConnectionRule[] = [
      { adjacentType: TileType.WATER, direction: 'north', resultVariant: 10 },
      { adjacentType: TileType.WATER, direction: 'south', resultVariant: 11 },
      { adjacentType: TileType.PATH, direction: 'north', resultVariant: 12 },
      // ... more connection rules
    ];
    
    // Apply autotiling rules to relevant tiles
    this.tileVariants.get('grass_base')!.autotile = true;
    this.tileVariants.get('grass_base')!.connectionRules = grassRules;
  }

  // Enhanced tile drawing methods with ALTTP-quality detail
  
  private drawEnhancedGrassTile(ctx: CanvasRenderingContext2D, variant: number): void {
    const size = this.TILE_SIZE;
    
    // Use ALTTP authentic grass colors
    const grassBase = TILE_COLORS[TileType.GRASS];
    const grassDark = this.adjustColor(grassBase, -0.2);
    const grassLight = this.adjustColor(grassBase, 0.15);
    const grassHighlight = this.adjustColor(grassBase, 0.3);
    
    // Base grass layer
    ctx.fillStyle = grassBase;
    ctx.fillRect(0, 0, size, size);
    
    // Grass texture pattern matching ALTTP style
    ctx.fillStyle = grassDark;
    
    switch (variant) {
      case 0: // Standard grass
        // Create organic grass blade patterns
        this.drawGrassBladePattern(ctx, size, grassDark, grassLight, grassHighlight);
        break;
        
      case 1: // Grass with flowers
        this.drawGrassBladePattern(ctx, size, grassDark, grassLight, grassHighlight);
        this.addFlowerAccents(ctx, size);
        break;
        
      case 2: // Dark grass
        ctx.fillStyle = this.adjustColor(grassBase, -0.3);
        ctx.fillRect(0, 0, size, size);
        this.drawGrassBladePattern(ctx, size, this.adjustColor(grassBase, -0.5), grassDark, grassBase);
        break;
        
      case 3: // Light grass
        ctx.fillStyle = this.adjustColor(grassBase, 0.2);
        ctx.fillRect(0, 0, size, size);
        this.drawGrassBladePattern(ctx, size, grassBase, grassLight, grassHighlight);
        break;
    }
  }

  private drawGrassBladePattern(ctx: CanvasRenderingContext2D, size: number, dark: string, mid: string, light: string): void {
    // Create authentic ALTTP grass blade patterns
    ctx.fillStyle = dark;
    
    // Vertical blade clusters
    const bladePositions = [
      [1, 2], [3, 1], [5, 3], [7, 0], [9, 2], [11, 1], [13, 3], [15, 2],
      [0, 5], [2, 4], [4, 6], [6, 5], [8, 7], [10, 4], [12, 6], [14, 5],
      [1, 8], [3, 9], [5, 7], [7, 10], [9, 8], [11, 11], [13, 9], [15, 10],
      [0, 12], [2, 13], [4, 11], [6, 14], [8, 12], [10, 15], [12, 13], [14, 14]
    ];
    
    bladePositions.forEach(([x, y]) => {
      if (x < size && y < size - 1) {
        ctx.fillRect(x, y, 1, 2);
      }
    });
    
    // Add lighter highlights
    ctx.fillStyle = mid;
    bladePositions.slice(0, 16).forEach(([x, y]) => {
      if (x < size - 1 && y < size - 1) {
        ctx.fillRect(x + 1, y, 1, 1);
      }
    });
    
    // Bright highlights on select blades
    ctx.fillStyle = light;
    bladePositions.slice(0, 8).forEach(([x, y]) => {
      if (x < size - 1 && y < size - 2) {
        ctx.fillRect(x + 1, y + 1, 1, 1);
      }
    });
  }

  private addFlowerAccents(ctx: CanvasRenderingContext2D, size: number): void {
    // Add small flower accents like in ALTTP
    const flowers = [
      { x: 4, y: 6, color: '#FF69B4' },
      { x: 11, y: 3, color: '#FF1493' },
      { x: 2, y: 12, color: '#FFB6C1' }
    ];
    
    flowers.forEach(flower => {
      // Flower petals
      ctx.fillStyle = flower.color;
      ctx.fillRect(flower.x - 1, flower.y, 1, 1);
      ctx.fillRect(flower.x + 1, flower.y, 1, 1);
      ctx.fillRect(flower.x, flower.y - 1, 1, 1);
      ctx.fillRect(flower.x, flower.y + 1, 1, 1);
      
      // Flower center
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(flower.x, flower.y, 1, 1);
    });
  }

  private drawAnimatedWaterTile(ctx: CanvasRenderingContext2D, frame: number): void {
    const size = this.TILE_SIZE;
    const waterBase = TILE_COLORS[TileType.WATER];
    const waterDark = this.adjustColor(waterBase, -0.3);
    const waterLight = this.adjustColor(waterBase, 0.2);
    const waterHighlight = '#87CEEB';
    
    // Base water
    ctx.fillStyle = waterBase;
    ctx.fillRect(0, 0, size, size);
    
    // Animated wave patterns
    const waveOffset = frame * 2;
    
    // Dark wave troughs
    ctx.fillStyle = waterDark;
    for (let y = 0; y < size; y += 4) {
      const waveY = (y + waveOffset) % 16;
      ctx.fillRect(0, waveY, size, 1);
      ctx.fillRect(0, (waveY + 2) % size, size, 1);
    }
    
    // Light wave crests
    ctx.fillStyle = waterLight;
    for (let y = 1; y < size; y += 4) {
      const waveY = (y + waveOffset) % 16;
      ctx.fillRect(0, waveY, size, 1);
    }
    
    // Foam highlights (animated)
    ctx.fillStyle = waterHighlight;
    const foamPositions = [
      [2 + frame, 3], [8 - frame, 7], [12 + frame, 11], [5 - frame, 15]
    ];
    
    foamPositions.forEach(([x, y]) => {
      const foamX = ((x % size) + size) % size;
      const foamY = ((y % size) + size) % size;
      ctx.fillRect(foamX, foamY, 1, 1);
      if (foamX < size - 1) ctx.fillRect(foamX + 1, foamY, 1, 1);
    });
  }

  private drawWaterfallTile(ctx: CanvasRenderingContext2D, frame: number): void {
    const size = this.TILE_SIZE;
    
    // Transparent background for overlay effect
    ctx.clearRect(0, 0, size, size);
    
    // Falling water streams
    ctx.fillStyle = '#B0E0E6';
    const streamPositions = [
      [3, 0], [6, 0], [9, 0], [12, 0]
    ];
    
    streamPositions.forEach(([x, startY]) => {
      for (let y = startY; y < size; y++) {
        const intensity = Math.sin((y + frame * 2) * 0.3) * 0.5 + 0.5;
        ctx.globalAlpha = intensity;
        ctx.fillRect(x, y, 1, 1);
        ctx.fillRect(x + 1, y, 1, 1);
      }
    });
    
    ctx.globalAlpha = 1;
    
    // Foam at bottom
    ctx.fillStyle = '#FFFFFF';
    const foamY = size - 2;
    for (let x = 0; x < size; x += 2) {
      ctx.fillRect(x + (frame % 2), foamY, 1, 2);
    }
  }

  private drawForestTile(ctx: CanvasRenderingContext2D, density: 'dense' | 'light'): void {
    const size = this.TILE_SIZE;
    const foliageDark = TILE_COLORS[TileType.FOREST];
    const foliageBase = this.adjustColor(foliageDark, 0.1);
    const foliageLight = this.adjustColor(foliageDark, 0.3);
    const trunkBrown = '#5D4037';
    const trunkDark = '#3E2723';
    
    // Background foliage
    ctx.fillStyle = foliageDark;
    ctx.fillRect(0, 0, size, size);
    
    if (density === 'dense') {
      // Dense forest - mostly foliage with trunk hints
      ctx.fillStyle = foliageBase;
      ctx.fillRect(1, 1, size - 2, size - 2);
      
      // Tree trunk glimpses
      ctx.fillStyle = trunkBrown;
      ctx.fillRect(6, 8, 2, 8);
      ctx.fillRect(10, 4, 1, 6);
      
      // Trunk shading
      ctx.fillStyle = trunkDark;
      ctx.fillRect(6, 8, 1, 8);
      ctx.fillRect(10, 4, 1, 1);
    } else {
      // Light forest - more visible trunks
      ctx.fillStyle = trunkBrown;
      ctx.fillRect(5, 6, 3, 10);
      ctx.fillRect(11, 3, 2, 8);
      
      // Trunk shading
      ctx.fillStyle = trunkDark;
      ctx.fillRect(5, 6, 1, 10);
      ctx.fillRect(5, 10, 3, 1);
      ctx.fillRect(11, 3, 1, 8);
      
      // Foliage clusters
      ctx.fillStyle = foliageBase;
      ctx.fillRect(2, 2, 6, 6);
      ctx.fillRect(9, 0, 7, 8);
      ctx.fillRect(0, 8, 5, 5);
      ctx.fillRect(12, 7, 4, 6);
    }
    
    // Foliage highlights
    ctx.fillStyle = foliageLight;
    ctx.fillRect(3, 3, 2, 1);
    ctx.fillRect(10, 1, 2, 1);
    ctx.fillRect(1, 9, 1, 2);
    ctx.fillRect(13, 8, 1, 2);
  }

  // Utility methods
  
  private addTileVariant(
    id: string,
    tileType: TileType,
    variant: number,
    layerType: 'ground' | 'decoration' | 'overlay' | 'collision',
    animated: boolean = false,
    animationFrames: number = 1,
    animationSpeed: number = 1000
  ): void {
    this.tileVariants.set(id, {
      id,
      tileType,
      variant,
      layerType,
      animated,
      animationFrames,
      animationSpeed
    });
  }

  private generateAndCacheTile(id: string, drawFunction: (ctx: CanvasRenderingContext2D) => void): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.TILE_SIZE;
    canvas.height = this.TILE_SIZE;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    
    drawFunction(ctx);
    
    this.tileCache.set(id, canvas);
    
    // Add to main tileset
    const variant = this.tileVariants.get(id);
    if (variant) {
      const tileIndex = this.tileVariants.size - 1;
      const tileX = (tileIndex % this.TILESET_WIDTH) * this.TILE_SIZE;
      const tileY = Math.floor(tileIndex / this.TILESET_WIDTH) * this.TILE_SIZE;
      
      this.tilesetCtx.drawImage(canvas, tileX, tileY);
    }
  }

  private adjustColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + factor)));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + factor)));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + factor)));
    
    return `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
  }

  // Placeholder methods for remaining tile types (to be implemented)
  private drawTallGrassTile(ctx: CanvasRenderingContext2D): void {
    // Implementation for tall grass decoration
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.TALL_GRASS]);
  }

  private drawDeepWaterTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('water', this.TILE_SIZE, TILE_COLORS[TileType.WATER_DEEP]);
  }

  private drawShallowWaterTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('water', this.TILE_SIZE, TILE_COLORS[TileType.WATER_SHALLOW]);
  }

  private drawTreeTile(ctx: CanvasRenderingContext2D, type: string): void {
    spriteManager.generateTile('forest', this.TILE_SIZE, TILE_COLORS[TileType.TREE]);
  }

  private drawWallTile(ctx: CanvasRenderingContext2D, type: string): void {
    spriteManager.generateTile('stone', this.TILE_SIZE, TILE_COLORS[TileType.WALL]);
  }

  private drawBuildingTile(ctx: CanvasRenderingContext2D, type: string): void {
    spriteManager.generateTile('house', this.TILE_SIZE, TILE_COLORS[TileType.HOUSE]);
  }

  private drawFenceTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.WOODEN_FENCE]);
  }

  private drawDoorTile(ctx: CanvasRenderingContext2D, type: string): void {
    spriteManager.generateTile('door', this.TILE_SIZE, TILE_COLORS[TileType.DOOR]);
  }

  private drawPathTile(ctx: CanvasRenderingContext2D, type: string): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.PATH]);
  }

  private drawBridgeTile(ctx: CanvasRenderingContext2D, orientation: string): void {
    spriteManager.generateTile('bridge', this.TILE_SIZE, TILE_COLORS[TileType.BRIDGE]);
  }

  private drawFlowerTile(ctx: CanvasRenderingContext2D, color: string): void {
    spriteManager.generateTile('flower', this.TILE_SIZE, TILE_COLORS[TileType.FLOWER]);
  }

  private drawBushTile(ctx: CanvasRenderingContext2D, type: string): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.BUSH]);
  }

  private drawMushroomTile(ctx: CanvasRenderingContext2D, color: string): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.MUSHROOM]);
  }

  private drawRockTile(ctx: CanvasRenderingContext2D, size: string): void {
    spriteManager.generateTile('stone', this.TILE_SIZE, TILE_COLORS[TileType.ROCK]);
  }

  private drawChestTile(ctx: CanvasRenderingContext2D, state: string): void {
    spriteManager.generateTile('chest', this.TILE_SIZE, TILE_COLORS[TileType.CHEST]);
  }

  private drawSignTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.SIGN]);
  }

  private drawTorchTile(ctx: CanvasRenderingContext2D, lit: boolean): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.TORCH]);
  }

  private drawLanternTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('grass', this.TILE_SIZE, TILE_COLORS[TileType.LANTERN]);
  }

  private drawWellTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('stone', this.TILE_SIZE, TILE_COLORS[TileType.WELL]);
  }

  private drawFountainTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('stone', this.TILE_SIZE, TILE_COLORS[TileType.FOUNTAIN]);
  }

  private drawPondTile(ctx: CanvasRenderingContext2D): void {
    spriteManager.generateTile('water', this.TILE_SIZE, TILE_COLORS[TileType.POND]);
  }

  private drawLavaTile(ctx: CanvasRenderingContext2D, frame: number): void {
    spriteManager.generateTile('volcanic', this.TILE_SIZE, TILE_COLORS[TileType.VOLCANIC]);
  }

  private drawTorchFlameTile(ctx: CanvasRenderingContext2D, frame: number): void {
    // Animated flame overlay
    ctx.clearRect(0, 0, this.TILE_SIZE, this.TILE_SIZE);
    ctx.fillStyle = frame === 0 ? '#FF4500' : '#FF6347';
    ctx.fillRect(6, 2, 4, 6);
  }

  // Public API
  
  getTileVariant(id: string): ALTTPTileVariant | undefined {
    return this.tileVariants.get(id);
  }

  getCachedTile(id: string): HTMLCanvasElement | undefined {
    return this.tileCache.get(id);
  }

  getTilesetCanvas(): HTMLCanvasElement {
    return this.tilesetCanvas;
  }

  getLayers(): ALTTPTileLayer[] {
    return [...this.ALTTP_LAYERS];
  }

  getAllTileVariants(): Map<string, ALTTPTileVariant> {
    return new Map(this.tileVariants);
  }

  // Get appropriate tile variant based on context
  getOptimalTileVariant(tileType: TileType, context?: { adjacentTypes?: TileType[], environment?: string }): string {
    // Find all variants of this tile type
    const variants = Array.from(this.tileVariants.values()).filter(v => v.tileType === tileType);
    
    if (variants.length === 0) {
      console.warn(`No variants found for tile type ${tileType}`);
      return 'grass_base'; // Fallback
    }
    
    // For now, return the first variant
    // In a full implementation, this would consider context for smart tile selection
    return variants[0].id;
  }
}

export const altttpTilesetManager = new ALTTPTilesetManager();