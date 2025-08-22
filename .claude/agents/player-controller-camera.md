---
name: "Player Controller & Camera Agent"
description: "Input handling, player state management, and camera system implementation"
---

# Player Controller & Camera Agent

**Role**: Input handling, player state management, and camera system implementation

## Core Responsibilities

### Input System Architecture
- Implement responsive input handling with proper buffering and dead-zone management
- Create input mapping system for keyboard, gamepad, and mobile touch controls
- Handle input queuing for complex move sequences and combos
- Provide accessibility options and customizable control schemes

### Player State Management  
- Design and implement player state machine (idle, moving, attacking, damaged, etc.)
- Handle state transitions with proper timing and interrupt rules
- Manage animation synchronization with game state
- Coordinate with other systems (combat, movement, audio) for state changes

### Camera Control System
- Implement smooth camera following with deadzone and look-ahead
- Handle camera transitions between areas and special events  
- Create camera effects (shake, zoom, smooth pans) for game events
- Manage camera bounds and constraints within world limits

## Technical Implementation

### Input Processing System
```typescript
// /src/game/systems/inputSystem.ts
export class InputSystem extends System {
  private inputBuffer: InputEvent[] = [];
  private inputMappings = new Map<string, InputAction>();
  private currentInputs = new Set<InputAction>();
  private gamepadManager: GamepadManager;
  
  // Input configuration
  private readonly BUFFER_TIME = 200; // ms to keep buffered inputs
  private readonly DEADZONE = 0.2;    // Analog stick deadzone
  
  update(deltaTime: number): void {
    this.updateGamepadInputs();
    this.processKeyboardInputs();
    this.updateInputBuffer(deltaTime);
    this.distributeInputEvents();
  }
  
  // Input buffering for responsive controls
  bufferInput(action: InputAction, timestamp: number = Date.now()): void {
    this.inputBuffer.push({
      action,
      timestamp,
      consumed: false
    });
  }
  
  // Check for buffered input within time window
  consumeBufferedInput(action: InputAction, maxAge: number = 100): boolean {
    const now = Date.now();
    const event = this.inputBuffer.find(e => 
      e.action === action && 
      !e.consumed && 
      (now - e.timestamp) <= maxAge
    );
    
    if (event) {
      event.consumed = true;
      return true;
    }
    return false;
  }
}
```

### Player State Machine
```typescript
// /src/game/systems/playerStateMachine.ts
export enum PlayerState {
  IDLE = 'idle',
  WALKING = 'walking', 
  RUNNING = 'running',
  ATTACKING = 'attacking',
  DAMAGED = 'damaged',
  DYING = 'dying',
  INTERACTING = 'interacting'
}

export class PlayerStateMachine {
  private currentState: PlayerState = PlayerState.IDLE;
  private stateTimer: number = 0;
  private stateData = new Map<PlayerState, StateData>();
  
  constructor(private player: Entity, private inputSystem: InputSystem) {
    this.initializeStates();
  }
  
  update(deltaTime: number): void {
    this.stateTimer += deltaTime;
    
    const currentStateData = this.stateData.get(this.currentState);
    if (currentStateData) {
      currentStateData.update(deltaTime, this.player);
      
      // Check for state transitions
      const nextState = currentStateData.checkTransitions(this.player, this.inputSystem);
      if (nextState && nextState !== this.currentState) {
        this.transitionTo(nextState);
      }
    }
  }
  
  transitionTo(newState: PlayerState): void {
    const oldState = this.currentState;
    const oldStateData = this.stateData.get(oldState);
    const newStateData = this.stateData.get(newState);
    
    // Exit current state
    oldStateData?.exit(this.player);
    
    // Enter new state  
    this.currentState = newState;
    this.stateTimer = 0;
    newStateData?.enter(this.player);
    
    // Notify other systems of state change
    this.player.emit('stateChanged', { from: oldState, to: newState });
  }
}
```

