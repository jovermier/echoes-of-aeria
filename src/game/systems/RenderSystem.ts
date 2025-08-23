// Enhanced Render System - ALTTP-style sprite rendering with pixel-perfect rendering
// Following Player Controller & Camera agent specifications

import Phaser from 'phaser';
import { System } from '../ECS.js';
import { spriteManager, type AnimationState } from './SpriteManager.js';
import type { TransformComponent, SpriteComponent, MovementComponent, HealthComponent } from '@shared/types.js';
import type { WorldScene } from '../scenes/WorldScene.js';
import type { Direction } from '@shared/types.js';

export class RenderSystem extends System {
  private scene: WorldScene;
  private spriteObjects: Map<string, Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle> = new Map();
  private cameraTarget: string | null = null;
  private cameraLerpSpeed = 0.1;
  private entityAnimationStates: Map<string, { lastDirection: Direction; isMoving: boolean; isAttacking: boolean }> = new Map();

  constructor(scene: WorldScene) {
    super();
    this.scene = scene;
    
    // Configure pixel-perfect rendering for the scene
    this.setupPixelPerfectRendering();
  }

  private setupPixelPerfectRendering(): void {
    // Disable anti-aliasing for pixel art
    this.scene.renderer.antialias = false;
    
    // Set up camera for pixel-perfect rendering
    const camera = this.scene.cameras.main;
    camera.roundPixels = true;
    
    // Ensure integer zoom levels only
    camera.setZoom(Math.floor(camera.zoom));
  }

  onAddedToWorld(): void {
    // Find player entity to follow with camera
    this.findCameraTarget();
  }

  onRemovedFromWorld(): void {
    // Clean up sprite objects
    this.spriteObjects.forEach(sprite => sprite.destroy());
    this.spriteObjects.clear();
  }

  update(deltaTime: number): void {
    this.updateAnimations(deltaTime);
    this.updateSprites();
    this.updateCamera();
  }

  private updateAnimations(deltaTime: number): void {
    // Update animations for all entities with sprites
    const renderableEntities = this.getEntitiesWithComponents('sprite', 'transform');

    for (const entity of renderableEntities) {
      const movement = this.getComponent<MovementComponent>(entity.id, 'movement');
      const health = this.getComponent<HealthComponent>(entity.id, 'health');
      
      // Determine animation state
      let direction: Direction = 'down';
      let isMoving = false;
      let isAttacking = false;

      if (movement) {
        direction = movement.direction;
        isMoving = Math.abs(movement.velocity.x) > 0.1 || Math.abs(movement.velocity.y) > 0.1;
      }

      // Check for attack state (simplified - would normally check for attack component)
      // For now, we'll use a timer-based approach or input state
      
      // Initialize animation state if not exists
      if (!spriteManager.getCurrentAnimationFrame(entity.id)) {
        spriteManager.initializeAnimationState(entity.id, this.getSpriteKeyForEntity(entity.id));
      }

      // Update the sprite manager animation state
      spriteManager.updateAnimationState(entity.id, direction, isMoving, isAttacking, deltaTime);

      // Store state for comparison
      this.entityAnimationStates.set(entity.id, { lastDirection: direction, isMoving, isAttacking });
    }
  }

  private getSpriteKeyForEntity(entityId: string): string {
    // Determine sprite key based on entity type
    if (this.hasComponent(entityId, 'player')) return 'player';
    if (this.hasComponent(entityId, 'npc')) return 'npc_keeper';
    return 'enemy_basic'; // Default
  }

  private findCameraTarget(): void {
    const playerEntities = this.getEntitiesWithComponents('player', 'transform');
    if (playerEntities.length > 0) {
      this.cameraTarget = playerEntities[0].id;
    }
  }

  private updateSprites(): void {
    // Get all entities with sprite and transform components
    const renderableEntities = this.getEntitiesWithComponents('sprite', 'transform');

    // Update existing sprites and create new ones
    for (const entity of renderableEntities) {
      this.updateEntitySprite(entity.id);
    }

    // Remove sprites for entities that no longer exist
    this.cleanupDestroyedSprites(renderableEntities.map(e => e.id));
  }

