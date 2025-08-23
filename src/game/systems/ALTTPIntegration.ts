/**
 * ALTTP Integration - Seamless integration of ALTTP systems with existing game systems
 * Integrates the enhanced tileset with collision detection, sprite management, and world rendering
 */

import { altttpTilesetManager } from './ALTTPTilesetManager';
import { altttpEnvironmentAssets } from './ALTTPEnvironmentAssets';
import { tileRenderer, ALTTPTileMap } from './TileRenderer';
import { spriteManager } from './SpriteManager';
import { TileType } from '@shared/types.js';
import { WALKABLE_TILES, NON_WALKABLE_TILES, INTERACTIVE_TILES } from '@shared/constants.js';

export interface CollisionData {
  x: number;
  y: number;
  width: number;
  height: number;
  solid: boolean;
  interactive: boolean;
  metadata?: {
    tileType: TileType;
    variantId: string;
    story?: string;
    requirements?: string[];
  };
}

export interface IntegratedWorldData {
  tilemap: ALTTPTileMap;
  collisionMap: CollisionData[][];
  interactables: Map<string, CollisionData>;
  narrativeElements: Array<{
    x: number;
    y: number;
    story: string;
    triggerRadius: number;
    requirements?: string[];
  }>;
  visualEffects: Array<{
    x: number;
    y: number;
    type: 'particle' | 'animation' | 'glow';
    data: any;
  }>;
}

export class ALTTPIntegration {
  private readonly TILE_SIZE = 16;
  private integratedWorld: IntegratedWorldData | null = null;

  constructor() {
    console.log('Initializing ALTTP system integration...');
  }

  /**
   * Create fully integrated world data combining ALTTP visuals with game mechanics
   */
  createIntegratedWorld(
    worldTiles: { tileType: number; walkable: boolean; region?: string }[][],
    width: number,
    height: number
  ): IntegratedWorldData {
    console.log('Creating integrated ALTTP world with collision and interaction systems...');

    // Create base ALTTP tilemap
    const tilemap = tileRenderer.convertWorldToALTTPTileMap(worldTiles, width, height);

    // Generate collision map from tilemap
    const collisionMap = this.generateCollisionMap(tilemap);

    // Extract interactable objects
    const interactables = this.extractInteractables(tilemap, collisionMap);

    // Create narrative elements from environmental storytelling
    const narrativeElements = this.extractNarrativeElements(worldTiles);

    // Generate visual effects for enhanced atmosphere
    const visualEffects = this.generateVisualEffects(tilemap);

    this.integratedWorld = {
      tilemap,
      collisionMap,
      interactables,
      narrativeElements,
      visualEffects
    };

    console.log(`Integrated world created with ${interactables.size} interactables and ${narrativeElements.length} narrative elements`);
    
    return this.integratedWorld;
  }

  /**
   * Generate collision map that respects both tile-based and structure-based collision
   */
  private generateCollisionMap(tilemap: ALTTPTileMap): CollisionData[][] {
    const collisionMap: CollisionData[][] = [];
    const groundLayer = tilemap.layers.get('ground');
    const decorationLayer = tilemap.layers.get('decoration');

    if (!groundLayer) {
      console.warn('No ground layer found in tilemap');
      return collisionMap;
    }

    for (let y = 0; y < tilemap.height; y++) {
      collisionMap[y] = [];
      for (let x = 0; x < tilemap.width; x++) {
        const groundTile = groundLayer.tiles[y]?.[x];
        const decorationTile = decorationLayer?.tiles[y]?.[x];

        // Determine collision properties
        const collision = this.determineCollision(x, y, groundTile, decorationTile);
        collisionMap[y][x] = collision;
      }
    }

    return collisionMap;
  }

  private determineCollision(
    x: number, 
    y: number, 
    groundTile: any, 
    decorationTile: any
  ): CollisionData {
    let solid = false;
    let interactive = false;
    let tileType = TileType.GRASS;
    let variantId = 'grass_base';
    let story: string | undefined;
    let requirements: string[] | undefined;

    // Check ground tile collision
    if (groundTile) {
      tileType = groundTile.baseType;
      variantId = groundTile.altttpVariantId || 'unknown';
      solid = NON_WALKABLE_TILES.has(tileType);
      interactive = INTERACTIVE_TILES.has(tileType);
    }

    // Decoration tiles can override ground collision
    if (decorationTile) {
      const decorationType = decorationTile.baseType;
      
      // Decoration overrides collision in most cases
      if (NON_WALKABLE_TILES.has(decorationType)) {
        solid = true;
        tileType = decorationType;
        variantId = decorationTile.altttpVariantId || variantId;
      }
      
      if (INTERACTIVE_TILES.has(decorationType)) {
        interactive = true;
        tileType = decorationType;
        variantId = decorationTile.altttpVariantId || variantId;
        
        // Extract story from decoration if available
        story = this.getStoryForTile(decorationType, variantId);
        requirements = this.getRequirementsForTile(decorationType);
      }
    }

    return {
      x: x * this.TILE_SIZE,
      y: y * this.TILE_SIZE,
      width: this.TILE_SIZE,
      height: this.TILE_SIZE,
      solid,
      interactive,
      metadata: {
        tileType,
        variantId,
        story,
        requirements
      }
    };
  }

