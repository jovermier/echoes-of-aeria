// Entity-Component-System implementation
// Following Game Architect specifications for scalable architecture

import type { Component, Entity } from '@shared/types.js';

// Component registry for type checking
export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private componentTypes: Set<string> = new Set();

  static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  registerComponent(type: string): void {
    this.componentTypes.add(type);
  }

  isValidComponent(type: string): boolean {
    return this.componentTypes.has(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.componentTypes);
  }
}

// World manages all entities and components
export class World {
  private entities: Map<string, Entity> = new Map();
  private componentsByType: Map<string, Map<string, Component>> = new Map();
  private systemExecutionOrder: System[] = [];
  private entityCounter = 0;

  // Entity management
  createEntity(): Entity {
    const id = `entity_${++this.entityCounter}`;
    const entity: Entity = {
      id,
      components: new Map()
    };
    
    this.entities.set(id, entity);
    return entity;
  }

  destroyEntity(entityId: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    // Remove all components from component maps
    for (const [componentType] of entity.components) {
      const componentsOfType = this.componentsByType.get(componentType);
      if (componentsOfType) {
        componentsOfType.delete(entityId);
      }
    }

    // Remove entity
    this.entities.delete(entityId);
    return true;
  }

  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  // Component management
  addComponent<T extends Component>(entityId: string, component: T): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    // Set component's entity reference
    component.entityId = entityId;

    // Add to entity
    entity.components.set(component.type, component);

    // Add to component type map
    if (!this.componentsByType.has(component.type)) {
      this.componentsByType.set(component.type, new Map());
    }
    this.componentsByType.get(component.type)!.set(entityId, component);

    return true;
  }

  removeComponent(entityId: string, componentType: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    // Remove from entity
    const removed = entity.components.delete(componentType);
    
    // Remove from component type map
    const componentsOfType = this.componentsByType.get(componentType);
    if (componentsOfType) {
      componentsOfType.delete(entityId);
    }

    return removed;
  }

  getComponent<T extends Component>(entityId: string, componentType: string): T | undefined {
    const entity = this.entities.get(entityId);
    if (!entity) return undefined;
    
    return entity.components.get(componentType) as T | undefined;
  }

  hasComponent(entityId: string, componentType: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;
    
    return entity.components.has(componentType);
  }

  // Query system
  getEntitiesWithComponents(...componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter(entity => 
      componentTypes.every(type => entity.components.has(type))
    );
  }

  getComponentsOfType<T extends Component>(componentType: string): T[] {
    const componentsMap = this.componentsByType.get(componentType);
    if (!componentsMap) return [];
    
    return Array.from(componentsMap.values()) as T[];
  }

  // System management
  addSystem(system: System): void {
    system.world = this;
    this.systemExecutionOrder.push(system);
    system.onAddedToWorld();
  }

  removeSystem(system: System): boolean {
    const index = this.systemExecutionOrder.indexOf(system);
    if (index === -1) return false;

    system.onRemovedFromWorld();
    this.systemExecutionOrder.splice(index, 1);
    return true;
  }

  getSystems(): System[] {
    return [...this.systemExecutionOrder];
  }

  // Update all systems
  update(deltaTime: number): void {
    for (const system of this.systemExecutionOrder) {
      if (system.enabled) {
        system.update(deltaTime);
      }
    }
  }

  // Cleanup
  clear(): void {
    // Remove all systems
    for (const system of this.systemExecutionOrder) {
      system.onRemovedFromWorld();
    }
    this.systemExecutionOrder.length = 0;

    // Clear all data
    this.entities.clear();
    this.componentsByType.clear();
    this.entityCounter = 0;
  }
}

// Base system class
export abstract class System {
  public world!: World;
  public enabled = true;
  
  // Called when system is added to world
  onAddedToWorld(): void {}
  
  // Called when system is removed from world
  onRemovedFromWorld(): void {}
  
  // Called every frame
  abstract update(deltaTime: number): void;

  // Helper methods for common queries
  protected getEntitiesWithComponents(...componentTypes: string[]): Entity[] {
    return this.world.getEntitiesWithComponents(...componentTypes);
  }

  protected getComponent<T extends Component>(entityId: string, componentType: string): T | undefined {
    return this.world.getComponent<T>(entityId, componentType);
  }

  protected hasComponent(entityId: string, componentType: string): boolean {
    return this.world.hasComponent(entityId, componentType);
  }

  protected addComponent<T extends Component>(entityId: string, component: T): boolean {
    return this.world.addComponent(entityId, component);
  }

  protected removeComponent(entityId: string, componentType: string): boolean {
    return this.world.removeComponent(entityId, componentType);
  }
}

// Entity builder pattern for easier entity creation
export class EntityBuilder {
  private entity: Entity;
  private world: World;

  constructor(world: World) {
    this.world = world;
    this.entity = world.createEntity();
  }

  with<T extends Component>(component: T): EntityBuilder {
    this.world.addComponent(this.entity.id, component);
    return this;
  }

  build(): Entity {
    return this.entity;
  }

  static create(world: World): EntityBuilder {
    return new EntityBuilder(world);
  }
}

// Query builder for complex entity queries
export class Query {
  private world: World;
  private requiredComponents: string[] = [];
  private excludedComponents: string[] = [];

  constructor(world: World) {
    this.world = world;
  }

  with(...componentTypes: string[]): Query {
    this.requiredComponents.push(...componentTypes);
    return this;
  }

  without(...componentTypes: string[]): Query {
    this.excludedComponents.push(...componentTypes);
    return this;
  }

  execute(): Entity[] {
    return this.world.getAllEntities().filter(entity => {
      // Check required components
      const hasRequired = this.requiredComponents.every(type => 
        entity.components.has(type)
      );
      
      // Check excluded components
      const hasExcluded = this.excludedComponents.some(type => 
        entity.components.has(type)
      );
      
      return hasRequired && !hasExcluded;
    });
  }

  count(): number {
    return this.execute().length;
  }

  first(): Entity | undefined {
    return this.execute()[0];
  }

  static from(world: World): Query {
    return new Query(world);
  }
}

// Utility functions
export const ECSUtils = {
  // Create a player entity with common components
  createPlayerEntity(world: World, position: { x: number; y: number }): Entity {
    return EntityBuilder.create(world)
      .with({
        type: 'transform',
        entityId: '', // Will be set by world
        position,
        rotation: 0,
        scale: { x: 1, y: 1 }
      })
      .with({
        type: 'sprite',
        entityId: '',
        texture: 'player',
        frame: 0,
        tint: 0xffffff,
        alpha: 1
      })
      .with({
        type: 'movement',
        entityId: '',
        velocity: { x: 0, y: 0 },
        speed: 80,
        direction: 'down' as const
      })
      .with({
        type: 'collider',
        entityId: '',
        bounds: { x: 0, y: 0, width: 12, height: 12 },
        solid: true,
        trigger: false
      })
      .with({
        type: 'health',
        entityId: '',
        current: 6,
        maximum: 6,
        invulnerable: false,
        invulnerabilityTimer: 0
      })
      .with({
        type: 'player',
        entityId: '',
        stamina: 100,
        maxStamina: 100,
        gleam: 0,
        hearts: 3,
        inventory: {
          sunflame_lantern: true,
          gale_boots: false,
          riverfin_vest: false,
          aether_mirror: false,
          storm_disk: false,
          quake_maul: false,
          tide_hook: false,
          sunflame_prism: false,
          kingsbane_sigil: false,
          aether_shards: 0,
          keys: {},
          heart_pieces: 0,
          rumor_cards: 0
        }
      })
      .build();
  }
};