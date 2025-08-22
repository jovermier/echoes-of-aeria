# Combat & Physics Engineer Agent

**Role**: Combat mechanics, physics simulation, and player action systems implementation

## Core Responsibilities

### Combat System Implementation
- Design and implement sword combat with authentic SNES feel
- Create hit detection, damage calculation, and feedback systems  
- Implement invincibility frames (i-frames) and hit pause mechanics
- Handle knockback, screen shake, and impact effects

### Physics & Movement
- Implement precise 8-directional movement with proper acceleration/deceleration
- Handle collision detection and response for all game entities
- Create physics simulation for projectiles, items, and environmental effects
- Optimize physics calculations for 60fps performance

### Player Controller Systems
- Implement responsive input handling with buffering and queuing
- Create state machine for player actions (idle, walking, attacking, damaged, etc.)
- Handle animation transitions and timing synchronization
- Implement camera following with deadzone and smooth tracking

## Technical Implementation

### Combat System Architecture
```typescript
// /src/game/systems/combat.ts
export class CombatSystem extends System {
  private hitboxes = new Map<Entity, Hitbox[]>();
  private activeAttacks = new Set<AttackInstance>();
  
  update(deltaTime: number): void {
    this.updateActiveAttacks(deltaTime);
    this.checkHitboxCollisions();
    this.processHitResults();
    this.updateInvincibilityFrames(deltaTime);
  }
  
  createAttack(attacker: Entity, attackData: AttackDefinition): AttackInstance {
    // Create sword swing hitbox
    // Set up damage, knockback, and timing
    // Register audio/visual effects
  }
  
  private processHit(attacker: Entity, target: Entity, attack: AttackInstance): void {
    // Apply damage with proper calculations
    // Trigger invincibility frames
    // Create knockback effect
    // Trigger hit pause and screen shake
    // Play appropriate audio/visual feedback
  }
}
```

### Player Controller
```typescript
// /src/game/systems/player.ts  
export class PlayerController extends System {
  private inputBuffer: InputEvent[] = [];
  private stateMachine: PlayerStateMachine;
  private movementComponent: MovementComponent;
  
  update(deltaTime: number): void {
    this.processInputBuffer();
    this.stateMachine.update(deltaTime);
    this.updateMovement(deltaTime);
    this.updateAnimations(deltaTime);
  }
  
  private processInputBuffer(): void {
    // Handle input buffering for responsive controls
    // Queue attacks and movement commands
    // Clear expired input events
  }
  
  private handleSwordAttack(): void {
    // Trigger combat system attack
    // Set player state to attacking
    // Lock movement during attack frames
    // Handle attack direction based on movement
  }
}
```

### Physics Engine Integration
```typescript
// /src/game/systems/physics.ts
export class PhysicsSystem extends System {
  private bodies = new Map<Entity, RigidBody>();
  private staticColliders = new Map<string, StaticCollider>();
  
  update(deltaTime: number): void {
    this.updateVelocities(deltaTime);
    this.detectCollisions();
    this.resolveCollisions();
    this.updatePositions(deltaTime);
  }
  
  addRigidBody(entity: Entity, config: RigidBodyConfig): void {
    // Create physics body with collision shape
    // Set up material properties (friction, bounce)
    // Register with collision detection system
  }
  
  applyForce(entity: Entity, force: Vector2, point?: Vector2): void {
    // Apply force for knockback effects
    // Handle impulse forces for combat impact
    // Update velocity based on mass
  }
}
```

## Combat Mechanics Specification

### Sword Combat System
```typescript
interface SwordAttackData {
  // Timing (in frames at 60fps)
  startup: number;      // Frames before hitbox becomes active (6-8 frames)
  active: number;       // Frames hitbox remains active (4-6 frames)  
  recovery: number;     // Frames after attack until next action (12-16 frames)
  
  // Hitbox properties
  hitbox: {
    offset: Vector2;    // Relative to player position
    size: Vector2;      // Hitbox dimensions
    shape: 'rectangle' | 'arc'; // Collision shape
  };
  
  // Damage and effects
  damage: number;       // Base damage amount
  knockback: {
    force: number;      // Knockback strength
    direction: Vector2; // Knockback direction (normalized)
  };
  
  // Audio-visual feedback
  hitPause: number;     // Frame freeze on hit (2-4 frames)
  screenShake: number;  // Screen shake intensity (0.0-1.0)
  audioEvent: string;   // Audio trigger ID
}
```

### Invincibility Frame System
```typescript
// /src/game/components/InvincibilityComponent.ts
export class InvincibilityComponent extends Component {
  duration: number = 0;         // Remaining i-frame time
  maxDuration: number = 1000;   // Total i-frame duration (ms)
  flickerRate: number = 100;    // Visual flicker timing (ms)
  
  isInvincible(): boolean {
    return this.duration > 0;
  }
  
  shouldRender(currentTime: number): boolean {
    // Flicker effect during i-frames
    if (!this.isInvincible()) return true;
    return Math.floor(currentTime / this.flickerRate) % 2 === 0;
  }
}
```

## Movement & Physics

### 8-Directional Movement
```typescript
// /src/game/systems/movement.ts
export class MovementSystem extends System {
  private readonly MAX_SPEED = 120; // pixels/second
  private readonly ACCELERATION = 800; // pixels/second²
  private readonly FRICTION = 1000; // deceleration when no input
  
  update(deltaTime: number): void {
    this.processMovementInput(deltaTime);
    this.applyFriction(deltaTime);
    this.normalizeVelocity(); // Prevent diagonal speed bonus
    this.updatePositions(deltaTime);
  }
  
  private normalizeVelocity(): void {
    // Ensure consistent speed in all 8 directions
    // Prevent faster diagonal movement
    const entities = this.getEntitiesWithComponents(MovementComponent);
    
    for (const entity of entities) {
      const movement = entity.getComponent(MovementComponent);
      if (movement.velocity.magnitude() > this.MAX_SPEED) {
        movement.velocity = movement.velocity.normalized().multiply(this.MAX_SPEED);
      }
    }
  }
}
```

