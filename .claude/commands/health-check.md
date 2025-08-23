---
name: "System Health Check"
description: "Comprehensive system health validation with autonomous issue detection and resolution"
---

# System Health Check Command

Performs comprehensive system health validation across all game systems.

## Usage
```
@health-check [--deep] [--auto-fix] [system-name]
```

## Examples
```
@health-check                    # Basic health check
@health-check --deep            # Comprehensive deep analysis
@health-check --auto-fix        # Auto-resolve detected issues
@health-check combat-system     # Check specific system
```

## Health Check Categories

### Performance Health
- **Frame Rate**: Consistent 60fps during gameplay
- **Memory Usage**: <512MB base game content
- **Load Times**: <3 seconds for map transitions
- **Input Latency**: <50ms response time
- **Rendering Pipeline**: WebGL optimization status

### Visual Integrity
- **Sprite Rendering**: Character and environment sprites
- **Animation Systems**: Smooth transitions and timing
- **UI Consistency**: Interface element alignment and scaling
- **Realm Switching**: Eclipse/Dayrealm transformation accuracy
- **Effect Systems**: Particle effects and visual feedback

### Functional Integrity
- **Player Controls**: Movement and action responsiveness
- **Combat System**: Hit detection and damage calculation
- **Inventory System**: Item collection and management
- **Save/Load**: State persistence and data integrity
- **Audio System**: Sound effects and music playback

### Integration Health
- **Event System**: Cross-system communication
- **State Management**: Data consistency across systems
- **Asset Loading**: Resource management and caching
- **Error Handling**: Graceful failure recovery
- **Memory Management**: Proper cleanup and garbage collection

## Autonomous Issue Resolution

### Issue Detection
- **Automated Monitoring**: Continuous health metric collection
- **Threshold Violations**: Performance and quality thresholds
- **Regression Detection**: Comparison with known good states
- **User Impact Assessment**: Severity classification and prioritization

### Self-Healing Actions
- **Performance Optimization**: Automatic rendering optimizations
- **Memory Cleanup**: Garbage collection and resource cleanup
- **State Recovery**: Automatic state restoration from corruption
- **Asset Reloading**: Fresh asset loading for corrupted resources
- **Configuration Reset**: Restore optimal system settings

### Escalation Rules
- **Minor Issues**: Auto-fix with logging
- **Major Issues**: Auto-fix with validation and user notification
- **Critical Issues**: Immediate escalation with system protection
- **Unresolvable Issues**: Human intervention request with detailed diagnostics

## Health Report Generation
- **System Status**: Overall health score and individual system ratings
- **Performance Metrics**: Detailed performance analysis and trends
- **Issue Summary**: Detected issues, applied fixes, and remaining concerns
- **Recommendations**: Suggested improvements and preventive measures