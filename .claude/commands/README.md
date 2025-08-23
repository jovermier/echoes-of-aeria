# Claude Code Commands - Echoes of Aeria

Autonomous agent system commands for comprehensive feature development with validation loops.

## 🌟 **START HERE: Primary Command**

### **`@feature-complete` - Your Go-To Command**
**Use this for 90% of development requests.** This is the main command developers should use for any feature work.

- ✅ Takes features from concept to fully validated completion
- ✅ Works autonomously until feature is fully working, tested, and verified  
- ✅ Includes before/after screenshots and comprehensive validation
- ✅ Automatically retries up to 5 times if issues are found
- ✅ Self-healing with intelligent issue detection and resolution

**When to use:** Almost always - for new features, improvements, bug fixes, or any development work.

```bash
@feature-complete inventory-system "Player can collect items" "Items persist between sessions"
@feature-complete combat-improvements "Sword hits feel impactful" "Enemy knockback on hit"  
@feature-complete ui-polish "Menus are responsive" "Animations are smooth"
```

---

## 🔧 **Specialized Commands** 
*Use these only for specific scenarios:*

### **`@agent-orchestrate`** - Multi-System Features
**When to use:** Complex features requiring multiple specialist agents (UI + backend + audio + etc.)
```bash
@agent-orchestrate "dialogue-system" "Branching NPC conversations with quest integration"
```

### **`@test-comprehensive`** - Testing Only  
**When to use:** You just want testing/validation of existing code without changes
```bash
@test-comprehensive --fix-issues
```

### **`@visual-regression`** - Screenshot Testing
**When to use:** You specifically need before/after visual comparison testing
```bash
@visual-regression player-movement
```

### **`@baseline-capture`** - Documentation
**When to use:** You need to update baseline screenshots for future comparisons
```bash
@baseline-capture ui-components
```

### **`@health-check`** - System Diagnostics
**When to use:** System maintenance, diagnostics, or investigating performance issues
```bash
@health-check --deep --auto-fix
```

## 🚀 **Decision Tree: Which Command Should I Use?**

```
Is this a development request (new feature, improvement, bug fix)?
├─ YES → Use @feature-complete (90% of cases)
└─ NO → Is this...
    ├─ Complex multi-system feature? → @agent-orchestrate
    ├─ Testing existing code only? → @test-comprehensive  
    ├─ Visual comparison needed? → @visual-regression
    ├─ Update baselines? → @baseline-capture
    └─ System diagnostics? → @health-check
```

## 📋 **Common Usage Patterns**

### Typical Developer Workflow
```bash
# 1. Most common - develop any feature
@feature-complete inventory-system "Player can collect items" "Items persist between sessions"

# 2. For complex multi-agent features  
@agent-orchestrate "dialogue-system" "Branching NPC conversations with quest integration"

# 3. Periodic system maintenance
@health-check --deep --auto-fix
```

### Testing & Validation Only
```bash
# Test existing code without changes
@test-comprehensive --fix-issues

# Check visual consistency  
@visual-regression player-movement

# Update reference screenshots
@baseline-capture ui-components
```

## Autonomous Workflows

### Feature Development Pipeline
1. **`@baseline-capture`** - Document current state
2. **`@feature-complete`** - Autonomous implementation with validation
3. **`@visual-regression`** - Visual verification 
4. **`@test-comprehensive`** - Full validation suite
5. **`@health-check`** - System integrity verification

### Multi-Agent Coordination
1. **`@agent-orchestrate`** - Epic breakdown and task assignment
2. **Automatic agent coordination** - Parallel implementation with validation
3. **`@test-comprehensive`** - Integration testing
4. **`@visual-regression`** - Visual consistency verification

## Validation Phases

All commands integrate comprehensive validation:

- **Visual**: Screenshot regression testing with pixel-perfect comparison
- **Functional**: Requirement verification and user workflow validation  
- **Performance**: 60fps stability, <512MB memory, <50ms latency
- **Integration**: Cross-system compatibility and data flow validation
- **Accessibility**: UI/UX standards and usability compliance
- **Cross-Platform**: Browser compatibility and device support

## Autonomous Retry System

Commands automatically retry on failure:
- **Up to 5 retry attempts** with intelligent issue analysis
- **Self-healing mechanisms** for common issues
- **Escalation rules** for unresolvable problems
- **Agent reassignment** for specialized issue resolution

## Success Metrics

- **95%+ regression detection rate** with <5% false positives
- **80% autonomous issue resolution** without human intervention  
- **Complete feature validation** before approval
- **Zero production crashes** through comprehensive testing