// Input System - Handle player input with buffering
// Following Player Controller & Camera agent specifications

import Phaser from 'phaser';
import { System } from '../ECS.js';
import { gameEvents } from '@shared/events.js';
import type { InputState, MovementComponent, TransformComponent } from '@shared/types.js';
import type { WorldScene } from '../scenes/WorldScene.js';

export class InputSystem extends System {
  private scene: WorldScene;
  private inputState: InputState = {
    movement: {
      up: false,
      down: false,
      left: false,
      right: false
    },
    actions: {
      attack: false,
      interact: false,
      inventory: false,
      pause: false
    }
  };

  // Input buffering for responsive controls
  private inputBuffer: Array<{ action: string; timestamp: number }> = [];
  private bufferDuration = 100; // milliseconds

  // Phaser key objects for polling
  private keyObjects: {
    up: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
    left: Phaser.Input.Keyboard.Key[];
    right: Phaser.Input.Keyboard.Key[];
    attack: Phaser.Input.Keyboard.Key[];
    interact: Phaser.Input.Keyboard.Key[];
    inventory: Phaser.Input.Keyboard.Key[];
    pause: Phaser.Input.Keyboard.Key[];
  } | null = null;

  constructor(scene: WorldScene) {
    super();
    this.scene = scene;
  }

  onAddedToWorld(): void {
    console.log('🎮 InputSystem: onAddedToWorld called');
    this.setupKeyboardInput();
    this.setupGamepadInput();
    console.log('🎮 InputSystem: Setup complete, keyObjects:', this.keyObjects ? 'initialized' : 'NULL');
  }

  onRemovedFromWorld(): void {
    // Cleanup event listeners if needed
  }

  update(deltaTime: number): void {
    this.updateInputState();
    this.updateInputBuffer(deltaTime);
    this.processPlayerInput();
  }

  private updateInputState(): void {
    if (!this.keyObjects) return;

    // Update movement state by polling key objects
    const upPressed = this.keyObjects.up.some(key => key.isDown);
    const downPressed = this.keyObjects.down.some(key => key.isDown);  
    const leftPressed = this.keyObjects.left.some(key => key.isDown);
    const rightPressed = this.keyObjects.right.some(key => key.isDown);
    
    this.inputState.movement.up = upPressed;
    this.inputState.movement.down = downPressed;
    this.inputState.movement.left = leftPressed;
    this.inputState.movement.right = rightPressed;
    
    // Debug: Log raw key states
    if (upPressed || downPressed || leftPressed || rightPressed) {
      console.log('🔸 RAW KEY STATES:', {
        up: upPressed,
        down: downPressed, 
        left: leftPressed,
        right: rightPressed,
        upKeyStates: this.keyObjects.up.map(k => k.isDown),
        downKeyStates: this.keyObjects.down.map(k => k.isDown),
        leftKeyStates: this.keyObjects.left.map(k => k.isDown),
        rightKeyStates: this.keyObjects.right.map(k => k.isDown)
      });
    }

    // Update action state and buffer presses
    const attackPressed = this.keyObjects.attack.some(key => Phaser.Input.Keyboard.JustDown(key));
    const interactPressed = this.keyObjects.interact.some(key => Phaser.Input.Keyboard.JustDown(key));
    const inventoryPressed = this.keyObjects.inventory.some(key => Phaser.Input.Keyboard.JustDown(key));
    const pausePressed = this.keyObjects.pause.some(key => Phaser.Input.Keyboard.JustDown(key));

    // Buffer action inputs when they're first pressed
    if (attackPressed) {
      this.bufferInput('attack');
      this.inputState.actions.attack = true;
    } else {
      this.inputState.actions.attack = false;
    }

    if (interactPressed) {
      this.bufferInput('interact');
      this.inputState.actions.interact = true;
    } else {
      this.inputState.actions.interact = false;
    }

    if (inventoryPressed) {
      this.bufferInput('inventory');
      this.inputState.actions.inventory = true;
    } else {
      this.inputState.actions.inventory = false;
    }

    if (pausePressed) {
      this.bufferInput('pause');
      this.inputState.actions.pause = true;
    } else {
      this.inputState.actions.pause = false;
    }

    // Debug logging for movement state
    const hasMovement = this.inputState.movement.up || this.inputState.movement.down || 
                       this.inputState.movement.left || this.inputState.movement.right;
    if (hasMovement) {
      console.log('InputSystem: Input state updated:', this.inputState.movement);
      console.log('InputSystem: Key states:', {
        upKeys: this.keyObjects.up.map(k => ({ code: k.keyCode, isDown: k.isDown })),
        downKeys: this.keyObjects.down.map(k => ({ code: k.keyCode, isDown: k.isDown })),
        leftKeys: this.keyObjects.left.map(k => ({ code: k.keyCode, isDown: k.isDown })),
        rightKeys: this.keyObjects.right.map(k => ({ code: k.keyCode, isDown: k.isDown }))
      });
    }
    
    // EXTRA DEBUG: Log specifically for UP arrow issues
    if (this.inputState.movement.up) {
      console.log('🔸 UP ARROW DETECTED! State:', this.inputState.movement.up);
      console.log('🔸 Up Key Objects:', this.keyObjects.up.map(k => ({ 
        keyCode: k.keyCode, 
        isDown: k.isDown,
        duration: k.getDuration()
      })));
    }
  }