  private getStoryForTile(tileType: TileType, variantId: string): string | undefined {
    // Get environmental story based on tile type and variant
    const storyMap: Record<TileType, string> = {
      [TileType.CHEST]: 'A treasure chest waits to be opened, its contents unknown',
      [TileType.SHRINE]: 'An ancient shrine radiates mystical energy, calling to those who seek wisdom',
      [TileType.WELL]: 'A stone well offers fresh water to weary travelers',
      [TileType.SIGN]: 'A weathered sign points the way for travelers',
      [TileType.DOOR]: 'A sturdy door invites you to discover what lies beyond',
      [TileType.FOUNTAIN]: 'Crystal clear water flows from an ornate fountain'
    };

    return storyMap[tileType];
  }

  private getRequirementsForTile(tileType: TileType): string[] | undefined {
    // Define requirements for accessing certain tiles
    const requirementMap: Record<TileType, string[]> = {
      [TileType.SHRINE]: ['aether_mirror'],
      [TileType.CHEST]: [], // Most chests have no requirements
      [TileType.DOOR]: ['key'] // Generic key requirement
    };

    return requirementMap[tileType];
  }

  /**
   * Extract interactable objects for efficient runtime access
   */
  private extractInteractables(
    tilemap: ALTTPTileMap, 
    collisionMap: CollisionData[][]
  ): Map<string, CollisionData> {
    const interactables = new Map<string, CollisionData>();

    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        const collision = collisionMap[y][x];
        
        if (collision.interactive) {
          const key = `${x},${y}`;
          interactables.set(key, collision);
        }
      }
    }

    return interactables;
  }

  /**
   * Extract narrative elements from world tiles with environmental stories
   */
  private extractNarrativeElements(
    worldTiles: { tileType: number; walkable: boolean; region?: string; environmentalStory?: string }[][]
  ): Array<{
    x: number;
    y: number;
    story: string;
    triggerRadius: number;
    requirements?: string[];
  }> {
    const narrativeElements: Array<{
      x: number;
      y: number;
      story: string;
      triggerRadius: number;
      requirements?: string[];
    }> = [];

    for (let y = 0; y < worldTiles.length; y++) {
      for (let x = 0; x < worldTiles[y].length; x++) {
        const tile = worldTiles[y][x];
        
        if (tile.environmentalStory) {
          narrativeElements.push({
            x: x * this.TILE_SIZE,
            y: y * this.TILE_SIZE,
            story: tile.environmentalStory,
            triggerRadius: this.TILE_SIZE * 1.5, // 1.5 tile radius
            requirements: []
          });
        }
      }
    }

    return narrativeElements;
  }

  /**
   * Generate atmospheric visual effects for enhanced immersion
   */
  private generateVisualEffects(tilemap: ALTTPTileMap): Array<{
    x: number;
    y: number;
    type: 'particle' | 'animation' | 'glow';
    data: any;
  }> {
    const effects: Array<{
      x: number;
      y: number;
      type: 'particle' | 'animation' | 'glow';
      data: any;
    }> = [];

    const decorationLayer = tilemap.layers.get('decoration');
    if (!decorationLayer) return effects;

    // Add effects based on decoration tiles
    for (let y = 0; y < tilemap.height; y++) {
      for (let x = 0; x < tilemap.width; x++) {
        const tile = decorationLayer.tiles[y]?.[x];
        
        if (tile?.altttpVariantId) {
          const effect = this.getEffectForVariant(tile.altttpVariantId);
          if (effect) {
            effects.push({
              x: x * this.TILE_SIZE,
              y: y * this.TILE_SIZE,
              type: effect.type,
              data: effect.data
            });
          }
        }
      }
    }

    return effects;
  }

  private getEffectForVariant(variantId: string): {
    type: 'particle' | 'animation' | 'glow';
    data: any;
  } | null {
    // Define visual effects for different tile variants
    const effectMap: Record<string, { type: 'particle' | 'animation' | 'glow'; data: any }> = {
      'torch_lit': {
        type: 'particle',
        data: {
          particleType: 'fire',
          count: 5,
          speed: 20,
          color: '#FF4500'
        }
      },
      'shrine_ancient': {
        type: 'glow',
        data: {
          color: '#9C27B0',
          radius: 32,
          intensity: 0.5,
          pulse: true
        }
      },
      'crystal_spire': {
        type: 'glow',
        data: {
          color: '#87CEEB',
          radius: 24,
          intensity: 0.7,
          pulse: false
        }
      },
      'waterfall_0': {
        type: 'animation',
        data: {
          animationType: 'waterfall',
          frameCount: 3,
          frameDuration: 600
        }
      }
    };

    return effectMap[variantId] || null;
  }

  /**
   * Update collision system to handle ALTTP integration
   */
  isPositionWalkable(x: number, y: number): boolean {
    if (!this.integratedWorld) return true;

    const tileX = Math.floor(x / this.TILE_SIZE);
    const tileY = Math.floor(y / this.TILE_SIZE);

    if (
      tileY < 0 || tileY >= this.integratedWorld.collisionMap.length ||
      tileX < 0 || tileX >= this.integratedWorld.collisionMap[0].length
    ) {
      return false; // Out of bounds
    }

    const collision = this.integratedWorld.collisionMap[tileY][tileX];
    return !collision.solid;
  }

  /**
   * Check for interactables at position
   */
  getInteractableAt(x: number, y: number): CollisionData | null {
    if (!this.integratedWorld) return null;

    const tileX = Math.floor(x / this.TILE_SIZE);
    const tileY = Math.floor(y / this.TILE_SIZE);
    const key = `${tileX},${tileY}`;

    return this.integratedWorld.interactables.get(key) || null;
  }

  /**
   * Get narrative elements within range of position
   */
  getNarrativeElementsNear(x: number, y: number, range: number = 32): Array<{
    x: number;
    y: number;
    story: string;
    triggerRadius: number;
    requirements?: string[];
  }> {
    if (!this.integratedWorld) return [];

    return this.integratedWorld.narrativeElements.filter(element => {
      const distance = Math.hypot(x - element.x, y - element.y);
      return distance <= Math.max(range, element.triggerRadius);
    });
  }

  /**
   * Get visual effects for rendering
   */
  getVisualEffects(): Array<{
    x: number;
    y: number;
    type: 'particle' | 'animation' | 'glow';
    data: any;
  }> {
    return this.integratedWorld?.visualEffects || [];
  }

  /**
   * Handle Eclipse/Dayrealm transformation with integrated systems
   */
  transformRealm(targetRealm: 'dayrealm' | 'eclipse'): void {
    if (!this.integratedWorld) return;

    console.log(`Transforming world to ${targetRealm}...`);

    // Transform tiles using the established transformation rules
    const tilemap = this.integratedWorld.tilemap;
    const layers = ['ground', 'decoration'];

    layers.forEach(layerName => {
      const layer = tilemap.layers.get(layerName);
      if (!layer) return;

      for (let y = 0; y < tilemap.height; y++) {
        for (let x = 0; x < tilemap.width; x++) {
          const tile = layer.tiles[y]?.[x];
          if (tile?.baseType) {
            const transformedType = this.getTransformedTileType(tile.baseType, targetRealm);
            if (transformedType !== tile.baseType) {
              // Update tile with transformed variant
              const newVariantId = altttpTilesetManager.getOptimalTileVariant(transformedType);
              tile.baseType = transformedType;
              tile.altttpVariantId = newVariantId;
            }
          }
        }
      }
    });

    // Regenerate collision map after transformation
    this.integratedWorld.collisionMap = this.generateCollisionMap(tilemap);
    this.integratedWorld.interactables = this.extractInteractables(tilemap, this.integratedWorld.collisionMap);

    console.log(`World transformed to ${targetRealm}`);
  }

  private getTransformedTileType(originalType: TileType, targetRealm: 'dayrealm' | 'eclipse'): TileType {
    if (targetRealm === 'eclipse') {
      // Use the established transformation rules from constants
      const transformed = Object.entries(REALM_TRANSFORMATIONS).find(
        ([key, value]) => parseInt(key) === originalType
      );
      return transformed ? transformed[1] : originalType;
    } else {
      // Reverse transformation for dayrealm
      const reversed = Object.entries(REALM_TRANSFORMATIONS).find(
        ([key, value]) => value === originalType
      );
      return reversed ? parseInt(reversed[0]) : originalType;
    }
  }

  /**
   * Get integrated world data
   */
  getIntegratedWorld(): IntegratedWorldData | null {
    return this.integratedWorld;
  }

  /**
   * Initialize integration with existing systems
   */
  initialize(): void {
    console.log('ALTTP Integration initialized');
    console.log(`- Tileset Manager: ${altttpTilesetManager.getAllTileVariants().size} variants`);
    console.log(`- Environment Assets: ${altttpEnvironmentAssets.getAllStructures().size} structures`);
    console.log('- Collision system integrated');
    console.log('- Visual effects system ready');
    console.log('- Narrative system connected');
  }
}

export const altttpIntegration = new ALTTPIntegration();

// Initialize the integration system
altttpIntegration.initialize();