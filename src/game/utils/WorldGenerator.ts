// World Generator - Enhanced ALTTP-style world creation based on regions from GDD
// Following World Builder agent specifications with ALTTP visual fidelity
// Integrates with ALTTPTilesetManager and ALTTPEnvironmentAssets

import { TileType } from '@shared/types.js';
import { REGIONS, TOWNS, WORLD_WIDTH, WORLD_HEIGHT, REALM_TRANSFORMATIONS, WALKABLE_TILES, INTERACTIVE_TILES } from '@shared/constants.js';
import { altttpTilesetManager } from '../systems/ALTTPTilesetManager';
import { altttpEnvironmentAssets, EnvironmentStructure } from '../systems/ALTTPEnvironmentAssets';
import { tileRenderer, ALTTPTileMap } from '../systems/TileRenderer';

export interface WorldTile {
  tileType: TileType;
  walkable: boolean;
  region?: string;
  // Enhanced ALTTP properties
  variant?: number;
  layerType?: 'ground' | 'decoration' | 'overlay';
  altttpVariantId?: string;
  environmentalStory?: string;
}

export interface ALTTPWorldData {
  tilemap: ALTTPTileMap;
  structures: Map<string, { structure: EnvironmentStructure; x: number; y: number }>;
  narrativeElements: Array<{
    x: number;
    y: number;
    story: string;
    triggerRadius: number;
    requirements?: string[];
  }>;
  secretAreas: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    discoveryMethod: 'exploration' | 'eclipse_reveal' | 'item_unlock';
    reward?: string;
  }>;
}

export class WorldGenerator {
  private world: WorldTile[][];
  private altttpWorldData: ALTTPWorldData | null = null;
  private placedStructures: Set<string> = new Set();

  constructor() {
    this.world = [];
    this.initializeWorld();
    this.createALTTPWorld();
  }

  private initializeWorld(): void {
    // Initialize world with grass
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      this.world[y] = [];
      for (let x = 0; x < WORLD_WIDTH; x++) {
        this.world[y][x] = {
          tileType: TileType.GRASS,
          walkable: true,
          region: 'Verdant Lowlands',
          altttpVariantId: 'grass_base',
          layerType: 'ground'
        };
      }
    }

    // Fill regions based on bounds with ALTTP variants
    this.applyRegionsWithALTTPVariants();
    
    // Add paths connecting regions with enhanced visuals
    this.addEnhancedPaths();
    
    // Add towns and buildings with ALTTP structures
    this.addALTTPTowns();
    
