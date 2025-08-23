---
name: "Comprehensive Test Suite"
description: "Execute full 6-phase testing validation with autonomous issue resolution"
---

# Comprehensive Test Suite Command

Runs complete testing validation across all quality dimensions.

## Usage
```
@test-comprehensive [feature-name] [--fix-issues]
```

## Examples
```
@test-comprehensive                           # Test entire application
@test-comprehensive player-controller        # Test specific feature
@test-comprehensive inventory-system --fix-issues  # Test and auto-fix issues
```

## Testing Phases

### Phase 1: Visual Testing
- Screenshot regression analysis
- Pixel-perfect comparison with baselines
- Visual element consistency validation
- UI/UX standards compliance

### Phase 2: Functional Testing  
- Requirement verification
- User workflow validation
- Feature completeness assessment
- Edge case handling

### Phase 3: Performance Testing
- Frame rate stability (target: 60fps)
- Memory usage monitoring (<512MB)
- Load time measurement (<3s transitions)
- Input latency testing (<50ms)

### Phase 4: Integration Testing
- Cross-system compatibility
- Data flow validation
- Event system integrity
- State management consistency

### Phase 5: Accessibility Testing
- Color contrast validation
- Keyboard navigation support
- Screen reader compatibility
- Text readability assessment

### Phase 6: Cross-Platform Testing
- Browser compatibility validation
- Device-specific testing
- Resolution scaling verification
- Input method support

## Autonomous Issue Resolution
- **Detection**: Automatic issue identification across all phases
- **Analysis**: Root cause analysis and impact assessment  
- **Resolution**: Intelligent fix generation and application
- **Validation**: Re-testing to confirm issue resolution
- **Escalation**: Human intervention for unresolvable issues