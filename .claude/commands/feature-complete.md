---
name: "Feature Complete"
description: "Autonomously develop and validate a feature until fully working, tested, and verified"
---

# Feature Complete Command

Orchestrates complete autonomous feature development with comprehensive validation.

## Usage
```
@feature-complete <feature-name> [requirements...]
```

## Examples
```
@feature-complete inventory-system "Player can collect items" "Items persist between sessions" "UI shows current inventory"
@feature-complete combat-system "Sword attacks hit enemies" "Player takes damage from enemies" "Visual feedback on hits"
@feature-complete realm-switching "Eclipse realm transforms world" "Aether Mirror enables switching" "Visual transition effects"
```

## Process
1. **Baseline Capture**: Screenshots and state documentation
2. **Implementation**: Autonomous task breakdown and execution
3. **Comprehensive Testing**: 6-phase validation system
4. **Visual Regression**: Before/after screenshot comparison
5. **Autonomous Retry**: Up to 5 retry attempts with self-healing
6. **Final Verification**: Complete requirement validation

## Validation Phases
- **Visual**: Screenshot regression testing
- **Functional**: Requirement verification
- **Performance**: Frame rate and memory impact
- **Integration**: Cross-system compatibility
- **Accessibility**: UI/UX standards compliance
- **Cross-Platform**: Browser compatibility

## Success Criteria
- All requirements met and verified
- No visual regressions detected
- Performance within acceptable limits
- All tests passing
- Documentation updated