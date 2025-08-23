/**
 * ALTTP Environment Assets - Comprehensive environment asset creation
 * Creates detailed ALTTP-style buildings, structures, and environmental storytelling elements
 * Builds upon the ALTTPTilesetManager foundation with specialized environment creation
 */

import { altttpTilesetManager } from './ALTTPTilesetManager';
import { spriteManager } from './SpriteManager';
import { TileType } from '@shared/types.js';
import { ALTTP_PALETTE, TILE_COLORS } from '@shared/constants.js';

export interface EnvironmentStructure {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Array<{
    x: number;
    y: number;
    variantId: string;
    layerType: 'ground' | 'decoration' | 'overlay';
    interactive?: boolean;
    collides?: boolean;
  }>;
  anchor: { x: number; y: number }; // Placement anchor point
  story?: string; // Environmental storytelling
  requirements?: string[]; // Required items/progression to access
}

export interface EnvironmentTheme {
  id: string;
  name: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    shadow: string;
    highlight: string;
  };
  materials: {
    roofType: 'thatch' | 'tile' | 'stone' | 'wood';
    wallType: 'wood' | 'stone' | 'brick' | 'mud';
    decorationType: 'flowers' | 'vines' | 'moss' | 'snow' | 'sand';
  };
}

export class ALTTPEnvironmentAssets {
  private structures: Map<string, EnvironmentStructure> = new Map();
  private themes: Map<string, EnvironmentTheme> = new Map();
  private generatedAssets: Map<string, HTMLCanvasElement> = new Map();
  private readonly TILE_SIZE = 16;

  constructor() {
    this.initializeThemes();
    this.initializeStructures();
  }

  private initializeThemes(): void {
    // Verdant Lowlands theme (starting area)
    this.themes.set('verdant', {
      id: 'verdant',
      name: 'Verdant Lowlands',
      colorScheme: {
        primary: TILE_COLORS[TileType.GRASS],
        secondary: '#8B7355', // Warm earth tones
        accent: '#FF6B9D',     // Pink flowers
        shadow: '#4A5D23',     // Dark green shadows
        highlight: '#B8E6B8'   // Light green highlights
      },
      materials: {
        roofType: 'thatch',
        wallType: 'wood',
        decorationType: 'flowers'
      }
    });

    // Whisperwood theme (forest)
    this.themes.set('whisperwood', {
      id: 'whisperwood',
      name: 'Whisperwood',
      colorScheme: {
        primary: TILE_COLORS[TileType.FOREST],
        secondary: '#8B4513',  // Tree trunk brown
        accent: '#8A2BE2',     // Mystical purple
        shadow: '#1B3B1B',     // Very dark green
        highlight: '#90EE90'   // Light forest green
      },
      materials: {
        roofType: 'wood',
        wallType: 'wood',
        decorationType: 'moss'
      }
    });

    // Moonwell Marsh theme (mystical marsh)
    this.themes.set('moonwell', {
      id: 'moonwell',
      name: 'Moonwell Marsh',
      colorScheme: {
        primary: TILE_COLORS[TileType.MARSH],
        secondary: '#4A6741',  // Marsh brown
        accent: '#87CEEB',     // Mystical blue
        shadow: '#2F4F2F',     // Dark grey green
        highlight: '#F0F8FF'   // Mystic light
      },
      materials: {
        roofType: 'stone',
        wallType: 'stone',
        decorationType: 'vines'
      }
    });

    // Amber Dunes theme (desert)
    this.themes.set('amber', {
      id: 'amber',
      name: 'Amber Dunes',
      colorScheme: {
        primary: TILE_COLORS[TileType.DESERT],
        secondary: '#D2B48C',  // Sandy brown
        accent: '#FF4500',     // Desert orange
        shadow: '#8B4513',     // Dark sand
        highlight: '#FFF8DC'   // Light sand
      },
      materials: {
        roofType: 'tile',
        wallType: 'mud',
        decorationType: 'sand'
      }
    });

    // Frostpeak theme (snowy mountains)
    this.themes.set('frostpeak', {
      id: 'frostpeak',
      name: 'Frostpeak Tundra',
      colorScheme: {
        primary: TILE_COLORS[TileType.SNOW],
        secondary: '#708090',  // Slate grey
        accent: '#4169E1',     // Ice blue
        shadow: '#2F4F4F',     // Dark slate
        highlight: '#F0FFFF'   // Pure white
      },
      materials: {
        roofType: 'stone',
        wallType: 'stone',
        decorationType: 'snow'
      }
    });
  }