### Collision Detection
```typescript
// /src/game/systems/collision.ts
export class CollisionSystem extends System {
  private spatialHash: SpatialHashGrid;
  
  detectCollisions(): CollisionPair[] {
    const pairs: CollisionPair[] = [];
    const entities = this.getEntitiesWithComponents(ColliderComponent);
    
    // Use spatial hashing for efficient broad-phase detection
    for (const entity of entities) {
      const nearby = this.spatialHash.getNearbyEntities(entity);
      
      for (const other of nearby) {
        if (this.checkCollision(entity, other)) {
          pairs.push({ entityA: entity, entityB: other });
        }
      }
    }
    
    return pairs;
  }
  
  private checkCollision(a: Entity, b: Entity): boolean {
    // Implement AABB, circle, or SAT collision detection
    // Return true if collision detected
  }
}
```

## Camera System

### Camera Controller  
```typescript
// /src/game/systems/camera.ts
export class CameraController extends System {
  private target: Entity | null = null;
  private deadzone: Rectangle = new Rectangle(-32, -32, 64, 64);
  private smoothing: number = 0.1; // Camera follow smoothing
  private bounds?: Rectangle; // World bounds for camera
  
  followTarget(target: Entity): void {
    this.target = target;
  }
  
  update(deltaTime: number): void {
    if (!this.target) return;
    
    const targetPos = this.target.getComponent(TransformComponent).position;
    const currentPos = this.getPosition();
    
    // Only move camera if target leaves deadzone
    if (!this.deadzone.contains(targetPos.subtract(currentPos))) {
      const targetCameraPos = this.calculateTargetPosition(targetPos);
      const newPos = currentPos.lerp(targetCameraPos, this.smoothing);
      
      // Clamp to world bounds
      if (this.bounds) {
        newPos.x = Math.max(this.bounds.x, Math.min(this.bounds.right, newPos.x));
        newPos.y = Math.max(this.bounds.y, Math.min(this.bounds.bottom, newPos.y));
      }
      
      this.setPosition(newPos);
    }
  }
}
```

## Performance Optimization

### Physics Optimization
```typescript
// /src/game/systems/physicsOptimization.ts
export class PhysicsOptimizer {
  private readonly SLEEP_THRESHOLD = 0.1; // Min velocity before sleep
  private readonly WAKE_DISTANCE = 100;   // Distance to wake sleeping bodies
  
  optimizePhysicsBodies(bodies: RigidBody[]): void {
    for (const body of bodies) {
      // Put slow-moving bodies to sleep
      if (body.velocity.magnitude() < this.SLEEP_THRESHOLD) {
        body.sleeping = true;
      }
      
      // Wake bodies when player approaches
      if (body.sleeping && this.distanceToPlayer(body) < this.WAKE_DISTANCE) {
        body.sleeping = false;
      }
    }
  }
  
  cullOffscreenBodies(): void {
    // Disable physics for entities far from camera
    // Maintain minimal simulation for important entities
  }
}
```

## Integration Points

### With Game Architect
- **ECS Integration**: All systems follow ECS patterns with proper component queries
- **Performance Budgets**: Combat and physics stay within frame time budgets
- **Memory Management**: Efficient object pooling for temporary combat effects

### With Audio Designer  
- **Combat Audio**: Trigger appropriate SFX for all combat events
- **Positional Audio**: 2D spatial audio for combat feedback
- **Dynamic Music**: Trigger combat music state changes

### With UI/UX Designer
- **Health Display**: Provide health change events for UI updates  
- **Combat Feedback**: Screen effects (shake, flash) for impact
- **Input Display**: Debug input buffer state for development

## Testing Strategy

### Combat System Tests
```typescript
// /src/game/systems/__tests__/combat.test.ts
describe('CombatSystem', () => {
  test('sword attack creates proper hitbox timing', () => {
    // Test attack frames and hitbox activation
    // Verify damage calculation accuracy  
    // Check invincibility frame application
  });
  
  test('knockback applies correct force and direction', () => {
    // Test knockback force calculation
    // Verify direction based on attack angle
    // Check collision with walls during knockback
  });
});
```

### Physics Integration Tests  
```typescript
// /src/game/systems/__tests__/physics.test.ts
describe('PhysicsSystem', () => {
  test('8-directional movement has consistent speed', () => {
    // Test cardinal vs diagonal movement speed
    // Verify acceleration and deceleration curves
    // Check collision response accuracy
  });
});
```

## Performance Targets

### Frame Timing Budgets
- **Combat System**: <2ms per frame for active combat
- **Physics System**: <4ms per frame for full world simulation  
- **Input Processing**: <0.5ms input lag from press to response
- **Collision Detection**: <1ms for 100+ active entities

### Memory Usage
- **Combat Effects**: <10MB for all active effects and particles
- **Physics Bodies**: <5MB for all rigid bodies and colliders
- **Input Buffer**: <1KB for input history and buffering

## Success Metrics
- Consistent 60fps during intense combat scenarios
- <50ms input lag from button press to character action
- Zero collision detection false positives or negatives  
- Smooth, responsive movement feel matching SNES classics