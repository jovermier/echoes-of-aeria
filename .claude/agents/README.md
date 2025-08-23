---
name: "Agents Documentation"
description: "Autonomous agent system with comprehensive before/after validation, visual regression testing, and self-healing workflows"
---

# Echoes of Aeria - Autonomous Agent System

Advanced autonomous agent system that implements comprehensive before/after screenshot testing, visual regression detection, and self-healing validation workflows. The system operates independently until features are fully working, tested, and verified.

## Agent Organization

### 🎯 **Orchestration & Standards**

#### **Orchestrator** (`orchestrator.md`)
**Project coordination, epic breakdown, task assignment, and milestone tracking**
- Epic → Task Breakdown and dependency management
- Agent coordination and conflict resolution  
- Milestone tracking and release management
- Architecture decision facilitation

#### **Spec Librarian** (`spec-librarian.md`)
**Schema management, data contracts, and cross-system standards enforcement**
- JSON Schema definition and maintenance
- Cross-system interface specification
- Standards enforcement and validation tools
- Data migration strategy management

### 🏗️ **Architecture & Core Systems**

#### **Game Architect** (`game-architect.md`)  
**ECS architecture, Phaser+React integration, and performance optimization**
- Entity-Component-System (ECS) architecture design
- Phaser 3 + React integration patterns
- Performance budgets and optimization strategies
- System integration and data flow design

### 🌍 **Runtime World & Map Systems**

#### **Map/Streaming Engineer** (`map-streaming-engineer.md`)
**Runtime world management, map streaming, and portal systems implementation**
- Map loading/unloading with memory management
- Portal detection and seamless transitions
- Realm switching (Eclipse ↔ Dayrealm) mechanics
- Chunk-based loading and entity culling

#### **Tilemap & Collision Validator** (`tilemap-collision-validator.md`)
**CI/CD validation of map assets, collision integrity, and Tiled standards compliance**
- Automated .tmx file validation against standards
- Collision geometry completeness checking
- Portal connectivity and softlock prevention
- CI/CD integration for quality assurance

#### **World Builder** (`world-builder.md`)
**Level design craft, Tiled workflow, and content creation**
- Level design philosophy and pacing
- Tiled editor workflow optimization
- Environmental storytelling and atmosphere
- World content creation and iteration

### 🎮 **Player Systems & Controls**  

#### **Player Controller & Camera** (`player-controller-camera.md`)
**Input handling, player state management, and camera systems**
- Responsive input handling with buffering
- Player state machine (idle, walking, attacking, etc.)
- Camera following with deadzone and effects
- Cross-platform input support (keyboard, gamepad, touch)

#### **Combat & Physics Engineer** (`combat-physics-engineer.md`)
**Combat mechanics, physics simulation, and player action systems**
- Sword combat with SNES-authentic feel
- Hit detection, i-frames, and damage calculation
- 8-directional movement with proper physics
- Collision detection and response optimization

### ⚙️ **Specialized Gameplay Systems**

#### **AI/Spawner Engineer** (`ai-spawner-engineer.md`)
**AI behavior systems, enemy spawning, and entity management**
- Enemy AI state machines and behavior trees
- Dynamic spawning systems with population limits
- Pathfinding and navigation mesh integration
- AI performance optimization and pooling

#### **Items & Inventory/Progression** (`items-inventory-progression.md`)
**Item systems, inventory management, and character progression**
- Item effects and stat modification systems
- Inventory UI integration with game systems
- Character progression and ability unlocks
- Save/load integration for progression state

#### **Dialogue & Quests** (`dialogue-quests.md`)
**Dialogue trees, quest systems, and narrative integration**
- Branching dialogue system implementation
- Quest state tracking and completion logic
- Narrative flag system integration
- Localization support for text content

#### **Save/Load & Persistence** (`save-load-persistence.md`)
**Save file management, data persistence, and integrity**
- Save file format design and versioning
- Cross-session state persistence
- Data integrity and corruption prevention
- Save file migration between versions

### 🎵 **Audio Systems**

#### **Audio Designer** (`audio-designer.md`)
**SNES-style audio system architecture and Web Audio integration**
- Howler.js + Web Audio API integration
- Authentic 16-bit audio characteristics
- Music ducking and dynamic mixing
- Cross-browser audio compatibility

#### **Audio Wiring** (`audio-wiring.md`)
**Audio bank management, event mapping, and runtime integration**
- Centralized audio asset registry management
- Game event to audio ID mapping
- Contextual audio mixing and transitions
- Positional audio for 2D spatial effects

### 🖥️ **UI & Presentation**

#### **UI/UX Designer** (`ui-ux-designer.md`)
**React UI components, game-UI bridge, and user experience**
- React overlay components for HUD and menus
- Zustand state management for UI data
- Game state to UI data bridging
- Accessibility and responsive design

### 🧪 **Quality Assurance & Testing**