  private initializeStructures(): void {
    console.log('Creating ALTTP-style environment structures...');
    
    // Basic structures
    this.createHearthmereBuildings();
    this.createGenericBuildings();
    this.createShrinesAndMonuments();
    this.createBridgesAndPaths();
    this.createNaturalFeatures();
    this.createInteractiveStructures();
    
    console.log(`Created ${this.structures.size} environment structures`);
  }

  private createHearthmereBuildings(): void {
    // Hearthmere Town Hall - central building of the starting town
    const townHall = this.createComplexBuilding('hearthmere_town_hall', 5, 4, 'verdant', {
      story: 'The heart of Hearthmere, where Keeper Elowen guides travelers',
      interactive: true,
      entrances: [{ x: 2, y: 3 }]
    });
    this.structures.set('hearthmere_town_hall', townHall);

    // Hearthmere Houses - cozy starter town homes
    for (let i = 1; i <= 3; i++) {
      const house = this.createStandardHouse(`hearthmere_house_${i}`, 3, 3, 'verdant', {
        story: `A quaint home in Hearthmere, filled with the warmth of village life`,
        variant: i
      });
      this.structures.set(`hearthmere_house_${i}`, house);
    }

    // Tutorial Shrine - first shrine players encounter
    const tutorialShrine = this.createShrine('tutorial_shrine', 'verdant', {
      story: 'An ancient shrine that teaches the ways of the Aether Mirror',
      mystical: true,
      tutorial: true
    });
    this.structures.set('tutorial_shrine', tutorialShrine);
  }

  private createGenericBuildings(): void {
    // Standard houses for various regions
    const regions = ['verdant', 'whisperwood', 'moonwell', 'amber', 'frostpeak'];
    
    regions.forEach(region => {
      // Small house
      const smallHouse = this.createStandardHouse(`house_small_${region}`, 2, 2, region, {
        story: `A modest dwelling adapted to the ${region} environment`
      });
      this.structures.set(`house_small_${region}`, smallHouse);

      // Medium house
      const mediumHouse = this.createStandardHouse(`house_medium_${region}`, 3, 3, region, {
        story: `A comfortable home reflecting ${region} architectural style`
      });
      this.structures.set(`house_medium_${region}`, mediumHouse);

      // Large house
      const largeHouse = this.createStandardHouse(`house_large_${region}`, 4, 4, region, {
        story: `An impressive residence of ${region}, home to local notables`
      });
      this.structures.set(`house_large_${region}`, largeHouse);
    });
  }

  private createShrinesAndMonuments(): void {
    // Ancient shrines for each region
    const shrines = [
      { id: 'rootway_shrine', region: 'whisperwood', power: 'Nature\'s Wisdom' },
      { id: 'moonwell_shrine', region: 'moonwell', power: 'Mystic Reflection' },
      { id: 'sunspear_shrine', region: 'amber', power: 'Desert Resilience' },
      { id: 'frostpeak_shrine', region: 'frostpeak', power: 'Mountain\'s Strength' }
    ];

    shrines.forEach(shrine => {
      const structure = this.createShrine(shrine.id, shrine.region, {
        story: `An ancient shrine imbued with ${shrine.power}, holding secrets of the ${shrine.region}`,
        mystical: true,
        power: shrine.power
      });
      this.structures.set(shrine.id, structure);
    });

    // Eldercrown Keep entrance
    const keepEntrance = this.createMonument('eldercrown_entrance', 7, 5, 'frostpeak', {
      story: 'The imposing entrance to Eldercrown Keep, seat of ancient power',
      monumental: true,
      requirements: ['sunflame_lantern', 'aether_mirror']
    });
    this.structures.set('eldercrown_entrance', keepEntrance);
  }

