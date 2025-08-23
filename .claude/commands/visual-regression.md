---
name: "Visual Regression Test"
description: "Run comprehensive visual regression testing with before/after screenshot comparison"
---

# Visual Regression Test Command

Captures screenshots, compares against baselines, and detects visual regressions.

## Usage
```
@visual-regression [test-scenario]
```

## Examples
```
@visual-regression                    # Full regression suite
@visual-regression player-movement    # Test player character rendering
@visual-regression realm-switching    # Test Eclipse/Dayrealm transitions  
@visual-regression ui-overlay         # Test UI elements and HUD
@visual-regression combat-effects     # Test visual effects and animations
```

## Test Scenarios
- **player-movement**: Character sprite rendering and animations
- **environment-tiles**: Tilemap rendering and seamless transitions
- **ui-overlay**: HUD, inventory, and menu interfaces
- **realm-switching**: Eclipse/Dayrealm visual transformations
- **combat-effects**: Attack animations and particle effects
- **full-game**: Complete gameplay flow screenshots

## Process
1. **Setup**: Initialize test scenarios and capture points
2. **Baseline**: Load or create reference screenshots
3. **Current**: Capture current state screenshots
4. **Compare**: Pixel-level comparison with configurable thresholds
5. **Analyze**: Classify differences and assess impact
6. **Report**: Generate detailed comparison results
7. **Update**: Manage baseline updates for approved changes

## Thresholds
- **Minor**: < 1% pixel difference (auto-accept)
- **Major**: 1-10% pixel difference (flag for review)
- **Critical**: > 10% pixel difference (block changes)