### Camera Control Implementation
```typescript
// /src/game/systems/cameraController.ts
export class CameraController extends System {
  private camera: Camera;
  private target: Entity | null = null;
  private followSettings: CameraFollowSettings;
  private effectQueue: CameraEffect[] = [];
  
  constructor() {
    super();
    this.followSettings = {
      deadzone: new Rectangle(-48, -32, 96, 64), // Deadzone around center
      smoothingSpeed: 0.08,                      // Follow smoothing factor
      lookAheadDistance: 64,                     // Look ahead in movement direction
      maxLookAheadSpeed: 2.0,                    // Max look-ahead transition speed
      bounds: null                               // World bounds (set per map)
    };
  }
  
  update(deltaTime: number): void {
    this.updateCameraEffects(deltaTime);
    this.updateCameraFollow(deltaTime);
    this.applyCameraBounds();
  }
  
  private updateCameraFollow(deltaTime: number): void {
    if (!this.target) return;
    
    const playerPos = this.target.getComponent(TransformComponent).position;
    const playerVel = this.target.getComponent(MovementComponent)?.velocity || Vector2.ZERO;
    const currentCameraPos = this.camera.position;
    
    // Calculate look-ahead offset based on movement
    const lookAheadOffset = this.calculateLookAhead(playerVel);
    const targetPosition = playerPos.add(lookAheadOffset);
    
    // Only adjust camera if target is outside deadzone
    const cameraToTarget = targetPosition.subtract(currentCameraPos);
    const deadzoneMin = this.followSettings.deadzone.topLeft;
    const deadzoneMax = this.followSettings.deadzone.bottomRight;
    
    let adjustedTarget = currentCameraPos;
    
    // Check deadzone boundaries
    if (cameraToTarget.x < deadzoneMin.x) {
      adjustedTarget.x = targetPosition.x - deadzoneMin.x;
    } else if (cameraToTarget.x > deadzoneMax.x) {
      adjustedTarget.x = targetPosition.x - deadzoneMax.x;
    }
    
    if (cameraToTarget.y < deadzoneMin.y) {
      adjustedTarget.y = targetPosition.y - deadzoneMin.y;
    } else if (cameraToTarget.y > deadzoneMax.y) {
      adjustedTarget.y = targetPosition.y - deadzoneMax.y;
    }
    
    // Smooth camera movement
    const newCameraPos = currentCameraPos.lerp(
      adjustedTarget, 
      this.followSettings.smoothingSpeed
    );
    
    this.camera.position = newCameraPos;
  }
  
  // Camera effects (shake, zoom, pan)
  addCameraEffect(effect: CameraEffect): void {
    this.effectQueue.push(effect);
  }
  
  screenShake(intensity: number, duration: number): void {
    this.addCameraEffect({
      type: 'shake',
      intensity,
      duration,
      elapsed: 0
    });
  }
}
```

## Input Handling Specification

### Input Actions
```typescript
// /src/game/input/inputActions.ts
export enum InputAction {
  // Movement
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down', 
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  
  // Actions
  ATTACK = 'attack',
  INTERACT = 'interact',
  DODGE_ROLL = 'dodge_roll',
  
  // Interface
  OPEN_MENU = 'open_menu',
  OPEN_INVENTORY = 'open_inventory',
  PAUSE = 'pause'
}

interface InputMapping {
  keyboard?: string[];    // Key codes
  gamepad?: number[];     // Button indices
  touch?: TouchGesture;   // Mobile touch gestures
}
```

### Input Buffering System
```typescript
// /src/game/input/inputBuffer.ts
export class InputBuffer {
  private buffer: InputEvent[] = [];
  private readonly BUFFER_SIZE = 10;        // Max buffered inputs
  private readonly BUFFER_TIME = 200;       // Buffer window (ms)
  
  addInput(action: InputAction, type: 'press' | 'release'): void {
    const event: InputEvent = {
      action,
      type,
      timestamp: performance.now(),
      consumed: false
    };
    
    this.buffer.push(event);
    
    // Limit buffer size
    if (this.buffer.length > this.BUFFER_SIZE) {
      this.buffer.shift();
    }
  }
  
  // Check for sequence of inputs (for combos)
  checkInputSequence(sequence: InputAction[], maxTimespan: number = 500): boolean {
    if (sequence.length === 0) return false;
    
    const now = performance.now();
    const recentInputs = this.buffer
      .filter(e => (now - e.timestamp) <= maxTimespan && e.type === 'press')
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (recentInputs.length < sequence.length) return false;
    
    // Check if sequence matches recent inputs
    const startIndex = recentInputs.length - sequence.length;
    for (let i = 0; i < sequence.length; i++) {
      if (recentInputs[startIndex + i].action !== sequence[i]) {
        return false;
      }
    }
    
    return true;
  }
}
```

## Camera System Features

### Camera Follow Settings
```typescript
interface CameraFollowSettings {
  deadzone: Rectangle;        // Area where camera doesn't move
  smoothingSpeed: number;     // How quickly camera catches up (0-1)
  lookAheadDistance: number;  // Pixels to look ahead in movement direction  
  maxLookAheadSpeed: number;  // Max speed for look-ahead transition
  bounds?: Rectangle;         // World bounds to constrain camera
  offsetY?: number;           // Vertical offset (useful for showing more ground)
}
```

### Camera Effects System
```typescript
// /src/game/systems/cameraEffects.ts
export interface CameraEffect {
  type: 'shake' | 'zoom' | 'pan' | 'flash';
  duration: number;
  elapsed: number;
  intensity?: number;
  target?: Vector2;
  easing?: (t: number) => number;
}

export class CameraEffectsManager {
  private effects: CameraEffect[] = [];
  
  update(deltaTime: number, camera: Camera): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      effect.elapsed += deltaTime;
      
      const progress = Math.min(effect.elapsed / effect.duration, 1.0);
      
      switch (effect.type) {
        case 'shake':
          this.applyShakeEffect(effect, camera, progress);
          break;
        case 'zoom':
          this.applyZoomEffect(effect, camera, progress);
          break;
        case 'pan':
          this.applyPanEffect(effect, camera, progress);
          break;
      }
      
      // Remove completed effects
      if (progress >= 1.0) {
        this.effects.splice(i, 1);
      }
    }
  }
  
  private applyShakeEffect(effect: CameraEffect, camera: Camera, progress: number): void {
    const intensity = effect.intensity || 1.0;
    const shakeAmount = intensity * (1.0 - progress); // Fade out over time
    
    const shakeX = (Math.random() - 0.5) * shakeAmount * 20;
    const shakeY = (Math.random() - 0.5) * shakeAmount * 20;
    
    camera.offset = new Vector2(shakeX, shakeY);
  }
}
```