  private createBridgesAndPaths(): void {
    // Various bridge types
    const bridgeTypes = [
      { id: 'wooden_bridge_h', width: 4, height: 1, direction: 'horizontal', material: 'wood' },
      { id: 'wooden_bridge_v', width: 1, height: 4, direction: 'vertical', material: 'wood' },
      { id: 'stone_bridge_h', width: 4, height: 1, direction: 'horizontal', material: 'stone' },
      { id: 'stone_bridge_v', width: 1, height: 4, direction: 'vertical', material: 'stone' }
    ];

    bridgeTypes.forEach(bridge => {
      const structure = this.createBridge(bridge.id, bridge.width, bridge.height, bridge.material, {
        story: `A ${bridge.material} bridge spanning the waters, connecting distant lands`
      });
      this.structures.set(bridge.id, structure);
    });

    // Path intersection
    const pathCross = this.createPathIntersection('path_cross', {
      story: 'Ancient paths converge here, worn by countless travelers'
    });
    this.structures.set('path_cross', pathCross);
  }

  private createNaturalFeatures(): void {
    // Sacred groves
    const sacredGrove = this.createSacredGrove('sacred_grove', 5, 5, {
      story: 'A mystical grove where ancient spirits dwell, untouched by time'
    });
    this.structures.set('sacred_grove', sacredGrove);

    // Crystal formations (for mystical areas)
    const crystalFormation = this.createCrystalFormation('crystal_spire', 3, 3, {
      story: 'Mysterious crystals that resonate with aether energy'
    });
    this.structures.set('crystal_spire', crystalFormation);

    // Ancient stone circles
    const stoneCircle = this.createStoneCircle('ancient_circle', 5, 5, {
      story: 'A ring of standing stones, their purpose lost to antiquity'
    });
    this.structures.set('ancient_circle', stoneCircle);

    // Waterfall features
    const waterfall = this.createWaterfall('mystic_falls', 3, 5, {
      story: 'A cascade of pure mountain water, said to grant clarity to those who drink'
    });
    this.structures.set('mystic_falls', waterfall);
  }

  private createInteractiveStructures(): void {
    // Wells with bucket mechanisms
    const ancientWell = this.createWell('ancient_well', {
      story: 'An old well that has sustained travelers for generations',
      functional: true,
      reward: 'fresh_water'
    });
    this.structures.set('ancient_well', ancientWell);

    // Signposts with directional information
    const signpost = this.createSignpost('direction_sign', {
      story: 'A weathered sign pointing toward distant destinations',
      directions: ['Hearthmere: 2 leagues', 'Whisperwood: 1 league', 'Moonwell: 3 leagues']
    });
    this.structures.set('direction_sign', signpost);

    // Campfire sites
    const campfire = this.createCampfire('travelers_rest', {
      story: 'A circle of stones where weary travelers rest and share tales',
      functional: true,
      benefit: 'rest_heal'
    });
    this.structures.set('travelers_rest', campfire);

    // Treasure chests in various states
    const treasureChest = this.createTreasureChest('hidden_cache', {
      story: 'A chest hidden by someone long ago, its secrets waiting to be discovered',
      locked: true,
      contents: 'aether_shard'
    });
    this.structures.set('hidden_cache', treasureChest);
  }

  // Structure creation methods with ALTTP-quality detail

