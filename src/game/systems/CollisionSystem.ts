// Collision System - Handle collision detection and response
// Following Combat & Physics Engineer specifications

import { System } from '../ECS.js';
import { gameEvents } from '@shared/events.js';
import type { TransformComponent, ColliderComponent, MovementComponent } from '@shared/types.js';

interface CollisionInfo {
  entityA: string;
  entityB: string;
  overlap: { x: number; y: number };
  normal: { x: number; y: number };
}

export class CollisionSystem extends System {
  private collisionPairs: Set<string> = new Set();

  update(_deltaTime: number): void {
    this.detectCollisions();
    this.resolveCollisions();
  }

  private detectCollisions(): void {
    const collidableEntities = this.getEntitiesWithComponents('collider', 'transform');
    const currentCollisions = new Set<string>();

    // Check all pairs of collidable entities
    for (let i = 0; i < collidableEntities.length; i++) {
      for (let j = i + 1; j < collidableEntities.length; j++) {
        const entityA = collidableEntities[i];
        const entityB = collidableEntities[j];
        
        const collision = this.checkCollision(entityA.id, entityB.id);
        if (collision) {
          const pairKey = this.getCollisionPairKey(entityA.id, entityB.id);
          currentCollisions.add(pairKey);
          
          // Handle collision
          this.handleCollision(collision);
        }
      }
    }

    // Update collision pairs for enter/exit events
    this.updateCollisionStates(currentCollisions);
  }

  private checkCollision(entityIdA: string, entityIdB: string): CollisionInfo | null {
    const transformA = this.getComponent<TransformComponent>(entityIdA, 'transform');
    const colliderA = this.getComponent<ColliderComponent>(entityIdA, 'collider');
    const transformB = this.getComponent<TransformComponent>(entityIdB, 'transform');
    const colliderB = this.getComponent<ColliderComponent>(entityIdB, 'collider');

    if (!transformA || !colliderA || !transformB || !colliderB) {
      return null;
    }

    // Calculate actual collision bounds
    const boundsA = {
      left: transformA.position.x + colliderA.bounds.x,
      right: transformA.position.x + colliderA.bounds.x + colliderA.bounds.width,
      top: transformA.position.y + colliderA.bounds.y,
      bottom: transformA.position.y + colliderA.bounds.y + colliderA.bounds.height
    };

    const boundsB = {
      left: transformB.position.x + colliderB.bounds.x,
      right: transformB.position.x + colliderB.bounds.x + colliderB.bounds.width,
      top: transformB.position.y + colliderB.bounds.y,
      bottom: transformB.position.y + colliderB.bounds.y + colliderB.bounds.height
    };

    // AABB collision detection
    const overlapX = Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
    const overlapY = Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);

    if (overlapX > 0 && overlapY > 0) {
      // Calculate collision normal (direction to separate)
      const centerAX = boundsA.left + colliderA.bounds.width / 2;
      const centerAY = boundsA.top + colliderA.bounds.height / 2;
      const centerBX = boundsB.left + colliderB.bounds.width / 2;
      const centerBY = boundsB.top + colliderB.bounds.height / 2;

      const normalX = centerBX - centerAX;
      const normalY = centerBY - centerAY;
      const length = Math.sqrt(normalX * normalX + normalY * normalY);

      return {
        entityA: entityIdA,
        entityB: entityIdB,
        overlap: { x: overlapX, y: overlapY },
        normal: length > 0 ? { x: normalX / length, y: normalY / length } : { x: 0, y: 1 }
      };
    }

