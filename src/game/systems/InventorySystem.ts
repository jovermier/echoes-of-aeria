import type { PlayerComponent, TransformComponent, ColliderComponent } from '@shared/types.js';
import { System } from '@game/ECS.js';
import { gameEvents } from '@shared/events.js';

interface ItemPickup {
  id: string;
  itemType: keyof PlayerComponent['inventory'];
  position: { x: number; y: number };
  value?: number; // For stackable items like aether_shards
}

export class InventorySystem extends System {
  private itemPickups: Map<string, ItemPickup> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
    this.spawnInitialItems();
  }

  private setupEventHandlers(): void {
    gameEvents.on('player.collect.item', (event: any) => {
      this.handleItemCollection(event.payload);
    });

    gameEvents.on('inventory.use.item', (event: any) => {
      this.handleItemUse(event.payload);
    });
  }

  private spawnInitialItems(): void {
    // Add a test item for demonstration
    this.addItemPickup('test_sunflame_lantern', {
      id: 'test_sunflame_lantern',
      itemType: 'sunflame_lantern',
      position: { x: 100, y: 100 }
    });

    // Add some aether shards for testing
    this.addItemPickup('test_shard_1', {
      id: 'test_shard_1',
      itemType: 'aether_shards',
      position: { x: 150, y: 100 },
      value: 1
    });
  }

  public addItemPickup(id: string, pickup: ItemPickup): void {
    this.itemPickups.set(id, pickup);
  }

  public removeItemPickup(id: string): void {
    this.itemPickups.delete(id);
  }

  private handleItemCollection(payload: { itemId: string; playerId: string }): void {
    const { itemId, playerId } = payload;
    const pickup = this.itemPickups.get(itemId);
    if (!pickup) return;

    const playerEntity = this.world.getEntity(playerId);
    if (!playerEntity) return;

    const playerComponent = playerEntity.components.get('player') as PlayerComponent;
    if (!playerComponent) return;

    // Add item to inventory
    this.addItemToInventory(playerComponent, pickup);

    // Remove pickup from world
    this.removeItemPickup(itemId);

    // Emit collection event for UI/audio feedback with position for visual effects
    gameEvents.emit({
      type: 'inventory.item.collected',
      payload: { 
        itemType: pickup.itemType, 
        value: pickup.value || 1,
        position: pickup.position,
        playerInventory: playerComponent.inventory
      },
      timestamp: Date.now()
    });
  }

  private addItemToInventory(playerComponent: PlayerComponent, pickup: ItemPickup): void {
    const { itemType, value = 1 } = pickup;

    // Handle boolean items (equipment/tools)
    if (typeof playerComponent.inventory[itemType] === 'boolean') {
      (playerComponent.inventory as any)[itemType] = true;
      return;
    }

    // Handle numeric items (collectibles)
    if (typeof playerComponent.inventory[itemType] === 'number') {
      (playerComponent.inventory as any)[itemType] += value;
      return;
    }

    // Handle key items
    if (itemType === 'keys' && typeof value === 'object') {
      const keyData = value as { type: string; count: number };
      if (!playerComponent.inventory.keys[keyData.type]) {
        playerComponent.inventory.keys[keyData.type] = 0;
      }
      playerComponent.inventory.keys[keyData.type] += keyData.count;
    }
  }

  private handleItemUse(payload: { itemType: keyof PlayerComponent['inventory']; playerId: string }): void {
    const { itemType, playerId } = payload;
    const playerEntity = this.world.getEntity(playerId);
    if (!playerEntity) return;

    const playerComponent = playerEntity.components.get('player') as PlayerComponent;
    if (!playerComponent) return;

    // Check if player has the item
    if (!this.hasItem(playerComponent, itemType)) return;

    // Handle item usage based on type
    this.useItem(playerComponent, itemType);

    // Emit usage event
    gameEvents.emit({
      type: 'inventory.item.used',
      payload: { 
        itemType, 
        playerInventory: playerComponent.inventory 
      },
      timestamp: Date.now()
    });
  }

  private hasItem(playerComponent: PlayerComponent, itemType: keyof PlayerComponent['inventory']): boolean {
    const item = playerComponent.inventory[itemType];
    
    if (typeof item === 'boolean') {
      return item;
    }
    
    if (typeof item === 'number') {
      return item > 0;
    }
    
    return false;
  }

  private useItem(_playerComponent: PlayerComponent, itemType: keyof PlayerComponent['inventory']): void {
    switch (itemType) {
      case 'aether_mirror':
        // This should trigger realm switching
        gameEvents.emit({
          type: 'world.realm.switch',
          payload: {},
          timestamp: Date.now()
        });
        break;
        
      case 'sunflame_lantern':
        // Could light up dark areas or reveal hidden paths
        gameEvents.emit({
          type: 'world.light.toggle',
          payload: { active: true },
          timestamp: Date.now()
        });
        break;
        
      case 'gale_boots':
        // Could provide temporary speed boost
        gameEvents.emit({
          type: 'player.speed.boost',
          payload: { duration: 5000, multiplier: 1.5 },
          timestamp: Date.now()
        });
        break;
        
      default:
        console.log(`No specific use action for item: ${itemType}`);
    }
  }

  // Check for item pickups near player
  private checkItemCollisions(): void {
    const playerEntities = this.getEntitiesWithComponents('player', 'transform', 'collider');
    if (playerEntities.length === 0) return;

    const playerEntity = playerEntities[0];
    const transform = playerEntity.components.get('transform') as TransformComponent;
    const collider = playerEntity.components.get('collider') as ColliderComponent;
    
    if (!transform || !collider) return;

    const PICKUP_DISTANCE = 24; // Same as interaction distance

    for (const [itemId, pickup] of this.itemPickups) {
      const distance = Math.hypot(
        transform.position.x - pickup.position.x,
        transform.position.y - pickup.position.y
      );

      if (distance <= PICKUP_DISTANCE) {
        // Auto-collect item
        gameEvents.emit({
          type: 'player.collect.item',
          payload: { itemId, playerId: playerEntity.id },
          timestamp: Date.now()
        });
      }
    }
  }

  update(_deltaTime: number): void {
    this.checkItemCollisions();
  }

  // Debug methods
  public getItemPickups(): ItemPickup[] {
    return Array.from(this.itemPickups.values());
  }

  public givePlayerItem(playerId: string, itemType: keyof PlayerComponent['inventory'], value = 1): boolean {
    const playerEntity = this.world.getEntity(playerId);
    if (!playerEntity) return false;

    const playerComponent = playerEntity.components.get('player') as PlayerComponent;
    if (!playerComponent) return false;

    const fakePickup: ItemPickup = {
      id: `debug_${Date.now()}`,
      itemType,
      position: { x: 0, y: 0 },
      value
    };

    this.addItemToInventory(playerComponent, fakePickup);

    gameEvents.emit({
      type: 'inventory.item.collected',
      payload: { 
        itemType, 
        value,
        position: fakePickup.position,
        playerInventory: playerComponent.inventory
      },
      timestamp: Date.now()
    });

    return true;
  }
}