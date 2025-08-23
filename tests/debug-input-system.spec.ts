import { test, expect } from '@playwright/test';

test('Debug input system key detection', async ({ page }) => {
  // Navigate and initialize
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 10000 });
  const canvas = page.locator('canvas');
  await canvas.click();
  await page.waitForTimeout(3000);
  
  console.log('Testing key detection...');
  
  // Test key detection
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(200);
  
  // Check input state
  const inputState = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const inputSystem = scene.inputSystem;
    return inputSystem ? inputSystem.getInputState() : null;
  });
  
  console.log('Input state during KeyD press:', inputState);
  
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(100);
  
  // Check velocity and movement system
  const systemInfo = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const playerEntities = scene.world.getEntitiesWithComponents('player', 'movement');
    
    if (playerEntities.length === 0) {
      return { error: 'No player entities found' };
    }
    
    const player = playerEntities[0];
    const movement = scene.world.getComponent(player.id, 'movement');
    
    return {
      playerId: player.id,
      movement: movement ? {
        velocity: movement.velocity,
        speed: movement.speed,
        direction: movement.direction
      } : null,
      hasInputSystem: !!scene.inputSystem,
      hasMovementSystem: !!scene.movementSystem,
    };
  });
  
  console.log('System info:', systemInfo);
  
  // Test manual movement through direct key input
  console.log('Testing manual movement through direct scene key handler...');
  
  await page.evaluate(() => {
    // Trigger the scene's manual movement test
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    if (scene.testManualMovement) {
      scene.testManualMovement(20, 0); // Move right 20 pixels
    } else {
      console.log('testManualMovement method not available');
    }
  });
  
  const positionAfterManual = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const playerEntities = scene.world.getEntitiesWithComponents('player', 'transform');
    const transform = scene.world.getComponent(playerEntities[0].id, 'transform');
    return { x: transform.position.x, y: transform.position.y };
  });
  
  console.log('Position after manual movement:', positionAfterManual);
  
  expect(systemInfo.hasInputSystem).toBeTruthy();
  expect(systemInfo.hasMovementSystem).toBeTruthy();
  expect(systemInfo.movement).toBeTruthy();
});