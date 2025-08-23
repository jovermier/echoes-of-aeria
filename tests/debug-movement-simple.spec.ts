import { test, expect } from '@playwright/test';

test('Debug game initialization and player position', async ({ page }) => {
  // Navigate to the game
  await page.goto('/');
  
  // Wait for canvas to appear
  await page.waitForSelector('canvas', { timeout: 10000 });
  
  // Focus the game
  const canvas = page.locator('canvas');
  await canvas.click();
  
  // Wait for game to initialize
  await page.waitForTimeout(3000);
  
  // Debug: Check what's available in the global scope
  const debugInfo = await page.evaluate(() => {
    const info: any = {
      hasPhaserGame: !!(window as any).phaserGame,
      hasGameInstance: !!(window as any).gameInstance,
      windowKeys: Object.keys(window).filter(k => k.includes('game') || k.includes('phaser')),
    };
    
    const game = (window as any).phaserGame;
    if (game) {
      info.gameType = typeof game;
      info.gameConstructor = game.constructor.name;
      info.sceneKeys = game.scene.keys;
      info.activeScenes = game.scene.getScenes(true).map((s: any) => s.scene.key);
      
      const worldScene = game.scene.getScene('WorldScene');
      if (worldScene) {
        info.worldSceneExists = true;
        info.worldSceneActive = worldScene.scene.isActive();
        info.hasWorld = !!worldScene.world;
        info.hasInputSystem = !!worldScene.inputSystem;
        info.hasMovementSystem = !!worldScene.movementSystem;
        
        if (worldScene.world) {
          const allEntities = worldScene.world.getAllEntities();
          info.totalEntities = allEntities.length;
          info.entities = allEntities.map((e: any) => ({
            id: e.id,
            components: Array.from(e.components.keys())
          }));
          
          const playerEntities = worldScene.world.getEntitiesWithComponents('player', 'transform');
          info.playerEntities = playerEntities.length;
          
          if (playerEntities.length > 0) {
            const player = playerEntities[0];
            const transform = worldScene.world.getComponent(player.id, 'transform');
            info.playerTransform = transform;
            info.playerPosition = transform ? transform.position : null;
          }
        }
      } else {
        info.worldSceneExists = false;
      }
    } else {
      info.gameType = 'undefined';
    }
    
    return info;
  });
  
  console.log('Debug info:');
  console.log('- Has Phaser Game:', debugInfo.hasPhaserGame);
  console.log('- WorldScene exists:', debugInfo.worldSceneExists);
  console.log('- WorldScene active:', debugInfo.worldSceneActive);
  console.log('- Has world:', debugInfo.hasWorld);
  console.log('- Total entities:', debugInfo.totalEntities);
  console.log('- Player entities:', debugInfo.playerEntities);
  console.log('- Player position:', debugInfo.playerPosition);
  
  // Assert basic requirements
  expect(debugInfo.hasPhaserGame).toBeTruthy();
  expect(debugInfo.worldSceneExists).toBeTruthy();
  expect(debugInfo.worldSceneActive).toBeTruthy();
  expect(debugInfo.hasWorld).toBeTruthy();
  expect(debugInfo.totalEntities).toBeGreaterThan(0);
  expect(debugInfo.playerEntities).toBe(1);
  expect(debugInfo.playerPosition).toBeTruthy();
  
  console.log('Player position:', debugInfo.playerPosition);
});