    // Add decorative elements with environmental storytelling
    this.addEnvironmentalDecorations();
  }

  private createALTTPWorld(): void {
    console.log('Creating enhanced ALTTP-style world...');
    
    // Convert basic world data to ALTTP tilemap
    const tilemap = tileRenderer.convertWorldToALTTPTileMap(this.world, WORLD_WIDTH, WORLD_HEIGHT);
    
    // Initialize ALTTP world data
    this.altttpWorldData = {
      tilemap,
      structures: new Map(),
      narrativeElements: [],
      secretAreas: []
    };
    
    // Add ALTTP structures and environmental storytelling
    this.placeALTTPStructures();
    this.addEnvironmentalStorytelling();
    this.createSecretAreas();
    this.addEnvironmentalDetails();
    
    console.log(`ALTTP World created with ${this.altttpWorldData.structures.size} structures and ${this.altttpWorldData.narrativeElements.length} story elements`);
  }

  private applyRegionsWithALTTPVariants(): void {
    REGIONS.forEach(region => {
      const { x, y, width, height } = region.bounds;
      
      for (let tileY = y; tileY < y + height; tileY++) {
        for (let tileX = x; tileX < x + width; tileX++) {
          if (this.isValidTile(tileX, tileY)) {
            // Get optimal ALTTP variant for this region and tile type
            const baseVariantId = altttpTilesetManager.getOptimalTileVariant(region.primaryTile, {
              environment: region.name
            });
            
            this.world[tileY][tileX] = {
              tileType: region.primaryTile,
              walkable: this.isTileWalkable(region.primaryTile),
              region: region.name,
              altttpVariantId: baseVariantId,
              layerType: 'ground'
            };
          }
        }
      }
    });
    
    // Add natural transition zones between regions
    this.addRegionTransitions();
  }

  private addRegionTransitions(): void {
    // Create smooth transitions between different region types
    REGIONS.forEach(region => {
      const { x, y, width, height } = region.bounds;
      
      // Check edges for transition opportunities
      for (let tileY = y; tileY < y + height; tileY++) {
        for (let tileX = x; tileX < x + width; tileX++) {
          const isEdge = tileX === x || tileX === x + width - 1 || tileY === y || tileY === y + height - 1;
          
          if (isEdge && this.isValidTile(tileX, tileY)) {
            // Add transition variant based on adjacent regions
            const adjacentRegions = this.getAdjacentRegions(tileX, tileY);
            if (adjacentRegions.length > 1) {
              const transitionVariant = this.getTransitionVariant(region.primaryTile, adjacentRegions);
              if (transitionVariant) {
                this.world[tileY][tileX].altttpVariantId = transitionVariant;
                this.world[tileY][tileX].variant = 1; // Transition variant
              }
            }
          }
        }
      }
    });
  }

  private getAdjacentRegions(x: number, y: number): string[] {
    const adjacent: string[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    directions.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      
      if (this.isValidTile(nx, ny)) {
        const region = this.world[ny][nx].region;
        if (region && !adjacent.includes(region)) {
          adjacent.push(region);
        }
      }
    });
    
    return adjacent;
  }

  private getTransitionVariant(tileType: TileType, adjacentRegions: string[]): string | null {
    // Logic for selecting appropriate transition variants
    // This would be expanded based on specific regional combinations
    switch (tileType) {
      case TileType.GRASS:
        if (adjacentRegions.some(r => r.includes('Forest'))) return 'grass_dark';
        if (adjacentRegions.some(r => r.includes('Desert'))) return 'grass_light';
        break;
      case TileType.FOREST:
        if (adjacentRegions.some(r => r.includes('Lowlands'))) return 'forest_light';
        break;
    }
    return null;
  }

  private addEnhancedPaths(): void {
    // Connect towns with visually enhanced paths
    const townList = Object.values(TOWNS);
    
    // Create main path network with ALTTP-style variety
    for (let i = 0; i < townList.length - 1; i++) {
      const from = townList[i];
      const to = townList[i + 1];
      this.createALTTPPath(from.x, from.y, to.x, to.y, 'main_road');
    }

    // Create additional connections for better navigation
    this.createALTTPPath(TOWNS.HEARTHMERE.x, TOWNS.HEARTHMERE.y, TOWNS.STARFALL_MONASTERY.x, TOWNS.STARFALL_MONASTERY.y, 'pilgrimage_path');
    
    // Add secret paths that are revealed during eclipse
    this.createSecretPaths();
  }

  private createALTTPPath(x1: number, y1: number, x2: number, y2: number, pathType: string): void {
    // Enhanced path creation with ALTTP visual variety
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;
    let pathVariant = this.getPathVariantForType(pathType);

    while (true) {
      if (this.isValidTile(x, y)) {
        const currentTile = this.world[y][x];
        
        // Select appropriate path type based on terrain
        if (currentTile.tileType === TileType.WATER) {
          // Create bridge over water
          this.world[y][x] = {
            tileType: TileType.BRIDGE,
            walkable: true,
            region: currentTile.region || 'Unknown',
            altttpVariantId: 'bridge_wood_h',
            layerType: 'ground'
          };
        } else if (currentTile.tileType !== TileType.MOUNTAIN) {
          // Create path on walkable terrain
          const pathTileType = this.getPathTypeForTerrain(currentTile.tileType);
          this.world[y][x] = {
            tileType: pathTileType,
            walkable: true,
            region: currentTile.region || 'Unknown',
            altttpVariantId: pathVariant,
            layerType: 'ground'
          };
        }
        
        // Add path decorations periodically
        if ((x + y) % 8 === 0 && pathType === 'main_road') {
          this.addPathDecoration(x, y);
        }
      }

      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private getPathVariantForType(pathType: string): string {
    switch (pathType) {
      case 'main_road': return 'path_cobble';
      case 'pilgrimage_path': return 'path_stone';
      case 'secret_path': return 'path_dirt';
      default: return 'path_dirt';
    }
  }

  private getPathTypeForTerrain(terrainType: TileType): TileType {
    switch (terrainType) {
      case TileType.DESERT: return TileType.SAND;
      case TileType.SNOW: return TileType.STONE;
      case TileType.MARSH: return TileType.BRIDGE;
      default: return TileType.PATH;
    }
  }

  private addPathDecoration(x: number, y: number): void {
    // Add decorative elements along major paths
    const decorations = ['sign_wood', 'torch_lit', 'milestone'];
    const decoration = decorations[Math.floor(Math.random() * decorations.length)];
    
    // Place decoration adjacent to path if space available
    const adjacent = [
      { x: x - 1, y }, { x: x + 1, y }, 
      { x, y: y - 1 }, { x, y: y + 1 }
    ];
    
    adjacent.forEach(pos => {
      if (this.isValidTile(pos.x, pos.y) && this.world[pos.y][pos.x].tileType === TileType.GRASS) {
        // Mark for decoration during ALTTP structure placement
        this.world[pos.y][pos.x].environmentalStory = `A ${decoration} marks the ancient road`;
      }
    });
  }

  private createSecretPaths(): void {
    // Create paths that are only visible during eclipse transformation
    const secretConnections = [
      // Secret path through Whisperwood
      { from: { x: 30, y: 60 }, to: { x: 50, y: 70 } },
      // Hidden route in Moonwell Marsh
      { from: { x: 110, y: 140 }, to: { x: 130, y: 150 } }
    ];
    
    secretConnections.forEach(connection => {
      this.createALTTPPath(connection.from.x, connection.from.y, connection.to.x, connection.to.y, 'secret_path');
    });
  }

  private createPath(x1: number, y1: number, x2: number, y2: number): void {
    // Use Bresenham-like algorithm for natural-looking paths
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;

    while (true) {
      // Place path tile
      if (this.isValidTile(x, y)) {
        // Only place path if it's not water or mountain
        if (this.world[y][x].tileType !== TileType.WATER && 
            this.world[y][x].tileType !== TileType.MOUNTAIN) {
          this.world[y][x] = {
            tileType: TileType.PATH,
            walkable: true,
            region: this.world[y][x].region || 'Unknown'
          };
        } else if (this.world[y][x].tileType === TileType.WATER) {
          // Create bridge over water
          this.world[y][x] = {
            tileType: TileType.BRIDGE,
            walkable: true,
            region: this.world[y][x].region || 'Unknown'
          };
        }
      }

      if (x === x2 && y === y2) break;
      
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private addALTTPTowns(): void {
    // Create towns with ALTTP structures and environmental storytelling
    Object.values(TOWNS).forEach(town => {
      if (town.name === 'Hearthmere') {
        this.createALTTPHearthmere(town);
      } else {
        this.createALTTPGenericTown(town);
      }
    });
  }

  private addEnvironmentalDecorations(): void {
    // Enhanced decorations with environmental storytelling
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const tile = this.world[y][x];
        
        // Add terrain-based decorations with story elements
        this.addALTTPTerrainBasedDecorations(x, y, tile);
        
        // Add scattered decorative elements with narrative
        this.addScatteredNarrativeDecorations(x, y, tile);
        
        // Add chests in remote areas with environmental stories
        if (tile.walkable && this.isRemoteArea(x, y) && Math.random() > 0.998) {
          this.world[y][x] = {
            ...tile,
            tileType: TileType.CHEST,
            altttpVariantId: 'chest_closed',
            layerType: 'decoration',
            environmentalStory: 'A weathered chest hidden by a long-departed traveler, its contents a mystery waiting to unfold.'
          };
        }
      }
    }
    
    // Add specific ALTTP area decorations
    this.addALTTPTownDecorations();
    this.addALTTPWaterFeatures();
    this.addALTTPForestClumps();
  }

  private createHearthmere(town: { x: number; y: number; name: string }): void {
    if (!this.isValidTile(town.x, town.y)) return;

    // Create a 7x7 town area with clear layout
    const townSize = 3;
    
    // Clear the main town area with grass for walkability
    for (let dy = -townSize; dy <= townSize; dy++) {
      for (let dx = -townSize; dx <= townSize; dx++) {
        const nx = town.x + dx;
        const ny = town.y + dy;
        
        if (this.isValidTile(nx, ny)) {
          this.world[ny][nx] = {
            tileType: TileType.GRASS,
            walkable: true,
            region: this.getRegionAt(nx, ny)
          };
        }
      }
    }
    
    // Create main paths - horizontal and vertical through center
    for (let dx = -townSize; dx <= townSize; dx++) {
      const nx = town.x + dx;
      if (this.isValidTile(nx, town.y)) {
        this.world[town.y][nx] = {
          tileType: TileType.PATH,
          walkable: true,
          region: this.getRegionAt(nx, town.y)
        };
      }
    }
    
    for (let dy = -townSize; dy <= townSize; dy++) {
      const ny = town.y + dy;
      if (this.isValidTile(town.x, ny)) {
        this.world[ny][town.x] = {
          tileType: TileType.PATH,
          walkable: true,
          region: this.getRegionAt(town.x, ny)
        };
      }
    }
    
    // Place key buildings in strategic positions
    // Town hall in the center-north
    if (this.isValidTile(town.x, town.y - 2)) {
      this.world[town.y - 2][town.x] = {
        tileType: TileType.HOUSE,
        walkable: false,
        region: this.getRegionAt(town.x, town.y - 2)
      };
    }
    
    // Small shrine to the east (tutorial landmark)
    if (this.isValidTile(town.x + 2, town.y - 1)) {
      this.world[town.y - 1][town.x + 2] = {
        tileType: TileType.SHRINE,
        walkable: false,
        region: this.getRegionAt(town.x + 2, town.y - 1)
      };
    }
    
    // Houses on the corners for town feel
    const cornerPositions = [
      { x: town.x - 2, y: town.y - 2 },
      { x: town.x + 2, y: town.y + 2 },
      { x: town.x - 2, y: town.y + 1 }
    ];
    
    cornerPositions.forEach(pos => {
      if (this.isValidTile(pos.x, pos.y)) {
        this.world[pos.y][pos.x] = {
          tileType: TileType.HOUSE,
          walkable: false,
          region: this.getRegionAt(pos.x, pos.y)
        };
      }
    });
    
    // Add decorative flowers around the central area
    const flowerPositions = [
      { x: town.x - 1, y: town.y - 1 },
      { x: town.x + 1, y: town.y - 1 },
      { x: town.x - 1, y: town.y + 1 },
      { x: town.x + 1, y: town.y + 1 }
    ];
    
    flowerPositions.forEach(pos => {
      if (this.isValidTile(pos.x, pos.y)) {
        this.world[pos.y][pos.x] = {
          tileType: TileType.FLOWER,
          walkable: true,
          region: this.getRegionAt(pos.x, pos.y)
        };
      }
    });
    
    // Place a tutorial chest to the south for discovery
    if (this.isValidTile(town.x, town.y + 2)) {
      this.world[town.y + 2][town.x] = {
        tileType: TileType.CHEST,
        walkable: true,
        region: this.getRegionAt(town.x, town.y + 2)
      };
    }
    
    // Add some flowers near the starting position for a welcoming feel
    const welcomeFlowers = [
      { x: town.x - 2, y: town.y },
      { x: town.x + 2, y: town.y },
      { x: town.x, y: town.y - 2 }
    ];
    
    welcomeFlowers.forEach(pos => {
      if (this.isValidTile(pos.x, pos.y) && this.world[pos.y][pos.x].tileType === TileType.GRASS) {
        this.world[pos.y][pos.x] = {
          tileType: TileType.FLOWER,
          walkable: true,
          region: this.getRegionAt(pos.x, pos.y)
        };
      }
    });
    
    console.log(`Created Hearthmere town at (${town.x}, ${town.y}) with tutorial layout`);
  }
  
  private createGenericTown(town: { x: number; y: number; name: string }): void {
    if (!this.isValidTile(town.x, town.y)) return;
    
    // Place main building
    this.world[town.y][town.x] = {
      tileType: TileType.HOUSE,
      walkable: false,
      region: this.getRegionAt(town.x, town.y)
    };

    // Add surrounding buildings (original logic)
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = town.x + dx;
        const ny = town.y + dy;
        
        if (this.isValidTile(nx, ny) && 
            (dx !== 0 || dy !== 0) && // Don't overwrite center
            Math.abs(dx) + Math.abs(dy) <= 2 && 
            Math.random() > 0.6) {
          
          this.world[ny][nx] = {
            tileType: Math.random() > 0.8 ? TileType.SHRINE : TileType.HOUSE,
            walkable: false,
            region: this.getRegionAt(nx, ny)
          };
        }
      }
    }
  }

  private addDecorations(): void {
    // Enhanced decorations for Zelda-style visual fidelity
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const tile = this.world[y][x];
        
        // Add environmental details based on terrain type
        this.addTerrainBasedDecorations(x, y, tile);
        
        // Add scattered decorative elements
        this.addScatteredDecorations(x, y, tile);
        
        // Add chests in remote areas (rare)
        if (tile.walkable && this.isRemoteArea(x, y) && Math.random() > 0.998) {
          this.world[y][x] = {
            ...tile,
            tileType: TileType.CHEST
          };
        }
      }
    }
    
    // Add specific area decorations
    this.addTownDecorations();
    this.addWaterFeatures();
    this.addForestClumps();
  }

  private addTerrainBasedDecorations(x: number, y: number, tile: WorldTile): void {
    const rand = Math.random();
    
    switch (tile.tileType) {
      case TileType.GRASS:
        // Add variety of grass decorations
        if (rand > 0.95) {
          const decorationType = Math.random();
          if (decorationType > 0.7) {
            this.world[y][x] = { ...tile, tileType: TileType.FLOWER };
          } else if (decorationType > 0.4) {
            this.world[y][x] = { ...tile, tileType: TileType.TALL_GRASS };
          } else if (decorationType > 0.2) {
            this.world[y][x] = { ...tile, tileType: TileType.BUSH };
          }
        }
        break;
        
      case TileType.FOREST:
        // Add forest floor elements
        if (rand > 0.9) {
          const forestDecor = Math.random();
          if (forestDecor > 0.6) {
            this.world[y][x] = { ...tile, tileType: TileType.MUSHROOM };
          } else if (forestDecor > 0.3) {
            this.world[y][x] = { ...tile, tileType: TileType.BUSH };
          }
        }
        break;
        
      case TileType.MOUNTAIN:
        // Add rocky elements
        if (rand > 0.85) {
          this.world[y][x] = { ...tile, tileType: TileType.ROCK };
        }
        break;
        
      case TileType.WATER:
        // Occasionally add shallow water near edges
        if (this.hasAdjacentGrass(x, y) && rand > 0.8) {
          this.world[y][x] = { ...tile, tileType: TileType.WATER_SHALLOW };
        }
        break;
    }
  }

  private addScatteredDecorations(x: number, y: number, tile: WorldTile): void {
    if (!tile.walkable) return;
    
    const rand = Math.random();
    
    // Add scattered rocks
    if (rand > 0.992) {
      this.world[y][x] = { ...tile, tileType: TileType.ROCK };
    }
    // Add occasional signs near paths
    else if (tile.tileType === TileType.PATH && rand > 0.985) {
      this.world[y][x] = { ...tile, tileType: TileType.SIGN };
    }
  }

  private addTownDecorations(): void {
    Object.values(TOWNS).forEach(town => {
      // Add decorative elements around towns
      this.addAroundPosition(town.x, town.y, 5, (x, y, distance) => {
        if (distance > 2 && distance < 5 && this.world[y][x].walkable) {
          const rand = Math.random();
          if (rand > 0.7) {
            if (rand > 0.9) {
              this.world[y][x] = { ...this.world[y][x], tileType: TileType.LANTERN };
            } else if (rand > 0.8) {
              this.world[y][x] = { ...this.world[y][x], tileType: TileType.WELL };
            }
          }
        }
      });
    });
  }

  private addWaterFeatures(): void {
    // Add small ponds in grass areas
    for (let attempts = 0; attempts < 20; attempts++) {
      const x = Math.floor(Math.random() * WORLD_WIDTH);
      const y = Math.floor(Math.random() * WORLD_HEIGHT);
      
      if (this.world[y][x].tileType === TileType.GRASS && this.hasOpenSpace(x, y, 2)) {
        // Create small pond
        this.world[y][x] = { ...this.world[y][x], tileType: TileType.POND };
        
        // Add shallow water around it
        this.addAroundPosition(x, y, 2, (px, py, distance) => {
          if (distance === 1 && this.world[py][px].tileType === TileType.GRASS && Math.random() > 0.5) {
            this.world[py][px] = { ...this.world[py][px], tileType: TileType.WATER_SHALLOW };
          }
        });
      }
    }
  }

  private addForestClumps(): void {
    // Add small tree clumps in grass areas
    for (let attempts = 0; attempts < 15; attempts++) {
      const x = Math.floor(Math.random() * WORLD_WIDTH);
      const y = Math.floor(Math.random() * WORLD_HEIGHT);
      
      if (this.world[y][x].tileType === TileType.GRASS && this.hasOpenSpace(x, y, 3)) {
        // Create small forest clump
        this.addAroundPosition(x, y, 2, (px, py, distance) => {
          if (this.world[py][px].tileType === TileType.GRASS && Math.random() > 0.3) {
            this.world[py][px] = { ...this.world[py][px], tileType: TileType.TREE };
          }
        });
      }
    }
  }

  private hasAdjacentGrass(x: number, y: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.isValidTile(nx, ny) && this.world[ny][nx].tileType === TileType.GRASS) {
          return true;
        }
      }
    }
    return false;
  }

  private hasOpenSpace(x: number, y: number, radius: number): boolean {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (!this.isValidTile(nx, ny)) return false;
        
        const tile = this.world[ny][nx];
        if (tile.tileType !== TileType.GRASS) return false;
      }
    }
    return true;
  }

  private addAroundPosition(centerX: number, centerY: number, radius: number, callback: (x: number, y: number, distance: number) => void): void {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (this.isValidTile(x, y)) {
          const distance = Math.hypot(dx, dy);
          if (distance <= radius) {
            callback(x, y, distance);
          }
        }
      }
    }
  }

  private isRemoteArea(x: number, y: number): boolean {
    // Check if area is far from towns
    return Object.values(TOWNS).every(town => {
      const distance = Math.hypot(x - town.x, y - town.y);
      return distance > 8;
    });
  }

  private isTileWalkable(tileType: TileType): boolean {
    // Use the same walkability logic as the collision system
    return WALKABLE_TILES.has(tileType) || INTERACTIVE_TILES.has(tileType);
  }

  private isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
  }

  private getRegionAt(x: number, y: number): string {
    for (const region of REGIONS) {
      const { x: rx, y: ry, width, height } = region.bounds;
      if (x >= rx && x < rx + width && y >= ry && y < ry + height) {
        return region.name;
      }
    }
    return 'Verdant Lowlands';
  }

  // Enhanced ALTTP methods

  private createALTTPHearthmere(town: { x: number; y: number; name: string }): void {
    if (!this.isValidTile(town.x, town.y)) return;

    // Create enhanced Hearthmere with ALTTP structures
    const townSize = 4;
    
    // Clear the main town area for structures
    for (let dy = -townSize; dy <= townSize; dy++) {
      for (let dx = -townSize; dx <= townSize; dx++) {
        const nx = town.x + dx;
        const ny = town.y + dy;
        
        if (this.isValidTile(nx, ny)) {
          this.world[ny][nx] = {
            tileType: TileType.GRASS,
            walkable: true,
            region: this.getRegionAt(nx, ny),
            altttpVariantId: 'grass_flowers', // More decorative grass for town
            layerType: 'ground'
          };
        }
      }
    }
    
    // Mark for ALTTP structure placement during world creation
    if (this.altttpWorldData) {
      // Town Hall
      const townHallStructure = altttpEnvironmentAssets.getStructure('hearthmere_town_hall');
      if (townHallStructure) {
        this.altttpWorldData.structures.set(`hearthmere_town_hall_${town.x}_${town.y}`, {
          structure: townHallStructure,
          x: town.x,
          y: town.y - 2
        });
      }

      // Surrounding houses
      const housePositions = [
        { x: town.x - 3, y: town.y - 2, id: 'hearthmere_house_1' },
        { x: town.x + 3, y: town.y + 1, id: 'hearthmere_house_2' },
        { x: town.x - 2, y: town.y + 3, id: 'hearthmere_house_3' }
      ];

      housePositions.forEach(pos => {
        const houseStructure = altttpEnvironmentAssets.getStructure(pos.id);
        if (houseStructure) {
          this.altttpWorldData.structures.set(`${pos.id}_${pos.x}_${pos.y}`, {
            structure: houseStructure,
            x: pos.x,
            y: pos.y
          });
        }
      });

      // Tutorial shrine
      const shrineStructure = altttpEnvironmentAssets.getStructure('tutorial_shrine');
      if (shrineStructure) {
        this.altttpWorldData.structures.set(`tutorial_shrine_${town.x + 4}_${town.y}`, {
          structure: shrineStructure,
          x: town.x + 4,
          y: town.y
        });
      }
    }
    
    console.log(`Created enhanced ALTTP Hearthmere at (${town.x}, ${town.y})`);
  }

  private createALTTPGenericTown(town: { x: number; y: number; name: string }): void {
    if (!this.isValidTile(town.x, town.y) || !this.altttpWorldData) return;
    
    // Get appropriate structures for this town's region
    const region = this.getRegionAt(town.x, town.y);
    const availableStructures = altttpEnvironmentAssets.getStructuresForRegion(region);
    
    if (availableStructures.length > 0) {
      // Place main building
      const mainStructure = altttpEnvironmentAssets.getStructure(availableStructures[0]);
      if (mainStructure) {
        this.altttpWorldData.structures.set(`${town.name}_main_${town.x}_${town.y}`, {
          structure: mainStructure,
          x: town.x,
          y: town.y
        });
      }

      // Add smaller structures around main building
      const surroundingPositions = [
        { x: town.x - 2, y: town.y - 1 },
        { x: town.x + 2, y: town.y + 1 },
        { x: town.x - 1, y: town.y + 2 }
      ];

      surroundingPositions.forEach((pos, index) => {
        if (this.isValidTile(pos.x, pos.y) && availableStructures.length > index + 1) {
          const structure = altttpEnvironmentAssets.getStructure(availableStructures[index + 1]);
          if (structure) {
            this.altttpWorldData.structures.set(`${town.name}_${index}_${pos.x}_${pos.y}`, {
              structure,
              x: pos.x,
              y: pos.y
            });
          }
        }
      });
    }
  }

  private placeALTTPStructures(): void {
    if (!this.altttpWorldData) return;

    // Place region-specific landmarks and shrines
    REGIONS.forEach(region => {
      const centerX = region.bounds.x + Math.floor(region.bounds.width / 2);
      const centerY = region.bounds.y + Math.floor(region.bounds.height / 2);
      
      // Place appropriate shrine for region
      const shrineId = this.getShrineForRegion(region.name);
      const shrine = altttpEnvironmentAssets.getStructure(shrineId);
      
      if (shrine && this.isValidTile(centerX, centerY)) {
        this.altttpWorldData.structures.set(`${shrineId}_${centerX}_${centerY}`, {
          structure: shrine,
          x: centerX,
          y: centerY
        });
      }

      // Add environmental features
      this.addRegionalFeatures(region);
    });
  }

  private getShrineForRegion(regionName: string): string {
    const shrineMap: Record<string, string> = {
      'Whisperwood': 'rootway_shrine',
      'Moonwell Marsh': 'moonwell_shrine',
      'Amber Dunes & Canyon': 'sunspear_shrine',
      'Frostpeak Tundra': 'frostpeak_shrine'
    };
    
    return shrineMap[regionName] || 'tutorial_shrine';
  }

  private addRegionalFeatures(region: any): void {
    if (!this.altttpWorldData) return;

    const featureDensity = 0.02; // 2% chance per tile
    const { x, y, width, height } = region.bounds;
    
    for (let attempts = 0; attempts < width * height * featureDensity; attempts++) {
      const fx = x + Math.floor(Math.random() * width);
      const fy = y + Math.floor(Math.random() * height);
      
      if (this.isValidTile(fx, fy) && this.world[fy][fx].walkable) {
        const feature = this.selectRegionalFeature(region.name);
        if (feature) {
          const featureStructure = altttpEnvironmentAssets.getStructure(feature);
          if (featureStructure) {
            this.altttpWorldData.structures.set(`${feature}_${fx}_${fy}`, {
              structure: featureStructure,
              x: fx,
              y: fy
            });
          }
        }
      }
    }
  }

  private selectRegionalFeature(regionName: string): string | null {
    const regionFeatures: Record<string, string[]> = {
      'Whisperwood': ['sacred_grove', 'ancient_well'],
      'Moonwell Marsh': ['crystal_spire', 'mystic_falls'],
      'Frostpeak Tundra': ['ancient_circle', 'stone_pillar'],
      'Amber Dunes & Canyon': ['oasis', 'desert_monument']
    };
    
    const features = regionFeatures[regionName] || [];
    return features.length > 0 ? features[Math.floor(Math.random() * features.length)] : null;
  }

  private addEnvironmentalStorytelling(): void {
    if (!this.altttpWorldData) return;

    // Add narrative trigger points throughout the world
    const storyElements = [
      {
        x: TOWNS.HEARTHMERE.x + 10,
        y: TOWNS.HEARTHMERE.y - 5,
        story: "Ancient stone markers hint at a path once walked by heroes of old",
        triggerRadius: 2,
        requirements: []
      },
      {
        x: 85, y: 65, // Near Whisperwood
        story: "The trees here seem to whisper secrets of the ancient eclipse",
        triggerRadius: 3,
        requirements: ['aether_mirror']
      },
      {
        x: 125, y: 145, // In Moonwell Marsh
        story: "Mystical reflections dance on the water's surface, showing glimpses of another realm",
        triggerRadius: 2,
        requirements: ['aether_mirror']
      }
    ];

    storyElements.forEach(element => {
      this.altttpWorldData!.narrativeElements.push(element);
    });
  }

  private createSecretAreas(): void {
    if (!this.altttpWorldData) return;

    // Define secret areas that enhance exploration
    const secretAreas = [
      {
        x: 45, y: 55, width: 5, height: 5,
        discoveryMethod: 'eclipse_reveal' as const,
        reward: 'aether_shard'
      },
      {
        x: 135, y: 155, width: 3, height: 3,
        discoveryMethod: 'item_unlock' as const,
        reward: 'heart_piece'
      },
      {
        x: 25, y: 175, width: 4, height: 4,
        discoveryMethod: 'exploration' as const,
        reward: 'ancient_key'
      }
    ];

    secretAreas.forEach(area => {
      this.altttpWorldData!.secretAreas.push(area);
    });
  }

  private addEnvironmentalDetails(): void {
    if (!this.altttpWorldData) return;

    // Add environmental details to each region for immersion
    REGIONS.forEach(region => {
      tileRenderer.addEnvironmentalDetails(
        this.altttpWorldData!.tilemap,
        region.name,
        0.05 // 5% density
      );
    });
  }

  // Enhanced decoration methods with ALTTP quality

  private addALTTPTerrainBasedDecorations(x: number, y: number, tile: WorldTile): void {
    const rand = Math.random();
    
    switch (tile.tileType) {
      case TileType.GRASS:
        if (rand > 0.92) {
          const decorationType = Math.random();
          if (decorationType > 0.7) {
            this.world[y][x] = { 
              ...tile, 
              tileType: TileType.FLOWER,
              altttpVariantId: Math.random() > 0.5 ? 'flower_red' : 'flower_blue',
              layerType: 'decoration',
              environmentalStory: 'Wildflowers bloom here, touched by gentle morning light'
            };
          } else if (decorationType > 0.4) {
            this.world[y][x] = { 
              ...tile, 
              tileType: TileType.TALL_GRASS,
              altttpVariantId: 'tall_grass',
              layerType: 'decoration',
              environmentalStory: 'Tall grass sways in the breeze, hiding small creatures'
            };
          }
        }
        break;
        
      case TileType.FOREST:
        if (rand > 0.85) {
          const forestDecor = Math.random();
          if (forestDecor > 0.6) {
            this.world[y][x] = { 
              ...tile, 
              tileType: TileType.MUSHROOM,
              altttpVariantId: 'mushroom_red',
              layerType: 'decoration',
              environmentalStory: 'Mushrooms grow in the forest shade, some glowing faintly'
            };
          }
        }
        break;
    }
  }

  private addScatteredNarrativeDecorations(x: number, y: number, tile: WorldTile): void {
    if (!tile.walkable) return;
    
    const rand = Math.random();
    
    if (rand > 0.995) {
      this.world[y][x] = { 
        ...tile, 
        tileType: TileType.ROCK,
        altttpVariantId: 'rock_small',
        layerType: 'decoration',
        environmentalStory: 'A weathered stone, marked with ancient symbols'
      };
    } else if (tile.tileType === TileType.PATH && rand > 0.99) {
      this.world[y][x] = { 
        ...tile, 
        tileType: TileType.SIGN,
        altttpVariantId: 'sign_wood',
        layerType: 'decoration',
        environmentalStory: 'An old signpost, its writing faded but still legible'
      };
    }
  }

  private addALTTPTownDecorations(): void {
    // Enhanced town decorations with ALTTP detail
    Object.values(TOWNS).forEach(town => {
      this.addAroundPosition(town.x, town.y, 6, (x, y, distance) => {
        if (distance > 3 && distance < 6 && this.world[y][x].walkable) {
          const rand = Math.random();
          if (rand > 0.8) {
            if (rand > 0.95) {
              this.world[y][x] = { 
                ...this.world[y][x], 
                tileType: TileType.LANTERN,
                altttpVariantId: 'lantern',
                layerType: 'decoration',
                environmentalStory: 'A lantern marks the edge of town, welcoming travelers'
              };
            } else if (rand > 0.85) {
              this.world[y][x] = { 
                ...this.world[y][x], 
                tileType: TileType.WELL,
                altttpVariantId: 'well_stone',
                layerType: 'decoration',
                environmentalStory: 'A community well, the heart of village life'
              };
            }
          }
        }
      });
    });
  }

  private addALTTPWaterFeatures(): void {
    // Enhanced water features with ALTTP quality
    for (let attempts = 0; attempts < 25; attempts++) {
      const x = Math.floor(Math.random() * WORLD_WIDTH);
      const y = Math.floor(Math.random() * WORLD_HEIGHT);
      
      if (this.world[y][x].tileType === TileType.GRASS && this.hasOpenSpace(x, y, 2)) {
        this.world[y][x] = { 
          ...this.world[y][x], 
          tileType: TileType.POND,
          altttpVariantId: 'pond_small',
          layerType: 'decoration',
          environmentalStory: 'A pristine pond reflects the sky, home to fish and frogs'
        };
        
        // Add shallow water around pond
        this.addAroundPosition(x, y, 2, (px, py, distance) => {
          if (distance === 1 && this.world[py][px].tileType === TileType.GRASS && Math.random() > 0.5) {
            this.world[py][px] = { 
              ...this.world[py][px], 
              tileType: TileType.WATER_SHALLOW,
              altttpVariantId: 'water_shallow',
              layerType: 'ground'
            };
          }
        });
      }
    }
  }

  private addALTTPForestClumps(): void {
    // Enhanced forest clumps with environmental stories
    for (let attempts = 0; attempts < 20; attempts++) {
      const x = Math.floor(Math.random() * WORLD_WIDTH);
      const y = Math.floor(Math.random() * WORLD_HEIGHT);
      
      if (this.world[y][x].tileType === TileType.GRASS && this.hasOpenSpace(x, y, 3)) {
        this.addAroundPosition(x, y, 2, (px, py, distance) => {
          if (this.world[py][px].tileType === TileType.GRASS && Math.random() > 0.4) {
            this.world[py][px] = { 
              ...this.world[py][px], 
              tileType: TileType.TREE,
              altttpVariantId: distance === 0 ? 'tree_large' : 'tree_small',
              layerType: 'decoration',
              environmentalStory: 'Ancient trees form a small grove, their roots intertwined with old magic'
            };
          }
        });
      }
    }
  }

  // Public API
  getWorld(): WorldTile[][] {
    return this.world;
  }

  getALTTPWorldData(): ALTTPWorldData | null {
    return this.altttpWorldData;
  }

  getTileAt(x: number, y: number): WorldTile | null {
    if (!this.isValidTile(x, y)) return null;
    return this.world[y][x];
  }

  isWalkable(x: number, y: number): boolean {
    const tile = this.getTileAt(x, y);
    return tile ? tile.walkable : false;
  }


  // Eclipse/Dayrealm transformation
  getEclipseTile(tileType: TileType): TileType {
    // Use transformations from constants for consistency
    return REALM_TRANSFORMATIONS[tileType] || tileType;
  }
}