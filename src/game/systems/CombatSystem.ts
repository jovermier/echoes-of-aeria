// Combat System - Handles combat mechanics with ALTTP-style visual feedback
// Integrates with VisualEffectsSystem for impact effects and screen shake

import { System } from '../ECS.js';
import { gameEvents } from '@shared/events.js';
import type { 
  TransformComponent, 
  HealthComponent, 
  PlayerComponent,
  MovementComponent,
  ColliderComponent 
} from '@shared/types.js';
import { TILE_SIZE } from '@shared/constants.js';

export interface CombatHit {
  attacker: string;
  target: string;
  damage: number;
  position: { x: number; y: number };
  knockback?: { x: number; y: number };
  type: 'sword' | 'magic' | 'projectile' | 'environmental';
}

export interface AttackPattern {
  id: string;
  range: number;
  damage: number;
  cooldown: number;
  knockback: number;
  hitEffect: string;
  soundEffect?: string;
}

export class CombatSystem extends System {
  private attackCooldowns: Map<string, number> = new Map();
  private invulnerabilityTimers: Map<string, number> = new Map();
  private pendingHits: CombatHit[] = [];
  
  // Combat constants (ALTTP-inspired)
  private readonly INVULNERABILITY_TIME = 1000; // 1 second i-frames
  private readonly SWORD_RANGE = TILE_SIZE * 1.5;
  private readonly SWORD_DAMAGE = 1;
  private readonly SWORD_COOLDOWN = 500;
  private readonly KNOCKBACK_FORCE = 60;

  // Attack patterns for different weapons
  private attackPatterns: Map<string, AttackPattern> = new Map([
    ['sword', {
      id: 'sword',
      range: this.SWORD_RANGE,
      damage: this.SWORD_DAMAGE,
      cooldown: this.SWORD_COOLDOWN,
      knockback: this.KNOCKBACK_FORCE,
      hitEffect: 'sword_strike',
      soundEffect: 'sfx_sword_swing'
    }],
    ['magic_blast', {
      id: 'magic_blast',
      range: TILE_SIZE * 3,
      damage: 2,
      cooldown: 800,
      knockback: this.KNOCKBACK_FORCE * 1.5,
      hitEffect: 'magic_impact',
      soundEffect: 'sfx_magic_cast'
    }]
  ]);

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle attack input
    gameEvents.on('combat.attack', (event: any) => {
      this.handleAttack(event.payload);
    });