#### **Testing & QA** (`testing-qa.md`)
**Testing strategy, quality assurance, and automated validation**
- Vitest unit and integration test strategy
- Playwright E2E testing for critical flows
- Performance testing and regression prevention
- CI/CD quality gates and automation

## Agent Interaction Workflows

### Feature Development Pipeline
1. **Orchestrator**: Epic breakdown and task assignment
2. **Spec Librarian**: Schema definition and validation setup
3. **Game Architect**: System design and integration planning
4. **Specialist Agents**: Implementation in parallel
5. **Testing & QA**: Test coverage and quality validation
6. **Orchestrator**: Integration coordination and milestone tracking

### Content Creation Pipeline
1. **World Builder**: Level design and content creation
2. **Tilemap & Collision Validator**: Automated quality checking
3. **Map/Streaming Engineer**: Runtime integration testing
4. **Audio Wiring**: Audio event integration for new areas
5. **Testing & QA**: Playtesting and user experience validation

### System Integration Pipeline
1. **Game Architect**: Interface specification and design
2. **Spec Librarian**: Contract definition and validation
3. **Specialist Agents**: Implementation with defined interfaces
4. **Testing & QA**: Integration test coverage
5. **Performance Engineer**: Performance impact analysis

## Project Standards

### Architecture Principles
- **Clean Separation**: Game logic (Phaser) and UI (React) are distinct
- **Event-Driven**: Systems communicate through typed events (`/src/shared/events.ts`)
- **Schema-First**: All data structures follow JSON Schema validation
- **Performance-First**: 60fps gameplay with <512MB memory usage
- **Standards Compliance**: Automated validation prevents integration issues

### Code Organization
```
/src/
  game/              # Phaser game systems
    systems/         # ECS systems and managers
    components/      # ECS component definitions
    entities/        # Entity factories and definitions
    data/            # Static game data and configurations
  ui/                # React UI layer
    components/      # UI components and overlays
    hooks/           # Custom React hooks
    stores/          # Zustand state management
  shared/            # Cross-system code
    events.ts        # Typed event system
    types.ts         # Shared TypeScript types
    constants.ts     # Game-wide constants

/schemas/            # JSON Schema definitions
/world/              # Tiled maps and world data
  maps/              # Individual .tmx map files
  tilesets/          # Shared .tsx tileset files
  worldIndex.json    # Map registry and portal definitions

/docs/               # Documentation and standards
  agents.yaml        # Agent configuration and workflows
  pillars.md         # Core design principles
  standards/         # Project conventions
```

### Quality Gates
- **Performance**: 60fps stable, <512MB memory, <50ms input latency
- **Quality**: Zero production crashes, 80%+ test coverage, validated maps
- **Process**: <2 week epics, automated validation catches 95%+ issues

## Getting Started

### Individual Agent Usage
```
@orchestrator Break down the "inventory system" epic into implementable tasks
@spec-librarian Define the save file schema for player progression data
@combat-physics-engineer Implement sword combat with 6-8 startup frames
@world-builder Create the first dungeon with authentic Zelda pacing
```

### Multi-Agent Collaboration
```
@orchestrator Plan the dialogue system feature implementation
  → @spec-librarian Define dialogue tree and NPC data schemas  
  → @dialogue-quests Implement dialogue state management
  → @ui-ux-designer Create dialogue UI components
  → @audio-wiring Add dialogue audio event integration
  → @testing-qa Set up comprehensive dialogue testing
```

### Quality Assurance Integration
```
@tilemap-collision-validator Check all maps before merge
@testing-qa Run performance benchmarks on new systems
@orchestrator Coordinate integration testing across agents
```

## Agent Expertise Matrix

| Agent | ECS | Systems | UI/UX | Audio | Testing | Performance |
|-------|-----|---------|-------|-------|---------|-------------|
| Orchestrator | ⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐ | ⭐⭐ |
| Spec Librarian | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ | ⭐ |
| Game Architect | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| Map/Streaming Engineer | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ |
| Combat & Physics | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Player Controller | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ | ⭐⭐ |
| Audio Wiring | ⭐ | ⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| UI/UX Designer | ⭐ | ⭐ | ⭐⭐⭐ | ⭐ | ⭐⭐ | ⭐ |
| Testing & QA | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

⭐⭐⭐ = Primary Expertise | ⭐⭐ = Secondary Knowledge | ⭐ = Basic Understanding

## Success Metrics

### Technical Quality
- Zero production crashes or game-breaking bugs
- Consistent 60fps performance on target hardware  
- <50ms input latency from hardware to game response
- Complete test coverage for all critical game systems

### Development Process  
- <2 week average epic completion time
- Zero integration bugs due to contract mismatches
- 95%+ issue detection via automated validation before manual testing
- Consistent delivery velocity across development sprints

This agent system scales with project complexity while maintaining quality standards and development velocity.