    return null;
  }

  private handleCollision(collision: CollisionInfo): void {
    const colliderA = this.getComponent<ColliderComponent>(collision.entityA, 'collider');
    const colliderB = this.getComponent<ColliderComponent>(collision.entityB, 'collider');

    if (!colliderA || !colliderB) return;

    // Handle trigger collisions (no physical response)
    if (colliderA.trigger || colliderB.trigger) {
      this.handleTriggerCollision(collision);
      return;
    }

    // Handle solid collisions (physical response)
    if (colliderA.solid && colliderB.solid) {
      this.handleSolidCollision(collision);
    }
  }

  private handleTriggerCollision(collision: CollisionInfo): void {
    // Emit trigger events for gameplay systems
    
    // Check if player is involved
    const isPlayerA = this.hasComponent(collision.entityA, 'player');
    const isPlayerB = this.hasComponent(collision.entityB, 'player');

    if (isPlayerA || isPlayerB) {
      // const playerId = isPlayerA ? collision.entityA : collision.entityB;
      const triggerId = isPlayerA ? collision.entityB : collision.entityA;
      
      // Emit trigger event
      gameEvents.emit({
        type: 'item.collected', // Generic trigger event
        payload: {
          itemId: triggerId,
          itemType: 'trigger',
          position: { x: 0, y: 0 },
          quantity: 1
        },
        timestamp: Date.now()
      });
    }
  }

  private handleSolidCollision(collision: CollisionInfo): void {
    // Separate overlapping entities
    this.separateEntities(collision);
    
    // Stop movement for solid entities
    this.stopMovementOnCollision(collision);
  }

  private separateEntities(collision: CollisionInfo): void {
    const transformA = this.getComponent<TransformComponent>(collision.entityA, 'transform');
    const transformB = this.getComponent<TransformComponent>(collision.entityB, 'transform');
    const movementA = this.getComponent<MovementComponent>(collision.entityA, 'movement');
    const movementB = this.getComponent<MovementComponent>(collision.entityB, 'movement');

    if (!transformA || !transformB) return;

    // Determine which entity should move based on movement components
    const entityAMoving = movementA && (movementA.velocity.x !== 0 || movementA.velocity.y !== 0);
    const entityBMoving = movementB && (movementB.velocity.x !== 0 || movementB.velocity.y !== 0);

    let separationDistance: number;
    
    // Choose separation direction based on smallest overlap
    if (collision.overlap.x < collision.overlap.y) {
      // Separate horizontally
      separationDistance = collision.overlap.x / 2;
      
      if (entityAMoving && !entityBMoving) {
        transformA.position.x -= collision.normal.x * collision.overlap.x;
      } else if (!entityAMoving && entityBMoving) {
        transformB.position.x += collision.normal.x * collision.overlap.x;
      } else {
        // Both or neither moving, separate equally
        transformA.position.x -= collision.normal.x * separationDistance;
        transformB.position.x += collision.normal.x * separationDistance;
      }
    } else {
      // Separate vertically
      separationDistance = collision.overlap.y / 2;
      
      if (entityAMoving && !entityBMoving) {
        transformA.position.y -= collision.normal.y * collision.overlap.y;
      } else if (!entityAMoving && entityBMoving) {
        transformB.position.y += collision.normal.y * collision.overlap.y;
      } else {
        // Both or neither moving, separate equally
        transformA.position.y -= collision.normal.y * separationDistance;
        transformB.position.y += collision.normal.y * separationDistance;
      }
    }
  }

  private stopMovementOnCollision(collision: CollisionInfo): void {
    const movementA = this.getComponent<MovementComponent>(collision.entityA, 'movement');
    const movementB = this.getComponent<MovementComponent>(collision.entityB, 'movement');

    // Stop movement in collision direction
    if (movementA) {
      if (collision.overlap.x < collision.overlap.y) {
        // Horizontal collision
        if ((collision.normal.x > 0 && movementA.velocity.x < 0) || 
            (collision.normal.x < 0 && movementA.velocity.x > 0)) {
          movementA.velocity.x = 0;
        }
      } else {
        // Vertical collision
        if ((collision.normal.y > 0 && movementA.velocity.y < 0) || 
            (collision.normal.y < 0 && movementA.velocity.y > 0)) {
          movementA.velocity.y = 0;
        }
      }
    }

    if (movementB) {
      if (collision.overlap.x < collision.overlap.y) {
        // Horizontal collision
        if ((collision.normal.x < 0 && movementB.velocity.x < 0) || 
            (collision.normal.x > 0 && movementB.velocity.x > 0)) {
          movementB.velocity.x = 0;
        }
      } else {
        // Vertical collision
        if ((collision.normal.y < 0 && movementB.velocity.y < 0) || 
            (collision.normal.y > 0 && movementB.velocity.y > 0)) {
          movementB.velocity.y = 0;
        }
      }
    }
  }

  private resolveCollisions(): void {
    // Additional collision resolution logic can go here
    // For now, basic separation is handled in handleSolidCollision
  }

  private updateCollisionStates(currentCollisions: Set<string>): void {
    // Handle collision enter events
    for (const pairKey of currentCollisions) {
      if (!this.collisionPairs.has(pairKey)) {
        // New collision
        const [entityA, entityB] = pairKey.split('-');
        this.onCollisionEnter(entityA, entityB);
      }
    }

    // Handle collision exit events
    for (const pairKey of this.collisionPairs) {
      if (!currentCollisions.has(pairKey)) {
        // Collision ended
        const [entityA, entityB] = pairKey.split('-');
        this.onCollisionExit(entityA, entityB);
      }
    }

    this.collisionPairs = currentCollisions;
  }

  private onCollisionEnter(entityA: string, entityB: string): void {
    // Emit collision enter events if needed
    console.log(`Collision enter: ${entityA} <-> ${entityB}`);
  }

  private onCollisionExit(entityA: string, entityB: string): void {
    // Emit collision exit events if needed
    console.log(`Collision exit: ${entityA} <-> ${entityB}`);
  }

  private getCollisionPairKey(entityA: string, entityB: string): string {
    // Ensure consistent ordering for pair keys
    return entityA < entityB ? `${entityA}-${entityB}` : `${entityB}-${entityA}`;
  }

  // Public API methods
  isColliding(entityA: string, entityB: string): boolean {
    const pairKey = this.getCollisionPairKey(entityA, entityB);
    return this.collisionPairs.has(pairKey);
  }

  getCollidingEntities(entityId: string): string[] {
    const colliding: string[] = [];
    
    for (const pairKey of this.collisionPairs) {
      const [entityA, entityB] = pairKey.split('-');
      if (entityA === entityId) {
        colliding.push(entityB);
      } else if (entityB === entityId) {
        colliding.push(entityA);
      }
    }
    
    return colliding;
  }

  // Utility method for point-in-bounds checking
  isPointInBounds(point: { x: number; y: number }, entityId: string): boolean {
    const transform = this.getComponent<TransformComponent>(entityId, 'transform');
    const collider = this.getComponent<ColliderComponent>(entityId, 'collider');
    
    if (!transform || !collider) return false;

    const bounds = {
      left: transform.position.x + collider.bounds.x,
      right: transform.position.x + collider.bounds.x + collider.bounds.width,
      top: transform.position.y + collider.bounds.y,
      bottom: transform.position.y + collider.bounds.y + collider.bounds.height
    };

    return point.x >= bounds.left && point.x <= bounds.right &&
           point.y >= bounds.top && point.y <= bounds.bottom;
  }
}