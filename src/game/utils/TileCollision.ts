// Tile Collision Utilities
// Following Combat & Physics Engineer specifications

import { TileType } from '@shared/types.js';
import { TILE_SIZE, WALKABLE_TILES, NON_WALKABLE_TILES, INTERACTIVE_TILES, REALM_TRANSFORMATIONS } from '@shared/constants.js';
import type { WorldTile } from './WorldGenerator.js';

export interface CollisionResult {
  canMove: boolean;
  correctedPosition?: { x: number; y: number };
  hitTileType?: TileType;
  isInteractive?: boolean;
}

export class TileCollision {
  /**
   * Check if a tile type is walkable
   */
  static isTileWalkable(tileType: TileType): boolean {
    // Check explicitly walkable tiles
    if (WALKABLE_TILES.has(tileType)) {
      return true;
    }
    
    // Interactive tiles are walkable but may trigger events
    if (INTERACTIVE_TILES.has(tileType)) {
      return true;
    }
    
    // Everything else is non-walkable
    return false;
  }

  /**
   * Get the effective tile type based on current realm
   */
  static getEffectiveTileType(tileType: TileType, realm: 'dayrealm' | 'eclipse'): TileType {
    if (realm === 'eclipse') {
      return REALM_TRANSFORMATIONS[tileType] || tileType;
    }
    return tileType;
  }

  /**
   * Convert pixel coordinates to tile coordinates
   */
  static pixelToTile(x: number, y: number): { tileX: number; tileY: number } {
    return {
      tileX: Math.floor(x / TILE_SIZE),
      tileY: Math.floor(y / TILE_SIZE)
    };
  }

  /**
   * Convert tile coordinates to pixel coordinates (center of tile)
   */
  static tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * TILE_SIZE + TILE_SIZE / 2,
      y: tileY * TILE_SIZE + TILE_SIZE / 2
    };
  }

  /**
   * Check if an entity can move to a specific pixel position
   */
  static checkMovement(
    currentPos: { x: number; y: number },
    targetPos: { x: number; y: number },
    entityBounds: { x: number; y: number; width: number; height: number },
    worldTiles: WorldTile[][],
    realm: 'dayrealm' | 'eclipse',
    worldWidth: number,
    worldHeight: number
  ): CollisionResult {
    // Calculate entity collision bounds at target position
    const entityLeft = targetPos.x + entityBounds.x;
    const entityRight = entityLeft + entityBounds.width;
    const entityTop = targetPos.y + entityBounds.y;
    const entityBottom = entityTop + entityBounds.height;

    // Get the tiles that the entity would overlap
    const startTileX = Math.floor(entityLeft / TILE_SIZE);
    const endTileX = Math.floor((entityRight - 1) / TILE_SIZE);
    const startTileY = Math.floor(entityTop / TILE_SIZE);
    const endTileY = Math.floor((entityBottom - 1) / TILE_SIZE);

    // Check if any tiles are out of bounds
    if (startTileX < 0 || endTileX >= worldWidth || startTileY < 0 || endTileY >= worldHeight) {
      return {
        canMove: false,
        hitTileType: TileType.WALL // Treat world bounds as walls
      };
    }

    // Check all tiles the entity would occupy
    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        const worldTile = worldTiles[tileY][tileX];
        const effectiveTileType = this.getEffectiveTileType(worldTile.tileType, realm);
        
        if (!this.isTileWalkable(effectiveTileType)) {
          return {
            canMove: false,
            hitTileType: effectiveTileType
          };
        }

        // Check for interactive tiles
        if (INTERACTIVE_TILES.has(effectiveTileType)) {
          // Allow movement but mark as interactive
          return {
            canMove: true,
            isInteractive: true,
            hitTileType: effectiveTileType
          };
        }
      }
    }

    // All tiles are walkable
    return {
      canMove: true
    };
  }

  /**
   * Perform sliding collision - try to move along one axis if diagonal movement is blocked
   */
  static checkSlidingMovement(
    currentPos: { x: number; y: number },
    targetPos: { x: number; y: number },
    entityBounds: { x: number; y: number; width: number; height: number },
    worldTiles: WorldTile[][],
    realm: 'dayrealm' | 'eclipse',
    worldWidth: number,
    worldHeight: number
  ): CollisionResult {
    // First, try the full movement
    const fullMovement = this.checkMovement(currentPos, targetPos, entityBounds, worldTiles, realm, worldWidth, worldHeight);
    
    if (fullMovement.canMove) {
      return fullMovement;
    }

    // If diagonal movement, try horizontal first, then vertical
    const deltaX = targetPos.x - currentPos.x;
    const deltaY = targetPos.y - currentPos.y;

    if (Math.abs(deltaX) > 0 && Math.abs(deltaY) > 0) {
      // Try horizontal movement only
      const horizontalPos = { x: targetPos.x, y: currentPos.y };
      const horizontalMovement = this.checkMovement(currentPos, horizontalPos, entityBounds, worldTiles, realm, worldWidth, worldHeight);
      
      if (horizontalMovement.canMove) {
        return {
          canMove: true,
          correctedPosition: horizontalPos
        };
      }

      // Try vertical movement only
      const verticalPos = { x: currentPos.x, y: targetPos.y };
      const verticalMovement = this.checkMovement(currentPos, verticalPos, entityBounds, worldTiles, realm, worldWidth, worldHeight);
      
      if (verticalMovement.canMove) {
        return {
          canMove: true,
          correctedPosition: verticalPos
        };
      }
    }

    // No movement possible
    return {
      canMove: false,
      hitTileType: fullMovement.hitTileType
    };
  }

  /**
   * Get debug information about tile collision at a position
   */
  static getCollisionDebugInfo(
    pos: { x: number; y: number },
    entityBounds: { x: number; y: number; width: number; height: number },
    worldTiles: WorldTile[][],
    realm: 'dayrealm' | 'eclipse'
  ): {
    entityBounds: { left: number; right: number; top: number; bottom: number };
    occupiedTiles: { tileX: number; tileY: number; tileType: TileType; effectiveType: TileType; walkable: boolean }[];
  } {
    const entityLeft = pos.x + entityBounds.x;
    const entityRight = entityLeft + entityBounds.width;
    const entityTop = pos.y + entityBounds.y;
    const entityBottom = entityTop + entityBounds.height;

    const startTileX = Math.floor(entityLeft / TILE_SIZE);
    const endTileX = Math.floor((entityRight - 1) / TILE_SIZE);
    const startTileY = Math.floor(entityTop / TILE_SIZE);
    const endTileY = Math.floor((entityBottom - 1) / TILE_SIZE);

    const occupiedTiles = [];

    for (let tileY = startTileY; tileY <= endTileY; tileY++) {
      for (let tileX = startTileX; tileX <= endTileX; tileX++) {
        if (tileY >= 0 && tileY < worldTiles.length && tileX >= 0 && tileX < worldTiles[0].length) {
          const worldTile = worldTiles[tileY][tileX];
          const effectiveTileType = this.getEffectiveTileType(worldTile.tileType, realm);
          
          occupiedTiles.push({
            tileX,
            tileY,
            tileType: worldTile.tileType,
            effectiveType: effectiveTileType,
            walkable: this.isTileWalkable(effectiveTileType)
          });
        }
      }
    }

    return {
      entityBounds: { left: entityLeft, right: entityRight, top: entityTop, bottom: entityBottom },
      occupiedTiles
    };
  }
}