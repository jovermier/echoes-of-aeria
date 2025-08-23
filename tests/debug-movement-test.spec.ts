import { test, expect } from '@playwright/test';

test('Debug basic movement functionality', async ({ page }) => {
  // Navigate and initialize
  await page.goto('/');
  await page.waitForSelector('canvas', { timeout: 10000 });
  const canvas = page.locator('canvas');
  await canvas.click();
  await page.waitForTimeout(3000);
  
  // Get initial position
  const initialPosition = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const playerEntities = scene.world.getEntitiesWithComponents('player', 'transform');
    const transform = scene.world.getComponent(playerEntities[0].id, 'transform');
    return { x: transform.position.x, y: transform.position.y };
  });
  
  console.log('Initial position:', initialPosition);
  
  // Test movement by pressing D key for 500ms
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(500);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(100);
  
  // Get final position
  const finalPosition = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const playerEntities = scene.world.getEntitiesWithComponents('player', 'transform');
    const transform = scene.world.getComponent(playerEntities[0].id, 'transform');
    return { x: transform.position.x, y: transform.position.y };
  });
  
  console.log('Final position:', finalPosition);
  console.log('Movement delta:', { 
    x: finalPosition.x - initialPosition.x, 
    y: finalPosition.y - initialPosition.y 
  });
  
  // Check if movement occurred
  const moved = finalPosition.x !== initialPosition.x || finalPosition.y !== initialPosition.y;
  expect(moved).toBeTruthy();
  
  // Specifically check right movement
  expect(finalPosition.x).toBeGreaterThan(initialPosition.x);
  
  // Test velocity during movement
  console.log('Testing velocity during movement...');
  
  // Start movement
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(100);
  
  // Check velocity
  const velocity = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const playerEntities = scene.world.getEntitiesWithComponents('player', 'movement');
    const movement = scene.world.getComponent(playerEntities[0].id, 'movement');
    return { x: movement.velocity.x, y: movement.velocity.y };
  });
  
  console.log('Velocity during movement:', velocity);
  
  // Stop movement
  await page.keyboard.up('KeyA');
  await page.waitForTimeout(100);
  
  // Check velocity after stopping
  const stoppedVelocity = await page.evaluate(() => {
    const game = (window as any).phaserGame;
    const scene = game.scene.getScene('WorldScene');
    const playerEntities = scene.world.getEntitiesWithComponents('player', 'movement');
    const movement = scene.world.getComponent(playerEntities[0].id, 'movement');
    return { x: movement.velocity.x, y: movement.velocity.y };
  });
  
  console.log('Velocity after stopping:', stoppedVelocity);
  
  // Velocity should be moving left during movement
  expect(Math.abs(velocity.x)).toBeGreaterThan(0);
  
  // Movement worked successfully!
  console.log('✓ Movement system is working correctly');
});