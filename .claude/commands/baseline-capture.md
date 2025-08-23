---
name: "Baseline Capture"
description: "Capture comprehensive baseline screenshots and state documentation for future comparison"
---

# Baseline Capture Command

Creates comprehensive baseline documentation for visual regression testing.

## Usage
```
@baseline-capture [scenario] [--update-existing]
```

## Examples
```
@baseline-capture                        # Capture full application baseline
@baseline-capture player-states         # Capture all player animation states
@baseline-capture ui-components         # Capture all UI element states
@baseline-capture --update-existing     # Update existing baselines
```

## Capture Scenarios

### Core Gameplay States
- **Player States**: Idle, walking (8 directions), attacking, taking damage
- **Combat States**: Sword swinging, hit effects, enemy interactions
- **Movement States**: Running, collision detection, boundary interactions

### Environment Captures
- **Tilemap Rendering**: All tile types and combinations
- **Realm States**: Dayrealm and Eclipse versions of same areas
- **Transition Effects**: Realm switching animations and states
- **Portal Areas**: Entry/exit points and connection zones

### UI Interface States
- **HUD Elements**: Health bars, inventory indicators, mini-maps
- **Menu Systems**: Pause menu, settings, inventory interface
- **Dialogue Interface**: NPC conversations and text rendering
- **Overlay States**: Game over, loading screens, transitions

### Special Effects
- **Visual Effects**: Particle systems, screen shake, flash effects
- **Lighting States**: Different lighting conditions and realm effects
- **Animation Frames**: All animation sequences at key frames

## Baseline Management
- **Version Control**: Git-based baseline versioning with branch tracking
- **Automatic Cleanup**: Removes outdated baselines and archives old versions
- **Health Monitoring**: Validates baseline integrity and freshness
- **Update Scheduling**: Automatic baseline refresh based on code changes

## Documentation Generated
- **Screenshot Catalog**: Indexed collection of all captured states
- **Test Case Definitions**: Detailed test scenarios and expectations
- **Threshold Configuration**: Diff tolerance settings per scenario type
- **Capture Metadata**: Timestamps, versions, and capture conditions