    // Handle damage events
    gameEvents.on('combat.damage', (event: any) => {
      this.handleDamage(event.payload);
    });
  }

  update(deltaTime: number): void {
    this.updateCooldowns(deltaTime);
    this.updateInvulnerability(deltaTime);
    this.processPendingHits(deltaTime);
  }

  private updateCooldowns(deltaTime: number): void {
    for (const [entityId, cooldown] of this.attackCooldowns) {
      const newCooldown = cooldown - deltaTime * 1000;
      if (newCooldown <= 0) {
        this.attackCooldowns.delete(entityId);
      } else {
        this.attackCooldowns.set(entityId, newCooldown);
      }
    }
  }

  private updateInvulnerability(deltaTime: number): void {
    for (const [entityId, timer] of this.invulnerabilityTimers) {
      const newTimer = timer - deltaTime * 1000;
      if (newTimer <= 0) {
        this.invulnerabilityTimers.delete(entityId);
        
        // Reset entity to normal state
        const entity = this.world.getEntity(entityId);
        const healthComponent = entity?.components.get('health') as HealthComponent;
        if (healthComponent) {
          healthComponent.invulnerable = false;
        }
      } else {
        this.invulnerabilityTimers.set(entityId, newTimer);
      }
    }
  }

  private processPendingHits(deltaTime: number): void {
    for (let i = this.pendingHits.length - 1; i >= 0; i--) {
      const hit = this.pendingHits[i];
      this.executeHit(hit);
      this.pendingHits.splice(i, 1);
    }
  }

  private handleAttack(payload: { 
    attackerId: string; 
    weaponType?: string;
    direction?: { x: number; y: number };
    position?: { x: number; y: number };
  }): void {
    const { attackerId, weaponType = 'sword', direction, position } = payload;
    
    // Check if attacker can attack (not on cooldown)
    if (this.attackCooldowns.has(attackerId)) {
      return; // Still on cooldown
    }

    const attackerEntity = this.world.getEntity(attackerId);
    if (!attackerEntity) return;

    const attackerTransform = attackerEntity.components.get('transform') as TransformComponent;
    const attackerMovement = attackerEntity.components.get('movement') as MovementComponent;
    if (!attackerTransform || !attackerMovement) return;

    const pattern = this.attackPatterns.get(weaponType);
    if (!pattern) return;

    // Set attack cooldown
    this.attackCooldowns.set(attackerId, pattern.cooldown);

    // Determine attack direction
    const attackDirection = direction || this.getDirectionFromMovement(attackerMovement);
    const attackPosition = position || attackerTransform.position;

    // Find potential targets in range
    const targets = this.findTargetsInRange(attackPosition, attackDirection, pattern);

    // Create hits for all valid targets
    for (const target of targets) {
      this.queueHit({
        attacker: attackerId,
        target: target.id,
        damage: pattern.damage,
        position: target.position,
        knockback: {
          x: attackDirection.x * pattern.knockback,
          y: attackDirection.y * pattern.knockback
        },
        type: weaponType as CombatHit['type']
      });
    }

    // Emit attack effect even if no targets hit (for visual feedback)
    gameEvents.emit({
      type: 'effects.magic.cast',
      payload: {
        position: attackPosition,
        spellType: weaponType
      },
      timestamp: Date.now()
    });

    console.log(`Combat: ${attackerId} attacks with ${weaponType}`);
  }

  private getDirectionFromMovement(movement: MovementComponent): { x: number; y: number } {
    switch (movement.direction) {
      case 'up': return { x: 0, y: -1 };
      case 'down': return { x: 0, y: 1 };
      case 'left': return { x: -1, y: 0 };
      case 'right': return { x: 1, y: 0 };
      default: return { x: 0, y: -1 }; // Default to up
    }
  }

  private findTargetsInRange(
    attackPosition: { x: number; y: number },
    direction: { x: number; y: number },
    pattern: AttackPattern
  ): Array<{ id: string; position: { x: number; y: number } }> {
    const targets: Array<{ id: string; position: { x: number; y: number } }> = [];
    
    // Get all entities that can take damage
    const damageable = this.getEntitiesWithComponents('health', 'transform', 'collider');
    
    for (const entity of damageable) {
      const transform = entity.components.get('transform') as TransformComponent;
      const collider = entity.components.get('collider') as ColliderComponent;
      
      // Calculate distance from attack origin
      const distance = Math.hypot(
        transform.position.x - attackPosition.x,
        transform.position.y - attackPosition.y
      );
      
      // Check if target is in range
      if (distance <= pattern.range) {
        // Check if target is in the attack direction (cone-based attack)
        const targetDirection = {
          x: transform.position.x - attackPosition.x,
          y: transform.position.y - attackPosition.y
        };
        
        // Normalize target direction
        const targetLength = Math.hypot(targetDirection.x, targetDirection.y);
        if (targetLength > 0) {
          targetDirection.x /= targetLength;
          targetDirection.y /= targetLength;
        }
        
        // Calculate dot product to check if in attack cone
        const dotProduct = direction.x * targetDirection.x + direction.y * targetDirection.y;
        
        // Attack hits if target is roughly in the forward direction (135 degree cone)
        if (dotProduct > -0.5) {
          targets.push({
            id: entity.id,
            position: transform.position
          });
        }
      }
    }
    
    return targets;
  }

  private queueHit(hit: CombatHit): void {
    this.pendingHits.push(hit);
  }

  private executeHit(hit: CombatHit): void {
    const targetEntity = this.world.getEntity(hit.target);
    if (!targetEntity) return;

    const healthComponent = targetEntity.components.get('health') as HealthComponent;
    const transformComponent = targetEntity.components.get('transform') as TransformComponent;
    const movementComponent = targetEntity.components.get('movement') as MovementComponent;

    if (!healthComponent || !transformComponent) return;

    // Skip if target is invulnerable
    if (healthComponent.invulnerable || this.invulnerabilityTimers.has(hit.target)) {
      return;
    }

    // Apply damage
    const actualDamage = this.calculateDamage(hit);
    healthComponent.current = Math.max(0, healthComponent.current - actualDamage);

    // Apply knockback
    if (hit.knockback && movementComponent) {
      movementComponent.velocity.x += hit.knockback.x;
      movementComponent.velocity.y += hit.knockback.y;
    }

    // Set invulnerability
    healthComponent.invulnerable = true;
    healthComponent.invulnerabilityTimer = this.INVULNERABILITY_TIME;
    this.invulnerabilityTimers.set(hit.target, this.INVULNERABILITY_TIME);

    // Emit hit effect
    gameEvents.emit({
      type: 'combat.hit',
      payload: {
        target: hit.target,
        damage: actualDamage,
        position: hit.position,
        type: hit.type
      },
      timestamp: Date.now()
    });

    // Check for death
    if (healthComponent.current <= 0) {
      this.handleDeath(hit.target, hit.attacker);
    }

    console.log(`Combat: ${hit.target} takes ${actualDamage} damage (${healthComponent.current}/${healthComponent.maximum} HP)`);
  }

  private calculateDamage(hit: CombatHit): number {
    // Base damage from hit
    let damage = hit.damage;

    // TODO: Apply damage modifiers based on:
    // - Attacker stats/equipment
    // - Target defense/armor
    // - Environmental factors
    // - Critical hit chances

    return Math.max(1, Math.floor(damage));
  }

  private handleDamage(payload: { 
    targetId: string; 
    damage: number; 
    source?: string;
    position?: { x: number; y: number };
  }): void {
    const { targetId, damage, source = 'environmental', position } = payload;
    
    const targetEntity = this.world.getEntity(targetId);
    if (!targetEntity) return;

    const transformComponent = targetEntity.components.get('transform') as TransformComponent;
    const hitPosition = position || transformComponent?.position || { x: 0, y: 0 };

    // Create a damage hit
    this.queueHit({
      attacker: source,
      target: targetId,
      damage,
      position: hitPosition,
      type: 'environmental'
    });
  }

  private handleDeath(targetId: string, killerId: string): void {
    const targetEntity = this.world.getEntity(targetId);
    if (!targetEntity) return;

    const transformComponent = targetEntity.components.get('transform') as TransformComponent;
    
    // Emit death event
    gameEvents.emit({
      type: 'combat.death',
      payload: {
        targetId,
        killerId,
        position: transformComponent?.position || { x: 0, y: 0 }
      },
      timestamp: Date.now()
    });

    // TODO: Handle drops, experience, etc.
    
    console.log(`Combat: ${targetId} was defeated by ${killerId}`);
  }

  // Public API methods
  canAttack(entityId: string): boolean {
    return !this.attackCooldowns.has(entityId);
  }

  isInvulnerable(entityId: string): boolean {
    return this.invulnerabilityTimers.has(entityId);
  }

  getRemainingCooldown(entityId: string): number {
    return this.attackCooldowns.get(entityId) || 0;
  }

  getInvulnerabilityTime(entityId: string): number {
    return this.invulnerabilityTimers.get(entityId) || 0;
  }

  // Force damage (bypasses invulnerability)
  forceDamage(targetId: string, damage: number, source: string = 'forced'): void {
    const targetEntity = this.world.getEntity(targetId);
    if (!targetEntity) return;

    const healthComponent = targetEntity.components.get('health') as HealthComponent;
    const transformComponent = targetEntity.components.get('transform') as TransformComponent;
    
    if (!healthComponent || !transformComponent) return;

    // Apply damage directly
    const actualDamage = Math.max(1, damage);
    healthComponent.current = Math.max(0, healthComponent.current - actualDamage);

    // Emit hit effect
    gameEvents.emit({
      type: 'combat.hit',
      payload: {
        target: targetId,
        damage: actualDamage,
        position: transformComponent.position,
        type: 'environmental'
      },
      timestamp: Date.now()
    });

    // Check for death
    if (healthComponent.current <= 0) {
      this.handleDeath(targetId, source);
    }

    console.log(`Combat: Force damage ${actualDamage} to ${targetId} from ${source}`);
  }

  // Heal entity
  heal(targetId: string, amount: number): void {
    const targetEntity = this.world.getEntity(targetId);
    if (!targetEntity) return;

    const healthComponent = targetEntity.components.get('health') as HealthComponent;
    const transformComponent = targetEntity.components.get('transform') as TransformComponent;
    
    if (!healthComponent || !transformComponent) return;

    const actualHeal = Math.min(amount, healthComponent.maximum - healthComponent.current);
    healthComponent.current += actualHeal;

    // Emit heal effect
    gameEvents.emit({
      type: 'effects.interaction',
      payload: {
        position: transformComponent.position,
        type: 'healing'
      },
      timestamp: Date.now()
    });

    console.log(`Combat: Healed ${targetId} for ${actualHeal} HP (${healthComponent.current}/${healthComponent.maximum})`);
  }

  // Get combat status for UI
  getCombatStatus(entityId: string): {
    canAttack: boolean;
    cooldownRemaining: number;
    invulnerable: boolean;
    invulnerabilityRemaining: number;
  } {
    return {
      canAttack: this.canAttack(entityId),
      cooldownRemaining: this.getRemainingCooldown(entityId),
      invulnerable: this.isInvulnerable(entityId),
      invulnerabilityRemaining: this.getInvulnerabilityTime(entityId)
    };
  }
}