## State Management Integration

### Player State Data
```typescript
// /src/game/states/playerStates.ts
export class IdleState implements StateData {
  enter(player: Entity): void {
    const animation = player.getComponent(AnimationComponent);
    animation.play('player_idle');
    
    const movement = player.getComponent(MovementComponent);
    movement.velocity = Vector2.ZERO;
  }
  
  update(deltaTime: number, player: Entity): void {
    // Apply friction to gradually stop movement
    const movement = player.getComponent(MovementComponent);
    movement.velocity = movement.velocity.multiply(0.9);
  }
  
  checkTransitions(player: Entity, input: InputSystem): PlayerState | null {
    // Transition to walking if movement input detected
    if (input.isActionActive(InputAction.MOVE_UP) ||
        input.isActionActive(InputAction.MOVE_DOWN) ||
        input.isActionActive(InputAction.MOVE_LEFT) ||
        input.isActionActive(InputAction.MOVE_RIGHT)) {
      return PlayerState.WALKING;
    }
    
    // Transition to attacking if attack input buffered
    if (input.consumeBufferedInput(InputAction.ATTACK, 150)) {
      return PlayerState.ATTACKING;
    }
    
    return null;
  }
  
  exit(player: Entity): void {
    // Clean up idle state
  }
}
```

## Performance Optimization

### Input Processing Optimization
```typescript
// /src/game/input/inputOptimizer.ts
export class InputOptimizer {
  private readonly MAX_EVENTS_PER_FRAME = 10;
  private eventQueue: InputEvent[] = [];
  
  processInputEvents(): void {
    // Limit input processing to prevent frame drops
    const eventsToProcess = Math.min(
      this.eventQueue.length, 
      this.MAX_EVENTS_PER_FRAME
    );
    
    for (let i = 0; i < eventsToProcess; i++) {
      const event = this.eventQueue.shift()!;
      this.processInputEvent(event);
    }
  }
  
  // Merge similar events to reduce processing overhead
  optimizeEventQueue(): void {
    // Merge duplicate movement events
    // Remove outdated buffered inputs
    // Prioritize important actions (attack, dodge)
  }
}
```

## Integration Points

### With Combat & Physics Engineer
- **State Coordination**: Ensure player states align with combat system timing
- **Input Timing**: Provide buffered inputs for combat system consumption  
- **Movement Integration**: Coordinate with physics for smooth movement

### With Audio Designer
- **State Audio**: Trigger appropriate audio for state changes
- **Input Feedback**: Play audio cues for input registration
- **Camera Audio**: Adjust audio listener position with camera movement

### With UI/UX Designer  
- **Input Display**: Provide input state for UI debugging and tutorials
- **Camera UI**: Coordinate UI positioning with camera movement
- **State Indicators**: Provide player state for HUD status displays

## Testing Strategy

### Input System Tests
```typescript
// /src/game/systems/__tests__/inputSystem.test.ts
describe('InputSystem', () => {
  test('input buffering works within time window', () => {
    const inputSystem = new InputSystem();
    
    inputSystem.bufferInput(InputAction.ATTACK);
    
    // Should consume buffered input within window
    expect(inputSystem.consumeBufferedInput(InputAction.ATTACK, 100)).toBe(true);
    
    // Should not consume same input twice
    expect(inputSystem.consumeBufferedInput(InputAction.ATTACK, 100)).toBe(false);
  });
  
  test('gamepad deadzone filtering works correctly', () => {
    // Test analog stick input filtering
    // Verify deadzone prevents drift
    // Check normalized output values
  });
});
```

### Camera System Tests
```typescript
// /src/game/systems/__tests__/cameraController.test.ts
describe('CameraController', () => {
  test('camera follows target with proper deadzone', () => {
    const camera = new CameraController();
    const player = createTestEntity();
    
    camera.followTarget(player);
    
    // Move player within deadzone - camera shouldn't move
    player.getComponent(TransformComponent).position = new Vector2(10, 10);
    camera.update(16);
    
    expect(camera.getPosition()).toEqual(Vector2.ZERO);
  });
});
```

## Performance Targets

### Input Processing
- **Input Lag**: <16ms from hardware input to game response
- **Buffer Processing**: <0.5ms per frame for input event processing
- **Gamepad Polling**: 60Hz polling with <1ms processing overhead

### Camera System  
- **Follow Smoothing**: Consistent 60fps camera updates
- **Effect Processing**: <1ms per frame for all camera effects
- **Bounds Checking**: <0.1ms per frame for world boundary constraints

## Success Metrics
- Responsive controls with <50ms perceived input lag
- Smooth camera following without jitter or lag
- Proper state transitions with no animation glitches  
- Consistent input buffering behavior across all game states