  private createComplexBuilding(
    id: string,
    width: number,
    height: number,
    themeId: string,
    options: {
      story?: string;
      interactive?: boolean;
      entrances?: Array<{ x: number; y: number }>;
    }
  ): EnvironmentStructure {
    const tiles: EnvironmentStructure['tiles'] = [];
    const theme = this.themes.get(themeId)!;

    // Create building foundation and walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === height - 1) {
          // Ground level - doors and walls
          const isEntrance = options.entrances?.some(e => e.x === x && e.y === y);
          tiles.push({
            x, y,
            variantId: isEntrance ? 'door_wood' : this.getBuildingWallVariant(theme),
            layerType: isEntrance ? 'decoration' : 'ground',
            interactive: isEntrance,
            collides: !isEntrance
          });
        } else {
          // Upper levels - roof and walls
          tiles.push({
            x, y,
            variantId: this.getBuildingRoofVariant(theme, x, y, width, height),
            layerType: 'ground',
            collides: true
          });
        }
      }
    }

    // Add architectural details
    this.addBuildingDetails(tiles, width, height, theme);

    return {
      id,
      name: `Complex Building (${theme.name})`,
      width,
      height,
      tiles,
      anchor: { x: Math.floor(width / 2), y: height - 1 },
      story: options.story
    };
  }

  private createStandardHouse(
    id: string,
    width: number,
    height: number,
    themeId: string,
    options: {
      story?: string;
      variant?: number;
    }
  ): EnvironmentStructure {
    const tiles: EnvironmentStructure['tiles'] = [];
    const theme = this.themes.get(themeId)!;

    // Simple house structure
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === height - 1) {
          // Ground level
          if (x === Math.floor(width / 2)) {
            // Door in center
            tiles.push({
              x, y,
              variantId: 'door_wood',
              layerType: 'decoration',
              interactive: true,
              collides: false
            });
          } else {
            // Wall
            tiles.push({
              x, y,
              variantId: this.getBuildingWallVariant(theme),
              layerType: 'ground',
              collides: true
            });
          }
        } else {
          // Roof
          tiles.push({
            x, y,
            variantId: this.getBuildingRoofVariant(theme, x, y, width, height),
            layerType: 'ground',
            collides: true
          });
        }
      }
    }

    return {
      id,
      name: `Standard House (${theme.name})`,
      width,
      height,
      tiles,
      anchor: { x: Math.floor(width / 2), y: height - 1 },
      story: options.story
    };
  }

  private createShrine(
    id: string,
    themeId: string,
    options: {
      story?: string;
      mystical?: boolean;
      tutorial?: boolean;
      power?: string;
    }
  ): EnvironmentStructure {
    const tiles: EnvironmentStructure['tiles'] = [];
    const width = 3;
    const height = 3;

    // Shrine base
    tiles.push({
      x: 1, y: 2,
      variantId: 'shrine_ancient',
      layerType: 'ground',
      interactive: true,
      collides: true
    });

    // Mystical elements around shrine
    if (options.mystical) {
      // Glowing orbs at corners
      const orbPositions = [[0, 0], [2, 0], [0, 2], [2, 2]];
      orbPositions.forEach(([x, y]) => {
        tiles.push({
          x, y,
          variantId: 'mystic_orb',
          layerType: 'decoration',
          interactive: false,
          collides: false
        });
      });

      // Central altar
      tiles.push({
        x: 1, y: 1,
        variantId: 'altar_stone',
        layerType: 'decoration',
        interactive: true,
        collides: false
      });
    }

    return {
      id,
      name: 'Ancient Shrine',
      width,
      height,
      tiles,
      anchor: { x: 1, y: 2 },
      story: options.story,
      requirements: options.tutorial ? [] : ['aether_mirror']
    };
  }

  private createBridge(
    id: string,
    width: number,
    height: number,
    material: string,
    options: { story?: string }
  ): EnvironmentStructure {
    const tiles: EnvironmentStructure['tiles'] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles.push({
          x, y,
          variantId: material === 'stone' ? 'bridge_stone' : 'bridge_wood_h',
          layerType: 'ground',
          collides: false
        });
      }
    }

    return {
      id,
      name: `${material} Bridge`,
      width,
      height,
      tiles,
      anchor: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
      story: options.story
    };
  }

  private createSacredGrove(
    id: string,
    width: number,
    height: number,
    options: { story?: string }
  ): EnvironmentStructure {
    const tiles: EnvironmentStructure['tiles'] = [];

    // Ring of ancient trees
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isEdge = x === 0 || x === width - 1 || y === 0 || y === height - 1;
        const isCorner = (x === 0 || x === width - 1) && (y === 0 || y === height - 1);
        
        if (isEdge && !isCorner) {
          tiles.push({
            x, y,
            variantId: 'tree_ancient',
            layerType: 'decoration',
            collides: true
          });
        } else if (x === Math.floor(width / 2) && y === Math.floor(height / 2)) {
          // Central shrine or altar
          tiles.push({
            x, y,
            variantId: 'nature_altar',
            layerType: 'decoration',
            interactive: true,
            collides: false
          });
        }
      }
    }

    return {
      id,
      name: 'Sacred Grove',
      width,
      height,
      tiles,
      anchor: { x: Math.floor(width / 2), y: Math.floor(height / 2) },
      story: options.story
    };
  }

  private createWaterfall(
    id: string,
    width: number,
    height: number,
    options: { story?: string }
  ): EnvironmentStructure {
    const tiles: EnvironmentStructure['tiles'] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === Math.floor(width / 2)) {
          // Central waterfall column
          tiles.push({
            x, y,
            variantId: `waterfall_${y % 3}`, // Animated waterfall frames
            layerType: y === 0 ? 'overlay' : 'decoration',
            collides: false
          });
        } else if (y === height - 1) {
          // Pool at bottom
          tiles.push({
            x, y,
            variantId: 'water_shallow',
            layerType: 'ground',
            collides: false
          });
        }
      }
    }

    return {
      id,
      name: 'Waterfall',
      width,
      height,
      tiles,
      anchor: { x: Math.floor(width / 2), y: height - 1 },
      story: options.story
    };
  }

  // Utility methods for building details

  private getBuildingWallVariant(theme: EnvironmentTheme): string {
    switch (theme.materials.wallType) {
      case 'wood': return 'wall_wood';
      case 'stone': return 'wall_stone';
      case 'brick': return 'wall_brick';
      case 'mud': return 'wall_adobe';
      default: return 'wall_wood';
    }
  }

  private getBuildingRoofVariant(
    theme: EnvironmentTheme,
    x: number,
    y: number,
    width: number,
    height: number
  ): string {
    const isTopRow = y === 0;
    const isBottomRow = y === height - 2; // One above ground
    const isLeftEdge = x === 0;
    const isRightEdge = x === width - 1;

    if (isTopRow) {
      return theme.materials.roofType === 'tile' ? 'roof_tile_peak' : 'roof_thatch_peak';
    } else if (isBottomRow) {
      return theme.materials.roofType === 'tile' ? 'roof_tile_edge' : 'roof_thatch_edge';
    } else {
      return theme.materials.roofType === 'tile' ? 'roof_tile' : 'roof_thatch';
    }
  }

  private addBuildingDetails(
    tiles: EnvironmentStructure['tiles'],
    width: number,
    height: number,
    theme: EnvironmentTheme
  ): void {
    // Add windows, chimneys, decorative elements based on theme
    if (width >= 3 && height >= 3) {
      // Add chimney
      tiles.push({
        x: width - 1,
        y: 0,
        variantId: 'chimney_stone',
        layerType: 'decoration',
        collides: true
      });

      // Add window if space allows
      if (width >= 4) {
        tiles.push({
          x: width - 2,
          y: height - 1,
          variantId: 'window_wood',
          layerType: 'decoration',
          collides: true
        });
      }
    }
  }

  // Additional structure creation methods (simplified for space)
  private createMonument(id: string, width: number, height: number, themeId: string, options: any): EnvironmentStructure {
    return this.createComplexBuilding(id, width, height, themeId, options);
  }

  private createPathIntersection(id: string, options: any): EnvironmentStructure {
    const tiles = [
      { x: 0, y: 1, variantId: 'path_dirt', layerType: 'ground' as const, collides: false },
      { x: 1, y: 0, variantId: 'path_dirt', layerType: 'ground' as const, collides: false },
      { x: 1, y: 1, variantId: 'path_dirt', layerType: 'ground' as const, collides: false },
      { x: 1, y: 2, variantId: 'path_dirt', layerType: 'ground' as const, collides: false },
      { x: 2, y: 1, variantId: 'path_dirt', layerType: 'ground' as const, collides: false }
    ];
    
    return {
      id, name: 'Path Intersection', width: 3, height: 3, tiles, anchor: { x: 1, y: 1 }, story: options.story
    };
  }

  private createCrystalFormation(id: string, width: number, height: number, options: any): EnvironmentStructure {
    const tiles = [{ x: 1, y: 1, variantId: 'crystal_large', layerType: 'decoration' as const, collides: true }];
    return { id, name: 'Crystal Formation', width, height, tiles, anchor: { x: 1, y: 1 }, story: options.story };
  }

  private createStoneCircle(id: string, width: number, height: number, options: any): EnvironmentStructure {
    const tiles = [
      { x: 1, y: 0, variantId: 'stone_pillar', layerType: 'decoration' as const, collides: true },
      { x: 3, y: 1, variantId: 'stone_pillar', layerType: 'decoration' as const, collides: true },
      { x: 3, y: 3, variantId: 'stone_pillar', layerType: 'decoration' as const, collides: true },
      { x: 1, y: 4, variantId: 'stone_pillar', layerType: 'decoration' as const, collides: true }
    ];
    return { id, name: 'Stone Circle', width, height, tiles, anchor: { x: 2, y: 2 }, story: options.story };
  }

  private createWell(id: string, options: any): EnvironmentStructure {
    const tiles = [{ x: 0, y: 0, variantId: 'well_stone', layerType: 'decoration' as const, interactive: true, collides: true }];
    return { id, name: 'Ancient Well', width: 1, height: 1, tiles, anchor: { x: 0, y: 0 }, story: options.story };
  }

  private createSignpost(id: string, options: any): EnvironmentStructure {
    const tiles = [{ x: 0, y: 0, variantId: 'sign_wood', layerType: 'decoration' as const, interactive: true, collides: false }];
    return { id, name: 'Signpost', width: 1, height: 1, tiles, anchor: { x: 0, y: 0 }, story: options.story };
  }

  private createCampfire(id: string, options: any): EnvironmentStructure {
    const tiles = [{ x: 0, y: 0, variantId: 'campfire_lit', layerType: 'decoration' as const, interactive: true, collides: false }];
    return { id, name: 'Campfire', width: 1, height: 1, tiles, anchor: { x: 0, y: 0 }, story: options.story };
  }

  private createTreasureChest(id: string, options: any): EnvironmentStructure {
    const tiles = [{ x: 0, y: 0, variantId: 'chest_closed', layerType: 'decoration' as const, interactive: true, collides: false }];
    return { id, name: 'Treasure Chest', width: 1, height: 1, tiles, anchor: { x: 0, y: 0 }, story: options.story };
  }

  // Public API

  getStructure(id: string): EnvironmentStructure | undefined {
    return this.structures.get(id);
  }

  getAllStructures(): Map<string, EnvironmentStructure> {
    return new Map(this.structures);
  }

  getStructuresForTheme(themeId: string): EnvironmentStructure[] {
    return Array.from(this.structures.values()).filter(s => s.id.includes(themeId));
  }

  getTheme(id: string): EnvironmentTheme | undefined {
    return this.themes.get(id);
  }

  getAllThemes(): Map<string, EnvironmentTheme> {
    return new Map(this.themes);
  }

  /**
   * Get appropriate structures for a region and context
   */
  getStructuresForRegion(regionName: string): string[] {
    const regionThemes: Record<string, string> = {
      'Verdant Lowlands': 'verdant',
      'Whisperwood': 'whisperwood',
      'Moonwell Marsh': 'moonwell',
      'Amber Dunes & Canyon': 'amber',
      'Frostpeak Tundra': 'frostpeak'
    };

    const themeId = regionThemes[regionName] || 'verdant';
    return Array.from(this.structures.keys()).filter(id => id.includes(themeId));
  }

  /**
   * Get story elements for environmental storytelling
   */
  getEnvironmentalStory(structureId: string): string | undefined {
    const structure = this.structures.get(structureId);
    return structure?.story;
  }
}

export const altttpEnvironmentAssets = new ALTTPEnvironmentAssets();