  private updateEntitySprite(entityId: string): void {
    const transform = this.getComponent<TransformComponent>(entityId, 'transform');
    const sprite = this.getComponent<SpriteComponent>(entityId, 'sprite');
    
    if (!transform || !sprite) return;

    // Get or create sprite object
    let spriteObject = this.spriteObjects.get(entityId);
    
    if (!spriteObject) {
      spriteObject = this.createSpriteObject(entityId, sprite);
      this.spriteObjects.set(entityId, spriteObject);
      
      // Add to appropriate layer
      if (this.hasComponent(entityId, 'player')) {
        this.scene.getEntityLayer().add(spriteObject);
      } else {
        this.scene.getEntityLayer().add(spriteObject);
      }
    }

    // Update sprite properties
    spriteObject.setPosition(transform.position.x, transform.position.y);
    spriteObject.setRotation(transform.rotation);
    spriteObject.setScale(transform.scale.x, transform.scale.y);
    
    // Debug logging for player position
    if (this.hasComponent(entityId, 'player')) {
      console.log('Updating player sprite position:', transform.position);
    }
    
    if ('setTint' in spriteObject) {
      spriteObject.setTint(sprite.tint || 0xffffff);
    }
    
    if ('setAlpha' in spriteObject) {
      spriteObject.setAlpha(sprite.alpha || 1);
    }

    // Handle ALTTP animation frames
    if ('setFrame' in spriteObject) {
      const currentFrame = spriteManager.getCurrentAnimationFrame(entityId);
      if (currentFrame) {
        // Calculate frame index based on sprite sheet layout
        const spriteSheet = spriteManager.getSpriteSheet(this.getSpriteKeyForEntity(entityId));
        if (spriteSheet) {
          const frameIndex = Math.floor(currentFrame.y / spriteSheet.frameHeight) * 4 + Math.floor(currentFrame.x / spriteSheet.frameWidth);
          (spriteObject as Phaser.GameObjects.Sprite).setFrame(frameIndex);
        }
      } else if (sprite.frame !== undefined) {
        (spriteObject as Phaser.GameObjects.Sprite).setFrame(sprite.frame);
      }
    }

    // Apply special effects based on entity state
    this.applyVisualEffects(entityId, spriteObject);
  }

  private createSpriteObject(entityId: string, sprite: SpriteComponent): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle {
    // Try to get ALTTP sprite from sprite manager
    const spriteKey = this.getSpriteKeyForEntity(entityId);
    const generatedSprite = spriteManager.getGeneratedSprite(spriteKey);
    
    if (generatedSprite) {
      // Create texture from the generated canvas if it doesn't exist
      const textureKey = `generated_${spriteKey}`;
      if (!this.scene.textures.exists(textureKey)) {
        this.scene.textures.addCanvas(textureKey, generatedSprite);
      }
      
      const phaserSprite = this.scene.add.sprite(0, 0, textureKey, 0);
      
      // Configure for pixel-perfect rendering
      phaserSprite.setOrigin(0.5, 0.875); // Anchor at bottom center like ALTTP
      
      // Initialize animation state
      spriteManager.initializeAnimationState(entityId, spriteKey);
      
      return phaserSprite;
    } 
    
    // Try to create sprite from existing texture
    if (this.scene.textures.exists(sprite.texture)) {
      const phaserSprite = this.scene.add.sprite(0, 0, sprite.texture, sprite.frame);
      phaserSprite.setOrigin(0.5, 0.875); // ALTTP-style anchoring
      return phaserSprite;
    } else {
      // Fallback to colored rectangle
      const color = this.getFallbackColor(sprite.texture);
      const rect = this.scene.add.rectangle(0, 0, 16, 16, color);
      
      // Add a visual indicator for the sprite type
      this.addSpriteTypeIndicator(rect, sprite.texture);
      
      return rect;
    }
  }