  private setupKeyboardInput(): void {
    console.log('🎮 InputSystem: setupKeyboardInput called');
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) {
      console.log('❌ InputSystem: No keyboard manager available!');
      return;
    }
    console.log('✅ InputSystem: Keyboard manager found');

    // Create key objects for all movement keys
    const keys = {
      up: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
      ],
      down: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
      ],
      left: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
      ],
      right: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      ],
      attack: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      ],
      interact: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      ],
      inventory: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I)
      ],
      pause: [
        keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      ]
    };

    // Store key references for polling
    this.keyObjects = keys;

    // Also listen for direct keyboard events for debugging
    keyboard.on('keydown', (event: any) => {
      console.log('Phaser keydown event:', event.keyCode, event.code);
    });
  }

  private setupGamepadInput(): void {
    // Gamepad support will be implemented by Player Controller agent
    const gamepadManager = this.scene.input.gamepad;
    if (!gamepadManager) return;

    gamepadManager.on('down', (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
      this.handleGamepadButton(button.index, true);
    });

    gamepadManager.on('up', (_pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) => {
      this.handleGamepadButton(button.index, false);
    });
  }

  // Old event-based handlers removed - now using polling in updateInputState()

  private handleGamepadButton(buttonIndex: number, isPressed: boolean): void {
    // Gamepad button mapping (following standard gamepad layout)
    switch (buttonIndex) {
      case 0: // A button - Attack/Interact
        if (isPressed) {
          this.bufferInput('attack');
        }
        this.inputState.actions.attack = isPressed;
        break;
      case 1: // B button - Cancel/Back
        if (isPressed) {
          this.bufferInput('pause');
        }
        break;
      case 2: // X button - Inventory
        if (isPressed) {
          this.bufferInput('inventory');
        }
        this.inputState.actions.inventory = isPressed;
        break;
      case 12: // D-pad up
        this.inputState.movement.up = isPressed;
        break;
      case 13: // D-pad down
        this.inputState.movement.down = isPressed;
        break;
      case 14: // D-pad left
        this.inputState.movement.left = isPressed;
        break;
      case 15: // D-pad right
        this.inputState.movement.right = isPressed;
        break;
    }
  }

  private bufferInput(action: string): void {
    this.inputBuffer.push({
      action,
      timestamp: performance.now()
    });
  }

  private updateInputBuffer(_deltaTime: number): void {
    const currentTime = performance.now();
    
    // Remove expired inputs from buffer
    this.inputBuffer = this.inputBuffer.filter(
      input => currentTime - input.timestamp < this.bufferDuration
    );
  }

  private processPlayerInput(): void {
    // Get player entity
    const playerEntities = this.getEntitiesWithComponents('player', 'movement', 'transform');
    if (playerEntities.length === 0) {
      console.log('InputSystem: No player entities found with required components');
      console.log('InputSystem: Available entities:', this.world.getAllEntities().map(e => ({ 
        id: e.id, 
        components: Array.from(e.components.keys()) 
      })));
      return;
    }

    const playerEntity = playerEntities[0];
    const movement = this.getComponent<MovementComponent>(playerEntity.id, 'movement');
    const transform = this.getComponent<TransformComponent>(playerEntity.id, 'transform');
    
    if (!movement || !transform) {
      console.log('InputSystem: Player entity missing components', { 
        entityId: playerEntity.id,
        hasMovement: !!movement, 
        hasTransform: !!transform 
      });
      return;
    }

    // Debug: Check if movement input is being processed (only log when there's input)
    const hasAnyMovement = this.inputState.movement.up || this.inputState.movement.down || 
                           this.inputState.movement.left || this.inputState.movement.right;
    if (hasAnyMovement) {
      console.log('InputSystem: About to process movement for player', playerEntity.id);
    }

    // Process movement input
    this.processMovementInput(movement);

    // Process buffered actions
    this.processBufferedActions(playerEntity.id, transform);
  }

  private processMovementInput(movement: MovementComponent): void {
    // Calculate movement direction based on input
    let directionX = 0;
    let directionY = 0;

    if (this.inputState.movement.left) directionX -= 1;
    if (this.inputState.movement.right) directionX += 1;
    if (this.inputState.movement.up) directionY -= 1;
    if (this.inputState.movement.down) directionY += 1;

    // Log movement input for debugging
    if (directionX !== 0 || directionY !== 0) {
      console.log('InputSystem: Processing movement:', { 
        directionX, 
        directionY, 
        inputState: this.inputState.movement,
        speed: movement.speed 
      });
    }

    // Normalize diagonal movement
    if (directionX !== 0 && directionY !== 0) {
      directionX *= 0.707; // Math.sqrt(2) / 2
      directionY *= 0.707;
    }

    // Store previous velocity for comparison
    const prevVelocity = { ...movement.velocity };

    // Update movement component
    movement.velocity.x = directionX * movement.speed;
    movement.velocity.y = directionY * movement.speed;

    // Log velocity changes
    if (movement.velocity.x !== prevVelocity.x || movement.velocity.y !== prevVelocity.y) {
      console.log('InputSystem: Velocity updated:', {
        from: prevVelocity,
        to: movement.velocity,
        direction: { directionX, directionY },
        speed: movement.speed
      });
    }

    // Update facing direction
    if (directionX < 0) movement.direction = 'left';
    else if (directionX > 0) movement.direction = 'right';
    else if (directionY < 0) movement.direction = 'up';
    else if (directionY > 0) movement.direction = 'down';
  }

  private processBufferedActions(entityId: string, transform: TransformComponent): void {

    for (const bufferedInput of this.inputBuffer) {
      switch (bufferedInput.action) {
        case 'attack':
          this.handleAttackAction(entityId, transform);
          break;
        case 'interact':
          this.handleInteractAction(entityId, transform);
          break;
        case 'inventory':
          this.handleInventoryAction();
          break;
        case 'pause':
          this.handlePauseAction();
          break;
      }
    }

    // Clear processed inputs
    this.inputBuffer.length = 0;
  }

  private handleAttackAction(entityId: string, transform: TransformComponent): void {
    // Emit attack event for combat system to handle
    const movement = this.getComponent<MovementComponent>(entityId, 'movement');
    
    gameEvents.emit({
      type: 'player.attack',
      payload: {
        direction: movement?.direction || 'down',
        position: transform.position
      },
      timestamp: Date.now()
    });
  }

  private handleInteractAction(_entityId: string, _transform: TransformComponent): void {
    // Emit interaction event
    gameEvents.emit({
      type: 'npc.interaction',
      payload: {
        npcId: 'nearest', // Will be resolved by interaction system
        dialogue: [],
        currentLine: 0
      },
      timestamp: Date.now()
    });
  }

  private handleInventoryAction(): void {
    gameEvents.emit({
      type: 'ui.inventory.toggle',
      payload: { open: true },
      timestamp: Date.now()
    });
  }

  private handlePauseAction(): void {
    gameEvents.emit({
      type: 'game.paused',
      payload: { paused: true },
      timestamp: Date.now()
    });
  }

  // Public API for other systems
  getInputState(): InputState {
    return { ...this.inputState };
  }

  isActionPressed(action: keyof InputState['actions']): boolean {
    return this.inputState.actions[action];
  }

  getMovementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.inputState.movement.left) x -= 1;
    if (this.inputState.movement.right) x += 1;
    if (this.inputState.movement.up) y -= 1;
    if (this.inputState.movement.down) y += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      x *= 0.707;
      y *= 0.707;
    }

    return { x, y };
  }
}