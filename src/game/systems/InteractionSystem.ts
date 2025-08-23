// Interaction System - Handles NPC dialogue and object interactions
// Following Game Architect specifications for system design

import { System } from '../ECS.js';
import { gameEvents } from '@shared/events.js';
import type { TransformComponent, NPCComponent } from '@shared/types.js';
import { INTERACTION_DISTANCE } from '@shared/constants.js';

export class InteractionSystem extends System {
  private nearbyNPCs: Map<string, NPCComponent> = new Map();
  private currentInteractionTarget: string | null = null;

  private scene: Phaser.Scene;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private lastNPCCheckTime = 0;
  private readonly NPC_CHECK_INTERVAL = 100; // Check NPCs every 100ms instead of every frame

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
  }

  onAddedToWorld(): void {
    // Cache keyboard keys for performance
    if (this.scene.input.keyboard) {
      this.spaceKey = this.scene.input.keyboard.addKey('SPACE');
      this.enterKey = this.scene.input.keyboard.addKey('ENTER');
    }
  }

  update(_deltaTime: number): void {
    // Throttle NPC checking for performance
    const now = Date.now();
    if (now - this.lastNPCCheckTime > this.NPC_CHECK_INTERVAL) {
      this.updateNearbyNPCs();
      this.lastNPCCheckTime = now;
    }
    
    this.handleInteractionInput();
  }

  private updateNearbyNPCs(): void {
    const playerEntities = this.getEntitiesWithComponents('player', 'transform');
    const npcEntities = this.getEntitiesWithComponents('npc', 'transform', 'collider');

    if (playerEntities.length === 0) return;

    const playerEntity = playerEntities[0];
    const playerTransform = playerEntity.components.get('transform') as TransformComponent;
    
    this.nearbyNPCs.clear();

    // Check distance to all NPCs
    for (const npcEntity of npcEntities) {
      const npcTransform = npcEntity.components.get('transform') as TransformComponent;
      const npcComponent = npcEntity.components.get('npc') as NPCComponent;
      
      if (!npcComponent.interactable) continue;

      const distance = Math.hypot(
        playerTransform.position.x - npcTransform.position.x,
        playerTransform.position.y - npcTransform.position.y
      );

      if (distance <= INTERACTION_DISTANCE) {
        this.nearbyNPCs.set(npcEntity.id, npcComponent);
        
        // Emit highlight event for UI
        gameEvents.emit({
          type: 'interaction/highlighted',
          payload: {
            entityId: npcEntity.id,
            entityType: 'npc',
            name: npcComponent.name,
            distance: distance.toFixed(1)
          },
          timestamp: Date.now()
        });
        
        // Show interaction prompt for tutorial
        if (npcComponent.name === 'Keeper Elowen' && distance <= INTERACTION_DISTANCE) {
          // Only show prompt occasionally to avoid spam
          if (Math.random() < 0.1) {
            console.log(`💬 ${npcComponent.name} is nearby! Press SPACE or ENTER to talk.`);
          }
        }
      }
    }
  }

  private handleInteractionInput(): void {
    // Use cached keys and check for key press (not hold)
    if ((this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) ||
        (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey))) {
      
      // Find the closest NPC to interact with
      const closestNPC = this.getClosestNPC();
      if (closestNPC) {
        this.startDialogue(closestNPC.entityId, closestNPC.npc);
      }
    }
  }

  private getClosestNPC(): { entityId: string; npc: NPCComponent } | null {
    if (this.nearbyNPCs.size === 0) return null;

    const playerEntities = this.getEntitiesWithComponents('player', 'transform');
    if (playerEntities.length === 0) return null;

    const playerTransform = playerEntities[0].components.get('transform') as TransformComponent;
    let closestDistance = Infinity;
    let closestNPC: { entityId: string; npc: NPCComponent } | null = null;

    for (const [entityId, npcComponent] of this.nearbyNPCs) {
      const npcEntity = this.world.getEntity(entityId);
      if (!npcEntity) continue;

      const npcTransform = npcEntity.components.get('transform') as TransformComponent;
      const distance = Math.hypot(
        playerTransform.position.x - npcTransform.position.x,
        playerTransform.position.y - npcTransform.position.y
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestNPC = { entityId, npc: npcComponent };
      }
    }

    return closestNPC;
  }

  private startDialogue(entityId: string, npc: NPCComponent): void {
    if (npc.currentDialogue >= npc.dialogue.length) {
      // No more dialogue
      return;
    }

    this.currentInteractionTarget = entityId;

    // Get NPC position for visual effects
    const npcEntity = this.world.getEntity(entityId);
    const npcTransform = npcEntity?.components.get('transform') as TransformComponent;
    
    // Emit visual interaction effect
    if (npcTransform) {
      gameEvents.emit({
        type: 'effects.interaction',
        payload: {
          position: npcTransform.position,
          type: 'npc_dialogue'
        },
        timestamp: Date.now()
      });
    }

    // Emit dialogue start event
    gameEvents.emit({
      type: 'ui/dialogueStart',
      payload: {
        npcId: entityId,
        npcName: npc.name,
        dialogue: npc.dialogue[npc.currentDialogue],
        isComplete: npc.currentDialogue >= npc.dialogue.length - 1
      },
      timestamp: Date.now()
    });

    // Advance dialogue
    npc.currentDialogue++;

    console.log(`Started dialogue with ${npc.name}: "${npc.dialogue[npc.currentDialogue - 1]}"`);
  }

  // Public API for external systems
  getCurrentInteractionTarget(): string | null {
    return this.currentInteractionTarget;
  }

  hasNearbyInteractables(): boolean {
    return this.nearbyNPCs.size > 0;
  }

  getNearbyInteractables(): string[] {
    return Array.from(this.nearbyNPCs.keys());
  }
}