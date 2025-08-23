/**
 * ALTTP World Demo - Demonstrates the complete ALTTP-style world transformation
 * Shows off the enhanced tileset, environment assets, and integrated systems
 */

import { altttpTilesetManager } from '../systems/ALTTPTilesetManager';
import { altttpEnvironmentAssets } from '../systems/ALTTPEnvironmentAssets';
import { tileRenderer } from '../systems/TileRenderer';
import { altttpIntegration } from '../systems/ALTTPIntegration';
import { WorldGenerator } from '../utils/WorldGenerator';
import { spriteManager } from '../systems/SpriteManager';

export interface DemoStats {
  tileVariants: number;
  environmentStructures: number;
  narrativeElements: number;
  visualEffects: number;
  interactableObjects: number;
  worldSize: { width: number; height: number };
  renderingLayers: number;
}

export class ALTTPWorldDemo {
  private worldGenerator: WorldGenerator;
  private demoStats: DemoStats;

  constructor() {
    console.log('🎮 Initializing ALTTP World Demo...');
    
    // Initialize the world generator (this creates the enhanced ALTTP world automatically)
    this.worldGenerator = new WorldGenerator();
    
    // Collect demo statistics
    this.demoStats = this.collectDemoStats();
    
    this.displayDemoInfo();
  }

  private collectDemoStats(): DemoStats {
    const altttpWorldData = this.worldGenerator.getALTTPWorldData();
    const integratedWorld = altttpIntegration.getIntegratedWorld();
    
    return {
      tileVariants: altttpTilesetManager.getAllTileVariants().size,
      environmentStructures: altttpEnvironmentAssets.getAllStructures().size,
      narrativeElements: altttpWorldData?.narrativeElements.length || 0,
      visualEffects: integratedWorld?.visualEffects.length || 0,
      interactableObjects: integratedWorld?.interactables.size || 0,
      worldSize: {
        width: altttpWorldData?.tilemap.width || 0,
        height: altttpWorldData?.tilemap.height || 0
      },
      renderingLayers: altttpTilesetManager.getLayers().length
    };
  }

  private displayDemoInfo(): void {
    console.log('🌟 ALTTP World Demo Statistics:');
    console.log(`📐 World Size: ${this.demoStats.worldSize.width} x ${this.demoStats.worldSize.height} tiles`);
    console.log(`🎨 Tile Variants: ${this.demoStats.tileVariants} unique ALTTP-style tiles`);
    console.log(`🏰 Environment Structures: ${this.demoStats.environmentStructures} buildings and landmarks`);
    console.log(`📚 Narrative Elements: ${this.demoStats.narrativeElements} environmental stories`);
    console.log(`✨ Visual Effects: ${this.demoStats.visualEffects} atmospheric effects`);
    console.log(`🔄 Interactable Objects: ${this.demoStats.interactableObjects} interactive elements`);
    console.log(`🎭 Rendering Layers: ${this.demoStats.renderingLayers} depth layers for authentic ALTTP look`);
  }

  /**
   * Demonstrate ALTTP tile variety by showcasing different variants
   */
  demonstrateTileVariety(): void {
    console.log('🎨 Demonstrating ALTTP Tile Variety:');
    
    const tileVariants = altttpTilesetManager.getAllTileVariants();
    const varietyByType = new Map<string, number>();
    
    tileVariants.forEach(variant => {
      const typeKey = variant.tileType.toString();
      varietyByType.set(typeKey, (varietyByType.get(typeKey) || 0) + 1);
    });
    
    varietyByType.forEach((count, type) => {
      console.log(`  🔹 Tile Type ${type}: ${count} variants`);
    });
    
    // Demonstrate animated tiles
    const animatedVariants = Array.from(tileVariants.values()).filter(v => v.animated);
    console.log(`🎬 Animated Tiles: ${animatedVariants.length} with smooth frame transitions`);
  }

