// Movement System - Handle entity movement and physics
// Following Combat & Physics Engineer specifications

import { System } from '../ECS.js';
import { emitPlayerMoved, gameEvents } from '@shared/events.js';
import { WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from '@shared/constants.js';
import { TileCollision } from '../utils/TileCollision.js';
import type { MovementComponent, TransformComponent, ColliderComponent } from '@shared/types.js';
import type { WorldTile } from '../utils/WorldGenerator.js';

interface MovementSystemConfig {
  worldTiles?: WorldTile[][];
  currentRealm?: 'dayrealm' | 'eclipse';
}

export class MovementSystem extends System {
  private lastPlayerPosition = { x: 0, y: 0 };
  private worldTiles: WorldTile[][] | null = null;
  private currentRealm: 'dayrealm' | 'eclipse' = 'dayrealm';
  public debugTileCollision = false; // Runtime debug flag
  
  constructor() {
    super();
    
    // Listen for world data updates
    gameEvents.on('movement.worldData.update', (event) => {
      this.updateWorldData(event.payload.worldTiles, event.payload.realm);
    });
    
    // Listen for realm changes
    gameEvents.on('world/realmSwitched', (event) => {
      this.currentRealm = event.payload.currentRealm;
      console.log('MovementSystem: Realm switched to', this.currentRealm);
    });
  }
  
  /**
   * Update world tile data for collision detection
   */
  updateWorldData(worldTiles: WorldTile[][], realm: 'dayrealm' | 'eclipse'): void {
    this.worldTiles = worldTiles;
    this.currentRealm = realm;
    console.log('MovementSystem: World data updated with', worldTiles.length, 'x', worldTiles[0]?.length, 'tiles in', realm);
  }

  update(deltaTime: number): void {
    // Get all entities with movement components
    const movingEntities = this.getEntitiesWithComponents('movement', 'transform');

    for (const entity of movingEntities) {
      this.updateEntityMovement(entity.id, deltaTime);
    }
  }

  private updateEntityMovement(entityId: string, deltaTime: number): void {
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    const transform = this.getComponent<TransformComponent>(entityId, 'transform');
    
    if (!movement || !transform) {
      if (this.hasComponent(entityId, 'player')) {
        console.log('MovementSystem: Player entity missing components!', { 
          hasMovement: !!movement, 
          hasTransform: !!transform 
        });
      }
      return;
    }

    // Debug: Log all movement attempts for player
    if (this.hasComponent(entityId, 'player')) {
      console.log('MovementSystem: Player movement check:', {
        entityId,
        velocity: movement.velocity,
        hasVelocity: movement.velocity.x !== 0 || movement.velocity.y !== 0,
        deltaTime
      });
    }

    // Early exit if no movement velocity
    if (movement.velocity.x === 0 && movement.velocity.y === 0) {
      return;
    }

    // Store previous position for collision resolution
    const previousPosition = { ...transform.position };

    // Debug logging for player movement
    if (this.hasComponent(entityId, 'player')) {
      console.log('MovementSystem: Player moving with velocity:', movement.velocity, 'deltaTime:', deltaTime);
    }

    // Apply velocity to position
    // Note: deltaTime is already in seconds from WorldScene (deltaTime / 1000)
    const newX = transform.position.x + movement.velocity.x * deltaTime;
    const newY = transform.position.y + movement.velocity.y * deltaTime;

    // Update position
    transform.position.x = newX;
    transform.position.y = newY;

    // Debug logging for player position change
    if (this.hasComponent(entityId, 'player')) {
      console.log('MovementSystem: Player position updated from:', previousPosition, 'to:', transform.position);
      console.log('MovementSystem: Position delta:', { 
        deltaX: newX - previousPosition.x, 
        deltaY: newY - previousPosition.y 
      });
    }

    // Check if this is the player entity and emit movement event
    if (this.hasComponent(entityId, 'player')) {
      const moved = this.lastPlayerPosition.x !== transform.position.x || 
                   this.lastPlayerPosition.y !== transform.position.y;
      
      if (moved) {
        emitPlayerMoved(transform.position, movement.direction);
        this.lastPlayerPosition = { ...transform.position };
      }
    }

    // Apply movement constraints (world bounds, etc.)
    this.applyMovementConstraints(entityId, transform, previousPosition);
  }

  private applyMovementConstraints(
    entityId: string, 
    transform: TransformComponent, 
    previousPosition: { x: number; y: number }
  ): void {
    const collider = this.getComponent<ColliderComponent>(entityId, 'collider');
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    
    if (!collider || !movement) return;

    // If we have world tile data, use tile-based collision
    if (this.worldTiles) {
      this.applyTileBasedCollision(entityId, transform, previousPosition, collider, movement);
    } else {
      // Fallback to basic world bounds only
      this.applyBasicWorldBounds(transform, previousPosition, collider, movement);
    }
  }
  
  private applyTileBasedCollision(
    entityId: string,
    transform: TransformComponent,
    previousPosition: { x: number; y: number },
    collider: ColliderComponent,
    movement: MovementComponent
  ): void {
    // Check collision with tile-based collision system
    const collisionResult = TileCollision.checkSlidingMovement(
      previousPosition,
      transform.position,
      collider.bounds,
      this.worldTiles!,
      this.currentRealm,
      WORLD_WIDTH,
      WORLD_HEIGHT
    );

    if (!collisionResult.canMove) {
      // Movement blocked - revert to previous position
      transform.position.x = previousPosition.x;
      transform.position.y = previousPosition.y;
      
      // Stop velocity to prevent sliding against walls
      movement.velocity.x = 0;
      movement.velocity.y = 0;
      
      // Debug logging
      if (this.debugTileCollision && this.hasComponent(entityId, 'player')) {
        console.log('MovementSystem: Movement blocked by tile:', collisionResult.hitTileType);
        
        const debugInfo = TileCollision.getCollisionDebugInfo(
          transform.position,
          collider.bounds,
          this.worldTiles!,
          this.currentRealm
        );
        console.log('Collision details:', debugInfo);
      }
    } else if (collisionResult.correctedPosition) {
      // Sliding movement - adjust position
      transform.position.x = collisionResult.correctedPosition.x;
      transform.position.y = collisionResult.correctedPosition.y;
      
      // Adjust velocity to match the corrected movement
      const deltaX = transform.position.x - previousPosition.x;
      const deltaY = transform.position.y - previousPosition.y;
      
      if (Math.abs(deltaX) < 0.1) movement.velocity.x = 0; // Stop horizontal if not moving horizontally
      if (Math.abs(deltaY) < 0.1) movement.velocity.y = 0; // Stop vertical if not moving vertically
      
      if (this.debugTileCollision && this.hasComponent(entityId, 'player')) {
        console.log('MovementSystem: Sliding movement applied from', previousPosition, 'to', transform.position);
      }
    }

    // Handle interactive tiles
    if (collisionResult.isInteractive && this.hasComponent(entityId, 'player')) {
      gameEvents.emit({
        type: 'interaction.tile.entered',
        payload: {
          tileType: collisionResult.hitTileType,
          position: transform.position
        },
        timestamp: Date.now()
      });
    }
    
    // Debug collision info
    if (this.debugTileCollision && this.hasComponent(entityId, 'player')) {
      const debugInfo = TileCollision.getCollisionDebugInfo(
        transform.position,
        collider.bounds,
        this.worldTiles!,
        this.currentRealm
      );
      
      if (debugInfo.occupiedTiles.some(tile => !tile.walkable)) {
        console.log('MovementSystem: Standing on non-walkable tiles:', 
          debugInfo.occupiedTiles.filter(tile => !tile.walkable));
      }
    }
  }
  
  private applyBasicWorldBounds(
    transform: TransformComponent,
    previousPosition: { x: number; y: number },
    collider: ColliderComponent,
    movement: MovementComponent
  ): void {
    // Basic world bounds checking (fallback when no tile data available)
    const entityLeft = transform.position.x + collider.bounds.x;
    const entityRight = entityLeft + collider.bounds.width;
    const entityTop = transform.position.y + collider.bounds.y;
    const entityBottom = entityTop + collider.bounds.height;

    // World bounds based on actual world size
    const worldBounds = {
      left: 0,
      right: WORLD_WIDTH * TILE_SIZE,  // 256 * 16 = 4096
      top: 0,
      bottom: WORLD_HEIGHT * TILE_SIZE  // 192 * 16 = 3072
    };

    let corrected = false;

    // Check horizontal bounds
    if (entityLeft < worldBounds.left) {
      transform.position.x = worldBounds.left - collider.bounds.x;
      corrected = true;
    } else if (entityRight > worldBounds.right) {
      transform.position.x = worldBounds.right - collider.bounds.x - collider.bounds.width;
      corrected = true;
    }

    // Check vertical bounds
    if (entityTop < worldBounds.top) {
      transform.position.y = worldBounds.top - collider.bounds.y;
      corrected = true;
    } else if (entityBottom > worldBounds.bottom) {
      transform.position.y = worldBounds.bottom - collider.bounds.y - collider.bounds.height;
      corrected = true;
    }

    // If position was corrected, stop movement in that direction
    if (corrected) {
      // Stop movement if hitting bounds
      if (transform.position.x !== previousPosition.x) {
        movement.velocity.x = 0;
      }
      if (transform.position.y !== previousPosition.y) {
        movement.velocity.y = 0;
      }
    }
  }

  // Public utility methods
  moveEntity(entityId: string, direction: { x: number; y: number }, speed: number): void {
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    if (!movement) return;

    // Normalize direction
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0) {
      movement.velocity.x = (direction.x / length) * speed;
      movement.velocity.y = (direction.y / length) * speed;
    }

    // Update facing direction
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
      movement.direction = direction.x > 0 ? 'right' : 'left';
    } else if (direction.y !== 0) {
      movement.direction = direction.y > 0 ? 'down' : 'up';
    }
  }

  stopEntity(entityId: string): void {
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    if (!movement) return;

    movement.velocity.x = 0;
    movement.velocity.y = 0;
  }

  teleportEntity(entityId: string, position: { x: number; y: number }): void {
    const transform = this.getComponent<TransformComponent>(entityId, 'transform');
    if (!transform) return;

    transform.position.x = position.x;
    transform.position.y = position.y;

    // Emit event if this is the player
    if (this.hasComponent(entityId, 'player')) {
      const movement = this.getComponent<MovementComponent>(entityId, 'movement');
      emitPlayerMoved(position, movement?.direction || 'down');
    }
  }

  getEntityVelocity(entityId: string): { x: number; y: number } | null {
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    return movement ? { ...movement.velocity } : null;
  }

  setEntitySpeed(entityId: string, speed: number): void {
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    if (movement) {
      movement.speed = speed;
    }
  }
  
  // Utility methods for tile collision
  getTileAtPosition(x: number, y: number): { tileType?: number; walkable?: boolean } | null {
    if (!this.worldTiles) return null;
    
    const tileCoords = TileCollision.pixelToTile(x, y);
    
    if (tileCoords.tileY >= 0 && tileCoords.tileY < this.worldTiles.length &&
        tileCoords.tileX >= 0 && tileCoords.tileX < this.worldTiles[0].length) {
      const tile = this.worldTiles[tileCoords.tileY][tileCoords.tileX];
      const effectiveTileType = TileCollision.getEffectiveTileType(tile.tileType, this.currentRealm);
      
      return {
        tileType: effectiveTileType,
        walkable: TileCollision.isTileWalkable(effectiveTileType)
      };
    }
    
    return null;
  }
  
  getCurrentRealm(): 'dayrealm' | 'eclipse' {
    return this.currentRealm;
  }
  
  hasWorldData(): boolean {
    return this.worldTiles !== null;
  }
}