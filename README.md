# Echoes of Aeria

A top-down action-adventure game inspired by 16-bit classics like The Legend of Zelda. Built with TypeScript, Phaser 3, and React, featuring a unique dual-world Eclipse/Dayrealm mechanic.

## 🎮 Game Features

- **Dual-World Mechanic**: Switch between Dayrealm and Eclipse to unlock new paths and solve puzzles
- **8-Directional Movement**: Smooth player controls with authentic retro feel
- **Progressive Item System**: Unlock new abilities and areas with key items like Gale Boots and Aether Mirror
- **Rich Audio**: 8-bit chiptune music and sound effects using Web Audio API
- **Environmental Storytelling**: Discover the story through world design and exploration
- **Multiple Regions**: Explore diverse areas from peaceful lowlands to mysterious marshes

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Modern web browser with Web Audio API support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd echoes-of-aeria

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Development Commands

```bash
# Development
pnpm dev             # Start development server
pnpm build           # Build for production
pnpm preview         # Preview production build

# Code Quality
pnpm lint            # Run ESLint
pnpm lint:fix        # Fix ESLint issues
pnpm type-check      # Run TypeScript compiler check

# Testing (Vitest)
pnpm test            # Run tests
pnpm test:watch      # Run tests in watch mode
pnpm test:coverage   # Run tests with coverage report
pnpm test:ui         # Run tests with visual UI
```

## 🏗️ Project Structure

```
src/
├── game/                    # Phaser 3 game logic
│   ├── scenes/             # Game scenes (Boot, Preload, World, etc.)
│   ├── systems/            # Game systems (movement, combat, audio)
│   ├── entities/           # Game entities (Player, Enemy, NPC)
│   ├── components/         # ECS components
│   └── utils/              # Game utilities and helpers
├── ui/                     # React UI components  
│   └── components/         # HUD, inventory, menus
├── assets/                 # Game assets
│   ├── sprites/            # Character and object sprites
│   ├── tilesets/           # Environment tiles
│   ├── audio/              # Music and sound effects
│   └── maps/               # Tiled JSON exports
└── test/                   # Test utilities and setup
```

## 🎯 Current Implementation Status

### ✅ Implemented Features

**Core Mechanics:**
- 8-directional player movement with WASD/Arrow keys
- Basic collision detection and world boundaries
- Canvas-based rendering with camera following
- Simple combat system with attack cooldowns

**World System:**
- Large 80x60 tile world map (2560x1920 pixels)
- Multiple region types (grass, forest, water, etc.)
- Basic NPC system with dialogue
- Region-based world generation

**Audio System:**
- Authentic SNES-style audio with Howler.js + Web Audio API
- Intro->loop music structure for seamless regional themes
- Organic SFX with pitch variation (±20-40 cents)
- Music ducking for dialogue and combat impact
- Cross-browser support (OGG + M4A fallback)
- Zero-latency critical SFX with intelligent preloading

**UI System:**
- Health display with heart-based visualization
- Currency and key counters
- Pause and inventory screens
- Basic game state management

### 🔄 In Progress

- Eclipse/Dayrealm transformation system
- Enhanced combat mechanics
- Tiled map integration
- Item progression system

### ❌ Planned Features

- **Migration to Phaser 3 + React**: Enhanced performance and features
- **Advanced Combat**: Combo attacks, enemy variety, boss battles  
- **Item Progression**: Gale Boots, Aether Mirror, Storm Disk, etc.
- **Complete Audio System**: Dynamic music, spatial audio
- **Save/Load System**: Progress persistence
- **Advanced Puzzles**: Multi-step environmental challenges

## 🎨 Game Design Philosophy

### Core Pillars

1. **Exploration-First Design**: Every screen rewards curiosity
2. **Item-Gated Progression**: Abilities unlock new areas and mechanics
3. **Combat Readability**: Clear telegraphs and consistent timing
4. **Environmental Storytelling**: World tells story without exposition
5. **Dual-World Innovation**: Eclipse/Dayrealm creates unique puzzle opportunities

### Level Design Rules

- **Every Screen Rule**: 1 main path + 1 curiosity path
- **Secret Density**: 12-18 discoverable elements per region  
- **Teaching Pattern**: Teach → Test → Twist for new mechanics
- **Safe Preview**: Show dangerous mechanics safely before lethal encounters

## 🔧 Technical Architecture

### Current Stack

- **Rendering**: HTML5 Canvas 2D
- **Language**: TypeScript with strict mode
- **Build System**: Vite for fast development
- **Audio**: Web Audio API with square wave synthesis

### Migration Plan (Phaser 3 + React)

1. **Phase 1**: Extract game logic into modular classes
2. **Phase 2**: Implement Phaser 3 scenes and rendering
3. **Phase 3**: Add React UI layer for menus and HUD
4. **Phase 4**: Integrate Tiled maps and enhanced assets
5. **Phase 5**: Advanced features and optimization

### Performance Targets

- Maintain 60 FPS during normal gameplay
- Support worlds up to 256x192 tiles
- Memory usage under 100MB for base content
- Load times under 3 seconds for map transitions

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: Game logic, utilities, math functions
- **Integration Tests**: System interactions, state management  
- **E2E Tests**: Complete gameplay scenarios
- **Performance Tests**: Frame rate and memory monitoring

### Quality Standards

- 80%+ code coverage requirement
- All public APIs documented with TSDoc
- ESLint and TypeScript strict mode compliance
- Automated testing in CI/CD pipeline

## 🎵 Audio Design

### Music System

- **Technology**: Web Audio API with oscillator synthesis
- **Style**: 8-bit chiptune inspired by SNES classics
- **Structure**: Layered composition (melody, harmony, bass, percussion)
- **Dynamic**: Music adapts to player region and game state

### Sound Effects

- **Combat**: Sword swings, hits, damage with pitch variation
- **Interaction**: Item collection, door opening, button presses
- **Ambient**: Region-specific environmental audio
- **Feedback**: Clear audio confirmation for all player actions

## 🤝 Contributing

### Development Workflow

1. **Choose Your Domain**: Identify which aspect you're working on
2. **Follow Agent Guidelines**: Reference the appropriate specialized agent
3. **Maintain Quality**: Run tests and linting before commits
4. **Document Changes**: Update relevant documentation

### Specialized Agents

The project uses specialized AI agents for different development domains:

- **🏗️ Game Architect**: System design and architecture
- **🎮 Gameplay Designer**: Combat and progression mechanics  
- **🌍 World Builder**: Level design and environmental systems
- **🎵 Audio Designer**: Music and sound implementation
- **🎨 UI/UX Designer**: Interface and user experience
- **🧪 Testing & QA**: Quality assurance and testing

See `.claude/agents/README.md` for detailed agent documentation.

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Resources

- [Game Design Document](./GAME_DOCUMENT.md) - Complete game design specification
- [Game Mechanics Documentation](./GAME_MECHANICS.md) - Technical implementation details
- [Claude Development Guide](./CLAUDE.md) - Development guidelines and patterns
- [Specialized Agents](./.claude/agents/) - Domain-specific development guidance

---

**Echoes of Aeria** - Where two worlds collide, adventure begins. ⚔️✨