  /**
   * Demonstrate environment structures and their themes
   */
  demonstrateEnvironmentStructures(): void {
    console.log('🏗️ Demonstrating ALTTP Environment Structures:');
    
    const structures = altttpEnvironmentAssets.getAllStructures();
    const themes = altttpEnvironmentAssets.getAllThemes();
    
    console.log(`🎪 Available Themes: ${themes.size}`);
    themes.forEach(theme => {
      console.log(`  🎨 ${theme.name}: ${theme.materials.roofType} roofs, ${theme.materials.wallType} walls`);
    });
    
    console.log(`🏰 Structure Categories:`);
    const structuresByType = new Map<string, number>();
    
    structures.forEach(structure => {
      if (structure.id.includes('house')) {
        structuresByType.set('Houses', (structuresByType.get('Houses') || 0) + 1);
      } else if (structure.id.includes('shrine')) {
        structuresByType.set('Shrines', (structuresByType.get('Shrines') || 0) + 1);
      } else if (structure.id.includes('bridge')) {
        structuresByType.set('Bridges', (structuresByType.get('Bridges') || 0) + 1);
      } else {
        structuresByType.set('Other', (structuresByType.get('Other') || 0) + 1);
      }
    });
    
    structuresByType.forEach((count, type) => {
      console.log(`  🏛️ ${type}: ${count} structures`);
    });
  }

  /**
   * Demonstrate environmental storytelling system
   */
  demonstrateEnvironmentalStorytelling(): void {
    console.log('📖 Demonstrating Environmental Storytelling:');
    
    const altttpWorldData = this.worldGenerator.getALTTPWorldData();
    if (!altttpWorldData) return;
    
    console.log(`📚 Story Elements: ${altttpWorldData.narrativeElements.length} environmental narratives`);
    
    // Sample some stories
    const sampleStories = altttpWorldData.narrativeElements.slice(0, 3);
    sampleStories.forEach((element, index) => {
      console.log(`  📜 Story ${index + 1} (${element.x}, ${element.y}): "${element.story}"`);
      if (element.requirements && element.requirements.length > 0) {
        console.log(`    🔐 Requires: ${element.requirements.join(', ')}`);
      }
    });
    
    console.log(`🗺️ Secret Areas: ${altttpWorldData.secretAreas.length} hidden locations`);
    altttpWorldData.secretAreas.forEach((area, index) => {
      console.log(`  🔍 Secret ${index + 1}: ${area.discoveryMethod} reveals ${area.reward}`);
    });
  }

  /**
   * Demonstrate Eclipse/Dayrealm transformation system
   */
  demonstrateRealmTransformation(): void {
    console.log('🌗 Demonstrating Eclipse/Dayrealm Transformation:');
    
    const integratedWorld = altttpIntegration.getIntegratedWorld();
    if (!integratedWorld) return;
    
    console.log('🌅 Current state: Dayrealm');
    console.log('🔄 Transforming to Eclipse...');
    
    // Transform to eclipse
    altttpIntegration.transformRealm('eclipse');
    
    console.log('🌙 Eclipse transformation complete!');
    console.log('  ✨ Grass areas become mystical marshes');
    console.log('  🌊 Water reveals hidden bridges');
    console.log('  🏔️ Mountains transform into ancient walls');
    console.log('  🌲 Forests reveal secret pathways');
    
    // Transform back
    console.log('🔄 Transforming back to Dayrealm...');
    altttpIntegration.transformRealm('dayrealm');
    console.log('🌅 Returned to Dayrealm state');
  }

  /**
   * Demonstrate integrated collision and interaction systems
   */
  demonstrateIntegratedSystems(): void {
    console.log('⚙️ Demonstrating Integrated Systems:');
    
    const integratedWorld = altttpIntegration.getIntegratedWorld();
    if (!integratedWorld) return;
    
    console.log(`🏃 Collision System: ${integratedWorld.collisionMap.length * integratedWorld.collisionMap[0].length} tiles processed`);
    console.log(`🔄 Interactive System: ${integratedWorld.interactables.size} interactable objects`);
    console.log(`✨ Visual Effects: ${integratedWorld.visualEffects.length} atmospheric effects`);
    
    // Test collision detection
    console.log('🧪 Testing collision detection:');
    const testPositions = [
      { x: 80 * 16, y: 110 * 16, name: 'Hearthmere center' },
      { x: 50 * 16, y: 60 * 16, name: 'Whisperwood' },
      { x: 120 * 16, y: 140 * 16, name: 'Moonwell Marsh' }
    ];
    
    testPositions.forEach(pos => {
      const walkable = altttpIntegration.isPositionWalkable(pos.x, pos.y);
      const interactable = altttpIntegration.getInteractableAt(pos.x, pos.y);
      const narratives = altttpIntegration.getNarrativeElementsNear(pos.x, pos.y);
      
      console.log(`  📍 ${pos.name}: ${walkable ? '✅ walkable' : '❌ blocked'}`);
      if (interactable) {
        console.log(`    🔄 Interactable: ${interactable.metadata?.variantId}`);
      }
      if (narratives.length > 0) {
        console.log(`    📖 ${narratives.length} story elements nearby`);
      }
    });
  }