  private getFallbackColor(textureKey: string): number {
    // Generate color based on texture key hash for consistent fallback colors
    let hash = 0;
    for (let i = 0; i < textureKey.length; i++) {
      hash = textureKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash & 0xffffff; // Ensure it's a valid color
  }

  private addSpriteTypeIndicator(rect: Phaser.GameObjects.Rectangle, textureKey: string): void {
    // Add small text indicator for development
    const indicator = this.scene.add.text(
      rect.x, 
      rect.y - 8, 
      textureKey.slice(0, 3).toUpperCase(), 
      {
        fontSize: '6px',
        color: '#ffffff',
        fontFamily: 'monospace'
      }
    ).setOrigin(0.5);
    
    // Parent the text to the rectangle so it moves together
    rect.setData('indicator', indicator);
  }

  private applyVisualEffects(entityId: string, spriteObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle): void {
    // Apply invulnerability flashing effect
    const health = this.getComponent<HealthComponent>(entityId, 'health');
    if (health && health.invulnerable) {
      const flashRate = 100; // milliseconds
      const isVisible = Math.floor(Date.now() / flashRate) % 2 === 0;
      spriteObject.setVisible(isVisible);
    } else {
      spriteObject.setVisible(true);
    }

    // Apply direction-based sprite effects
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    if (movement && 'setFlipX' in spriteObject) {
      // Flip sprite based on movement direction
      if (movement.direction === 'left') {
        (spriteObject as Phaser.GameObjects.Sprite).setFlipX(true);
      } else if (movement.direction === 'right') {
        (spriteObject as Phaser.GameObjects.Sprite).setFlipX(false);
      }
    }
  }

  private cleanupDestroyedSprites(activeEntityIds: string[]): void {
    const activeSet = new Set(activeEntityIds);
    
    for (const [entityId, spriteObject] of this.spriteObjects.entries()) {
      if (!activeSet.has(entityId)) {
        // Clean up indicator text if it exists
        const indicator = spriteObject.getData('indicator');
        if (indicator) {
          indicator.destroy();
        }
        
        spriteObject.destroy();
        this.spriteObjects.delete(entityId);
      }
    }
  }

  private updateCamera(): void {
    if (!this.cameraTarget) return;

    const targetTransform = this.getComponent<TransformComponent>(this.cameraTarget, 'transform');
    if (!targetTransform) return;

    const camera = this.scene.cameras.main;
    const targetX = targetTransform.position.x;
    const targetY = targetTransform.position.y;

    // Smooth camera following with lerp
    const currentX = camera.scrollX + camera.width / 2;
    const currentY = camera.scrollY + camera.height / 2;
    
    const newX = Phaser.Math.Linear(currentX, targetX, this.cameraLerpSpeed);
    const newY = Phaser.Math.Linear(currentY, targetY, this.cameraLerpSpeed);
    
    camera.centerOn(newX, newY);
  }

  // Public API methods
  setCameraTarget(entityId: string): void {
    this.cameraTarget = entityId;
  }

  setCameraLerpSpeed(speed: number): void {
    this.cameraLerpSpeed = Phaser.Math.Clamp(speed, 0, 1);
  }

  getSpriteObject(entityId: string): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle | undefined {
    return this.spriteObjects.get(entityId);
  }

  // Screen shake effect
  shakeCamera(duration: number, intensity: number): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  // Flash effect
  flashCamera(duration: number, red: number = 255, green: number = 255, blue: number = 255): void {
    this.scene.cameras.main.flash(duration, red, green, blue);
  }

  // Fade effects
  fadeIn(duration: number, red: number = 0, green: number = 0, blue: number = 0): void {
    this.scene.cameras.main.fadeIn(duration, red, green, blue);
  }

  fadeOut(duration: number, red: number = 0, green: number = 0, blue: number = 0): void {
    this.scene.cameras.main.fadeOut(duration, red, green, blue);
  }
}