  /**
   * Demonstrate visual rendering capabilities
   */
  demonstrateRenderingCapabilities(): void {
    console.log('🎨 Demonstrating Rendering Capabilities:');
    
    const layers = altttpTilesetManager.getLayers();
    console.log(`🎭 Rendering Layers: ${layers.length} depth layers`);
    
    layers.forEach(layer => {
      console.log(`  🎨 ${layer.name}: z-index ${layer.zIndex}, opacity ${layer.opacity}`);
      if (layer.blendMode && layer.blendMode !== 'normal') {
        console.log(`    ✨ Blend mode: ${layer.blendMode}`);
      }
    });
    
    // Demonstrate animation capabilities
    const animatedVariants = Array.from(altttpTilesetManager.getAllTileVariants().values())
      .filter(v => v.animated);
    
    console.log(`🎬 Animation System: ${animatedVariants.length} animated tile types`);
    animatedVariants.slice(0, 3).forEach(variant => {
      console.log(`  🔄 ${variant.id}: ${variant.animationFrames} frames @ ${variant.animationSpeed}ms`);
    });
  }

  /**
   * Run complete demonstration
   */
  runCompleteDemo(): void {
    console.log('🌟 Running Complete ALTTP World Transformation Demo');
    console.log('='.repeat(60));
    
    this.demonstrateTileVariety();
    console.log();
    
    this.demonstrateEnvironmentStructures();
    console.log();
    
    this.demonstrateEnvironmentalStorytelling();
    console.log();
    
    this.demonstrateRealmTransformation();
    console.log();
    
    this.demonstrateIntegratedSystems();
    console.log();
    
    this.demonstrateRenderingCapabilities();
    
    console.log('='.repeat(60));
    console.log('🎉 ALTTP World Demo Complete!');
    console.log('✨ The world of Echoes of Aeria now features:');
    console.log('   🎨 Authentic ALTTP-style pixel art tileset');
    console.log('   🏰 Detailed environment structures and buildings');
    console.log('   📖 Rich environmental storytelling');
    console.log('   🌗 Eclipse/Dayrealm transformation system');
    console.log('   ⚙️ Integrated collision and interaction systems');
    console.log('   🎭 Layered rendering with animations and effects');
    console.log('');
    console.log('Ready for an authentic 16-bit adventure! 🗺️⚔️✨');
  }

  /**
   * Get demo statistics for external use
   */
  getDemoStats(): DemoStats {
    return { ...this.demoStats };
  }

  /**
   * Generate a visual representation of world data
   */
  generateWorldPreview(width: number = 40, height: number = 30): string {
    const world = this.worldGenerator.getWorld();
    let preview = '🗺️ ALTTP World Preview:\n';
    preview += '─'.repeat(width + 2) + '\n';
    
    for (let y = 0; y < Math.min(height, world.length); y++) {
      preview += '│';
      for (let x = 0; x < Math.min(width, world[y].length); x++) {
        const tile = world[y][x];
        preview += this.getTileIcon(tile.tileType);
      }
      preview += '│\n';
    }
    
    preview += '─'.repeat(width + 2) + '\n';
    preview += 'Legend: 🌱=Grass 🌊=Water 🌲=Forest 🏔️=Mountain 🏠=Buildings ✨=Special\n';
    
    return preview;
  }

  private getTileIcon(tileType: number): string {
    const iconMap: Record<number, string> = {
      0: '🌱',  // GRASS
      1: '🌊',  // WATER
      2: '🌲',  // FOREST
      3: '🏔️',  // MOUNTAIN
      4: '🏜️',  // DESERT
      5: '❄️',  // SNOW
      6: '🐸',  // MARSH
      7: '🌋',  // VOLCANIC
      8: '🧱',  // WALL
      9: '🚪',  // DOOR
      10: '🌉', // BRIDGE
      11: '🛤️', // PATH
      12: '🏠', // HOUSE
      13: '⛩️', // SHRINE
      14: '📦', // CHEST
      15: '🌸'  // FLOWER
    };
    
    return iconMap[tileType] || '✨';
  }
}

// Create and run demo instance if in development
if (typeof window !== 'undefined' && (window as any).DEV_MODE) {
  const demo = new ALTTPWorldDemo();
  demo.runCompleteDemo();
  
  // Make demo available globally for testing
  (window as any).altttpDemo = demo;
}